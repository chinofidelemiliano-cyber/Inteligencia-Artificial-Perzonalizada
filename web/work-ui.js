'use strict';
(() => {
  const $=id=>document.getElementById(id);const api=window.liftsWorkspace;const work=window.liftsWork;
  const state=()=>api.getState();const persist=()=>api.save();const refresh=()=>api.render();
  const fields={workRole:'role',workDuties:'duties',workShiftStart:'shiftStart',workShiftEnd:'shiftEnd',workChallenges:'challenges',workResources:'resources',workGoal:'goal'};
  let proposal=null,editing=null,version=0,registration=null,notificationDetails=false,stepRequest=null,draftKind='';
  const notified=new Set();let dueSignature='';let backgroundPush=false;
  const today=()=>work.localDate(new Date());
  function stamp(value){return new Date(value).toLocaleString(undefined,{dateStyle:'short',timeStyle:'short'});}
  function button(text,action){const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=text;b.onclick=action;return b;}
  function note(target,text){const p=document.createElement('p');p.textContent=text;target.append(p);return p;}
  function presentation(){return state().assistant?.presentation==='feminine'?'Lista para acompañarte.':state().assistant?.presentation==='masculine'?'Listo para acompañarte.':'Aquí para acompañarte.';}
  function updateCompanion(){
    const data=state();const pending=data.tasks.filter(t=>!t.done&&!t.archived&&t.kind!=='reminder');const overdue=pending.filter(t=>t.date&&t.date<today());const dueToday=pending.filter(t=>t.date===today());
    $('companionName').textContent=api.assistantName()+' te acompaña';
    $('companionMessage').textContent=window.liftsCoachUI?.companionText() || presentation()+(overdue.length?` Tienes ${overdue.length} pendiente(s) de días anteriores. Podemos reorganizarlos.`:dueToday.length?` Hay ${dueToday.length} pendiente(s) para hoy. Vamos con uno a la vez.`:pending.length?` Tienes ${pending.length} pendiente(s). ¿Elegimos el siguiente paso?`:' Si quieres, empieza con una prioridad pequeña para hoy.');
    return{pending,overdue,dueToday};
  }
  function render(){
    const data=state();const {pending,overdue,dueToday}=updateCompanion();
    const completedToday=data.tasks.filter(t=>!t.archived&&t.done&&t.completedAt&&work.localDate(new Date(t.completedAt))===today()).length;
    $('daySummary').replaceChildren();note($('daySummary'),`${pending.length} pendientes · ${dueToday.length} para hoy · ${overdue.length} de días anteriores · ${completedToday} completadas hoy`);note($('daySummary'),'Horarios del dispositivo: '+Intl.DateTimeFormat().resolvedOptions().timeZone);
    $('taskList').replaceChildren();const filter=$('taskFilter').value;
    const counts=new Map();
    for(const task of pending){const key=work.taskKey(task.title);if(key)counts.set(key,(counts.get(key)||0)+1);}
    const tasks=data.tasks.filter(t=>t.kind!=='reminder').filter(t=>filter==='archived'?t.archived:!t.archived).filter(t=>filter==='duplicates'?(!t.done&&counts.get(work.taskKey(t.title))>1):filter==='pending'?!t.done:filter==='done'?t.done:filter==='today'?!t.done&&((t.date&&t.date<=today())||(t.startAt&&work.localDate(new Date(t.startAt))===today())):true).sort((a,b)=>Number(a.done)-Number(b.done)||(a.startAt||'z').localeCompare(b.startAt||'z')||(Number(a.priority)||2)-(Number(b.priority)||2)||(a.date||'9999').localeCompare(b.date||'9999')||(Number(a.duration)||25)-(Number(b.duration)||25));
    if(!tasks.length)note($('taskList'),'No hay tareas en esta vista.');
    for(const task of tasks){const row=document.createElement('div');row.className='task agenda-task'+(task.done?' done':'');const check=document.createElement('input');check.type='checkbox';check.checked=task.done;check.setAttribute('aria-label','Completar '+task.title);check.onchange=()=>{task.done=check.checked;task.completedAt=task.done?new Date().toISOString():'';persist();refresh();};const text=document.createElement('div');text.className='task-description';note(text,task.title);const meta=document.createElement('small');meta.textContent=[['Alta','Normal','Baja'][(Number(task.priority)||2)-1],(Number(task.duration)||25)+' min',task.date?'Objetivo: '+task.date:'',task.startAt?'Bloque: '+stamp(task.startAt):'',task.reminderAt?'Aviso: '+stamp(task.reminderAt):''].filter(Boolean).join(' · ');text.append(meta);
      for(const step of task.steps || []){
        const label=document.createElement('label');
        const input=document.createElement('input');input.type='checkbox';input.checked=step.done;
        input.onchange=()=>{step.done=input.checked;step.completedAt=step.done?new Date().toISOString():'';persist();refresh();};
        label.append(input,document.createTextNode(' '+step.title));text.append(label);
      }
      row.append(check,text,button(task.archived?'Recuperar':'Archivar',()=>{task.archived=!task.archived;persist();refresh();}),button('Editar',()=>editTask(task)),button('Eliminar',()=>{if(!confirm('¿Eliminar este pendiente?'))return;if(data.googleCalendarId && (task.reminderAt || task.startAt)){data.googleCancelledTasks=[...new Set([...(data.googleCancelledTasks||[]),task.id])];}data.tasks=data.tasks.filter(t=>t.id!==task.id);if(editing===task.id)cancelEdit();persist();refresh();}));$('taskList').append(row);}
    const current=$('focusTask').value;$('focusTask').replaceChildren();const none=document.createElement('option');none.value='';none.textContent='Enfoque sin tarea específica';$('focusTask').append(none);for(const task of pending){const option=document.createElement('option');option.value=task.id;option.textContent=task.title;$('focusTask').append(option);}$('focusTask').value=current;
    const profile=data.workProfile || {};for(const [id,key] of Object.entries(fields))$(id).value=profile[key] || (key==='shiftStart'?'09:00':key==='shiftEnd'?'17:00':'');$('workConsent').checked=data.workConsent===true;
    notificationDetails=$('notificationDetails').checked;
    $('planDate').value ||= today();$('taskDate').value ||= today();
    renderDue();tickFocus();
  }
  function cancelEdit(){draftKind='';stepRequest?.abort();stepRequest=null;$('suggestTaskSteps').disabled=false;editing=null;$('taskForm').reset();$('taskSubmit').textContent='Agregar tarea';$('cancelEditTask').hidden=true;$('taskFormStatus').textContent='';}
  function editTask(task){cancelEdit();editing=task.id;$('taskTitle').value=task.title;$('taskDate').value=task.date || '';$('taskPriority').value=String(task.priority || 2);$('taskDuration').value=String(task.duration || 25);$('taskStart').value=task.startAt?work.localInput(new Date(task.startAt)):'';$('taskReminder').value=task.reminderAt?work.localInput(new Date(task.reminderAt)):'';$('taskRepeat').value=task.reminderRepeat || '';$('taskSteps').value=(task.steps || []).map(step=>step.title).join('\n');$('taskSubmit').textContent='Guardar tarea';$('cancelEditTask').hidden=false;$('taskTitle').focus();}
  $('suggestTaskSteps').onclick=async()=>{
    const title=$('taskTitle').value.trim();
    const current=$('taskSteps').value;
    if(!title){$('taskFormStatus').textContent='Escribe primero el título de la tarea.';return;}
    const request=new AbortController();
    stepRequest=request;
    const timeout=setTimeout(()=>request.abort(),45000);
    $('suggestTaskSteps').disabled=true;
    $('taskFormStatus').textContent='Preparando pasos a partir del título…';
    try{
      const token=await window.nexoAccount.accessToken();
      const prompt='Divide la tarea en 3 a 5 pasos breves y accionables. Devuelve solo una lista JSON de cadenas, sin texto adicional. Si faltan detalles, incluye un paso para confirmarlos. Título: '+JSON.stringify(title);
      const response=await fetch('/api/chat',{method:'POST',signal:request.signal,
        headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
        body:JSON.stringify({messages:[{role:'user',content:prompt}],detail:'brief'})});
      const result=await response.json();
      if(stepRequest!==request)return;
      if(!response.ok)throw new Error(result.error || 'La IA no respondió.');
      if(title!==$('taskTitle').value.trim()||current!==$('taskSteps').value){
        $('taskFormStatus').textContent='El borrador cambió. Puedes pedir pasos para la versión nueva.';
        return;
      }
      const raw=String(result.reply).trim().replace(/^```(?:json)?\s*|\s*```$/gi,'');
      let steps;
      try{steps=JSON.parse(raw);}catch{}
      if(!Array.isArray(steps)||steps.length<3||steps.length>5||steps.some(step=>typeof step!=='string'||!step.trim()||step.length>180||/[\r\n]/.test(step))){
        throw new Error('La IA no devolvió pasos válidos. Puedes escribirlos directamente.');
      }
      const merged=[...new Set([...current.split('\n'),...steps].map(step=>step.trim()).filter(Boolean))].slice(0,20).join('\n');
      if(merged.length>2000)throw new Error('Los pasos sugeridos superan el espacio disponible.');
      $('taskSteps').value=merged;
      $('taskFormStatus').textContent='Pasos preparados. Revísalos antes de guardar.';
    }catch(error){
      if(stepRequest===request)$('taskFormStatus').textContent=request.signal.aborted?'La sugerencia tardó demasiado.':error.message;
    }finally{
      clearTimeout(timeout);
      if(stepRequest===request){stepRequest=null;$('suggestTaskSteps').disabled=false;}
    }
  };
  function addTask(event){event.preventDefault();const title=$('taskTitle').value.trim();const duration=Number($('taskDuration').value);if(!title||!Number.isFinite(duration)||duration<5||duration>720){$('taskFormStatus').textContent='Añade una tarea y una duración de 5 a 720 minutos.';return;}
    const start=$('taskStart').value?new Date($('taskStart').value):null;const reminder=$('taskReminder').value?new Date($('taskReminder').value):null;if((start&&!Number.isFinite(start.getTime()))||(reminder&&!Number.isFinite(reminder.getTime()))){$('taskFormStatus').textContent='Revisa la fecha y la hora.';return;}
    if(start){const block={start:start.getTime(),end:start.getTime()+duration*60000};const conflict=state().tasks.find(t=>t.id!==editing&&!t.done&&!t.archived&&t.startAt&&work.overlaps(block,{start:Date.parse(t.startAt),end:Date.parse(t.startAt)+(Number(t.duration)||25)*60000}));if(conflict){$('taskFormStatus').textContent='Este bloque se cruza con: '+conflict.title+'. Elige otro horario.';return;}}
    const previous=state().tasks.find(t=>t.id===editing);const task={...previous,id:previous?.id || crypto.randomUUID(),title,date:$('taskDate').value,done:previous?.done || false,priority:[1,2,3].includes(Number($('taskPriority').value))?Number($('taskPriority').value):2,duration,startAt:start?.toISOString() || '',reminderAt:reminder?.toISOString() || ''};task.reminderRepeat=reminder?$('taskRepeat').value:'';
    if(draftKind)task.kind=draftKind;
    if(reminder && (task.reminderAt!==previous?.reminderAt || !task.reminderTimeZone))task.reminderTimeZone=Intl.DateTimeFormat().resolvedOptions().timeZone;
    task.steps=[...new Set($('taskSteps').value.split('\n').map(line=>line.trim().slice(0,240)).filter(Boolean))].slice(0,20)
      .map(title=>previous?.steps?.find(step=>step.title===title)||{title,done:false});
    if(task.startAt!==previous?.startAt)task.planned=false;
    if(task.reminderAt!==previous?.reminderAt||task.reminderRepeat!==(previous?.reminderRepeat||'')){
      task.reminderAnchorAt=task.reminderRepeat?task.reminderAt:'';
      task.remindedFor='';task.notifiedFor='';task.snoozedFrom='';
    }
    if(state().googleCalendarId && (previous?.startAt || previous?.reminderAt) && !task.startAt && !task.reminderAt){
      state().googleCancelledTasks=[...new Set([...(state().googleCancelledTasks || []),task.id])];
    }
    if(previous)state().tasks=state().tasks.map(t=>t.id===editing?task:t);else state().tasks.push(task);
    persist();cancelEdit();refresh();window.dispatchEvent(new CustomEvent('lifts-task-created',{detail:{title}}));$('taskFormStatus').textContent='Tarea preparada. Revisa el estado de guardado de tu cuenta.';
  }
  function renderDue(){const overdue=work.due(state().tasks);const signature=JSON.stringify(overdue.map(t=>[t.id,t.title,t.reminderAt]));if(signature===dueSignature)return;dueSignature=signature;$('dueReminders').replaceChildren();for(const task of overdue){const row=document.createElement('div');row.className='reminder-card';note(row,'Es momento de: '+task.title);row.append(button('Hecho',()=>{task.done=true;task.completedAt=new Date().toISOString();persist();refresh();}),button('Posponer 10 min',()=>{task.snoozedFrom ||= task.reminderAt;task.reminderAt=new Date(Date.now()+600000).toISOString();task.remindedFor='';persist();refresh();}),button('Ya lo vi',()=>{const next=work.nextReminder({...task,reminderAt:task.reminderAnchorAt || task.snoozedFrom || task.reminderAt});
      if(next){task.reminderAt=next;task.snoozedFrom='';task.notifiedFor='';}else task.remindedFor=task.reminderAt;
      persist();refresh();}));$('dueReminders').append(row);}}
  async function notify(title,body,tag,intensity=2){if(!registration || !window.Notification || Notification.permission!=='granted')return false;try{await registration.showNotification(title,{body,tag,icon:'/assets/icon-192.png',badge:'/assets/favicon-32.png',silent:intensity===3,...(intensity===1?{vibrate:[180,90,180]}:{})});return true;}catch{return false;}}
  async function tickReminders(){updateCompanion();const currentVersion=version;const due=work.due(state().tasks).sort((a,b)=>(a.priority||2)-(b.priority||2)||a.reminderAt.localeCompare(b.reminderAt));if(backgroundPush){renderDue();return;}if(!registration || !window.Notification || Notification.permission!=='granted'){renderDue();return;}for(const task of due){const key=task.id+task.reminderAt;if(notified.has(key)||task.notifiedFor===task.reminderAt)continue;notified.add(key);const delivered=await notify(api.assistantName()+' · Recordatorio',notificationDetails?task.title:'Tienes un pendiente programado. Abre Lifts para verlo.',key,task.priority||2);if(currentVersion!==version)return;if(delivered){$('notificationStatus').textContent='Aviso aceptado por el sistema. Pulsa la notificación para confirmar que la viste.';}
      else {notified.delete(key);$('notificationStatus').textContent='No se pudo mostrar el aviso. Sigue pendiente en la agenda.';}}renderDue();}
  function tickFocus(){const session=state().focusSession;if(!session){$('focusClock').textContent=String(Number($('focusMinutes').value)||25).padStart(2,'0')+':00';return;}const remaining=Math.max(0,session.paused?session.remaining:session.endsAt-Date.now());$('focusClock').textContent=String(Math.floor(remaining/60000)).padStart(2,'0')+':'+String(Math.floor(remaining/1000)%60).padStart(2,'0');if(!session.paused&&remaining===0&&!session.finished){session.finished=true;if(session.kind==='break'&&session.taskId){const task=state().tasks.find(t=>t.id===session.taskId&&t.kind==='break');if(task){task.done=true;task.completedAt=new Date().toISOString();}queueMicrotask(()=>api.render());}$('focusStatus').textContent=session.kind==='break'?'Terminó tu pausa. Elige el siguiente paso cuando estés listo.':'Terminaste tu bloque. Haz una pausa y revisa cómo te fue.';notify(api.assistantName()+' · Enfoque',session.kind==='break'?'Tu pausa terminó. Podemos elegir el siguiente paso.':'Tu bloque terminó. Es momento de una pausa.','focus-'+session.endsAt);persist();}}
  $('taskFilter').onchange=render;$('cancelEditTask').onclick=cancelEdit;
  function planDay(){
    return work.plan(state().tasks.filter(t=>!t.archived&&t.kind!=='day-review'&&t.kind!=='reminder'),$('planDate').value,$('planStart').value,$('planEnd').value,{
      now:Math.floor(Date.now()/60000)*60000,recover:true,reorganize:$('planReorganize').checked,
      breakMinutes:Math.max(0,Math.min(60,Number($('planBreak').value)||0)),events:window.liftsGoogle?.events() || []
    });
  }
  $('reviewDay').onclick=()=>reviewDay($('planDate').value);
  for(const [id,title,hour] of [['remindStartDay','Revisar prioridades al iniciar mi jornada',8],['remindEndDay','Resumir mi jornada y pendientes',17]]){
    $(id).onclick=()=>{
      const date=new Date();date.setHours(hour,0,0,0);
      if(date.getTime()<=Date.now())date.setDate(date.getDate()+1);
      window.liftsWorkUI.prepareReminder(title,date);
      $('taskRepeat').value='daily';draftKind='day-review';
    };
  }
  function reviewDay(date){
    const tasks=state().tasks.filter(t=>!t.archived&&t.kind!=='day-review'&&t.kind!=='reminder');
    const complete=tasks.filter(t=>t.done&&t.completedAt&&work.localDate(new Date(t.completedAt))===date);
    const pending=tasks.filter(t=>!t.done&&(t.date&&t.date<=date || t.startAt&&work.localDate(new Date(t.startAt))<=date));
    $('schedulePreview').replaceChildren();
    $('applySchedule').hidden=true;
    note($('schedulePreview'),complete.length+' completadas · '+pending.length+' pendientes para este día o anteriores.');
    pending.sort((a,b)=>(a.priority||2)-(b.priority||2)||(a.date||'9999').localeCompare(b.date||'9999'));
    if(pending.length)note($('schedulePreview'),'Siguiente paso sugerido: '+pending[0].title+'. Si el bloque es demasiado grande, divídelo en pasos o reprograma lo que no quepa.');
    for(const task of complete)note($('schedulePreview'),'Completada · '+task.title);
  }
  $('suggestSchedule').onclick=()=>{proposal=planDay();$('schedulePreview').replaceChildren();$('applySchedule').hidden=true;if(proposal.error){note($('schedulePreview'),proposal.error);return;}for(const block of proposal.scheduled){const task=state().tasks.find(t=>t.id===block.id);note($('schedulePreview'),stamp(block.startAt)+' · '+task.title+' · '+block.duration+' min');}note($('schedulePreview'),proposal.remaining.length?`${proposal.remaining.length} tarea(s) no caben en esta jornada. Ajusta el alcance o programa otro día.`:proposal.scheduled.length?'Propuesta lista. Revisa los horarios y los descansos antes de aplicarla.':'No hay tareas sin horario que programar para este día.');$('applySchedule').hidden=!proposal.scheduled.length;};
  $('applySchedule').onclick=()=>{if(!proposal?.scheduled)return;const fresh=planDay();if(JSON.stringify(fresh.scheduled)!==JSON.stringify(proposal.scheduled)){$('schedulePreview').textContent='La agenda cambió. Pulsa Proponer horario para revisarla de nuevo.';$('applySchedule').hidden=true;proposal=null;return;}for(const block of proposal.scheduled){const task=state().tasks.find(t=>t.id===block.id);if(task&&!task.done)Object.assign(task,block,{planned:true});}persist();proposal=null;$('applySchedule').hidden=true;$('schedulePreview').textContent='Propuesta aplicada. Revisa el estado de guardado.';refresh();};
  $('startFocus').onclick=()=>{const minutes=Number($('focusMinutes').value);if(!Number.isFinite(minutes)||minutes<1||minutes>120){$('focusStatus').textContent='Elige entre 1 y 120 minutos.';return;}const previous=state().focusSession;const remaining=previous?.paused?previous.remaining:minutes*60000;state().focusSession={endsAt:Date.now()+remaining,remaining,paused:false,finished:false,kind:previous?.paused?previous.kind||'task':'task',taskId:$('focusTask').value};persist();$('focusStatus').textContent='Un paso a la vez. Puedes pausar cuando lo necesites.';tickFocus();};
  $('pauseFocus').onclick=()=>{const session=state().focusSession;if(!session||session.finished||session.paused)return;session.remaining=Math.max(0,session.endsAt-Date.now());session.paused=true;persist();$('focusStatus').textContent='En pausa. Pulsa Comenzar para continuar.';tickFocus();};
  $('resetFocus').onclick=()=>{state().focusSession=null;persist();$('focusStatus').textContent='Bloque terminado. Puedes elegir tu siguiente paso.';tickFocus();};
  $('enableNotifications').onclick=async()=>{if(!window.Notification || !navigator.serviceWorker){$('notificationStatus').textContent='Este navegador no permite estos avisos. Puedes exportar al calendario; en algunos teléfonos necesitas añadir Lifts a la pantalla de inicio.';return;}try{const permission=await Notification.requestPermission();if(permission==='granted'){await navigator.serviceWorker.register('/sw.js');registration=await navigator.serviceWorker.ready;void tickReminders();}$('notificationStatus').textContent=permission==='granted'?'Avisos habilitados en este dispositivo mientras Lifts pueda ejecutarse.':permission==='denied'?'Permiso bloqueado. Puedes cambiarlo en el navegador o usar tu calendario.':'No se concedió permiso. Los pendientes seguirán visibles en la agenda.';}catch{$('notificationStatus').textContent='No se pudieron activar los avisos. Usa la agenda o exporta al calendario.';}};
  $('testNotification').onclick=async()=>{$('notificationStatus').textContent=await notify(api.assistantName(),'Este es un aviso de prueba. No incluye tus datos de trabajo.','lifts-test')?'Aviso enviado al sistema. Su visualización depende de tus ajustes de notificaciones.':'Activa los avisos y concede permiso primero.';};
  $('notificationDetails').onchange=()=>{notificationDetails=$('notificationDetails').checked;};
  $('exportCalendar').onclick=()=>{if(!state().tasks.some(t=>!t.done&&(t.startAt||t.reminderAt))){$('notificationStatus').textContent='Añade al menos un bloque o recordatorio para exportar.';return;}const url=URL.createObjectURL(new Blob([work.calendar(state().tasks)],{type:'text/calendar;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='lifts-agenda.ics';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('notificationStatus').textContent='Archivo preparado. Impórtalo en un calendario privado y comprueba sus alertas; cada app gestiona las alarmas de forma distinta.';};
  $('workForm').onsubmit=event=>{event.preventDefault();const data={};for(const [id,key]of Object.entries(fields))data[key]=$(id).value.trim();state().workProfile=data;state().workConsent=$('workConsent').checked;persist();$('planStart').value=data.shiftStart || '09:00';$('planEnd').value=data.shiftEnd || '17:00';refresh();$('workStatus').textContent='Contexto aplicado. Revisa el estado de guardado.';};
  $('forgetWork').onclick=()=>{state().workProfile=null;state().workConsent=false;$('workShare').checked=false;persist();refresh();$('workStatus').textContent='Borrado preparado. Revisa el estado de guardado.';};
  $('goWork').onclick=()=>api.open('work');$('goAgenda').onclick=$('companionButton').onclick=()=>api.open('tasks');$('checkIn').onclick=()=>{$('companionMessage').textContent='Haz una pausa breve si tu actividad lo permite. ¿Necesitas descansar, reorganizar un pendiente o continuar con una sola prioridad?';};
  $('researchForm').onsubmit=async event=>{event.preventDefault();const query=$('researchQuery').value.trim();if(!query)return;const currentVersion=version;$('researchButton').disabled=true;$('researchResults').replaceChildren();$('researchFallback').replaceChildren();$('researchStatus').textContent='Buscando una referencia general…';try{const token=await window.nexoAccount.accessToken();if(currentVersion!==version)return;const response=await fetch('/api/research',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({query})});const result=await response.json();if(currentVersion!==version)return;if(!response.ok)throw new Error(result.error || 'No se pudo buscar.');for(const source of result.results || []){const card=document.createElement('article');card.className='research-card';const title=document.createElement('a');title.href=source.url;title.target='_blank';title.rel='noopener noreferrer';title.textContent=source.title;card.append(title);note(card,source.excerpt);card.append(button('Preparar consulta',()=>{api.open('home');$('question').value=('Quiero entender '+query+'. Esta es una referencia general, no un manual de fabricante: '+source.title+' '+source.url+'\n'+source.excerpt+'\n¿Qué se puede afirmar y qué falta verificar?').slice(0,5000);$('question').focus();}));$('researchResults').append(card);}$('researchStatus').textContent=result.results?.length?'Referencias generales encontradas. Contrasta cualquier ajuste técnico con el manual de tu equipo.':'No encontré una referencia suficientemente útil. Puedes buscar en el sitio del fabricante.';}catch(error){if(currentVersion===version)$('researchStatus').textContent=error.message || 'No se pudo consultar la referencia.';}finally{if(currentVersion===version){$('researchButton').disabled=false;const link=document.createElement('a');link.href='https://www.google.com/search?q='+encodeURIComponent(query+' manual fabricante ficha técnica');link.target='_blank';link.rel='noopener noreferrer';link.textContent='Buscar manuales y fichas del fabricante (sitio externo)';$('researchFallback').append(link);}}};
  function context(){const data=state();return{profile:data.workProfile || {},tasks:data.tasks.filter(t=>!t.done&&!t.archived&&t.kind!=='reminder').slice(0,12).map(t=>({title:t.title,date:t.date || '',priority:t.priority || 2,duration:t.duration || 25,startAt:t.startAt || ''})),timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone};}
  window.addEventListener('lifts-dictation-replaced',event=>{if(!editing && event.detail?.previous && $('taskTitle').value.trim()===event.detail.previous.slice(0,240).trim())cancelEdit();});
  window.addEventListener('lifts-push-enabled',event=>{backgroundPush=true;registration=event.detail;});
  window.addEventListener('lifts-push-disabled',()=>{backgroundPush=false;});
  window.addEventListener('nexo-state',()=>{version++;backgroundPush=false;
    const accountVersion=version;
    if(window.nexoAccount?.isReady?.())window.liftsPush?.active().then(active=>{
      if(accountVersion===version)backgroundPush=active;
    }).catch(()=>{});registration?.getNotifications().then(list=>list.forEach(n=>n.close())).catch(()=>{});proposal=null;cancelEdit();dueSignature='';
    $('planDate').value=today();$('taskDate').value=today();
    $('planStart').value=state().workProfile?.shiftStart || '09:00';$('planEnd').value=state().workProfile?.shiftEnd || '17:00';
    $('planReorganize').checked=false;notified.clear();notificationDetails=false;$('notificationDetails').checked=false;$('workShare').checked=false;for(const id of ['workStatus','researchStatus','researchResults','researchFallback','schedulePreview','focusStatus'])$(id).replaceChildren();$('researchQuery').value='';$('researchButton').disabled=false;$('applySchedule').hidden=true;render();if(window.Notification?.permission==='granted'&&navigator.serviceWorker)navigator.serviceWorker.getRegistration('/').then(value=>{if(accountVersion===version){registration=value;void tickReminders();}}).catch(()=>{});});
  navigator.serviceWorker?.addEventListener('message',event=>{if(event.data?.type==='OPEN_AGENDA'){api.open('reminders');$('notificationStatus').textContent='Aviso abierto en este dispositivo.';}});
  window.addEventListener('pageshow',()=>{tickFocus();tickReminders();});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){tickFocus();tickReminders();}});
  setInterval(tickFocus,1000);setInterval(tickReminders,30000);
  window.liftsWorkUI={render,addTask,context,reviewDay,preparePlan(date,reorganize){
    api.open('tasks');$('planDate').value=date;$('planReorganize').checked=reorganize;
    $('suggestSchedule').click();$('schedulePreview').scrollIntoView({block:'center'});
  },openReminder(taskId){
    if(state().tasks.some(t=>t.id===taskId&&t.kind==='day-review')){
      api.open('tasks');$('planDate').value=today();reviewDay(today());
      $('schedulePreview').scrollIntoView({block:'center'});
    }
  },prepareUrgent(date){
    this.preparePlan(date,true);
    this.prepareTask('');
    $('taskDate').value=date;$('taskPriority').value='1';
    $('taskFormStatus').textContent='Describe el imprevisto, estima cuánto tomará y guarda. Después vuelve a planificar.';
  },prepareReminder(title,date){
    this.prepareTask(title);$('taskDate').value=work.localDate(date);$('taskReminder').value=work.localInput(date);
  },prepareTask:title=>{cancelEdit();api.open('tasks');$('taskTitle').value=String(title).slice(0,240);$('taskTitle').focus();}};render();
  const view=new URL(location.href).searchParams.get('view');if(view==='tasks'||view==='reminders')api.open(view);
  window.addEventListener('nexo-state',()=>{const view=new URL(location.href).searchParams.get('view');if(view==='tasks'||view==='reminders')api.open(view);});
})();
