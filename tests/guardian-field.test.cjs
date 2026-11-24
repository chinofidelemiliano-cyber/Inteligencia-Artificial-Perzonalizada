const {test}=require('node:test');
const assert=require('node:assert/strict');
const {clock,readings}=require('../web/guardian-field.js');
const {lookup}=require('../web/evolution-core.js');

test('field measurements keep decimal readings and reject ambiguous input',()=>{
  assert.equal(readings('3,27  3.29\n-1'),'3.27 3.29 -1');
  assert.throws(()=>readings('3,27,3'),/decimales/);
  assert.throws(()=>readings(''),/decimales/);
  assert.equal(clock(61399),'01:01.3');
});
test('explicit memory queries only return matching active memories',()=>{
  const memories=[{title:'Llave',text:'En la caja',context:'Taller digital'},{title:'Taller',text:'Texto archivado',archived:true}];
  const reply=lookup('Busca en mis recuerdos sobre el taller',memories).reply;
  assert.match(reply,/Llave · En la caja/);
  assert.doesNotMatch(reply,/archivado/);
  assert.equal(lookup('Explícame un taller',memories),null);
});

test('calculator hub converts physical units and rejects incompatible dimensions',()=>{
  const {convert}=require('../web/guardian-calculator.js');
  assert.equal(convert('1','in','mm').result,25.4);
  assert.equal(convert('1,25','bar','kPa').result,125);
  assert.throws(()=>convert('1','kg','mm'),/misma magnitud/);
});

test('field links require an exact identifier in the requested collection of the current space',()=>{
  const {parse,owns}=require('../web/guardian-field-links.js');
  const id='10000000-0000-4000-8000-000000000001';
  assert.deepEqual(parse('#ficha/calibration/'+id),{kind:'calibration',id});
  assert.equal(parse('#ficha/orders/'+id),null);
  assert.equal(parse('#ficha/calibration/'+id+'/extra'),null);
  assert.equal(owns({industrial:{stock:[{id}]}},'machines',id),false);
  assert.equal(owns({nexusJournal:[{kind:'note',id}]},'calibration',id),false);
  assert.equal(owns({nexusJournal:[{kind:'calibration',id}]},'calibration',id),true);
});
