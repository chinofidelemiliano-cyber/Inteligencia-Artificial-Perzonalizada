'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const api=window.liftsWorkspace;
  const core=window.liftsNexusCore;
  const panel=$('nexusPanel');
  const status=$('nexusStatus');
  const form=$('nexusContext');
  const inputs=Object.fromEntries(core.fields.map(field=>[field,form.elements.namedItem(field)]));
  let pending=0,openingRecord=false;

  function printContext() {
    const notes=core.context(api.getState().nexusContext);
    for(const field of core.fields)inputs[field].value=notes[field];
    renderRelated();
  }

  function renderRelated() {
    const notes=core.context({goal:inputs.goal.value,next:inputs.next.value});
    const relevant=window.liftsEvolutionCore.relevant(notes.goal+' '+notes.next,api.getState().privateMemories);
    const list=$('nexusSources');
    list.replaceChildren();
    for(const {title,text} of relevant){
      const item=document.createElement('li');
      item.textContent=title+' — '+text;
      list.append(item);
    }
    if(!relevant.length){
      const item=document.createElement('li');
      item.textContent='Sin recuerdos relacionados con el objetivo o la próxima acción.';
      list.append(item);
    }
  }

  function render() {
    const checkpoint=core.recover(api.getState().nexusCheckpoint);
    $('nexusResume').hidden=!checkpoint;
    $('nexusActivity').textContent=checkpoint?checkpoint.label:'Abre una herramienta compatible para registrar tu punto de trabajo.';
    $('nexusLimit').textContent=checkpoint?core.tools[checkpoint.target.id].limitations:'';
  }

  async function sync(message) {
    const version=++pending;
    status.textContent='Guardando…';
    const ok=await api.save();
    if(version===pending)status.textContent=ok?message:'El cambio está en esta sesión. Puedes volver a guardar antes de salir.';
  }

  function checkpoint(id,key='',label='') {
    if(!window.nexoAccount?.isReady?.())return;
    const state=api.getState();
    const target=core.location(id,key);
    if(!state.onboardingCompleted||!target)return;
    const old=core.recover(state.nexusCheckpoint);
    if(old?.target.id===id&&old.target.key===key)return;
    state.nexusCheckpoint={target,label:label||core.tools[id].label,at:new Date().toISOString()};
    render();
    void sync('Punto de trabajo guardado.');
  }

  function open(target) {
    const checked=core.location(target?.id,target?.key);
    if(checked&&api.getState().onboardingCompleted){
      if(checked.id!=='engineering-record')return core.tools[checked.id].open(api,checked.id,checked.key);
      openingRecord=true;
      try {
        if(!core.tools[checked.id].open(api,checked.id,checked.key))status.textContent='La ficha ya no está disponible en tu historial.';
      } finally {openingRecord=false;}
    }
  }

  $('nexusResume').onclick=()=>open(core.recover(api.getState().nexusCheckpoint)?.target);
  panel.addEventListener('toggle',()=>{if(panel.open)renderRelated();});
  form.oninput=renderRelated;
  form.onsubmit=event=>{
    event.preventDefault();
    api.getState().nexusContext=core.context(Object.fromEntries(new FormData(form)));
    printContext();
    void sync('Contexto de trabajo guardado.');
  };
  window.addEventListener('lifts-page',({detail})=>{
    if(!openingRecord&&['tasks','reminders','engineering','diagnostics'].includes(detail.page))checkpoint(detail.page);
  });
  function reset() {
    pending++;
    panel.open=false;
    status.textContent='';
    printContext();
    render();
  }
  window.addEventListener('nexo-state',reset);
  window.liftsNexus={checkpoint,open,reset};
  reset();
})();
