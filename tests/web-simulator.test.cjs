const {test}=require('node:test');
const assert=require('node:assert/strict');
const {simulate}=require('../web/web-simulator.js');
const fixture={speed:'60',alternate:'120',length:'2',print:'250',cut:'249,5',cycles:'10'};
test('band simulation preserves dimensions and direction of accumulated drift',()=>{
  assert.deepEqual(simulate(fixture),{seconds:[2,1],repetitions:[240,480],drift:-5});
  assert.throws(()=>simulate({...fixture,speed:'0'}),/velocidad/);
  assert.throws(()=>simulate({...fixture,cycles:'1.5'}),/entero/);
});
