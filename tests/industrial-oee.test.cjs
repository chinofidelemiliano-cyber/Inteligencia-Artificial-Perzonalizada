const {test}=require('node:test');
const assert=require('node:assert/strict');
const {oee}=require('../web/industrial-oee.js');
const fixture={planned:'100',stopped:'10',cycle:'6',pieces:'720',good:'684'};
test('OEE decomposes time, output, and quality using consistent units',()=>{
  const result=oee(fixture);
  assert.deepEqual([result.availability,result.performance,result.quality],[0.9,0.8,0.95]);
  assert.ok(Math.abs(result.oee-0.684)<1e-12);
  assert.equal(result.scrap,36);
});
test('OEE rejects invalid counts and preserves out-of-range performance for review',()=>{
  assert.throws(()=>oee({...fixture,good:'721'}),/conteo/);
  assert.throws(()=>oee({...fixture,stopped:'100'}),/tiempo/);
  assert.ok(oee({...fixture,cycle:'9'}).performance>1);
});
