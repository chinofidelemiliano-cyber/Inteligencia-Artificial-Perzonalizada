const {test}=require('node:test');
const assert=require('node:assert/strict');
const lab=import('../web/ink-lab.js');
const base={source:'Ficha p. 2',product:'Producto de prueba',ink:'Serie de prueba',basis:'product',mass:'2',previous:'0',min:'0,1',nominal:'0,5',max:'0,8',target:'0,5'};

test('calculates authorized product and active dosing with prior adjustment and documented density',async()=>{
  const {dose}=await lab;
  assert.equal(dose(base).add,10);
  assert.equal(dose(base).ml,null);
  const active=dose({...base,basis:'active',active:'50',previous:'5',density:'1,25',price:'100'});
  assert.equal(active.add,15);
  assert.equal(active.ml,12);
  assert.equal(active.cost,1.5);
  assert.equal(active.remaining,27);
  assert.equal(dose({...base,previous:'20'}).aboveMaximum,true);
  assert.throws(()=>dose({...base,source:''}),/fuente/);
  assert.throws(()=>dose({...base,target:'1'}),/rango/);
  assert.throws(()=>dose({...base,basis:'active'}),/concentración/);
});

test('balances dilution, scales recipes and compares measured LAB samples',async()=>{
  const {dilution,recipe,comparison}=await lab;
  assert.deepEqual(dilution({stock:96,target:48,total:2000}),{stockMl:1000,totalMl:2000});
  assert.throws(()=>dilution({stock:70,target:80,total:2000}),/objetivo/);
  assert.deepEqual(recipe(50,'A | 75\nB | 25').map(row=>row.amount),[37.5,12.5]);
  assert.throws(()=>recipe(50,'A | 75\nB | 10'),/100/);
  assert.equal(comparison('55 2 -3','56 2 -3').differences.de76,1);
  assert.throws(()=>comparison('105 0 0','56 2 -3'),/LAB/);
});

test('subtracts confirmed consumption only from a stocked additive without mutating earlier state',async()=>{
  const {consumeAdditive}=await lab;
  const industrial={stock:[{id:'x',category:'additive',unit:'kg',quantity:1.2},{id:'ink',category:'ink',unit:'kg',quantity:2}]};
  assert.equal(consumeAdditive(industrial,'x',20).stock[0].quantity,1.18);
  assert.equal(industrial.stock[0].quantity,1.2);
  assert.throws(()=>consumeAdditive(industrial,'x',1201),/saldo/);
  assert.throws(()=>consumeAdditive(industrial,'ink',20),/aditivo/);
});
