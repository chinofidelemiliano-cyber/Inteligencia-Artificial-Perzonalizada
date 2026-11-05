// npm install --prefix /tmp/lifts-sql-tests --no-audit --no-fund @electric-sql/pglite@0.3.14
// NODE_PATH=/tmp/lifts-sql-tests/node_modules node tests/quota.test.cjs
const {PGlite}=require('@electric-sql/pglite');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 const db=new PGlite();
 const regular='00000000-0000-0000-0000-000000000001';
 const owner='00000000-0000-0000-0000-000000000002';
 try{
  await db.exec(`create role anon; create role authenticated; create schema auth;
  create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
  create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
  insert into auth.users values ('${regular}','regular@example.test',now()),('${owner}','owner@example.test',now());`);
  const schema=fs.readFileSync('supabase/ai_rate_limit.sql','utf8');
  await db.exec(schema);await db.exec(schema); // Repeatable migration must preserve counters.
  const ownerSQL=fs.readFileSync('supabase/owner_limit.sql','utf8');
  await db.exec(ownerSQL.replace('TU_CORREO_AQUI','owner@example.test'));
  async function identity(id){await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);}
  async function claim(){return (await db.query('select public.claim_ai_request() as allowed')).rows[0].allowed;}
  // Freeze PostgreSQL now() so a wall-clock minute boundary cannot reset a test window.
  await db.exec('begin');
  await identity(regular);
  for(let i=0;i<5;i++)assert.equal(await claim(),true);
  assert.equal(await claim(),false);console.log('PASS: cuenta normal limitada a 5/minuto');
  await db.exec(`update public.ai_usage set minute_start=now()-interval '2 minutes',day_count=49 where user_id='${regular}'`);
  assert.equal(await claim(),true);assert.equal(await claim(),false);console.log('PASS: cuenta normal limitada a 50/día');
  await identity(owner);for(let i=0;i<20;i++)assert.equal(await claim(),true);
  assert.equal(await claim(),false);console.log('PASS: excepción limitada a 20/minuto');
  await db.exec(`update public.ai_usage set minute_start=now()-interval '2 minutes',day_count=499 where user_id='${owner}'`);
  assert.equal(await claim(),true);assert.equal(await claim(),false);console.log('PASS: excepción limitada a 500/día');
  await db.exec(`update public.ai_usage set day_start=current_date-1,minute_start=now()-interval '2 minutes' where user_id='${owner}'`);
  assert.equal(await claim(),true);console.log('PASS: reinicio de ventanas');
  await db.exec('commit');
  await db.exec('set role authenticated');
  await assert.rejects(db.query(`insert into public.ai_quota_overrides (user_id,per_minute,per_day) values ('${regular}',100,10000) on conflict(user_id) do update set per_day=10000`),/permission denied/);
  await assert.rejects(db.query('select * from public.ai_quota_overrides'),/permission denied/);
  await identity('');assert.equal(await claim(),false);
  await db.exec('reset role');console.log('PASS: usuarios no pueden leer ni modificar excepciones; sin sesión no hay cuota');
  const unlimitedSQL=fs.readFileSync('supabase/owner_unlimited.sql','utf8').replace('TU_CORREO_AQUI','owner@example.test');
  await db.exec(unlimitedSQL);
  await db.exec(schema); // Reapplying the migration must retain the unlimited flag.
  await identity(owner);
  await db.exec('set role authenticated');
  for(let i=0;i<600;i++)assert.equal(await claim(),true);
  await identity(regular);assert.equal(await claim(),false);
  await assert.rejects(db.query(`update public.ai_quota_overrides set unlimited=true where user_id='${regular}'`),/permission denied/);
  await db.exec('reset role');
  console.log('PASS: cuenta autorizada supera 500 consultas; otros usuarios mantienen límites y no pueden ampliarlos');
  await db.exec(ownerSQL.replace('TU_CORREO_AQUI','owner@example.test'));
  await identity(owner);
  await db.exec(`update public.ai_usage set minute_start=date_trunc('minute',now()),minute_count=20 where user_id='${owner}'`);
  assert.equal(await claim(),false);
  console.log('PASS: se puede revocar acceso ilimitado sin eliminar la cuenta');
  await assert.rejects(db.exec(ownerSQL.replace('TU_CORREO_AQUI','unknown@example.test')),/No se encontró/);
  await db.exec('rollback');console.log('PASS: asignación exige una cuenta confirmada existente');
 }finally{await db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
