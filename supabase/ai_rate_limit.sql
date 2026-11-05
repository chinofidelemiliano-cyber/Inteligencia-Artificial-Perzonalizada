-- Ejecutar en SQL Editor antes de activar el chat.
-- Contador privado y atómico por usuario: 5/minuto, 50/día UTC.
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
create or replace function public.claim_ai_request() returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  current_minute timestamptz := date_trunc('minute', now());
  current_day date := (now() at time zone 'UTC')::date;
  accepted uuid;
begin
  if uid is null then return false; end if;
  insert into public.ai_usage as usage (user_id,minute_start,minute_count,day_start,day_count)
  values (uid,current_minute,1,current_day,1)
  on conflict (user_id) do update set
    minute_start=current_minute,
    minute_count=case when usage.minute_start=current_minute then usage.minute_count+1 else 1 end,
    day_start=current_day,
    day_count=case when usage.day_start=current_day then usage.day_count+1 else 1 end
  where (usage.minute_start<>current_minute or usage.minute_count<5)
    and (usage.day_start<>current_day or usage.day_count<50)
  returning user_id into accepted;
  return accepted is not null;
end;
$$;
revoke all on function public.claim_ai_request() from public, anon;
grant execute on function public.claim_ai_request() to authenticated;
commit;
