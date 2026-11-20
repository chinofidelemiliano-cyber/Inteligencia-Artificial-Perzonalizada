-- Apply after reminder_push.sql in Supabase SQL Editor.
begin;

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net;

create schema if not exists lifts_push_private;
revoke all on schema lifts_push_private from public, anon, authenticated;

create table if not exists lifts_push_private.configuration (
  singleton boolean primary key default true check (singleton),
  public_key text not null,
  private_key text not null,
  dispatch_secret text not null check (dispatch_secret ~ '^[a-f0-9]{64}$'),
  subject text not null,
  dispatch_url text not null check (dispatch_url ~ '^https://[a-z0-9]+\.supabase\.co/functions/v1/reminder-dispatch$')
);
alter table lifts_push_private.configuration enable row level security;
revoke all on lifts_push_private.configuration from public, anon, authenticated;

-- A single insert wins, even when two devices activate simultaneously.
create or replace function public.lifts_push_configuration(candidate jsonb default null)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  configuration jsonb;
begin
  if candidate is not null then
    insert into lifts_push_private.configuration (public_key, private_key, dispatch_secret, subject, dispatch_url)
      values (candidate->>'public_key', candidate->>'private_key', candidate->>'dispatch_secret', candidate->>'subject', candidate->>'dispatch_url')
      on conflict (singleton) do nothing;
  end if;
  select to_jsonb(c) - 'singleton' into configuration from lifts_push_private.configuration c;
  return configuration;
end;
$$;

revoke all on function public.lifts_push_configuration(jsonb) from public, anon, authenticated;
grant execute on function public.lifts_push_configuration(jsonb) to service_role;

create or replace function lifts_push_private.wake()
returns void
language plpgsql
set search_path = ''
as $$
declare
  config lifts_push_private.configuration%rowtype;
begin
  select * into config from lifts_push_private.configuration where singleton;
  if found then
    perform net.http_post(
      url := config.dispatch_url,
      headers := jsonb_build_object('Content-Type', 'application/json', 'X-Dispatch-Key', config.dispatch_secret),
      body := '{"action":"dispatch"}'::jsonb,
      timeout_milliseconds := 55000
    );
  end if;
end;
$$;

revoke all on function lifts_push_private.wake() from public, anon, authenticated;
select cron.schedule('lifts-reminder-dispatch', '* * * * *', 'select lifts_push_private.wake()');
commit;
