-- Apply after reminder_push.sql. This replaces only the scheduler function.
begin;

create or replace function public.claim_due_reminder_push()
returns table (delivery_id uuid, lease_attempt integer, destination text, key_p256dh text, key_auth text, reminder_priority integer)
language sql
set search_path = ''
as $$
  with tasks as (
    select s.user_id, t->>'id' as task_id, t->>'reminderAt' as reminder, t->>'remindedFor' as acknowledged,
      t->>'reminderAnchorAt' as anchor,
      case when coalesce(t->>'snoozedFrom','') <> '' then 0
        else case t->>'reminderRepeat' when 'daily' then 1 when 'alternate' then 2 when 'weekly' then 7 else 0 end end as repeat_days,
      case when coalesce(t->>'snoozedFrom','') = '' and (t->>'reminderRepeat') ~ '^minutes:[1-9][0-9]{0,3}$'
        then split_part(t->>'reminderRepeat', ':', 2)::integer
        else 0 end as repeat_minutes,
      case t->>'priority' when '1' then 1 when '3' then 3 else 2 end as priority,
      coalesce(z.name, 'UTC') as tz
    from public.user_spaces s
    cross join lateral jsonb_array_elements(
      case when jsonb_typeof(s.data->'tasks')='array' then s.data->'tasks' else '[]'::jsonb end
    ) t
    left join pg_catalog.pg_timezone_names z on z.name = t->>'reminderTimeZone'
    where t->>'done' is distinct from 'true' and t->>'archived' is distinct from 'true'
      and t->>'reminderPaused' is distinct from 'true'
      and length(t->>'id') between 1 and 100
  ), parsed as (
    select *,
      case when reminder ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T' and pg_input_is_valid(reminder, 'timestamptz')
        then reminder::timestamptz end as active_at,
      case when anchor ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T' and pg_input_is_valid(anchor, 'timestamptz')
        then anchor::timestamptz end as anchor_at
    from tasks
  ), active as (
    select *, coalesce(anchor_at, active_at) as base from parsed
    where active_at <= now() and acknowledged is distinct from reminder
  ), candidates as (
    select user_id, task_id, priority, active_at,
      case when repeat_minutes between 5 and 1440
        then date_bin(make_interval(mins => repeat_minutes), now(), base)
        when repeat_days = 0 then active_at else
        ((base at time zone tz) +
          greatest(0, ((now() at time zone tz)::date - (base at time zone tz)::date) / repeat_days)
          * repeat_days * interval '1 day') at time zone tz
      end as due_at
    from active
  ), due as (
    select c.user_id, c.task_id, c.due_at, d.endpoint, min(c.priority) as priority
    from candidates c join public.reminder_devices d on c.user_id = d.user_id
    where c.due_at between c.active_at and now() and c.due_at >= now() - interval '1 day' and c.due_at >= d.created_at
    group by c.user_id, c.task_id, c.due_at, d.endpoint
  ), claimed as (
    insert into public.reminder_deliveries as existing (user_id, endpoint, task_id, occurrence, priority)
    select d.user_id, d.endpoint, d.task_id, d.due_at, d.priority
    from due d left join public.reminder_deliveries prev
      on (prev.user_id, prev.endpoint, prev.task_id, prev.occurrence) = (d.user_id, d.endpoint, d.task_id, d.due_at)
    where prev.id is null or (prev.attempts < 5 and prev.status in ('sending','retry')
      and prev.updated_at < now() - interval '2 minutes')
    order by d.due_at, d.priority, d.user_id, d.endpoint, d.task_id
    limit 40
    on conflict (user_id, endpoint, task_id, occurrence) do update
      set status='sending', attempts=existing.attempts+1, updated_at=now(), detail=null, priority=excluded.priority
      where existing.attempts < 5 and existing.status in ('sending','retry')
        and existing.updated_at < now() - interval '2 minutes'
    returning id, attempts, user_id, endpoint, priority
  )
  select c.id, c.attempts, c.endpoint, d.p256dh, d.auth, c.priority
  from claimed c join public.reminder_devices d using (user_id, endpoint);
$$;

revoke all on function public.claim_due_reminder_push() from public, anon, authenticated;
grant execute on function public.claim_due_reminder_push() to service_role;
commit;
