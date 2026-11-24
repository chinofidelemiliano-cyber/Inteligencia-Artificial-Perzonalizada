const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseSteps,nextRun}=require('../web/guided-routines.js');
const {relevant}=require('../web/evolution-core.js');

test('guided routines validate minutes and preserve results through a timed run',()=>{
  const routine={steps:parseSteps('Preparar | 5\nRevisión | | opcional')};
  assert.throws(()=>parseSteps('Otro | 121'),/120 minutos/);
  const empty={index:0,endsAt:0,results:[]};
  assert.throws(()=>nextRun(empty,routine,'skip',0),/Completa/);
  const timed=nextRun(empty,routine,'timer',1000);
  assert.equal(timed.endsAt,301000);
  const active=nextRun(timed,routine,'done',2000);
  assert.equal(active.endsAt,0);
  const complete=nextRun(active,routine,'skip',3000);
  assert.equal(complete.finishedAt,3000);
  assert.deepEqual(complete.results.map(item=>item.status),['done','skip']);
});

test('archived memories are excluded and metadata stays out of chat payloads',()=>{
  assert.deepEqual(relevant('Catálogo',[
    {title:'Catálogo oculto',text:'Anterior',archived:true},
    {title:'Catálogo nuevo',text:'Vigente',context:'Privado',category:'Compra'}
  ]),[{title:'Catálogo nuevo',text:'Vigente'}]);
});

test('backup preserves archived status and memory metadata',()=>{
  const {parseBackup}=require('../web/nexus-backup.js');
  const memory={
    id:'10000000-0000-4000-8000-000000000001',
    title:'Herramienta',text:'Guardada en el taller',category:'Objeto guardado',
    context:'Gabinete',createdAt:'2026-11-24T16:00:00.000Z',archived:true
  };
  assert.deepEqual(parseBackup(JSON.stringify({privateMemories:[memory]})).collections.privateMemories,[memory]);
});
