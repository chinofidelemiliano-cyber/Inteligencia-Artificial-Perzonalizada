'use strict';
const personal = window.liftsPersonalization;
const initial = () => ({profile:personal.emptyProfile(),profileConsent:false,onboardingCompleted:false,tasks:[],messages:[],savedConversations:[],assistant:{name:'Lifts',voiceURI:'',rate:1}});
let state = initial();
let chatVersion=0;
let chatController=null;
let chatBusy=false;
let activeConversation=null;
let accountVersion=0;
let savingConversation=false;
const pendingConversations=new Set();
const $ = id => document.getElementById(id);
function assistantName(){const result=window.liftsAssistantName.validate(state.assistant?.name || 'Lifts');return result.valid?result.name:'Lifts';}
function persist(){ window.nexoAccount.save(personal.snapshot(state)); return true; }
window.addEventListener('nexo-state', e => {cancelChat();$('shareProfile').checked=false;$('aiDiagnostic').textContent='';$('responseDetail').value='detailed';$('chatEngine').value='balanced';$('assistantSettingsStatus').textContent='';state=e.detail || initial();accountVersion++;activeConversation=null;savingConversation=false;pendingConversations.clear();
  state.savedConversations=Array.isArray(state.savedConversations)?state.savedConversations:[];
  if(state.messages.length){
    state.savedConversations.push({id:crypto.randomUUID(),title:'Historial anterior',messages:JSON.parse(JSON.stringify(state.messages)),savedAt:new Date().toISOString()});
    state.messages=[];persist();
  }
  state.messages=[];state.profile={...personal.emptyProfile(),...state.profile};welcomeStep=0;welcomeDraft={...state.profile};$('welcomeConsent').checked=state.profileConsent===true;render();renderWelcome();page(state.onboardingCompleted?'home':'welcome');});
