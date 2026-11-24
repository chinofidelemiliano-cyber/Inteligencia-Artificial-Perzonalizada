'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const api=window.liftsWorkspace;
  const selector=$('nexusActionMode'), run=$('nexusRunAction'), retry=$('nexusRetryAction'), notice=$('nexusOperationNotice');
  const settings=$('nexusActionSettings');
  const inboxPermission=$('nexusInboxPermission'), runInbox=$('nexusRunInbox'), saveInbox=$('nexusSaveInboxPermission');
  const state=()=>api.getState();
  const modes=['consult','draft','authorized'];
  const mode=()=>modes.includes(state().nexusActionMode)?state().nexusActionMode:'consult';
  const title=()=>String(state().nexusContext?.next||'').trim().slice(0,240);
  let busy=false,pendingTask=null;
  function health(){
    $('nexusSyncState').textContent=$('syncStatus')?.textContent.trim()||'Sin estado de sincronización en esta sesión.';
    $('nexusAIState').textContent=$('aiDiagnostic').textContent.trim()||'Sin comprobación en esta sesión.';
    $('nexusCheckAI').disabled=$('testAI').disabled;
  }
  function render(){
    const value=mode(),text=title();
    $('nexusActionPreview').textContent=text?
      (value==='authorized'?'Tarea de 25 minutos sin fecha ni aviso: ':'Próxima acción guardada: ')+text:
      'Guarda una próxima acción en Continuidad de trabajo.';
    run.hidden=!text||value==='consult'||Boolean(pendingTask);
    run.disabled=busy;
    retry.hidden=!pendingTask;
    retry.disabled=busy;
    retry.textContent=pendingTask?.type==='inbox'?'Reintentar guardado de la captura':'Reintentar guardado de la tarea';
    inboxPermission.disabled=busy;
    saveInbox.disabled=busy;
    runInbox.hidden=!state().nexusInboxAuthorized||!text||Boolean(pendingTask);
    runInbox.disabled=busy;
    settings.querySelector('button').disabled=busy;
    selector.disabled=busy;
    run.textContent=value==='draft'?'Preparar borrador en Agenda':'Crear tarea en Agenda';
    const history=$('nexusActionHistory');
    history.replaceChildren();
    for(const item of state().nexusActionHistory||[]){
      const row=document.createElement('li');
      const label=item.type==='inbox'?'Captura en Bandeja':'Tarea creada en Agenda';
      row.textContent=new Date(item.at).toLocaleString('es-MX')+' · '+label+' (ID '+item.id.slice(0,8)+')'+
        (item.id===pendingTask?.id?' · Guardado pendiente':'');
      history.append(row);
    }
    if(!history.childElementCount)history.textContent='Todavía no hay tareas registradas por esta acción.';
    health();
  }
  settings.onsubmit=async event=>{
    event.preventDefault();
    if(busy)return;
    const selected=selector.value,current=state(),before=current.nexusActionMode;
    if(!modes.includes(selected))return;
    busy=true;current.nexusActionMode=selected;render();
    try {
      if(!await api.save())throw new Error();
      if(current===state())notice.textContent='Permiso guardado.';
    }catch{
      if(current===state()){
        current.nexusActionMode=before;selector.value=mode();
        notice.textContent='No se confirmó el permiso. Puedes volver a guardarlo.';
      }
    }finally{if(current===state()){busy=false;render();}}
  };
  saveInbox.onclick=async()=>{
    if(busy)return;
    const current=state(),before=current.nexusInboxAuthorized;
    busy=true;current.nexusInboxAuthorized=inboxPermission.checked;render();
    try{
      if(!await api.save())throw new Error();
      if(current===state())notice.textContent='Permiso de Bandeja guardado.';
    }catch{
      if(current===state()){
        current.nexusInboxAuthorized=before;inboxPermission.checked=before===true;
        notice.textContent='No se confirmó el permiso de Bandeja.';
      }
    }finally{if(current===state()){busy=false;render();}}
  };
  function register(id,type){
    state().nexusActionHistory=[{id,type,at:new Date().toISOString()},...(state().nexusActionHistory||[])].slice(0,50);
    pendingTask={id,type};
    void persistTask();
  }
  async function persistTask(){
    const current=state(),{id,type}=pendingTask;
    busy=true;render();
    try{
      if(!await api.save())throw new Error();
      if(current!==state())return;
      pendingTask=null;
      if(type==='inbox'){
        notice.textContent='Próxima acción guardada en Bandeja.';
        window.liftsInbox.render();
      }else{
        notice.textContent='Tarea guardada en Agenda.';
        window.dispatchEvent(new CustomEvent('lifts-task-created',{detail:{title:current.tasks.find(task=>task.id===id)?.title}}));
      }
    }catch{
      if(current===state())notice.textContent=(type==='inbox'?'La captura':'La tarea')+' quedó en esta sesión. Reintenta el guardado para conservarla.';
    }finally{if(current===state()){busy=false;render();}}
  }
  run.onclick=()=>{
    const text=title();
    if(busy||pendingTask||!text)return;
    if(mode()==='draft'){window.liftsWorkUI.prepareTask(text);return;}
    if(mode()!=='authorized')return;
    if(state().tasks.some(task=>!task.done&&!task.archived&&window.liftsWork.taskKey(task.title)===window.liftsWork.taskKey(text))){
      notice.textContent='Ya tienes una tarea pendiente con esa acción.';return;
    }
    let task;
    try{task=window.liftsWorkUI.captureTask(text);}
    catch(error){notice.textContent=error.message;return;}
    state().tasks.push(task);
    api.render();
    register(task.id,'agenda');
  };
  runInbox.onclick=()=>{
    const text=title();
    if(busy||pendingTask||!text||state().nexusInboxAuthorized!==true)return;
    const inbox=state().inbox||[];
    if(inbox.some(item=>!item.processed&&window.liftsWork.taskKey(item.title)===window.liftsWork.taskKey(text))){
      notice.textContent='Ya tienes una captura pendiente con esa acción.';return;
    }
    try{
      const item=window.liftsInbox.capture(text);
      state().inbox=[item,...inbox];
      register(item.id,'inbox');
    }catch(error){notice.textContent=error.message;}
  };
  retry.onclick=()=>{if(!busy&&pendingTask)void persistTask();};
  $('nexusCheckAI').onclick=()=>$('testAI').click();
  const observe=new MutationObserver(health);
  for(const id of ['syncStatus','aiDiagnostic','testAI'])observe.observe($(id),{attributes:true,childList:true,subtree:true,characterData:true});
  function reset(){
    busy=false;pendingTask=null;notice.textContent='';selector.value=mode();inboxPermission.checked=state().nexusInboxAuthorized===true;render();
  }
  window.addEventListener('nexo-state',reset);
  window.addEventListener('lifts-page',event=>{if(event.detail.page==='operations'){selector.value=mode();inboxPermission.checked=state().nexusInboxAuthorized===true;render();}});
  window.liftsNexusOperations={reset};
  reset();
})();
