const {test}=require('node:test');
const assert=require('node:assert/strict');
const {motivation,summary,strategies}=require('../web/mind-core.js');

test('motivation model uses bounded expectation and nonnegative decimal input',()=>{
  assert.equal(motivation(['0,5','10','1','4']).result,1);
  assert.equal(motivation([1,10,0,4]).result,10);
  assert.throws(()=>motivation([1.01,10,1,4]),/0 a 1/);
  assert.throws(()=>motivation([1,10,-1,4]),/no negativos/);
  assert.throws(()=>motivation([1,10,1]),/0 a 1/);
});
test('behavior review separates pending evaluations and justified changes',()=>{
  const now=10*86400000;
  const entries=[
    {at:now,barrier:'tired',result:'pending'},
    {at:now-1000,barrier:'priority',result:'helped'},
    {at:now-8*86400000,barrier:'unclear',result:'none'}
  ];
  assert.deepEqual(summary(entries,now),{count:2,factors:{tired:1,priority:1},helped:1,evaluated:1});
  assert.equal(strategies.tired[1],'Descansar');
  assert.equal(strategies.priority[1],'Reorganizar');
});

test('training spans four stages and ends in a comparison with baseline',()=>{
  const {trainingStep,agendaSignals}=require('../web/mind-core.js');
  assert.equal(trainingStep(30,7).name,'Inicio');
  assert.equal(trainingStep(30,14).name,'Concentración');
  assert.match(trainingStep(30,29).activity,/punto de partida/);
  assert.equal(trainingStep(30,30),null);
  assert.deepEqual(agendaSignals([
    {id:'late',date:'2026-11-23'},{id:'rest',kind:'break',date:'2026-11-23'},
    {id:'completed',done:true,date:'2026-11-23'},{id:'today',date:'2026-11-24'}
  ],'2026-11-24').map(item=>item.id),['late']);
});
