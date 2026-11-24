const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFile}=require('node:fs/promises');
const {PGlite}=require('@electric-sql/pglite');
const {relevant,route}=require('../web/evolution-core.js');

test('private memory requires matching terms and returns only bounded reference fields',()=>{
  const memories=[{id:'1',title:'Comco Cadet',text:'Estaciones documentadas.'},{id:'2',title:'Presupuesto',text:'Gastos del año.'}];
  assert.deepEqual(relevant('¿Cómo es la Comco?',memories),[{title:'Comco Cadet',text:'Estaciones documentadas.'}]);
  assert.deepEqual(relevant('¿Puedes explicar el calor?',memories),[]);
  assert.equal(relevant('Comco',Array(7).fill(memories[0])).length,3);
});

test('offline chat opens intended tools and calculates a circumference with units',()=>{
  assert.equal(route('Quiero calcular una distorsión').target,'engineering');
  assert.equal(route('Abre la plantilla de Pareto').template,'pareto');
  assert.equal(route('Explícame de dónde viene la distorsión'),null);
  assert.match(route('Circunferencia con diámetro de 100 mm').reply,/314\.159265 mm/);
  assert.match(route('Circunferencia con diámetro de -4 cm').reply,/positivo/);
  assert.match(route('Circunferencia de diámetro 28').reply,/unidad/);
});

test('the real SQL policies isolate two authenticated accounts and deny anonymous reads',async()=>{
  const db=new PGlite();
  const a='00000000-0000-4000-8000-000000000001', b='00000000-0000-4000-8000-000000000002';
  const authenticate=async id=>{
    await db.exec('reset role; set role authenticated;');
    await db.query("select set_config('request.jwt.claim.sub', $1, false)",[id]);
  };
  try {
    await db.exec(`create role authenticated; create role anon; create schema auth;
      create table auth.users(id uuid primary key);
      insert into auth.users values ('${a}'),('${b}');
      create function auth.uid() returns uuid language sql stable as
        $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated;`);
    await db.exec(await readFile('supabase/schema.sql','utf8'));
    await authenticate(b);
    await db.query('insert into public.user_spaces(user_id,data) values($1,$2)',[b,{privateMemories:[{title:'B privado'}]}]);
    await authenticate(a);
    assert.deepEqual((await db.query('select data from public.user_spaces where user_id=$1',[b])).rows,[]);
    assert.deepEqual((await db.query("update public.user_spaces set data='{}' where user_id=$1 returning user_id",[b])).rows,[]);
    assert.deepEqual((await db.query('delete from public.user_spaces where user_id=$1 returning user_id',[b])).rows,[]);
    await assert.rejects(db.query("insert into public.user_spaces(user_id) values($1)",[b]),/row-level security/);
    await db.query('insert into public.user_spaces(user_id,data) values($1,$2)',[a,{privateMemories:[{title:'A privado'}]}]);
    assert.deepEqual((await db.query('select user_id from public.user_spaces')).rows,[{user_id:a}]);
    await assert.rejects(db.query('update public.user_spaces set user_id=$1 where user_id=$2',[b,a]),/row-level security/);
    await authenticate(b);
    assert.deepEqual((await db.query('select data from public.user_spaces')).rows,[{data:{privateMemories:[{title:'B privado'}]}}]);
    await db.exec('reset role; set role anon;');
    await assert.rejects(db.query('select data from public.user_spaces'),/permission denied/);
  } finally {await db.close();}
});
