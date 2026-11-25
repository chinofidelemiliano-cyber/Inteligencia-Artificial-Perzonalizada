const {test}=require('node:test');
const assert=require('node:assert/strict');
const {schedule}=require('../web/finance-amortization.js');

test('amortization balances principal, interest and final balance',()=>{
  const result=schedule(['10000','1','12']);
  assert.equal(result.rows.length,12);
  assert.equal(result.rows[0].interest,100);
  assert.equal(result.rows.at(-1).balance,0);
  assert.ok(Math.abs(result.rows.reduce((sum,row)=>sum+row.principalPaid,0)-10000)<1e-8);
  assert.ok(Math.abs(result.payment-888.4878867834)<1e-8);
  assert.ok(Math.abs(result.rows.reduce((sum,row)=>sum+row.payment,0)-result.totalPaid)<1e-8);
});

test('zero rates retain equal installments and invalid terms fail',()=>{
  const result=schedule([1200,0,12]);
  assert.equal(result.totalInterest,0);
  assert.ok(result.rows.every(row=>row.payment===100));
  assert.throws(()=>schedule([0,1,12]),/positivo/);
  assert.throws(()=>schedule([10000,1,481]),/480 pagos/);
});
