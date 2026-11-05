'use strict';
const initial = () => ({profile:{name:'',role:'',specialty:'',equipment:'',goals:''},tasks:[],messages:[]});
let state = initial();
const $ = id => document.getElementById(id);
function persist(){ window.nexoAccount.save(state); return true; }
window.addEventListener('nexo-state', e => {state=e.detail || initial();render();page('home');});
function page(id){for(const section of ['home','tasks','profile']) $(section).hidden=section!==id;document.querySelectorAll('[data-page]').forEach(b=>b.setAttribute('aria-current',String(b.dataset.page===id)));}
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>page(b.dataset.page));
$('plan').onclick=$('openTasks').onclick=()=>page('tasks');
function render(){
  $('greeting').textContent=state.profile.name ? `Hola, ${state.profile.name}. Vamos paso a paso.` : 'Todo empieza con un buen plan.';
  $('focus').textContent=`${state.profile.specialty} · ${state.profile.equipment}`;
  $('count').textContent=`${state.tasks.filter(t=>!t.done).length} pendientes por completar.`;
  for(const field of ['name','role','specialty','equipment','goals']) $(field).value=state.profile[field] || '';
  $('messages').replaceChildren();
  for(const m of state.messages){const el=document.createElement('div');el.className='message'+(m.role==='user'?' user':'');el.textContent=m.text;$('messages').append(el);}
  if(!state.messages.length){const el=document.createElement('p');el.className='muted';el.textContent='Tu próxima consulta empieza aquí. Puedes guardar el contexto para retomarlo después.';$('messages').append(el);}
  $('messages').scrollTop=$('messages').scrollHeight;
  $('taskList').replaceChildren();
  if(!state.tasks.length) $('taskList').textContent='Todavía no tienes pendientes. Agrega el primero.';
  for(const t of state.tasks){const row=document.createElement('div');row.className='task'+(t.done?' done':'');const check=document.createElement('input');check.type='checkbox';check.checked=t.done;check.setAttribute('aria-label',`Completar ${t.title}`);check.onchange=()=>{t.done=check.checked;persist();render();};const label=document.createElement('span');label.textContent=t.title+(t.date?` · ${t.date}`:'');const remove=document.createElement('button');remove.textContent='Eliminar';remove.setAttribute('aria-label',`Eliminar ${t.title}`);remove.onclick=()=>{state.tasks=state.tasks.filter(x=>x.id!==t.id);persist();render();};row.append(check,label,remove);$('taskList').append(row);}
}
$('profileForm').onsubmit=e=>{e.preventDefault();for(const field of ['name','role','specialty','equipment','goals']) state.profile[field]=$(field).value.trim();const saved=persist();render();if(saved)$('saved').textContent='Cambios preparados; revisa el estado de sincronización.';};
$('taskForm').onsubmit=e=>{e.preventDefault();const title=$('taskTitle').value.trim();if(!title)return;state.tasks.push({id:crypto.randomUUID(),title,date:$('taskDate').value,done:false});persist();e.target.reset();render();};
$('chat').onsubmit=e=>{e.preventDefault();const text=$('question').value.trim();if(!text)return;state.messages.push({role:'user',text},{role:'assistant',text:'Consulta preparada para guardar en tu cuenta. La IA aún no está conectada, así que no puedo resolverla ni consultar fuentes. Para una consulta de máquina, reúne marca, modelo, material, síntoma, condiciones de trabajo y el manual disponible. No incluyas información confidencial.'});persist();$('question').value='';render();};
$('erase').onclick=()=>{if(!confirm('¿Borrar el perfil, las tareas y las consultas de tu cuenta?'))return;state=initial();persist();render();$('saved').textContent='Borrado preparado; revisa el estado de sincronización.';};
render();
