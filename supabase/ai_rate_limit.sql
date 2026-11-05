-- Ejecutar en SQL Editor antes de activar el chat.
-- Por defecto: 5/minuto, 50/día UTC. Excepciones administradas por UUID.
begin;
create table if not exists public.ai_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  minute_start timestamptz not null,
  minute_count integer not null,
  day_start date not null,
  day_count integer not null
);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;
create table if not exists public.ai_quota_overrides (
  user_id uuid primary key references auth.users(id) on delete cascade,
  per_minute integer not null check (per_minute between 1 and 100),
  per_day integer not null check (per_day between 1 and 10000)
);
alter table public.ai_quota_overrides add column if not exists unlimited boolean not null default false;
alter table public.ai_quota_overrides enable row level security;
revoke all on public.ai_quota_overrides from public, anon, authenticated;
create or replace function public.claim_ai_request() returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  current_minute timestamptz := date_trunc('minute', now());
  current_day date := (now() at time zone 'UTC')::date;
  accepted uuid;
  minute_limit integer := 5;
  day_limit integer := 50;
  unlimited_access boolean := false;
begin
  if uid is null then return false; end if;
  select q.per_minute, q.per_day, q.unlimited into minute_limit, day_limit, unlimited_access
    from public.ai_quota_overrides q where q.user_id=uid;
  if unlimited_access is true then return true; end if;
  minute_limit := coalesce(minute_limit,5);
  day_limit := coalesce(day_limit,50);
  insert into public.ai_usage as usage (user_id,minute_start,minute_count,day_start,day_count)
  values (uid,current_minute,1,current_day,1)
  on conflict (user_id) do update set
    minute_start=current_minute,
    minute_count=case when usage.minute_start=current_minute then usage.minute_count+1 else 1 end,
    day_start=current_day,
    day_count=case when usage.day_start=current_day then usage.day_count+1 else 1 end
  where (usage.minute_start<>current_minute or usage.minute_count<minute_limit)
    and (usage.day_start<>current_day or usage.day_count<day_limit)
  returning user_id into accepted;
  return accepted is not null;
end;
$$;
revoke all on function public.claim_ai_request() from public, anon;
grant execute on function public.claim_ai_request() to authenticated;
commit;
