const {test}=require('node:test');
const assert=require('node:assert/strict');
const {calculate}=require('../web/process-performance.js');

test('indices use distinct overall and within-subgroup variation',()=>{
  const result=calculate({readings:'9 10 11',lower:'7',upper:'13',within:'0,5'});
  assert.equal(result.deviation,1);
  assert.deepEqual([result.pp,result.ppk,result.cp,result.cpk],[1,1,2,2]);
  assert.ok(calculate({readings:'12 13 14',lower:'7',upper:'11'}).ppk<0);
});
test('process indices reject reversed specifications and degenerate samples',()=>{
  assert.throws(()=>calculate({readings:'1 2',lower:'5',upper:'2'}),/superar/);
  assert.throws(()=>calculate({readings:'1 1',lower:'0',upper:'2'}),/variación/);
});
