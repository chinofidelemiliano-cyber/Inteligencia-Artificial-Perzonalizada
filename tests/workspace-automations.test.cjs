const {test}=require('node:test');
const assert=require('node:assert/strict');
const {define,evaluate}=require('../web/workspace-automations.js');

test('automation rules respect type, text condition, pausing and Radar state',()=>{
  const rule=define({name:'Revisar producción',when:'task',condition:'presión',then:'reminder'},'rule');
  const state={
    tasks:[{id:'a',title:'Revisar presión',date:'2026-11-21'},{id:'b',title:'Control de presión',date:'2026-11-22'},
      {id:'c',title:'Regla distinta',date:'2026-11-22'}],
    workspaceAutomations:{rules:[rule,{...rule,id:'paused',paused:true}]},
    personalRadar:{'task:b:2026-11-22':{status:'snoozed',until:'2026-11-26'}}
  };
  assert.deepEqual(evaluate(state,'2026-11-25').map(item=>[item.rule.id,item.signal.id]),[['rule','task:a:2026-11-21']]);
  assert.throws(()=>define({name:'Plan',when:'constructor',then:'open'},'x'),/Revisa/);
});

test('calibration rules reuse dated active records without loading manual files',()=>{
  const rule=define({name:'Instrumento',when:'calibration',then:'open'},'cal');
  const state={workspaceAutomations:{rules:[rule]},nexusJournal:[
    {id:'active',kind:'calibration',title:'Balanza',status:'active',data:{date:'2026-11-26'}},
    {id:'retired',kind:'calibration',title:'Micrómetro',status:'retired',data:{date:'2026-11-26'}}
  ]};
  assert.equal(evaluate(state,'2026-11-25')[0].signal.destination.key,'active');
  assert.equal(evaluate(state,'2026-11-25').length,1);
});
