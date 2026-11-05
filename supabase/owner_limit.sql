-- Ejecuta primero ai_rate_limit.sql actualizado.
-- Sustituye el correo del ejemplo por el de tu cuenta confirmada.
-- Ejecutar solo desde SQL Editor como administrador, nunca desde el navegador.
begin;
do $$
declare
  owner_id uuid;
begin
  select id into strict owner_id from auth.users
    where lower(email) = lower('TU_CORREO_AQUI')
      and email_confirmed_at is not null;
  insert into public.ai_quota_overrides (user_id,per_minute,per_day,unlimited)
    values (owner_id,20,500,false)
    on conflict (user_id) do update set per_minute=20, per_day=500, unlimited=false;
exception
  when no_data_found then raise exception 'No se encontró una cuenta confirmada con ese correo. Revisa el correo y la confirmación en Authentication > Users.';
  when too_many_rows then raise exception 'Hay más de una cuenta con ese correo. Revisa los usuarios antes de asignar el límite.';
end;
$$;
commit;
