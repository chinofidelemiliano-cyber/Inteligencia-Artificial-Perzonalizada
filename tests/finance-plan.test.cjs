const {test}=require('node:test');
const assert=require('node:assert/strict');
const {record,progress}=require('../web/finance-plan.js');
test('financial cards store exact cents and distinguish saving from outstanding debt',()=>{
  const saving=record({name:'Fondo',kind:'saving',target:'100',current:'25,50'},'a');
  assert.equal(saving.current,2550);
  assert.deepEqual(progress(saving),{remaining:7450,percent:25.5});
  const debt=record({name:'Crédito',kind:'debt',target:'100',current:'125'},'b');
  assert.deepEqual(progress(debt),{remaining:12500,percent:-25});
  assert.equal(record({name:'Fondo',kind:'saving',target:'100',current:'0'},'c',saving).id,'a');
  assert.throws(()=>record({name:'Fondo',kind:'saving',target:'0',current:'0'},'c'),/mayor que cero/);
});
