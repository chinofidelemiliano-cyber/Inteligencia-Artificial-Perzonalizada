const {test}=require('node:test');
const assert=require('node:assert/strict');
const {compare}=require('../web/finance-comparison.js');
const inputs={principal:'10000',rateA:'1',rateB:'0',monthsA:'12',monthsB:'10',feeA:'100',feeB:'50',rateChange:'0,25',monthsChange:'6'};
test('loan comparison includes fees and changes one variable at a time',()=>{
  const [a,b,rate,term]=compare(inputs);
  assert.equal(b.payment,1000);
  assert.equal(b.total,10050);
  assert.ok(Math.abs(a.total-(12*888.4878867834+100))<1e-8);
  assert.equal(rate.rate,1.25);
  assert.equal(rate.months,a.months);
  assert.equal(term.rate,a.rate);
  assert.equal(term.months,18);
  assert.ok(term.payment<a.payment&&term.total>a.total);
});
test('negative commissions and out-of-range sensitivity are rejected',()=>{
  for(const change of [{feeA:'-1'},{rateChange:'-2'},{monthsChange:'-12'},{monthsChange:'1.5'}])assert.throws(()=>compare({...inputs,...change}));
});
