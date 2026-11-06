const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function setup({valid=true,allowed=true,binding=true,output=btoa(String.fromCharCode(137,80,78,71,13,10,26,10,0)),aiError=null,freeConfirmed=true}={}){
 const calls=[],runs=[];
 const context={Response,TextDecoder,Uint8Array,URL,AbortSignal,atob,JSON,fetch:async(url,options)=>{calls.push({url,options});return url.endsWith('/auth/v1/user')?Response.json(valid?{id:'user'}:{},{status:valid?200:401}):Response.json(allowed);}};
 vm.runInNewContext(fs.readFileSync('functions/api/image.js','utf8').replaceAll('export ','')+'\nglobalThis.handle=onRequestPost;',context);
 const env=binding?{AI:{run:async(model,input)=>{runs.push({model,input});if(aiError)throw aiError;return{image:output};}}}:{};
 if(freeConfirmed!==null)env.FREE_AI_CONFIRMED=freeConfirmed?'true':'false';
 const send=({body={prompt:'Un paisaje azul'},token='test-token',origin='https://lifts.pages.dev'}={})=>context.handle({env,request:new Request('https://lifts.pages.dev/api/image',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)})});
 return{send,calls,runs};
}
test('authorized image generation returns private binary image and forwards only prompt',async()=>{const s=setup();const response=await s.send({body:{prompt:'Un paisaje azul',profile:{name:'Not sent'},history:['Not sent'],steps:8}});assert.equal(response.status,200);assert.equal(response.headers.get('Content-Type'),'image/png');assert.match(response.headers.get('Cache-Control'),/no-store/);assert.equal((await response.arrayBuffer()).byteLength,9);assert.equal(s.runs[0].model,'@cf/black-forest-labs/flux-1-schnell');assert.equal(s.runs[0].input.steps,4);assert.equal(JSON.stringify(s.runs[0].input),JSON.stringify({prompt:'Un paisaje azul',steps:4}));assert.equal(s.calls.length,2);});
test('image requests need valid session and cannot bypass quota',async()=>{for(const options of [{valid:false},{allowed:false}]){const s=setup(options);const response=await s.send();assert.equal(response.status,options.valid===false?401:429);assert.equal(s.runs.length,0);}const s=setup();assert.equal((await s.send({token:''})).status,401);assert.equal(s.calls.length,0);});
test('invalid descriptions and oversized bodies consume no quota',async()=>{for(const body of [{prompt:''},{prompt:'a'.repeat(2049)},{prompt:'a'.repeat(13000)},{prompt:4}]){const s=setup();const response=await s.send({body});assert.ok([400,413].includes(response.status));assert.equal(s.calls.length,0);}});
test('cross origin and missing binding cannot invoke image model',async()=>{const s=setup();assert.equal((await s.send({origin:'https://other.example'})).status,403);assert.equal(s.calls.length,0);const missing=setup({binding:false});assert.equal((await missing.send()).status,503);assert.equal(missing.runs.length,0);});
test('unsupported model output is rejected instead of rendered as executable content',async()=>{for(const output of [null,'',btoa('<svg onload="alert(1)"></svg>')]){const s=setup({output});assert.equal((await s.send()).status,502);}});
test('provider failure exposes only useful bounded diagnostic',async()=>{const s=setup({aiError:new Error('5035 paid plan required private-prompt test-token')});const response=await s.send();const result=await response.json();assert.equal(response.status,503);assert.match(result.error,/facturación/);assert.match(result.error,/5035/);assert.doesNotMatch(result.error,/private-prompt|test-token/);});

test('explicit pause blocks images before inference or network calls',async()=>{const s=setup({freeConfirmed:false});const response=await s.send();assert.equal(response.status,503);assert.equal(s.calls.length,0);assert.equal(s.runs.length,0);});

test('owner-confirmed free plan works without extra dashboard configuration',async()=>{const s=setup({freeConfirmed:null});assert.equal((await s.send()).status,200);assert.equal(s.runs.length,1);});
