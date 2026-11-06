// NODE_PATH=/tmp/lifts-sql-tests/node_modules node tests/quota.test.cjs
const {PGlite}=require('@electric-sql/pglite');const fs=require('node:fs');const assert=require('node:assert/strict');
(async()=>{const db=new PGlite();const user='00000000-0000-0000-0000-000000000001';
 try{
  await db.exec(`create role anon;create role authenticated;create schema auth;
    create table auth.users(id uuid primary key);insert into auth.users values ('${user}');
    create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`);
  const sql=fs.readFileSync('supabase/ai_rate_limit.sql','utf8');await db.exec(sql);
  await db.exec(`insert into public.ai_quota_overrides values ('${user}',100,10000,true)`);
  await db.exec(sql);await db.exec(sql);
  assert.equal((await db.query('select unlimited from public.ai_quota_overrides')).rows[0].unlimited,false);
  console.log('PASS: migración revoca excepción ilimitada sin eliminar datos');
  // Even legacy overrides cannot bypass the new function.
  await db.exec(`update public.ai_quota_overrides set unlimited=true`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);
  await db.exec('begin');await db.exec('set role authenticated');
  async function claim(){return(await db.query('select public.claim_ai_request() as allowed')).rows[0].allowed;}
  for(let i=0;i<5;i++)assert.equal(await claim(),true);assert.equal(await claim(),false);
  await db.exec('reset role');console.log('PASS: 5/minuto incluso con excepción antigua');
  await db.exec(`update public.ai_usage set minute_start=now()-interval '2 minutes',day_count=49`);
  await db.exec('set role authenticated');assert.equal(await claim(),true);assert.equal(await claim(),false);await db.exec('reset role');
  console.log('PASS: 50/día incluso con excepción antigua');
  await db.exec(`update public.ai_usage set minute_start=now()-interval '2 minutes',day_start=current_date-1`);
  assert.equal(await claim(),true);await db.exec('commit');console.log('PASS: ventanas se restablecen');
  await db.exec('set role authenticated');await assert.rejects(db.query('update public.ai_quota_overrides set unlimited=true'),/permission denied/);
  await db.query("select set_config('request.jwt.claim.sub','',false)");assert.equal(await claim(),false);await db.exec('reset role');
  console.log('PASS: sin sesión no hay uso y los usuarios no pueden ampliar permisos');
 }finally{await db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