function page(id){if(!state.onboardingCompleted)id='welcome';for(const section of ['home','tasks','profile','welcome','images']) $(section).hidden=section!==id;document.querySelectorAll('[data-page]').forEach(b=>b.setAttribute('aria-current',String(b.dataset.page===id)));}
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>page(b.dataset.page));
$('plan').onclick=$('openTasks').onclick=()=>page('tasks');
function renderMessageText(element,message){
  if(!Array.isArray(message.citations) || !message.citations.length){element.textContent=message.text;return;}
  let offset=0;let number=0;
  for(const citation of [...message.citations].sort((a,b)=>a.start-b.start)){
    if(!Number.isInteger(citation.start) || !Number.isInteger(citation.end) || citation.start<offset || citation.end<=citation.start || citation.end>message.text.length || !/^https?:\/\//i.test(citation.url || ''))continue;
    const text=document.createElement('span');text.textContent=message.text.slice(offset,citation.start);element.append(text);
    const link=document.createElement('a');link.textContent='['+(++number)+']';link.href=citation.url;link.title=citation.title || 'Consultar fuente';link.target='_blank';link.rel='noopener noreferrer';element.append(link);offset=citation.end;
  }
  const tail=document.createElement('span');tail.textContent=message.text.slice(offset);element.append(tail);
}
function render(){
  $('assistantTitle').textContent=assistantName()+' · Tu asistente';
  $('welcomeTitle').textContent='Hola, soy '+assistantName()+'. Vamos a conocernos.';
  $('assistantName').value=assistantName();
  if(!chatBusy)$('sendChat').textContent='Enviar a '+assistantName();
  window.liftsVoice?.configure(state.assistant || {});
  $('greeting').textContent=state.profile.name ? `Hola, ${state.profile.name}. Vamos paso a paso.` : 'Todo empieza con un buen plan.';
  $('focus').textContent=[state.profile.role,state.profile.specialty,state.profile.equipment].filter(Boolean).join(' · ') || 'Tu perfil es opcional. Elige los temas que te interesan.';
  $('topics').replaceChildren();
  for(const topic of personal.suggestions(state.profile)) {const button=document.createElement('button');button.type='button';button.className='secondary';button.textContent=topic.label;button.onclick=()=>{$('question').value=topic.prompt;page('home');$('question').focus();};$('topics').append(button);}
  $('personalizationNote').textContent=state.profileConsent===true ? 'Sugerencias basadas en tu perfil guardado. Puedes cambiarlo o borrarlo en Mi perfil.' : 'Sugerencias por reglas locales. Tus preferencias actuales no se guardarán en el perfil sin tu autorización.';
  $('profileConsent').checked=state.profileConsent===true;
  $('taskProgress').value=state.tasks.length?state.tasks.filter(t=>t.done).length/state.tasks.length:0;
  $('count').textContent=`${state.tasks.filter(t=>!t.done).length} pendientes por completar.`;
  for(const field of personal.fields) $(field).value=state.profile[field] || '';
  $('messages').replaceChildren();
  for(const m of state.messages){const el=document.createElement('div');el.className='message'+(m.role==='user'?' user':'');renderMessageText(el,m);if(m.role==='assistant'){const listen=document.createElement('button');listen.type='button';listen.className='secondary listen-message';listen.textContent='▷ Escuchar';listen.onclick=()=>window.liftsVoice?.speak(m.text);el.append(listen);if(Array.isArray(m.sources) && m.sources.length){const refs=document.createElement('div');refs.className='response-sources';const label=document.createElement('p');label.textContent='Fuentes consultadas';refs.append(label);for(const source of m.sources){if(typeof source.url!=='string' || !/^https?:\/\//i.test(source.url))continue;const link=document.createElement('a');link.href=source.url;link.textContent=source.title || source.url;link.target='_blank';link.rel='noopener noreferrer';refs.append(link);}el.append(refs);}}$('messages').append(el);}
  if(!state.messages.length){const el=document.createElement('p');el.className='muted';el.textContent='Tu próxima consulta empieza aquí. Puedes guardar el contexto para retomarlo después.';$('messages').append(el);}
  $('messages').scrollTop=$('messages').scrollHeight;
  renderConversations();
  $('taskList').replaceChildren();
  if(!state.tasks.length) $('taskList').textContent='Todavía no tienes pendientes. Agrega el primero.';
  for(const t of state.tasks){const row=document.createElement('div');row.className='task'+(t.done?' done':'');const check=document.createElement('input');check.type='checkbox';check.checked=t.done;check.setAttribute('aria-label',`Completar ${t.title}`);check.onchange=()=>{t.done=check.checked;persist();render();};const label=document.createElement('span');label.textContent=t.title+(t.date?` · ${t.date}`:'');const remove=document.createElement('button');remove.textContent='Eliminar';remove.setAttribute('aria-label',`Eliminar ${t.title}`);remove.onclick=()=>{state.tasks=state.tasks.filter(x=>x.id!==t.id);persist();render();};row.append(check,label,remove);$('taskList').append(row);}
}
$('readLatest').onclick=()=>window.liftsVoice?.speak(state.messages.filter(m=>m.role==='assistant').at(-1)?.text || '');
$('assistantForm').onsubmit=async event=>{
  event.preventDefault();const result=window.liftsAssistantName.validate($('assistantName').value);
  if(!result.valid){$('assistantSettingsStatus').textContent=result.error;return;}
  const version=accountVersion;
  state.assistant={name:result.name,voiceURI:$('voiceSelect').value,rate:Number($('voiceRate').value) || 1};
  render();$('sendChat').textContent='Enviar a '+assistantName();$('assistantSettingsStatus').textContent='Guardando…';
  try{const ok=await window.nexoAccount.save(personal.snapshot(state));if(version===accountVersion)$('assistantSettingsStatus').textContent=ok===false?'No se pudo guardar. Reintenta antes de salir.':'Nombre y voz guardados en tu cuenta.';}
  catch{if(version===accountVersion)$('assistantSettingsStatus').textContent='No se pudo guardar. Revisa tu conexión.';}
};
$('profileForm').onsubmit=e=>{e.preventDefault();for(const field of personal.fields) state.profile[field]=$(field).value.trim();state.profileConsent=$('profileConsent').checked;const saved=persist();render();if(saved)$('saved').textContent='Preferencias aplicadas; revisa el estado de sincronización.';};
$('taskForm').onsubmit=e=>{e.preventDefault();const title=$('taskTitle').value.trim();if(!title)return;state.tasks.push({id:crypto.randomUUID(),title,date:$('taskDate').value,done:false});persist();e.target.reset();render();};
function cancelChat(){window.liftsVoice?.stop();$('streamingAnswer').textContent='';$('streamingAnswer').hidden=true;chatVersion++;chatController?.abort();chatController=null;chatBusy=false;$('sendChat').disabled=false;$('testAI').disabled=false;$('sendChat').textContent='Enviar a '+assistantName();$('chatStatus').textContent='';}
$('chat').onsubmit=async e=>{
  e.preventDefault();const text=$('question').value.trim();if(!text || chatBusy)return;
  if(text.length>5000)return;
  const version=chatVersion;
  const controller=new AbortController();chatController=controller;chatBusy=true;
  $('sendChat').disabled=true;$('testAI').disabled=true;$('sendChat').textContent='Respondiendo…';$('chatStatus').textContent='Consultando a '+assistantName()+'…';
  const history=state.messages.filter(m=>m.role==='user' || (m.role==='assistant' && m.source==='ai')).slice(-8).map(m=>({role:m.role,content:m.text.slice(0,5000)}));
  const payload={messages:[...history,{role:'user',content:text}],detail:$('responseDetail').value || 'detailed',engine:$('chatEngine').value || 'balanced',stream:true,assistantName:assistantName()};
  if($('shareProfile').checked)payload.profile={...state.profile};
  const timer=setTimeout(()=>controller.abort(),120000);
  try{
    const token=await window.nexoAccount.accessToken();
    if(version!==chatVersion)return;
    const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(payload),signal:controller.signal});
    let reply;let sources=[];let citations=[];let reviewNote='';
    if(response.ok && response.headers?.get('Content-Type')?.includes('text/event-stream')){
      reply=await window.liftsStream.read(response,partial=>{if(version===chatVersion){$('streamingAnswer').hidden=false;$('streamingAnswer').textContent=partial;$('chatStatus').textContent=assistantName()+' está escribiendo…';}});
    }else{
      const result=await response.json().catch(()=>({error:'El servidor no respondió en el formato esperado. Verifica el despliegue.'}));
      if(!response.ok)throw new Error(result.error || 'No se pudo obtener una respuesta.');
      reply=result.reply;sources=Array.isArray(result.sources)?result.sources:[];reviewNote=result.note || '';citations=Array.isArray(result.citations)?result.citations:[];
    }
    if(version!==chatVersion)return;
    if(typeof reply!=='string' || !reply.trim())throw new Error('La IA no devolvió una respuesta válida.');
    $('streamingAnswer').hidden=true;$('streamingAnswer').textContent='';
    state.messages.push({role:'user',text},{role:'assistant',text:reply,source:'ai',sources,citations});
    if($('question').value.trim()===text)$('question').value='';render();$('chatStatus').textContent=reviewNote || 'Respuesta lista.';
  }catch(error){if(version===chatVersion)$('chatStatus').textContent=error.name==='AbortError'?'La respuesta tardó demasiado. Tu pregunta sigue aquí para reintentarlo.':error.message || 'No se pudo contactar con la IA. Tu pregunta no se ha borrado.';}
  finally{clearTimeout(timer);if(version===chatVersion){chatBusy=false;chatController=null;$('sendChat').disabled=false;$('testAI').disabled=false;$('sendChat').textContent='Enviar a '+assistantName();renderConversations();}}
};
function conversationDirty(){
  const saved=state.savedConversations?.find(c=>c.id===activeConversation);
  return state.messages.length>0 && (!saved || JSON.stringify(saved.messages)!==JSON.stringify(state.messages));
}
function renderConversations(){
  const records=state.savedConversations || [];
  const saved=records.find(c=>c.id===activeConversation);
  $('saveConversation').disabled=chatBusy || savingConversation || !state.messages.length;
  $('saveConversation').textContent=savingConversation?'Guardando…':saved?'Guardar cambios':'Guardar conversación';
  $('conversationStatus').textContent=pendingConversations.has(activeConversation)?'Guardado pendiente. Reintenta antes de recargar.':conversationDirty()?'Conversación temporal o con cambios sin guardar.':saved?'Conversación guardada.':'Nueva conversación temporal.';
  $('savedConversations').replaceChildren();
  if(!records.length)$('savedConversations').textContent='Todavía no has guardado conversaciones.';
  for(const conversation of records){
    const row=document.createElement('div');row.className='task';
    const open=document.createElement('button');open.type='button';open.className='secondary';open.textContent=conversation.title || 'Conversación guardada';
    open.onclick=()=>{
      if(conversationDirty() && !confirm('¿Dejar los cambios sin guardar y abrir esta conversación?'))return;
      cancelChat();activeConversation=conversation.id;state.messages=JSON.parse(JSON.stringify(conversation.messages));$('question').value='';render();
    };
    const remove=document.createElement('button');remove.type='button';remove.textContent='Eliminar';remove.onclick=()=>{
      if(!confirm('¿Eliminar esta conversación guardada?'))return;
      state.savedConversations=state.savedConversations.filter(c=>c.id!==conversation.id);pendingConversations.delete(conversation.id);
      if(activeConversation===conversation.id)activeConversation=null;
      persist();render();
    };
    row.append(open);row.append(remove);$('savedConversations').append(row);
  }
}
$('saveConversation').onclick=async()=>{
  if(chatBusy || savingConversation || !state.messages.length)return;
  const version=accountVersion;
  const id=activeConversation || crypto.randomUUID();activeConversation=id;
  const record={id,title:(state.messages.find(m=>m.role==='user')?.text || 'Conversación').slice(0,72),messages:JSON.parse(JSON.stringify(state.messages)),savedAt:new Date().toISOString()};
  state.savedConversations=state.savedConversations.filter(c=>c.id!==id);state.savedConversations.unshift(record);
  pendingConversations.add(id);savingConversation=true;renderConversations();
  try{
    const success=await window.nexoAccount.save(personal.snapshot(state));
    if(version!==accountVersion)return;
    if(success===false)throw new Error('save failed');
    pendingConversations.delete(id);
  }catch{if(version===accountVersion)$('chatStatus').textContent='No se pudo guardar. Mantén esta página abierta y pulsa Guardar cambios para reintentar.';}
  finally{if(version===accountVersion){savingConversation=false;renderConversations();}}
};
$('newConversation').onclick=()=>{
  if(conversationDirty() && !confirm('¿Empezar otra conversación y descartar los cambios que no guardaste?'))return;
  cancelChat();activeConversation=null;state.messages=[];$('question').value='';render();
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
      (result.providerDetail?'\nDetalle del servicio: '+result.providerDetail:'');
  }catch(error){if(version===chatVersion)$('aiDiagnostic').textContent=error.name==='AbortError'?'La comprobación agotó el tiempo de espera.':error.message || 'No se pudo completar la comprobación.';}
  finally{clearTimeout(timer);if(version===chatVersion){chatBusy=false;chatController=null;$('testAI').disabled=false;$('sendChat').disabled=false;}}
};
$('erase').onclick=()=>{if(!confirm('¿Borrar el perfil, las tareas y las consultas de tu cuenta?'))return;cancelChat();state=initial();activeConversation=null;pendingConversations.clear();state.onboardingCompleted=true;persist();render();$('saved').textContent='Borrado preparado; revisa el estado de sincronización.';};
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
