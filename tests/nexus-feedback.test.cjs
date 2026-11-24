const {test}=require('node:test');
const assert=require('node:assert/strict');
const {draft,search}=require('../web/nexus-feedback.js');

test('private feedback requires a topic and concrete text for corrections',()=>{
  assert.throws(()=>draft({topic:'  ',verdict:'useful'}),/tema/);
  assert.throws(()=>draft({topic:'Fricción',verdict:'incorrect'}),/corrección/);
  const item=draft({topic:'  Fricción  ',verdict:'correction',correction:'Distinguir adhesión de humectación.',answer:'No copiar'});
  assert.equal(item.topic,'Fricción');
  assert.equal(item.answer,undefined);
  const other=draft({topic:'Montaje',verdict:'useful'});
  assert.deepEqual(search([item,other],'humectacion'),[item]);
  assert.deepEqual(search([other],'friccion'),[]);
});
