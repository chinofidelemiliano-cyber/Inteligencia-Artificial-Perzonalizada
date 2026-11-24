const {test}=require('node:test');
const assert=require('node:assert/strict');
const {record,relation,compareCosts}=require('../web/nexus-journal.js');

test('mission requires evidence and completed checklist before closure and preserves identity on edit',()=>{
  const initial=record('mission',{title:'Reducir merma',status:'paused',stages:'Medir\nValidar\nMedir',completed:['Medir','otra']});
  assert.deepEqual(initial.completed,['Medir']);
  assert.throws(()=>record('mission',{title:initial.title,status:'done'}),/evidencia/);
  const data={title:initial.title,objective:'Reducir',deliverable:'Informe',acceptance:'Informe revisado',evidence:'Revisión del 10 de mayo',stages:'Medir\nValidar',status:'done'};
  assert.throws(()=>record('mission',{...data,completed:['Medir']},initial),/etapas/);
  const done=record('mission',{...data,completed:['Medir','Validar']},initial);
  assert.equal(done.id,initial.id);assert.equal(done.createdAt,initial.createdAt);assert.equal(done.status,'done');
});

test('knowledge and links have evidence rules and links reference records in the supplied space',()=>{
  assert.throws(()=>record('knowledge',{title:'Material',status:'verified',source:'manual'}),/evidencia/);
  const a=record('knowledge',{title:'Material',status:'verified',source:'manual',evidence:'p. 17'});
  const b=record('decision',{title:'Cambiar material'});
  const data={from:a.id,to:b.id,title:'Sustenta',status:'verified',evidence:'Prueba repetida'};
  assert.throws(()=>relation(data,[a]),/dos registros/);
  assert.throws(()=>relation({...data,evidence:''},[a,b]),/evidencia/);
  assert.equal(relation(data,[a,b]).to,b.id);
  assert.throws(()=>record('change',{title:'Cambio',status:'validated'}),/reversión/);
});

test('cost comparison uses exact cents and validates decimal input',()=>{
  const result=compareCosts({unit:'MXN',base:'50,31',favorable:'40.21',adverse:'60.50'});
  assert.deepEqual(result.rows.map(row=>row.difference),[0,-10.1,10.19]);
  assert.throws(()=>compareCosts({unit:'MXN',base:'1e4',favorable:'1',adverse:'2'}),/decimales/);
  assert.throws(()=>compareCosts({unit:'MXN',base:'-2',favorable:'1',adverse:'2'}),/decimales/);
});

test('reviews use only real event timestamps and include start but exclude end',()=>{
  const {timeline}=require('../web/nexus-journal.js');
  const start=Date.parse('2026-01-01T00:00:00Z'), end=Date.parse('2026-01-02T00:00:00Z');
  const events=timeline({tasks:[
    {title:'Entrada válida',done:true,completedAt:new Date(start).toISOString()},
    {title:'Fuera del periodo',done:true,completedAt:new Date(end).toISOString()},
    {title:'Sin evidencia temporal',done:true,date:'2026-01-01'},
    {title:'Sigue pendiente',done:false,completedAt:new Date(start).toISOString()}
  ]},start,end);
  assert.deepEqual(events.map(item=>item.label),['Entrada válida']);
});

test('experiment summaries calculate sample standard deviation',()=>{
  const {measurementSummary}=require('../web/nexus-journal.js');
  assert.deepEqual(measurementSummary('2,0 4\n6'),{count:3,mean:4,deviation:2});
  assert.throws(()=>measurementSummary('1'),/dos mediciones/);
  assert.throws(()=>measurementSummary('1 2mm'),/mediciones/);
});

test('recurrence requires verified evidence and counts distinct cases even with multiple links',()=>{
  const {graphNodes,graphView,linkedCases}=require('../web/nexus-journal.js');
  const space={engineeringRecords:[{id:'f',data:{name:'Ficha A'}}],diagnosticCases:[
    {id:'a',data:{name:'Caso A'}},{id:'b',data:{name:'Caso B'}}
  ]};
  const nodes=graphNodes(space);
  const edge=(id,from,to,status='verified',evidence='registro citado')=>({id,from,to,status,evidence});
  const set=[edge('1','f','a'),edge('2','a','f'),edge('3','f','b','suggested'),edge('4','f','b','verified',' '),edge('5','f','missing')];
  assert.equal(graphView(nodes,set).length,4);
  assert.deepEqual(linkedCases(nodes,graphView(nodes,set)),[]);
  const groups=linkedCases(nodes,graphView(nodes,[...set,edge('6','b','f')]));
  assert.equal(groups.length,1);
  assert.equal(groups[0].engineering.id,'f');
  assert.deepEqual(groups[0].cases.map(item=>[item.diagnosis.id,item.links.length]),[['a',2],['b',1]]);
});

test('journal retains prior content, restores it as a new change and keeps graph identity',()=>{
  const {restoreRecord}=require('../web/nexus-journal.js');
  const initial=record('mission',{title:'Proyecto original',status:'paused',stages:'Medición\nValidación',completed:['Medición']});
  const updated=record('mission',{title:'Proyecto vigente',status:'active',stages:'Inspección',completed:[]},initial);
  const [originalVersion]=updated.history;
  assert.equal(originalVersion.title,initial.title);
  assert.equal(originalVersion.status,'paused');
  assert.deepEqual(originalVersion.completed,['Medición']);
  assert.equal(originalVersion.history,undefined);
  const restored=restoreRecord(updated,originalVersion.id);
  assert.equal(restored.id,initial.id);
  assert.equal(restored.createdAt,initial.createdAt);
  assert.equal(restored.restoredFrom,originalVersion.id);
  assert.equal(restored.title,initial.title);
  assert.deepEqual(restored.completed,initial.completed);
  assert.deepEqual(restored.history.map(version=>version.title),['Proyecto vigente','Proyecto original']);
  assert.equal(restoreRecord(restored,originalVersion.id),restored);
  assert.throws(()=>restoreRecord(restored,'otra-cuenta-o-versión'),/ya no está disponible/);
});

test('journal skips duplicate edits, bounds history and revalidates older content',()=>{
  const {restoreRecord,historyLimit}=require('../web/nexus-journal.js');
  let entry=record('knowledge',{title:'Ficha 0',status:'documented'});
  assert.equal(record('knowledge',{title:'  Ficha 0  ',status:'documented'},entry),entry);
  for(let index=1;index<=historyLimit+2;index++){
    entry=record('knowledge',{title:'Ficha '+index,status:'documented'},entry);
  }
  assert.equal(entry.history.length,historyLimit);
  assert.equal(entry.history.at(-1).title,'Ficha 2');
  const bad={...entry.history[0],status:'verified',data:{source:'Manual'}};
  assert.throws(()=>restoreRecord({...entry,history:[bad]},bad.id),/evidencia/);
});
