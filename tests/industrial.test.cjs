const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('../web/industrial-core.js');

test('registered routes, inventory, orders and pair rules share stable IDs',()=>{
  let space=core.blank();
  const add=(kind,data,id)=>{
    const result=core.change(space,kind,data,id);
    space=result.space;
    return result.item;
  };
  assert.throws(()=>add('machines',{name:'P1',path:'Un paso'}),/2 a 24/);
  const machine=add('machines',{name:'P1',path:'Entrada\nEstación\nSalida'});
  assert.deepEqual(machine.path,['Entrada','Estación','Salida']);
  assert.throws(()=>add('stock',{name:'Tinta U',category:'ink',quantity:'1e2',unit:'kg'}),/cantidad/);
  const ink=add('stock',{name:'Tinta U',category:'ink',quantity:'4,25',unit:'kg',lot:'L-7'});
  assert.equal(ink.quantity,4.25);
  assert.throws(()=>add('orders',{name:'OT-7',machine:machine.id,plate:ink.id}),/Placa/);
  const order=add('orders',{name:'OT-7',machine:machine.id,ink:ink.id});
  assert.deepEqual(core.assess(space,order).violations,[]);
  const rule=add('rules',{name:'Prueba de taller',left:ink.id,right:machine.id,reason:'Medición registrada'});
  assert.throws(()=>add('rules',{name:'Duplicada',left:machine.id,right:ink.id,reason:'idem'}),/Ya existe/);
  assert.equal(core.assess(space,order).violations[0].rightName,'P1');
  add('rules',{...rule,active:'no'},rule.id);
  assert.equal(core.assess(space,order).ruleCount,0);
  assert.deepEqual(core.assess(space,order).missing,['Material','Anilox','Placa','Suaje']);
  const snapshot=core.trace(space,order.id);
  assert.equal(snapshot.ink,'Tinta U · L-7');
  assert.equal(snapshot.orderLink,order.id);
  add('stock',{...ink,lot:'L-9'},ink.id);
  assert.equal(snapshot.ink,'Tinta U · L-7');
  assert.equal(core.trace(space,order.id).ink,'Tinta U · L-9');
  assert.equal(core.trace(core.blank(),order.id),null);
});

test('machine parameters preserve units and require a traceable source',()=>{
  const {blank,change}=require('../web/industrial-core.js');
  const raw={name:'Prensa',path:'Entrada\nSalida',webWidth:'330,5',maxSpeed:'90',stations:'6'};
  assert.throws(()=>change(blank(),'machines',raw),/referencia técnica/);
  const saved=change(blank(),'machines',{...raw,parameterSource:'Medición firmada'});
  assert.deepEqual(saved.item.parameters,{webWidth:330.5,maxSpeed:90,stations:6});
  assert.throws(()=>change(saved.space,'machines',{...raw,stations:'6.5',parameterSource:'Manual'},saved.item.id),/estaciones/);
  assert.deepEqual(change(blank(),'machines',{name:'Registro antiguo',path:'Entrada\nSalida'}).item.parameters,{});
});

test('typed machine components preserve the real band path and remain compatible with plain labels',()=>{
  const {blank,change}=require('../web/industrial-core.js');
  const {item}=change(blank(),'machines',{name:'Prensa',path:'[rodillo] Entrada\n[secado] Túnel\nSalida'});
  assert.deepEqual(item.path,['Entrada','Túnel','Salida']);
  assert.deepEqual(item.componentKinds,['rodillo','secado','']);
});
