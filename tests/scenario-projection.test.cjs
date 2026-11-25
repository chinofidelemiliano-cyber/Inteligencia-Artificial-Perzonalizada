const {test}=require('node:test');
const assert=require('node:assert/strict');
const {project}=require('../web/scenario-projection.js');
const inputs={start:'100',adverse:'-25',base:'0',favorable:'50',months:'3 12 36'};
test('projections preserve signed changes and report sensitivity by horizon',()=>{
  assert.deepEqual(project(inputs),[
    {month:3,values:[25,100,250],sensitivity:3},
    {month:12,values:[-200,100,700],sensitivity:12},
    {month:36,values:[-800,100,1900],sensitivity:36}
  ]);
  assert.equal(project({...inputs,favorable:'50,5'})[0].values[2],251.5);
});
test('projections reject repeated, descending or excessive horizons',()=>{
  for(const months of ['3 3 36','12 3 36','0 12 36','3 12 601','3 12'])assert.throws(()=>project({...inputs,months}));
  assert.throws(()=>project({...inputs,start:'1e6'}),/decimales/);
});
