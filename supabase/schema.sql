-- Ejecutar una vez en el SQL Editor del proyecto de Supabase.
begin;
create table if not exists public.user_spaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{"profile":{},"tasks":[],"messages":[]}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint user_space_object check (jsonb_typeof(data) = 'object')
);
alter table public.user_spaces enable row level security;
revoke all on public.user_spaces from anon;
grant select, insert, update, delete on public.user_spaces to authenticated;
drop policy if exists "Read own space" on public.user_spaces;
create policy "Read own space" on public.user_spaces for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Insert own space" on public.user_spaces;
create policy "Insert own space" on public.user_spaces for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Update own space" on public.user_spaces;
create policy "Update own space" on public.user_spaces for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Delete own space" on public.user_spaces;
create policy "Delete own space" on public.user_spaces for delete to authenticated using ((select auth.uid()) = user_id);
commit;
