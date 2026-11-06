const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('web/auth.js','utf8');
const tick=()=>new Promise(r=>setTimeout(r,15));
function setup({data=null,error=null,signupError=null,saveError=null}={}){
 const elements=new Map();
 const get=id=>{if(!elements.has(id))elements.set(id,{hidden:false,value:'',textContent:'',disabled:false,querySelectorAll:()=>[],reportValidity:()=>true});return elements.get(id);};
 get('workspace').hidden=true;
 let handler;const writes=[];const reads=[];const events=[];
 const client={from:()=>({select:()=>({eq:(column,id)=>{reads.push(id);return{maybeSingle:async()=>({data:data?{data}:null,error})};}}),upsert:async row=>{writes.push(row);return{error:saveError};}}),auth:{onAuthStateChange:fn=>handler=fn,signInWithPassword:async()=>({error:{message:'bad password'}}),signOut:async()=>({error:null}),signUp:async()=>({data:{session:null},error:signupError}),resetPasswordForEmail:async()=>({error:null}),updateUser:async()=>({error:null})}};
 const window={supabase:{createClient:()=>client},dispatchEvent:e=>events.push(e)};
 vm.runInNewContext(source,{window,document:{getElementById:get},location:{href:'https://example.pages.dev/'},URL,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},setTimeout,JSON,Date});
 return {get,writes,reads,events,window,event:(type,id)=>handler(type,id?{user:{id,email:id+'@example.com'}}:null)};
}
test('no session keeps workspace hidden and prevents writes',async()=>{const s=setup();s.event('INITIAL_SESSION');s.window.nexoAccount.save({});await tick();assert.equal(s.get('workspace').hidden,true);assert.equal(s.writes.length,0);});
test('load and save use current authenticated user; logout clears UI',async()=>{const data={profile:{name:'A'},tasks:[],messages:[]};const s=setup({data});s.event('SIGNED_IN','user-a');await tick();assert.equal(s.get('workspace').hidden,false);assert.deepEqual(s.reads,['user-a']);s.window.nexoAccount.save(data);await tick();assert.equal(s.writes[0].user_id,'user-a');s.event('SIGNED_OUT');assert.equal(s.get('workspace').hidden,true);assert.equal(s.events.at(-1).detail,null);});
test('missing schema blocks entry and saving',async()=>{const s=setup({error:{code:'PGRST205'}});s.event('SIGNED_IN','user-a');await tick();assert.equal(s.get('workspace').hidden,true);assert.match(s.get('authStatus').textContent,/schema.sql/);s.window.nexoAccount.save({});await tick();assert.equal(s.writes.length,0);});
test('recovery never reveals workspace',async()=>{const s=setup();s.event('PASSWORD_RECOVERY','user-a');await tick();assert.equal(s.get('workspace').hidden,true);assert.equal(s.get('resetForm').hidden,false);assert.equal(s.get('authForm').hidden,true);});
test('invalid login does not open workspace',async()=>{const s=setup();s.get('email').value='a@example.com';s.get('password').value='invalid-test-password';s.get('authForm').onsubmit({preventDefault(){}});await tick();assert.equal(s.get('workspace').hidden,true);assert.match(s.get('authStatus').textContent,/No se pudo iniciar/);});
test('malformed stored data is not overwritten',async()=>{const s=setup({data:{profile:{}}});s.event('SIGNED_IN','user-a');await tick();assert.equal(s.get('workspace').hidden,true);s.window.nexoAccount.save({});await tick();assert.equal(s.writes.length,0);});

test('registration displays email rate limit and exact error code',async()=>{const s=setup({signupError:{code:'over_email_send_rate_limit',status:429}});s.get('email').value='a@example.com';s.get('password').value='test-only-password';s.get('signup').onclick();await tick();assert.match(s.get('authStatus').textContent,/SMTP/);assert.match(s.get('authStatus').textContent,/over_email_send_rate_limit/);assert.equal(s.get('password').value,'');assert.equal(s.get('workspace').hidden,true);});
test('unknown registration error displays server detail as plain text',async()=>{const s=setup({signupError:{code:'new_error',message:'Example diagnostic',status:400}});s.get('signup').onclick();await tick();assert.match(s.get('authStatus').textContent,/Example diagnostic/);assert.match(s.get('authStatus').textContent,/new_error/);});

test('save reports actual persistence success and database failure',async()=>{for(const saveError of [null,{code:'42501'}]){const s=setup({saveError});s.event('SIGNED_IN','user-a');await tick();const saved=await s.window.nexoAccount.save({profile:{},messages:[],tasks:[]});assert.equal(saved,!saveError);}});
test('save without an active account reports failure',async()=>{const s=setup();assert.equal(await s.window.nexoAccount.save({}),false);});
