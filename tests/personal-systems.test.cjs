const {test}=require('node:test');
const assert=require('node:assert/strict');
const {addNode,addEdge,cycles,downstream}=require('../web/personal-systems.js');

test('system routes preserve uncertainty and avoid looping through cycles',()=>{
  const start={nodes:[],edges:[]};
  const map=['Humedad','Merma','Tiempo'].reduce((prev,name,index)=>addNode(prev,{name},String(index)),start);
  assert.throws(()=>addNode(map,{name:'  MERMA '}),/distinto/);
  assert.throws(()=>addEdge(map,{from:'0',to:'1',label:'a',sign:'negative',status:'observed'}),/evidencia/);
  const first=addEdge(map,{from:'0',to:'1',label:'a',sign:'negative',status:'observed',evidence:'Registro de lote',lag:'1.50'},'a');
  const second=addEdge(first,{from:'1',to:'2',label:'b',sign:'unknown',status:'hypothesis'},'b');
  const third=addEdge(second,{from:'2',to:'0',label:'c',sign:'positive',status:'hypothesis',lag:'3'},'c');
  assert.deepEqual(cycles(third),[['0','1','2','0']]);
  assert.deepEqual(downstream(third,'0'),[{id:'1',steps:1,lag:1.5,hypothesis:false},{id:'2',steps:2,lag:null,hypothesis:true}]);
});
