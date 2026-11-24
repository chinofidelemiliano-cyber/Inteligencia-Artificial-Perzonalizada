'use strict';
((root)=>{
  const maxBytes=2*1024*1024;
  const maxRecords=2000;
  const collectionLabels={
    tasks:'Tareas de Agenda',savedConversations:'Conversaciones guardadas',privateMemories:'Recuerdos privados',
    inbox:'Capturas de la bandeja',nexusJournal:'Registros de Nexus'
  };
  const plain=value=>value!==null&&typeof value==='object'&&Object.getPrototypeOf(value)===Object.prototype;
  const validId=value=>typeof value==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value);
  const text=(value,max)=>typeof value==='string'&&value.length<=max&&value.trim()?value:'';
  const optional=(value,max)=>value===undefined||value===''||typeof value==='string'&&value.length<=max;
  const timestamp=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)&&
    Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;
  const day=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&timestamp(value+'T00:00:00.000Z');

  function normalizeTask(value){
    if(!text(value.title,240)||!['task','',undefined].includes(value.kind)||
      value.date!==undefined&&value.date!==''&&!day(value.date)||
      value.priority!==undefined&&![1,2,3].includes(value.priority)||
      value.duration!==undefined&&(!Number.isFinite(value.duration)||value.duration<5||value.duration>720))return null;
    const steps=value.steps===undefined?[]:value.steps;
    if(!Array.isArray(steps)||steps.length>20||steps.some(step=>!plain(step)||!text(step.title,240)))return null;
    const done=value.done===true;
    return {id:value.id,title:value.title,date:value.date||'',done,archived:value.archived===true,
      priority:value.priority??2,duration:value.duration??25,startAt:'',reminderAt:'',reminderRepeat:'',
      ...(done&&timestamp(value.completedAt)?{completedAt:value.completedAt}:{}),
      steps:steps.map(step=>({title:step.title,done:step.done===true,
        ...(step.done===true&&timestamp(step.completedAt)?{completedAt:step.completedAt}:{})}))};
  }

  function normalizeConversation(value){
    if(!text(value.title,100)||!timestamp(value.savedAt)||!Array.isArray(value.messages)||
      value.messages.length<1||value.messages.length>240)return null;
    if(value.messages.some(message=>!plain(message)||!['user','assistant'].includes(message.role)||
      !text(message.text,50000)))return null;
    return {id:value.id,title:value.title,savedAt:value.savedAt,
      messages:value.messages.map(message=>({role:message.role,text:message.text,source:'local'}))};
  }

  function normalizeJournal(value,journal){
    if(!journal||typeof value.kind!=='string'||!Object.hasOwn(journal.kinds,value.kind)||
      !timestamp(value.createdAt)||!timestamp(value.updatedAt))return null;
    const kind=value.kind;
    const revisions=value.history===undefined?[]:value.history;
    if(!Array.isArray(revisions)||revisions.length>journal.historyLimit)return null;
    const build=entry=>{
      if(!plain(entry)||!text(entry.title,100)||!plain(entry.data)||
        entry.completed!==undefined&&(!Array.isArray(entry.completed)||entry.completed.length>100||
          entry.completed.some(stage=>!text(stage,1500))))return null;
      const statuses=journal.statuses[kind];
      if(entry.status!==undefined&&(typeof entry.status!=='string'||(statuses?!Object.hasOwn(statuses,entry.status):entry.status!=='')))return null;
      const fields=Object.keys(journal.kinds[kind].fields);
      if(fields.some(key=>!optional(entry.data[key],1500)))return null;
      const raw=Object.fromEntries(fields.map(key=>[key,entry.data[key]]));
      try{
        const normalized=journal.record(kind,{...raw,title:entry.title,status:entry.status,completed:entry.completed});
        return {title:normalized.title,data:normalized.data,status:normalized.status,completed:normalized.completed};
      }catch{return null;}
    };
    const current=build(value);
    if(!current)return null;
    const history=[];
    for(const revision of revisions){
      const content=build(revision);
      if(!content||!validId(revision.id)||!timestamp(revision.at))continue;
      history.push({id:revision.id,at:revision.at,...content});
    }
    return {id:value.id,kind,createdAt:value.createdAt,updatedAt:value.updatedAt,...current,...(history.length?{history}:{})};
  }

  const validators={
    tasks:normalizeTask,savedConversations:normalizeConversation,
    privateMemories:value=>{
      if(!text(value.title,80)||!text(value.text,600))return null;
      return {id:value.id,title:value.title,text:value.text,
        ...(timestamp(value.createdAt)?{createdAt:value.createdAt}:{}),
        ...(text(value.category,40)?{category:value.category}:{}),
        ...(text(value.context,200)?{context:value.context}:{}),
        ...(value.archived===true?{archived:true}:{})};
    },
    inbox:value=>text(value.title,240)&&timestamp(value.createdAt)&&typeof value.processed==='boolean'?
      {id:value.id,title:value.title,createdAt:value.createdAt,processed:value.processed}:null,
    nexusJournal:normalizeJournal
  };

  function parseBackup(raw,journal){
    if(typeof raw!=='string'||raw.length>maxBytes||new TextEncoder().encode(raw).byteLength>maxBytes){
      throw new Error('Selecciona una copia JSON de hasta 2 MiB.');
    }
    let data;
    try{data=JSON.parse(raw.replace(/^\ufeff/,''));}
    catch{throw new Error('El archivo no contiene JSON válido.');}
    if(!plain(data)||!Object.keys(validators).some(key=>Object.hasOwn(data,key))){
      throw new Error('El archivo no contiene colecciones compatibles de Lifts.');
    }
    const collections={},invalid={};
    for(const [key,validate] of Object.entries(validators)){
      if(!Object.hasOwn(data,key))continue;
      if(!Array.isArray(data[key])||data[key].length>maxRecords)throw new Error('La colección '+collectionLabels[key]+' debe ser una lista de hasta '+maxRecords+' registros.');
      collections[key]=[];
      invalid[key]=0;
      for(const value of data[key]){
        const item=plain(value)&&validId(value.id)?validate(value,journal):null;
        if(item)collections[key].push(item);
        else invalid[key]++;
      }
    }
    return {collections,invalid,ignored:Object.keys(data).filter(key=>!Object.hasOwn(validators,key)).length};
  }

  function planRestore(state,parsed){
    const patch={},summary={};
    let total=0;
    for(const key of Object.keys(collectionLabels)){
      if(!Object.hasOwn(parsed.collections,key))continue;
      const existing=Array.isArray(state[key])?state[key]:[];
      const ids=new Set(existing.flatMap(item=>typeof item?.id==='string'?[item.id.toLowerCase()]:[]));
      const added=[];
      let duplicate=0,limit=0;
      for(const item of parsed.collections[key]){
        const id=item.id.toLowerCase();
        if(ids.has(id)){duplicate++;continue;}
        ids.add(id);
        if(key==='privateMemories'&&existing.length+added.length>=200){limit++;continue;}
        added.push(item);
      }
      summary[key]={added:added.length,duplicate,invalid:parsed.invalid[key]||0,limit};
      if(added.length)patch[key]=[...existing,...added];
      total+=added.length;
    }
    return {patch,summary,total};
  }

  if(typeof module!=='undefined'&&module.exports){
    module.exports={parseBackup,planRestore,maxBytes};
    return;
  }

  let cleanup=null,resetView=()=>{};
  function mount(container){
    if(cleanup)cleanup();
    const api=root.liftsWorkspace;
    const node=(parent,tag,label)=>{
      const element=document.createElement(tag);
      if(label)element.textContent=label;
      parent.append(element);
      return element;
    };
    const details=node(container,'details');
    node(details,'summary','Recuperar datos de una copia JSON');
    node(details,'p','Vista previa de una copia de Lifts de hasta 2 MiB. Solo añade registros con identificadores nuevos a la cuenta abierta. Usa únicamente copias que tengas permiso de recuperar.');
    node(details,'p','Alcance: tareas sin bloques ni alarmas, texto de conversaciones, recuerdos privados, capturas y registros de Nexus. La configuración y los enlaces entre registros se quedan fuera. El límite de recuerdos es 200 por cuenta.');
    const label=node(details,'label','Copia JSON de Lifts');
    const input=node(details,'input');
    input.id='nexusBackupFile';label.htmlFor=input.id;
    input.type='file';input.accept='.json,application/json';
    const table=node(details,'table');
    node(table,'caption','Registros de la copia');
    const row=node(node(table,'thead'),'tr');
    for(const name of ['Colección','Por añadir','Identificadores ya vistos','Inválidos','Por límite']){
      node(row,'th',name).scope='col';
    }
    const rows=node(table,'tbody');
    const ignored=node(details,'p');
    const status=node(details,'p');status.setAttribute('role','status');
    const restore=node(details,'button','Añadir registros a esta cuenta');restore.type='button';
    const retry=node(details,'button','Reintentar guardado de la copia');retry.type='button';
    let pending=null,preview=null,failed=false,busy=false,generation=0;

    function refresh(){
      rows.replaceChildren();
      table.hidden=!preview;
      restore.hidden=!preview?.total||failed;
      restore.disabled=busy;
      retry.hidden=!failed;retry.disabled=busy;
      input.disabled=busy||failed;
      ignored.textContent=pending?.ignored?'Campos de nivel superior fuera del alcance: '+pending.ignored+'.':'';
      if(!preview)return;
      for(const [key,item] of Object.entries(preview.summary)){
        const line=node(rows,'tr');
        node(line,'th',collectionLabels[key]).scope='row';
        for(const value of [item.added,item.duplicate,item.invalid,item.limit])node(line,'td',String(value));
      }
    }
    function reset(){
      generation++;pending=null;preview=null;failed=false;busy=false;
      input.value='';status.textContent='';details.open=false;refresh();
    }
    input.onchange=async()=>{
      const token=++generation,state=api.getState(),file=input.files?.[0];
      pending=null;preview=null;status.textContent='';
      refresh();
      if(!file)return;
      try{
        if(file.size>maxBytes)throw new Error('Selecciona una copia JSON de hasta 2 MiB.');
        const value=await file.text();
        if(token!==generation||api.getState()!==state)return;
        pending=parseBackup(value,root.liftsNexusJournal);
        preview=planRestore(state,pending);
        status.textContent=preview.total?'Revisa la vista previa antes de confirmar.':'La copia no contiene registros nuevos para recuperar.';
      }catch(error){if(token===generation)status.textContent=error.message;}
      refresh();
    };
    async function save(){
      const token=generation,state=api.getState();
      if(!root.nexoAccount?.isReady?.()||busy){status.textContent='Abre una sesión para sincronizar los datos.';return;}
      busy=true;status.textContent='Guardando en tu cuenta…';refresh();
      let result=false;
      try{result=await api.save()===true;}catch{}
      if(token!==generation||api.getState()!==state)return;
      busy=false;failed=!result;
      status.textContent=result?'Datos recuperados y guardados en tu cuenta.':'Los registros añadidos siguen en esta sesión. Reintenta para confirmar el guardado.';
      if(result){pending=null;preview=null;input.value='';}
      refresh();
    }
    restore.onclick=()=>{
      if(!pending||busy||failed||!root.nexoAccount?.isReady?.())return;
      const state=api.getState(),current=planRestore(state,pending);
      if(JSON.stringify(preview.summary)!==JSON.stringify(current.summary)){
        preview=current;status.textContent='La cuenta cambió desde la vista previa. Revisa los conteos actualizados.';refresh();return;
      }
      if(!current.total||!confirm('¿Añadir '+current.total+' registros nuevos a la cuenta abierta?'))return;
      Object.assign(state,current.patch);
      preview=null;
      api.render();
      root.liftsInbox?.render();
      root.dispatchEvent(new CustomEvent('lifts-backup-restored'));
      void save();
    };
    retry.onclick=()=>{if(failed)void save();};
    root.addEventListener('nexo-state',reset);
    cleanup=()=>{root.removeEventListener('nexo-state',reset);reset();details.remove();cleanup=null;resetView=()=>{};};
    resetView=reset;
    reset();
    return cleanup;
  }
  root.liftsBackup={mount,reset:()=>resetView()};
  const container=document.getElementById('nexusBackup');
  if(container)mount(container);
})(typeof window!=='undefined'?window:globalThis);
