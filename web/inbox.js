'use strict';
((root)=>{
  function capture(text,id=crypto.randomUUID(),createdAt=new Date().toISOString()){
    const title=typeof text==='string'?text.trim():'';
    if(!title||title.length>240)throw new TypeError('Escribe una captura de 1 a 240 caracteres.');
    return {id,title,createdAt,processed:false};
  }
  function setProcessed(items,id,processed){
    return items.map(item=>item.id===id?{...item,processed:processed===true}:item);
  }
  const journalDestinations={
    mission:{label:'Preparar misión',field:'objective'},
    knowledge:{label:'Preparar conocimiento',field:'summary'},
    experiment:{label:'Preparar experimento',field:'question'},
    note:{label:'Preparar nota',field:'content'}
  };
  function journalDraft(kind,text){
    if(!Object.hasOwn(journalDestinations,kind))throw new TypeError('Elige un destino válido para la captura.');
    const title=text.slice(0,100).replace(/[\uD800-\uDBFF]$/,'').trimEnd();
    return {title,[journalDestinations[kind].field]:text};
  }
  if(typeof module!=='undefined'&&module.exports){
    module.exports={capture,setProcessed,journalDraft};
    return;
  }

  const api=root.liftsWorkspace;
  const taskForm=document.getElementById('taskForm');
  const panel=document.createElement('details');
  panel.className='planner-summary';
  panel.id='agendaInbox';
  const view=api.getState;
  let writing=false,dirty=false,epoch=0;
  function append(parent,tag,text){
    const element=document.createElement(tag);
    if(text)element.textContent=text;
    parent.append(element);
    return element;
  }
  function action(parent,label,handler){
    const button=append(parent,'button',label);
    button.type='button';button.className='secondary';
    button.addEventListener('click',handler);
    return button;
  }
  append(panel,'summary','Bandeja de entrada');
  append(panel,'p','Captura ideas y pendientes para ordenarlos después. Las opciones de preparación abren un borrador. Marca la captura como procesada cuando termines.');
  const form=append(panel,'form');
  const label=append(form,'label','Captura rápida');
  const input=append(form,'textarea');
  label.htmlFor=input.id='agendaInboxTitle';
  input.rows=2;input.maxLength=240;input.required=true;
  const submit=append(form,'button','Guardar captura');
  submit.type='submit';
  const status=append(panel,'p');
  status.setAttribute('role','status');
  const retry=action(panel,'Reintentar guardado de la bandeja',()=>save('Bandeja guardada.'));
  const filterLabel=append(panel,'label','Mostrar capturas');
  const filter=append(panel,'select');
  filterLabel.htmlFor=filter.id='agendaInboxFilter';
  for(const [key,name] of [['pending','Pendientes'],['processed','Procesadas'],['all','Todas']]){
    const option=append(filter,'option',name);
    option.value=key;
  }
  const list=append(panel,'div');
  list.id='agendaInboxItems';
  taskForm.before(panel);

  function render(){
    retry.hidden=!dirty;
    retry.disabled=writing;
    submit.disabled=writing||dirty;
    list.replaceChildren();
    const items=(view().inbox||[]).filter(item=>filter.value==='all'||item.processed===(filter.value==='processed'));
    if(!items.length)append(list,'p','No hay capturas en esta vista.');
    for(const item of items){
      const row=append(list,'article');
      row.className='reminder-card';
      append(row,'p',item.title);
      const created=new Date(item.createdAt);
      append(row,'small',[item.processed?'Procesada':'Pendiente',
        Number.isFinite(+created)?created.toLocaleString('es',{dateStyle:'short',timeStyle:'short'}):''].filter(Boolean).join(' · '));
      const actions=append(row,'div');
      actions.className='companion-actions';
      if(!item.processed){
        action(actions,'Preparar tarea',()=>root.liftsWorkUI.prepareTask(item.title));
        action(actions,'Preparar aviso',()=>root.liftsReminders.open(item.title));
        const drafts=append(row,'details');
        append(drafts,'summary','Otros borradores');
        const draftsActions=append(drafts,'div');
        draftsActions.className='companion-actions';
        for(const [kind,destination] of Object.entries(journalDestinations)){
          action(draftsActions,destination.label,()=>{
            if(!root.liftsJournal.prepareDraft(kind,journalDraft(kind,item.title))){
              status.textContent='No se pudo abrir el borrador. Tu captura se conserva.';
            }
          });
        }

      }
      action(actions,item.processed?'Reabrir captura':'Marcar como procesada',()=>{
        if(writing||dirty)return;
        view().inbox=setProcessed(view().inbox,item.id,!item.processed);
        void save(item.processed?'Captura reabierta.':'Captura procesada.');
      }).disabled=writing||dirty;
    }
  }
  async function save(message){
    if(writing)return;
    const operation=epoch;
    const state=view();
    writing=true;dirty=true;
    status.textContent='Guardando captura…';
    render();
    let success=false;
    try{success=await api.save()!==false;}
    catch{}
    if(operation!==epoch||view()!==state)return;
    writing=false;dirty=!success;
    status.textContent=success?message:'El cambio sigue en esta página. Reintenta el guardado antes de salir.';
    render();
  }
  form.onsubmit=event=>{
    event.preventDefault();
    if(writing||dirty)return;
    try{
      const item=capture(input.value);
      view().inbox=[item,...(view().inbox||[])];
      input.value='';
      filter.value='pending';
      void save('Captura guardada.');
    }catch(error){status.textContent=error.message;}
  };
  filter.onchange=render;
  function reset(){
    epoch++;
    writing=false;dirty=false;
    status.textContent='';
    form.reset();filter.value='pending';panel.open=false;render();
  }
  function open(){
    api.open('tasks');
    if(document.getElementById('tasks').hidden)return false;
    panel.open=true;
    input.focus();
    return true;
  }
  root.liftsInbox={open,reset,capture,render};
  root.addEventListener('nexo-state',reset);
  reset();
})(typeof window!=='undefined'?window:globalThis);
