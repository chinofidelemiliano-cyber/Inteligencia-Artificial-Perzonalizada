const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {PGlite} = require('@electric-sql/pglite');

test('push claims are account-scoped, lease-protected and recordable by the owning user', async () => {
  const db = new PGlite();
  const owner = '00000000-0000-0000-0000-000000000001';
  const other = '00000000-0000-0000-0000-000000000002';
  const endpoint = 'https://fcm.googleapis.com/fcm/send/fixture';
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      insert into auth.users values ('${owner}'),('${other}');
      create function auth.uid() returns uuid language sql as
        $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to authenticated;
    `);
    await db.exec(readFileSync('supabase/schema.sql','utf8'));
    const sql = readFileSync('supabase/reminder_push.sql','utf8');
    await db.exec(sql);
    await db.exec(sql);
    await db.exec('grant select on public.user_spaces to service_role');
    const since = new Date(Date.now()-5*60000).toISOString();
    const recent = new Date(Date.now()-60000).toISOString();
    const weekly = new Date(Date.now()-7*86400000-60000).toISOString();
    const work = {tasks:[
      {id:'due',reminderAt:recent},
      {id:'weekly',reminderAt:weekly,reminderRepeat:'weekly',reminderTimeZone:'America/Mexico_City'},
      {id:'archived',archived:true,reminderAt:recent},
      {id:'completed',done:true,reminderAt:recent},
      {id:'acknowledged',remindedFor:recent,reminderAt:recent},
      {id:'malformed',reminderAt:'unknown'}
    ]};
    await db.query('insert into public.user_spaces(user_id,data) values ($1,$2)',[owner,work]);
    await db.query('insert into public.reminder_devices(user_id,endpoint,p256dh,auth,created_at) values ($1,$2,$3,$4,$5)',
      [owner,endpoint,'x'.repeat(87),'y'.repeat(22),since]);
    await db.exec('set role service_role');
    const claim = async () => (await db.query('select * from public.claim_due_reminder_push()')).rows;
    const delivery = await claim();
    assert.equal(delivery.length,2);
    assert.equal((await claim()).length,0);
    await db.query("update public.reminder_deliveries set status='retry',updated_at=now()-interval '3 minutes' where id=$1",[delivery[0].delivery_id]);
    assert.equal((await claim())[0].lease_attempt,2);
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[other]);
    await db.exec('set role authenticated');
    assert.equal((await db.query('select * from public.reminder_deliveries')).rows.length,0);
    await assert.rejects(claim(),/permission denied/);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);
    assert.equal((await db.query('update public.reminder_deliveries set opened_at=now() returning id')).rows.length,2);
    await assert.rejects(db.query("update public.reminder_deliveries set status='accepted'"),/permission denied/);
  } finally { await db.close(); }
});

test('service worker displays a private reminder and opens the agenda with a receipt', async () => {
  const {runInNewContext}=require('node:vm');
  const listeners = {};
  const notifications = [];
  const opened = [];
  const self = {
    addEventListener:(name, handler)=>{listeners[name]=handler;},
    registration:{showNotification:async (title, options)=>notifications.push({title,options})},
    clients:{matchAll:async()=>[],openWindow:async url=>opened.push(new URL(url))},
    location:{origin:'https://lifts.example'}
  };
  runInNewContext(readFileSync('web/sw.js','utf8'),{self,URL});
  const id='00000000-0000-4000-8000-000000000001';
  const pending = [];
  const waitUntil = promise=>pending.push(promise);
  listeners.push({data:{json:()=>({id,title:'Título privado'})},waitUntil});
  await Promise.all(pending);
  assert.equal(notifications.length,1);
  assert.equal(notifications[0].options.data.id,id);
  assert.doesNotMatch(JSON.stringify(notifications),/Título privado/);
  listeners.notificationclick({notification:{data:{id},close(){}},waitUntil});
  await Promise.all(pending);
  assert.equal(opened[0].searchParams.get('view'),'tasks');
  assert.equal(opened[0].searchParams.get('aviso'),id);
});

test('automatic setup keeps a single private key pair and wakes the configured dispatcher', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create schema net; create schema cron;
      create table public.cron_fixture(name text primary key, schedule text, command text);
      create table public.net_fixture(url text, headers jsonb, body jsonb);
      create function cron.schedule(name text, schedule text, command text) returns bigint
      language sql as $$ insert into public.cron_fixture values ($1,$2,$3)
        on conflict (name) do update set schedule=$2, command=$3 returning 1::bigint $$;
      create function net.http_post(url text, headers jsonb, body jsonb, timeout_milliseconds integer) returns bigint
      language sql as $$ insert into public.net_fixture values ($1,$2,$3) returning 1::bigint $$;
    `);
    // PGlite has no pg_cron/pg_net workers. The fixtures capture their calls.
    const migration = readFileSync('supabase/reminder_push_auto.sql','utf8').replace(/^create extension .*;$/gm,'');
    await db.exec(migration);
    await db.exec(migration);
    assert.equal((await db.query('select * from public.cron_fixture')).rows[0].schedule,'* * * * *');
    await db.exec('select lifts_push_private.wake()');
    assert.equal((await db.query('select * from public.net_fixture')).rows.length,0);
    const config = {
      public_key:'test-public',private_key:'test-private',dispatch_secret:'a'.repeat(64),
      subject:'https://example.com',dispatch_url:'https://test.supabase.co/functions/v1/reminder-dispatch'
    };
    await db.exec('set role authenticated');
    await assert.rejects(db.query('select public.lifts_push_configuration()'),/permission denied/);
    await assert.rejects(db.query('select * from lifts_push_private.configuration'),/permission denied/);
    await db.exec('set role service_role');
    const register = async candidate => (await db.query('select public.lifts_push_configuration($1) as config',[candidate])).rows[0].config;
    assert.deepEqual(await register(config),config);
    assert.deepEqual(await register({...config,private_key:'another'}),config);
    await db.exec('reset role');
    await db.exec('select lifts_push_private.wake()');
    const sent = (await db.query('select * from public.net_fixture')).rows[0];
    assert.equal(sent.url,config.dispatch_url);
    assert.equal(sent.headers['X-Dispatch-Key'],config.dispatch_secret);
    assert.deepEqual(sent.body,{action:'dispatch'});
  } finally {await db.close();}
});
