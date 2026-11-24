'use strict';
(function(root){
  const kinds=['reply','receive','answer','information','help','deliver','verify','lend','tool','date'];
  const dates=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
  function followup(input,previous,day,id){
    const subject=input.subject?.trim(),person=input.person?.trim(),promise=input.promise?.trim()||'';
    if(!subject||subject.length>120||!person||person.length>80||promise.length>400)throw new Error('Revisa el asunto, la persona y el compromiso.');
    if(!dates(input.next)||!kinds.includes(input.kind)||!['normal','high'].includes(input.priority))throw new Error('Revisa la fecha, el tipo y la prioridad.');
    return {id:previous?.id||id,subject,person,promise,next:input.next,kind:input.kind,priority:input.priority,created:previous?.created||day,closed:previous?.closed||false};
  }
  function summarize(state,{day,tomorrow,start,end,endTomorrow,now}){
    const tasks=(state.tasks||[]).filter(task=>!task.archived&&task.kind!=='reminder');
    const pending=tasks.filter(task=>!task.done);
    const schedule=pending.map(task=>{
      const time=Date.parse(task.startAt),duration=Number(task.duration)||25;
      return {task,time,until:time+Math.max(0,duration)*60000};
    }).filter(item=>Number.isFinite(item.time)).sort((a,b)=>a.time-b.time);
    const todayBlocks=schedule.filter(item=>item.time<end&&item.until>start);
    const conflicts=[];
    let latest;
    for(const item of todayBlocks){
      if(latest&&item.time<latest.until)conflicts.push([latest.task.title,item.task.title]);
      if(!latest||item.until>latest.until)latest=item;
    }
    const byPriority=(a,b)=>(Number(a.priority)||2)-(Number(b.priority)||2)||String(a.date||'9999').localeCompare(String(b.date||'9999'));
    const activeIds=new Set(todayBlocks.filter(item=>item.until>now).map(item=>item.task.id));
    const follow=(state.guardianFollowups||[]).filter(record=>!record.closed&&dates(record.next)&&record.next<=day)
      .sort((a,b)=>Number(b.priority==='high')-Number(a.priority==='high')||a.next.localeCompare(b.next));
    const nextIds=new Set(schedule.filter(item=>item.time<endTomorrow&&item.until>end).map(item=>item.task.id));
    return {
      today:todayBlocks.map(item=>item.task), conflicts, follow,
      priorities:pending.filter(task=>dates(task.date)&&task.date<=day||activeIds.has(task.id)).sort(byPriority),
      complete:tasks.filter(task=>task.done&&Date.parse(task.completedAt)>=start&&Date.parse(task.completedAt)<end),
      tomorrow:pending.filter(task=>task.date===tomorrow||nextIds.has(task.id)).sort(byPriority)
    };
  }
  const instructionLabels={
    solicitante:'Solicitante',entregable:'Entregable',fecha:'Fecha',materiales:'Materiales',
    'primer paso':'Primer paso',verificacion:'Verificación'
  };
  function instruction(text){
    const fields=new Map(),extra=[];
    for(const line of text.split(/\r?\n/).map(value=>value.trim()).filter(Boolean)){
      const [,label,value]=line.match(/^([^:]+):\s*(.+)$/)||[];
      const key=label?.trim().normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
      if(key&&Object.hasOwn(instructionLabels,key)&&value.trim()){
        fields.set(key,[...(fields.get(key)||[]),value.trim()]);
      }else extra.push(line);
    }
    const missing=Object.keys(instructionLabels).filter(key=>!fields.has(key));
    const ambiguous=[...fields].filter(([,values])=>new Set(values).size>1).map(([key])=>key);
    const first=fields.get('primer paso')?.[0];
    const action=ambiguous.length?'Confirmar '+instructionLabels[ambiguous[0]].toLowerCase()+' con quien solicitó el trabajo.':
      first||(!fields.has('entregable')?'Confirmar qué se debe entregar.':'Definir una acción concreta para empezar el entregable.');
    return {fields,extra,missing,ambiguous,action};
  }
  if(typeof module==='object'){module.exports={summarize,followup,instruction};return;}
  const $=id=>document.getElementById(id),app=root.liftsWorkspace;
  const form=$('guardianFollowForm'),prefsForm=$('guardianPreferences'),host=$('guardianBrief'),status=$('guardianStatus');
  let phase='start',focus=false,editing=null,busy=false;
  const records=()=>app.getState().guardianFollowups||[];
  const localDate=date=>root.liftsWork.localDate(date);
  function times(){
    const now=new Date(),start=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    const end=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1);
    const endTomorrow=new Date(now.getFullYear(),now.getMonth(),now.getDate()+2);
    return {day:localDate(start),tomorrow:localDate(end),start:+start,end:+end,endTomorrow:+endTomorrow,now:+now};
  }
  function element(parent,tag,label){
    const item=document.createElement(tag);item.textContent=label;parent.append(item);return item;
  }
  function button(parent,label,action){
    const item=element(parent,'button',label);item.type='button';item.className='secondary';item.onclick=action;return item;
  }
  function list(title,items,empty){
    element(host,'h3',title);
    if(!items.length){element(host,'p',empty);return;}
    const ul=element(host,'ul','');
    for(const item of items)element(ul,'li',item);
  }
  function render(){
    const state=app.getState(),clock=times(),brief=summarize(state,clock),prefs=state.guardianPreferences||{};
    const limit=Math.min(12,Math.max(1,Number(prefs.limit)||3));
    const title=task=>task.title||'Tarea sin título';
    const toTime=value=>new Intl.DateTimeFormat('es-MX',{timeStyle:'short'}).format(new Date(value));
    host.replaceChildren();
    document.querySelectorAll('[data-guardian-detail]').forEach(card=>{card.hidden=focus;});
    if(focus){
      const task=brief.priorities[0];
      element(host,'h3','Primera acción');
      element(host,'p',task?(task.steps?.find(step=>!step.done)?.title||title(task)):'Agrega a Agenda lo primero que necesitas resolver.');
      if(task?.steps?.some(step=>!step.done))element(host,'p','Tarea: '+title(task));
      return;
    }
    if(phase==='close'){
      list('Completadas hoy',brief.complete.slice(0,limit).map(title),'Sin tareas con fecha de finalización hoy.');
      list('Para preparar mañana',brief.tomorrow.slice(0,limit).map(title),'Sin actividades previstas para mañana.');
      element(host,'p','Reflexión: ¿qué funcionó hoy y qué cambiarías mañana?');
    }else{
      list('Bloques de hoy',brief.today.slice(0,limit).map(task=>toTime(task.startAt)+' · '+title(task)),'Sin bloques pendientes para hoy.');
      list('Cruces de horario',brief.conflicts.slice(0,limit).map(pair=>pair.join(' / ')),'Sin cruces entre bloques pendientes de hoy.');
    }
    list('Pendientes prioritarios',brief.priorities.slice(0,limit).map(title),'Sin pendientes fechados para hoy.');
    if(prefs.follow!==false)list('Seguimientos pendientes',brief.follow.slice(0,limit)
      .map(item=>item.subject+' · '+item.person+' · Programado para '+item.next),'Sin seguimientos vencidos o previstos para hoy.');
    if(prefs.alerts!==false&&root.liftsRadar){
      const alertList=root.liftsRadar.signals(state,clock.day).filter(item=>{
        const saved=state.personalRadar?.[item.id];
        return saved?.status!=='resolved'&&(saved?.status!=='snoozed'||saved.until<=clock.day);
      });
      list('Sugerencias de Radar',alertList.slice(0,limit).map(item=>item.title+' · '+item.detail),'Sin alertas activas de Radar.');
    }
    if(phase==='start'){
      element(host,'h3','Idea para practicar hoy');
      reading(host,root.liftsGuardianReference.daily(clock.day));
    }
    if(phase==='during'){
      const checkpoint=root.liftsNexusCore?.recover(state.nexusCheckpoint);
      if(checkpoint)button(host,'Retomar '+checkpoint.label,()=>root.liftsNexus.open(checkpoint.target));
    }
  }
  function reading(parent,item){
    element(parent,'h4',item.title);
    element(parent,'p',item.idea);
    element(parent,'p',item.practice);
    const source=element(parent,'a',item.source);
    source.href=item.url;
    element(parent,'p','Explicación y ejercicio de Lifts basados en la referencia.');
    button(parent,'Preparar reflexión',()=>root.liftsJournal.prepareDraft('lesson',{
      title:item.title,situation:item.practice,evidence:item.source+' · '+item.url
    }));
  }
  function reference(){
    const results=$('guardianReferenceResults');
    results.replaceChildren();
    const matches=root.liftsGuardianReference.search($('guardianReferenceQuery').value);
    if(!matches.length)element(results,'p','No se encontraron lecturas en la colección.');
    for(const item of matches){
      const detail=element(results,'details','');
      element(detail,'summary',item.title+' · '+item.topic);
      reading(detail,item);
    }
  }
  $('guardianReferenceQuery').oninput=reference;
  async function save(key,value,message){
    if(busy)return false;
    const state=app.getState(),before=state[key];
    busy=true;state[key]=value;
    try{
      if(!await app.save())throw new Error();
      if(app.getState()!==state)return false;
      status.textContent=message;return true;
    }catch{
      if(app.getState()===state){state[key]=before;status.textContent='No se pudo guardar. Puedes volver a intentarlo.';}
      return false;
    }finally{
      if(app.getState()===state){busy=false;render();renderRecords();}
    }
  }
  function resetForm(){
    editing=null;form.reset();$('guardianCancel').hidden=true;
  }
  function renderRecords(){
    const container=$('guardianRecords');container.replaceChildren();
    for(const record of records()){
      const entry=element(container,'article','');entry.className='card';
      const kind=[...$('guardianKind').options].find(option=>option.value===record.kind)?.label||'Seguimiento';
      element(entry,'h4',record.subject);
      element(entry,'p',record.person+' · '+kind+' · '+(record.closed?'Cerrado':'Pendiente')+' · Prioridad '+(record.priority==='high'?'alta':'normal'));
      element(entry,'p','Creado el '+record.created+' · Próximo seguimiento el '+record.next);
      if(record.promise)element(entry,'p',record.promise);
      const actions=element(entry,'div','');actions.className='evolution-controls';
      button(actions,'Editar seguimiento',()=>{
        if(busy)return;
        editing=record.id;
        for(const key of ['subject','person','promise','kind','next','priority'])form.elements[key].value=record[key];
        $('guardianCancel').hidden=false;form.elements.subject.focus();
      });
      button(actions,record.closed?'Reabrir':'Cerrar seguimiento',()=>save('guardianFollowups',
        records().map(item=>item.id===record.id?{...item,closed:!item.closed}:item),record.closed?'Seguimiento reabierto.':'Seguimiento cerrado.'));
      if(!record.closed)button(actions,'Preparar recordatorio',()=>{
        root.liftsReminders.open('Seguimiento: '+record.subject);
        $('reminderDate').focus();
      });
      button(actions,'Preparar mensaje',()=>{
        $('guardianDraftPanel').hidden=false;
        $('guardianDraft').value='Hola, '+record.person+'. Te escribo para dar seguimiento a '+record.subject+'.'+
          (record.promise?' Quedó pendiente: '+record.promise+'.':'')+' ¿Podemos confirmar el siguiente paso? Gracias.';
        $('guardianDraft').focus();
      });
    }
  }
  function loadPreferences(){
    const prefs=app.getState().guardianPreferences||{};
    $('guardianLimit').value=prefs.mode||'3';
    $('guardianCustom').value=prefs.mode==='custom'?prefs.limit:4;
    $('guardianShowAlerts').checked=prefs.alerts!==false;
    $('guardianShowFollow').checked=prefs.follow!==false;
    $('guardianCustomLimit').hidden=$('guardianLimit').value!=='custom';
  }
  prefsForm.onsubmit=event=>{
    event.preventDefault();
    const mode=$('guardianLimit').value,limit=Number(mode==='custom'?$('guardianCustom').value:mode);
    if(!Number.isInteger(limit)||limit<1||limit>12){status.textContent='Elige entre 1 y 12 sugerencias.';return;}
    void save('guardianPreferences',{mode,limit,alerts:$('guardianShowAlerts').checked,follow:$('guardianShowFollow').checked},'Preferencias guardadas.');
  };
  $('guardianLimit').onchange=()=>{$('guardianCustomLimit').hidden=$('guardianLimit').value!=='custom';};
  form.onsubmit=async event=>{
    event.preventDefault();if(busy)return;
    const previous=records().find(record=>record.id===editing);
    if(!previous&&records().length>=100){status.textContent='Alcanzaste el límite de 100 seguimientos.';return;}
    try{
      const entry=followup(Object.fromEntries(new FormData(form)),previous,times().day,crypto.randomUUID());
      const next=previous?records().map(item=>item.id===entry.id?entry:item):[entry,...records()];
      if(await save('guardianFollowups',next,'Seguimiento guardado.'))resetForm();
    }catch(error){status.textContent=error.message;}
  };
  const capture=$('guardianClipboardText'),captureResult=$('guardianClipboardResult');
  capture.oninput=()=>captureResult.replaceChildren();
  $('guardianClipboardForm').onsubmit=event=>{
    event.preventDefault();
    captureResult.replaceChildren();
    const value=capture.value.trim();
    if(!value){element(captureResult,'p','Pega el dato que quieres revisar.');return;}
    const lines=value.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
    const title=lines[0].slice(0,80);
    const arithmetic=value.replace(/^=\s*/,'');
    if(arithmetic.length<=100&&/^[0-9.()+*/^% -]+$/.test(arithmetic)&&/[+*/^%-]/.test(arithmetic)&&!dates(value)){
      button(captureResult,'Calcular expresión',()=>{
        let message;
        try{
          const result=root.liftsBuilderCore.compile(arithmetic,new Set())({});
          message=arithmetic+' = '+result;
        }catch(error){message=error.message;}
        element(captureResult,'p',message);
      });
    }
    if(dates(value)){
      button(captureResult,'Preparar aviso para '+value,()=>{
        root.liftsReminders.open('Aviso para '+value);
        $('reminderDate').focus();
      });
    }
    let url;
    try{const parsed=new URL(value);if(['https:','http:'].includes(parsed.protocol))url=parsed.href;}catch{}
    if(url)button(captureResult,'Preparar referencia',()=>root.liftsJournal.prepareDraft('knowledge',{title:'Referencia web',source:url}));
    if(lines.length>1){
      button(captureResult,'Revisar como instrucción',()=>{
        $('guardianInstructionText').value=value;
        $('guardianInstructionText').dispatchEvent(new Event('input'));
        $('guardianInstructionText').focus();
      });
      button(captureResult,'Ver como tabla',()=>{
        const table=element(captureResult,'table','');
        element(table,'caption','Lista de '+lines.length+' elementos');
        const body=element(table,'tbody','');
        lines.slice(0,100).forEach((line,index)=>{
          const row=element(body,'tr','');
          element(row,'th',String(index+1)).scope='row';
          element(row,'td',line);
        });
        if(lines.length>100)element(captureResult,'p','Se muestran los primeros 100 elementos.');
      });
    }
    button(captureResult,'Preparar nota',()=>root.liftsJournal.prepareDraft('note',{title,content:value}));
    button(captureResult,'Preparar misión',()=>root.liftsJournal.prepareDraft('mission',{title,objective:value}));
  };
  const instructionResult=$('guardianInstructionResult');
  $('guardianInstructionText').oninput=()=>instructionResult.replaceChildren();
  $('guardianInstruction').onsubmit=event=>{
    event.preventDefault();
    const review=instruction($('guardianInstructionText').value);
    instructionResult.replaceChildren();
    const list=element(instructionResult,'dl','');
    for(const [key,values] of review.fields){
      element(list,'dt',instructionLabels[key]);
      element(list,'dd',[...new Set(values)].join(' / '));
    }
    if(review.missing.length)element(instructionResult,'p','Por confirmar: '+review.missing.map(key=>instructionLabels[key]).join(', ')+'.');
    if(review.ambiguous.length)element(instructionResult,'p','Datos con varias versiones: '+review.ambiguous.map(key=>instructionLabels[key]).join(', ')+'.');
    if(review.extra.length)element(instructionResult,'p','Lee las líneas sin etiqueta en la solicitud original.');
    element(instructionResult,'p','Primera acción: '+review.action);
    button(instructionResult,'Preparar en Agenda',()=>root.liftsWorkUI.prepareTask(review.action));
  };
  $('guardianCancel').onclick=resetForm;
  $('guardianFocus').onclick=()=>{
    focus=!focus;$('guardianFocus').setAttribute('aria-pressed',String(focus));render();
  };
  $('guardianAgenda').onclick=()=>app.open('tasks');
  document.querySelectorAll('[data-guardian-phase]').forEach(button=>{
    button.onclick=()=>{phase=button.dataset.guardianPhase;render();};
  });
  root.addEventListener('lifts-page',event=>{
    if(event.detail.page==='guardian'){loadPreferences();render();renderRecords();reference();}
  });
  root.addEventListener('nexo-state',()=>{
    phase='start';focus=busy=false;resetForm();status.textContent='';
    $('guardianInstruction').reset();instructionResult.replaceChildren();
    $('guardianReferenceQuery').value='';reference();
    $('guardianClipboardForm').reset();captureResult.replaceChildren();$('guardianClipboard').open=false;
    $('guardianFocus').setAttribute('aria-pressed','false');
    $('guardianDraftPanel').hidden=true;$('guardianDraft').value='';
    loadPreferences();render();renderRecords();
  });
})(globalThis);
