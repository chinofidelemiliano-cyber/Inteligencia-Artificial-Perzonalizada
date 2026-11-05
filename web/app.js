'use strict';
const personal = window.liftsPersonalization;
const initial = () => ({profile:personal.emptyProfile(),profileConsent:false,onboardingCompleted:false,tasks:[],messages:[]});
let state = initial();
let chatVersion=0;
let chatController=null;
let chatBusy=false;
const $ = id => document.getElementById(id);
function persist(){ window.nexoAccount.save(personal.snapshot(state)); return true; }
window.addEventListener('nexo-state', e => {cancelChat();$('shareProfile').checked=false;$('aiDiagnostic').textContent='';state=e.detail || initial();state.profile={...personal.emptyProfile(),...state.profile};welcomeStep=0;welcomeDraft={...state.profile};$('welcomeConsent').checked=state.profileConsent===true;render();renderWelcome();page(state.onboardingCompleted?'home':'welcome');});
function page(id){if(!state.onboardingCompleted)id='welcome';for(const section of ['home','tasks','profile','welcome']) $(section).hidden=section!==id;document.querySelectorAll('[data-page]').forEach(b=>b.setAttribute('aria-current',String(b.dataset.page===id)));}
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>page(b.dataset.page));
$('plan').onclick=$('openTasks').onclick=()=>page('tasks');
function render(){
  $('greeting').textContent=state.profile.name ? `Hola, ${state.profile.name}. Vamos paso a paso.` : 'Todo empieza con un buen plan.';
  $('focus').textContent=[state.profile.role,state.profile.specialty,state.profile.equipment].filter(Boolean).join(' · ') || 'Tu perfil es opcional. Elige los temas que te interesan.';
  $('topics').replaceChildren();
  for(const topic of personal.suggestions(state.profile)) {const button=document.createElement('button');button.type='button';button.className='secondary';button.textContent=topic.label;button.onclick=()=>{$('question').value=topic.prompt;page('home');$('question').focus();};$('topics').append(button);}
  $('personalizationNote').textContent=state.profileConsent===true ? 'Sugerencias basadas en tu perfil guardado. Puedes cambiarlo o borrarlo en Mi perfil.' : 'Sugerencias por reglas locales. Tus preferencias actuales no se guardarán en el perfil sin tu autorización.';
  $('profileConsent').checked=state.profileConsent===true;
  $('count').textContent=`${state.tasks.filter(t=>!t.done).length} pendientes por completar.`;
  for(const field of personal.fields) $(field).value=state.profile[field] || '';
  $('messages').replaceChildren();
  for(const m of state.messages){const el=document.createElement('div');el.className='message'+(m.role==='user'?' user':'');el.textContent=m.text;$('messages').append(el);}
  if(!state.messages.length){const el=document.createElement('p');el.className='muted';el.textContent='Tu próxima consulta empieza aquí. Puedes guardar el contexto para retomarlo después.';$('messages').append(el);}
  $('messages').scrollTop=$('messages').scrollHeight;
  $('taskList').replaceChildren();
  if(!state.tasks.length) $('taskList').textContent='Todavía no tienes pendientes. Agrega el primero.';
  for(const t of state.tasks){const row=document.createElement('div');row.className='task'+(t.done?' done':'');const check=document.createElement('input');check.type='checkbox';check.checked=t.done;check.setAttribute('aria-label',`Completar ${t.title}`);check.onchange=()=>{t.done=check.checked;persist();render();};const label=document.createElement('span');label.textContent=t.title+(t.date?` · ${t.date}`:'');const remove=document.createElement('button');remove.textContent='Eliminar';remove.setAttribute('aria-label',`Eliminar ${t.title}`);remove.onclick=()=>{state.tasks=state.tasks.filter(x=>x.id!==t.id);persist();render();};row.append(check,label,remove);$('taskList').append(row);}
}
$('profileForm').onsubmit=e=>{e.preventDefault();for(const field of personal.fields) state.profile[field]=$(field).value.trim();state.profileConsent=$('profileConsent').checked;const saved=persist();render();if(saved)$('saved').textContent='Preferencias aplicadas; revisa el estado de sincronización.';};
$('taskForm').onsubmit=e=>{e.preventDefault();const title=$('taskTitle').value.trim();if(!title)return;state.tasks.push({id:crypto.randomUUID(),title,date:$('taskDate').value,done:false});persist();e.target.reset();render();};
function cancelChat(){chatVersion++;chatController?.abort();chatController=null;chatBusy=false;$('sendChat').disabled=false;$('testAI').disabled=false;$('sendChat').textContent='Enviar a Lifts';$('chatStatus').textContent='';}
$('chat').onsubmit=async e=>{
  e.preventDefault();const text=$('question').value.trim();if(!text || chatBusy)return;
  if(text.length>5000)return;
  const version=chatVersion;
  const controller=new AbortController();chatController=controller;chatBusy=true;
  $('sendChat').disabled=true;$('testAI').disabled=true;$('sendChat').textContent='Respondiendo…';$('chatStatus').textContent='Consultando a Lifts…';
  const history=state.messages.filter(m=>m.role==='user' || (m.role==='assistant' && m.source==='ai')).slice(-8).map(m=>({role:m.role,content:m.text.slice(0,5000)}));
  const payload={messages:[...history,{role:'user',content:text}]};
  if($('shareProfile').checked)payload.profile={...state.profile};
  const timer=setTimeout(()=>controller.abort(),60000);
  try{
    const token=await window.nexoAccount.accessToken();
    if(version!==chatVersion)return;
    const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(payload),signal:controller.signal});
    const result=await response.json().catch(()=>({error:'El servidor no respondió en el formato esperado. Verifica el despliegue de Pages Functions.'}));
    if(version!==chatVersion)return;
    if(!response.ok)throw new Error(result.error || 'No se pudo obtener una respuesta.');
    if(typeof result.reply!=='string' || !result.reply.trim())throw new Error('La IA no devolvió una respuesta válida.');
    state.messages.push({role:'user',text},{role:'assistant',text:result.reply,source:'ai'});
    persist();if($('question').value.trim()===text)$('question').value='';render();$('chatStatus').textContent='Respuesta recibida. Revisa el estado de guardado de tu cuenta.';
  }catch(error){if(version===chatVersion)$('chatStatus').textContent=error.name==='AbortError'?'La respuesta tardó demasiado. Tu pregunta sigue aquí para reintentarlo.':error.message || 'No se pudo contactar con la IA. Tu pregunta no se ha borrado.';}
  finally{clearTimeout(timer);if(version===chatVersion){chatBusy=false;chatController=null;$('sendChat').disabled=false;$('testAI').disabled=false;$('sendChat').textContent='Enviar a Lifts';}}
};
$('testAI').onclick=async()=>{
  if(chatBusy)return;
  const version=chatVersion;
  const controller=new AbortController();chatController=controller;chatBusy=true;
  $('testAI').disabled=true;$('sendChat').disabled=true;
  $('aiDiagnostic').textContent='Comprobando con una pregunta fija, sin perfil ni historial…';
  const timer=setTimeout(()=>controller.abort(),60000);
  try{
    const token=await window.nexoAccount.accessToken();if(version!==chatVersion)return;
    const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({diagnostic:true}),signal:controller.signal});
    const result=await response.json();if(version!==chatVersion)return;
    const server=result.server;
    $('aiDiagnostic').textContent=(response.ok?'La IA respondió a la prueba.':result.error || 'Falló la comprobación.')+
      (server?`\nVersión: ${server.revision}\nModelo: ${server.model}`:'\nServidor anterior: esta respuesta no incluye la versión de diagnóstico.')+
      (result.providerDetail?'\nDetalle de Cloudflare: '+result.providerDetail:'');
  }catch(error){if(version===chatVersion)$('aiDiagnostic').textContent=error.name==='AbortError'?'La comprobación agotó el tiempo de espera.':error.message || 'No se pudo completar la comprobación.';}
  finally{clearTimeout(timer);if(version===chatVersion){chatBusy=false;chatController=null;$('testAI').disabled=false;$('sendChat').disabled=false;}}
};
$('erase').onclick=()=>{if(!confirm('¿Borrar el perfil, las tareas y las consultas de tu cuenta?'))return;cancelChat();state=initial();state.onboardingCompleted=true;persist();render();$('saved').textContent='Borrado preparado; revisa el estado de sincronización.';};
const questions = [
  {field:'name',label:'¿Cómo te gustaría que te llame?',hint:'Puede ser tu nombre o un apodo. No necesitamos tu nombre legal.',limit:80},
  {field:'interests',label:'¿Qué cosas te gustan o te dan curiosidad?',hint:'Por ejemplo: música, cocina, tecnología, deportes. Separa tus intereses con comas.',limit:500},
  {field:'role',label:'¿A qué dedicas tu tiempo?',hint:'Puedes mencionar trabajo, estudios, proyectos o actividades. No hace falta decir dónde trabajas.',limit:160},
  {field:'specialty',label:'¿Hay algún tema profesional o de estudio que quieras explorar?',hint:'Por ejemplo: diseño, programación, ventas o flexografía. También puedes dejarlo vacío.',limit:160},
  {field:'goals',label:'¿En qué te gustaría que te acompañara Lifts?',hint:'Por ejemplo: organizar tu tiempo, aprender algo o avanzar en un proyecto.',limit:500},
  {field:'tone',label:'¿Cómo te gustaría conversar?',hint:'Por ejemplo: respuestas breves, explicación paso a paso o ejemplos prácticos.',limit:160}
];
let welcomeStep=0;
let welcomeDraft=personal.emptyProfile();
function captureWelcome(){if(welcomeStep<questions.length)welcomeDraft[questions[welcomeStep].field]=$('welcomeAnswer').value.trim();}
function renderWelcome(){
  const done=welcomeStep===questions.length;
  $('welcomeProgress').textContent=done?'Tú decides qué recordar':`Pregunta ${welcomeStep+1} de ${questions.length} · Todas son opcionales`;
  $('welcomeLabel').hidden=done;$('welcomeHint').hidden=done;$('welcomeAnswer').hidden=done;
  $('welcomeConsentPanel').hidden=!done;$('welcomeSkip').hidden=done;$('welcomeBack').hidden=welcomeStep===0;
  $('welcomeNext').textContent=done?'Entrar a mi espacio':'Siguiente';
  if(!done){const question=questions[welcomeStep];$('welcomeLabel').textContent=question.label;$('welcomeHint').textContent=question.hint;$('welcomeAnswer').maxLength=question.limit;$('welcomeAnswer').value=welcomeDraft[question.field] || '';}
}
function finishWelcome(consent){
  state.profile={...welcomeDraft};state.profileConsent=consent;state.onboardingCompleted=true;persist();render();page('home');
}
$('welcomeForm').onsubmit=e=>{e.preventDefault();captureWelcome();if(welcomeStep===questions.length){finishWelcome($('welcomeConsent').checked);return;}welcomeStep++;renderWelcome();if(welcomeStep<questions.length)$('welcomeAnswer').focus();else $('welcomeConsent').focus();};
$('welcomeBack').onclick=()=>{captureWelcome();welcomeStep=Math.max(0,welcomeStep-1);renderWelcome();};
$('welcomeSkip').onclick=()=>{welcomeDraft[questions[welcomeStep].field]='';welcomeStep++;renderWelcome();};
$('welcomeLater').onclick=()=>{welcomeDraft=personal.emptyProfile();finishWelcome(false);};
$('personalize').onclick=()=>{welcomeDraft={...state.profile};welcomeStep=0;$('welcomeConsent').checked=state.profileConsent===true;renderWelcome();page('welcome');};
$('forgetProfile').onclick=()=>{if(!confirm('¿Borrar tus preferencias guardadas? Se conservarán tus tareas y consultas, que pueden contener información que hayas escrito.'))return;cancelChat();$('shareProfile').checked=false;state.profile=personal.emptyProfile();state.profileConsent=false;welcomeDraft=personal.emptyProfile();persist();render();$('saved').textContent='Borrado del perfil preparado; revisa el estado de sincronización.';};
render();
renderWelcome();
