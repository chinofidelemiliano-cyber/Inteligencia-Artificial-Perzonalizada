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

test('unlabelled requests extract explicit dates and steps while preserving ambiguity',()=>{
  const {instruction}=require('../web/guardian.js');
  const clear=instruction('Ana me pidió entregar el informe para el 2026-12-09 a las 09:30.\n1. Medir\n2. Revisar');
  assert.deepEqual(clear.draft,{title:'entregar el informe',person:'Ana',date:'2026-12-09',time:'09:30',steps:['Medir','Revisar'],promise:''});
  assert.equal(instruction('Debo medir el lunes').draft.date,'');
  assert.equal(instruction('Debo medir para el 2026-02-30').draft.date,'');
  const conflict=instruction('Debo medir para el 2026-12-09\nFecha: 2026-12-10');
  assert.deepEqual(conflict.ambiguous,['fecha']);
  assert.equal(conflict.draft.date,'');
  assert.throws(()=>followup({subject:'Medir',person:'Ana',kind:'verify',next:'2026-12-09',time:'24:00',priority:'normal'},null,'2026-11-24','id'),/hora/);
});
