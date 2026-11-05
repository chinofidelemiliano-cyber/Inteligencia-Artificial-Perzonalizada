const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function setup({fail=false,pending=false}={}){
 const elements=new Map(),events={},requests=[],revoked=[];let resolveResponse;
 const get=id=>{if(!elements.has(id))elements.set(id,{value:'',hidden:true,disabled:false,textContent:'',removeAttribute(name){delete this[name];}});return elements.get(id);};
 const response=()=>fail?Response.json({error:'Límite de uso'},{status:429}):new Response(new Uint8Array([255,216,255,0]),{headers:{'Content-Type':'image/jpeg'}});
 const context={window:{nexoAccount:{accessToken:async()=>'test-token'},addEventListener:(name,fn)=>events[name]=fn},document:{getElementById:get},AbortController,setTimeout,clearTimeout,URL:{createObjectURL:()=> 'blob:generated',revokeObjectURL:url=>revoked.push(url)},fetch:async(url,options)=>{requests.push({url,body:JSON.parse(options.body)});if(pending)return new Promise(resolve=>resolveResponse=resolve);return response();}};
 vm.runInNewContext(fs.readFileSync('web/images.js','utf8'),context);
 return{get,events,requests,revoked,submit:()=>get('imageForm').onsubmit({preventDefault(){}}),resolve:()=>resolveResponse(response())};
}
test('image UI previews downloadable result and clears it on account change',async()=>{const s=setup();s.get('imagePrompt').value='A blue scene';await s.submit();assert.equal(s.requests[0].url,'/api/image');assert.equal(JSON.stringify(s.requests[0].body),JSON.stringify({prompt:'A blue scene'}));assert.equal(s.get('generatedImage').src,'blob:generated');assert.equal(s.get('downloadImage').download,'lifts-imagen.jpg');assert.equal(s.get('imageResult').hidden,false);s.events['nexo-state']();assert.equal(s.get('imageResult').hidden,true);assert.equal(s.get('imagePrompt').value,'');assert.deepEqual(s.revoked,['blob:generated']);});
test('failed generation preserves prompt and re-enables submit',async()=>{const s=setup({fail:true});s.get('imagePrompt').value='A blue scene';await s.submit();assert.equal(s.get('imagePrompt').value,'A blue scene');assert.match(s.get('imageStatus').textContent,/Límite/);assert.equal(s.get('generateImage').disabled,false);});
test('response from previous session cannot appear in next account',async()=>{const s=setup({pending:true});s.get('imagePrompt').value='Old account scene';const pending=s.submit();await new Promise(resolve=>setTimeout(resolve,0));s.events['nexo-state']();s.resolve();await pending;assert.equal(s.get('imageResult').hidden,true);assert.equal(s.get('generatedImage').src,undefined);});
