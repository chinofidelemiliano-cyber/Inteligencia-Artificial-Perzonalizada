const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFile}=require('node:fs/promises');
const {addNode,addEdge,cycles,downstream}=require('../web/personal-systems.js');

test('all twenty provided poses are complete local GLBs',async()=>{
  for(const character of ['lifts','perro']){
    for(const pose of ['feliz','risa','sorpresa','amor','guino','triste','enojo','duda','sueno','concentrado']){
      const file=await readFile('web/assets/characters/'+character+'_'+pose+'.glb');
      assert.equal(file.toString('ascii',0,4),'glTF');
      assert.equal(file.readUInt32LE(4),2);
      assert.equal(file.readUInt32LE(8),file.length);
      const json=JSON.parse(file.toString('utf8',20,20+file.readUInt32LE(12)));
      assert.ok(json.meshes.length>0);
      assert.ok([...json.buffers,...(json.images||[])].every(item=>!item.uri));
    }
  }
});

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
