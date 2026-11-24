const {test}=require('node:test');
const assert=require('node:assert/strict');
const {summarize,followup}=require('../web/guardian.js');

test('Guardian uses actual local day boundaries, priorities, completions and overlap',()=>{
  const start=Date.parse('2026-11-24T06:00Z'),end=start+86400000;
  const brief=summarize({tasks:[
    {id:'a',title:'Primero',startAt:'2026-11-24T15:00Z',duration:60},
    {id:'b',title:'Segundo',startAt:'2026-11-24T15:30Z',duration:30},
    {id:'c',title:'Contiguo',startAt:'2026-11-24T16:00Z',duration:30},
    {id:'d',title:'Vencido',date:'2026-11-23',priority:1},
    {id:'e',title:'Completado',done:true,completedAt:'2026-11-24T16:00Z'},
    {id:'f',title:'Mañana',startAt:'2026-11-25T06:00Z',duration:30},
    {id:'g',title:'Archivado',date:'2026-11-24',archived:true},
    {id:'h',title:'Aviso',date:'2026-11-24',kind:'reminder'}
  ],guardianFollowups:[
    {id:'active',next:'2026-11-24'},
    {id:'closed',next:'2026-11-24',closed:true},
    {id:'future',next:'2026-11-25'}
  ]},{day:'2026-11-24',tomorrow:'2026-11-25',start,end,endTomorrow:end+86400000,now:start});
  assert.deepEqual(brief.conflicts,[['Primero','Segundo']]);
  assert.deepEqual(brief.priorities.map(task=>task.id),['d','a','b','c']);
  assert.deepEqual(brief.complete.map(task=>task.id),['e']);
  assert.deepEqual(brief.tomorrow.map(task=>task.id),['f']);
  assert.deepEqual(brief.follow.map(task=>task.id),['active']);
});

test('followup validates calendar dates and preserves identity and status on edit',()=>{
  const value={subject:' Catálogo ',person:' Rosa ',kind:'receive',next:'2026-11-24',priority:'high'};
  assert.throws(()=>followup({...value,next:'2026-02-30'},null,'2026-11-23','id'),/fecha/);
  const first=followup(value,null,'2026-11-23','id');
  assert.equal(first.subject,'Catálogo');
  const edit=followup({...value,next:'2026-11-28'},{...first,closed:true},'2026-11-24','discarded');
  assert.equal(edit.id,'id');
  assert.equal(edit.created,'2026-11-23');
  assert.equal(edit.closed,true);
});

test('an instruction draft uses supplied labels and notices contradictory dates',()=>{
  const {instruction}=require('../web/guardian.js');
  const review=instruction('Entregable: informe\nFecha: lunes\nFecha: martes\nVerificación: revisar dos muestras\nNota adicional');
  assert.deepEqual(review.ambiguous,['fecha']);
  assert.equal(review.action,'Confirmar fecha con quien solicitó el trabajo.');
  assert.deepEqual(review.fields.get('verificacion'),['revisar dos muestras']);
  assert.deepEqual(review.extra,['Nota adicional']);
  assert.equal(instruction('No entiendo').action,'Confirmar qué se debe entregar.');
});
