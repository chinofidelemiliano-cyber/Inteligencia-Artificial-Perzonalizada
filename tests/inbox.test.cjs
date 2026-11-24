const {test}=require('node:test');
const assert=require('node:assert/strict');
const {capture,setProcessed}=require('../web/inbox.js');

test('capture validates title and stores the given ID and time without a scheduling side effect',()=>{
 const item=capture('  Revisar repuestos  ','item-a','2026-11-24T09:00:00.000Z');
 assert.deepEqual(item,{id:'item-a',title:'Revisar repuestos',createdAt:'2026-11-24T09:00:00.000Z',processed:false});
 assert.throws(()=>capture(null,'item-a',''),TypeError);
 assert.throws(()=>capture('    ','item-a',''),TypeError);
 assert.throws(()=>capture('x'.repeat(241),'item-a',''),TypeError);
});

test('processing and reopening preserve source title and identity without mutating the input list',()=>{
 const original=[capture('Primera','item-a',''),capture('Segunda','item-b','')];
 const processed=setProcessed(original,'item-a',true);
 assert.equal(original[0].processed,false);
 assert.equal(processed[0].processed,true);
 assert.equal(processed[0].title,'Primera');
 assert.strictEqual(processed[1],original[1]);
 assert.deepEqual(setProcessed(processed,'item-a',false),original);
});
