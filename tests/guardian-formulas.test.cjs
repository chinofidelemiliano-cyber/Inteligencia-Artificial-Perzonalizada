const {test}=require('node:test');
const assert=require('node:assert/strict');
const {calculate}=require('../web/guardian-formulas.js');

test('featured formulas match known cases with decimal input and expected dimensions',()=>{
  const examples={
    percent:[[250,12],30],direct:[[4,30,10],75],inverse:[[4,30,10],12],
    discount:[[1000,20,10],720],compound:[[1000,5,3],1157.625],
    loan:[[1200,0,12],100],circle:[[10],Math.PI*100],
    linear:[[0,4,10,24,6],16],labels:[[330,3,100],10],
    bcm:[['5,0','4,0'],20],ohm:[[2,12],24],density:[[250,200],1.25]
  };
  for(const [id,[args,expected]] of Object.entries(examples)){
    assert.ok(Math.abs(calculate(id,args).result-expected)<1e-8,id);
  }
  assert.ok(Math.abs(calculate('loan',[10000,1,12]).result-888.4878867834)<1e-8);
});

test('formula inputs reject zero denominators, out-of-range values and unsupported formulas',()=>{
  for(const [id,values] of [
    ['direct',[0,30,10]],['loan',[1200,0,0]],['labels',[250,3,100]],
    ['labels',[330,2.5,100]],['discount',[100,101,0]],['linear',[0,4,10,24,11]],
    ['bcm',[0,4]],['percent',['',10]],['constructor',[5,10]]
  ])assert.throws(()=>calculate(id,values),Error,id);
});

test('expanded finance formulas match known examples and validate bounds',()=>{
  const {calculate}=require('../web/guardian-formulas.js');
  assert.equal(calculate('simpleInterest',[1000,5,3]).result,150);
  assert.ok(Math.abs(calculate('presentValue',[1210,10,2]).result-1000)<1e-9);
  assert.ok(Math.abs(calculate('realReturn',[5,4]).result-0.96153846)<1e-8);
  assert.equal(calculate('breakEven',[1000,70,40]).result,34);
  assert.equal(calculate('workHours',[600,120]).result,5);
  assert.throws(()=>calculate('breakEven',[1000,40,40]),/mayor/);
});
