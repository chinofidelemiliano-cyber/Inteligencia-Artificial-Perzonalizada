'use strict';
(() => {
  const $ = id => document.getElementById(id);
  let editing = null;
  const panelNames = {agenda:'Agenda',reminders:'Recordatorios',academy:'Aprendizaje',journal:'Misiones y objetivos',finance:'Finanzas y hábitos',builder:'Lifts Builder',radar:'Alertas de Radar'};
  const panelKeys = Object.keys(panelNames);
  const button = (label, action) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'secondary';
    el.textContent = label;
    el.onclick = action;
    return el;
  };
  const api = () => window.liftsWorkspace;
  const current = () => api().getState();
  const memories = state => Array.isArray(state.privateMemories)?state.privateMemories:[];
  const text = (tag, content) => {
    const el = document.createElement(tag);
    el.textContent = content;
    return el;
  };

  function resetEditor() {
    editing = null;
    $('memoryForm').reset();
    $('memoryCancel').hidden = true;
    $('memorySave').textContent = 'Guardar recuerdo';
  }

  async function save(message) {
    const state = current();
    render();
    const saved = await api().save();
    if(current()===state)$('privacyStatus').textContent = saved?message:'El cambio quedó en esta sesión. Revisa el estado de sincronización.';
  }

  function renderMemory(state) {
    const enabled = state.privateMemoryEnabled===true;
    $('memoryEnabled').checked = enabled;
    $('memoryShareLabel').hidden = !enabled;
    if(!enabled)$('shareMemory').checked = false;
    const list = $('memoryList');
    list.replaceChildren();
    const normalize=value=>String(value||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
    const terms=normalize($('memorySearch').value).split(/[^a-z0-9]+/).filter(term=>term.length>2);
    const matching=memories(state).filter(memory=>{
      const content=normalize([memory.title,memory.text,memory.category,memory.context].join(' '));
      return ($('memoryArchived').checked||!memory.archived)&&(!terms.length||terms.some(term=>content.includes(term)));
    });
    if(!matching.length)list.append(text('li',memories(state).length?'No hay recuerdos que coincidan.':'Todavía no hay recuerdos guardados.'));
    for(const memory of matching) {
      const entry = text('li','');
      entry.append(text('strong',memory.title),text('p',memory.text));
      const date=Date.parse(memory.createdAt);
      const metadata=[memory.category,Number.isFinite(date)?new Intl.DateTimeFormat('es-MX').format(date):'',memory.archived?'Archivado':''].filter(Boolean);
      if(metadata.length)entry.append(text('p',metadata.join(' · ')));
      if(memory.context)entry.append(text('p',memory.context));
      entry.append(button('Editar '+memory.title,()=>{
        editing = memory.id;
        $('memoryTitle').value = memory.title;
        $('memoryText').value = memory.text;
        $('memoryCategory').value = memory.category||'';
        $('memoryContext').value = memory.context||'';
        $('memorySave').textContent = 'Guardar cambios';
        $('memoryCancel').hidden = false;
        $('memoryTitle').focus();
      }),button((memory.archived?'Recuperar ':'Archivar ')+memory.title,()=>{
        if(editing===memory.id)resetEditor();
        state.privateMemories=memories(state).map(record=>record.id===memory.id?{...record,archived:!record.archived}:record);
        save(memory.archived?'Recuerdo recuperado.':'Recuerdo archivado.');
      }),button('Eliminar '+memory.title,()=>{
        if(!confirm('¿Eliminar este recuerdo de tu cuenta?'))return;
        if(editing===memory.id)resetEditor();
        state.privateMemories = memories(state).filter(item=>item.id!==memory.id);
        save('Recuerdo eliminado.');
      }));
      list.append(entry);
    }
  }

  function renderHome(state) {
    $('evolutionGreeting').textContent = state.profile?.name?'Hola, '+state.profile.name:'Tu espacio de trabajo';
    const prefs = state.evolutionHome || {};
    const order = [...new Set([...(Array.isArray(prefs.order)?prefs.order.filter(key=>panelKeys.includes(key)):[]),...panelKeys])];
    const hidden = Array.isArray(prefs.hidden)?prefs.hidden:[];
    const pending = state.tasks.filter(task=>!task.done&&!task.archived);
    const now = new Date();
    const today = new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
    const due = pending.filter(task=>task.kind!=='reminder'&&task.date&&task.date<=today).length;
    const currentEvents=pending.filter(task=>task.date===today || task.startAt&&window.liftsWork.localDate(new Date(task.startAt))===today);
    $('osTodayDate').textContent=new Intl.DateTimeFormat('es-MX',{dateStyle:'full'}).format(now);
    const todayList=$('osTodayTasks');
    todayList.replaceChildren();
    for(const task of currentEvents.slice(0,5))todayList.append(text('li',task.title+(task.startAt&&Number.isFinite(Date.parse(task.startAt))?
      ' · '+new Intl.DateTimeFormat('es-MX',{timeStyle:'short'}).format(new Date(task.startAt)):'')));
    if(!currentEvents.length)todayList.append(text('li','Sin actividades registradas para hoy.'));
    if(currentEvents.length>5)todayList.append(text('li',(currentEvents.length-5)+' más en Agenda.'));
    const journal=state.nexusJournal||[];
    const goals=journal.filter(item=>item.kind==='goal'&&item.status==='active').length;
    const missions=journal.filter(item=>item.kind==='mission'&&item.status==='active').length;
    const month=today.slice(0,7);
    const expenses=(state.finance?.entries||[]).filter(item=>item.type==='expense'&&item.date?.startsWith(month)&&Number.isSafeInteger(item.cents));
    const habits=state.tasks.filter(item=>item.habitId&&!item.done&&!item.archived).length;
    const radar=(window.liftsRadar?.signals(state,today)||[]).filter(item=>{
      const status=state.personalRadar?.[item.id];
      return status?.status!=='resolved'&&(status?.status!=='snoozed'||status.until<=today);
    }).length;
    const sections = {
      agenda:[due+' tareas para hoy o vencidas',()=>api().open('tasks')],
      reminders:[pending.filter(task=>task.kind==='reminder').length+' recordatorios sin completar',()=>api().open('reminders')],
      academy:[Object.keys(state.academyProgress?.done||{}).length+' lecturas registradas como completadas',()=>window.liftsAcademy.open()],
      journal:[missions+' misiones activas · '+goals+' objetivos activos',()=>api().open('journal')],
      finance:[expenses.length+' gastos registrados este mes · '+habits+' hábitos activos',()=>api().open('routines')],
      builder:[(state.builderTools||[]).filter(tool=>!tool.archived).length+' herramientas personalizadas activas',()=>api().open('builder')],
      radar:[radar+' alertas detectadas',()=>api().open('radar')]
    };
    $('evolutionPanels').replaceChildren();
    $('evolutionPanelSettings').replaceChildren();
    for(const [index,key] of order.entries()) {
      const [description,open] = sections[key];
      if(!hidden.includes(key)) {
        const panel = document.createElement('article');
        panel.append(text('h3',panelNames[key]),text('p',description),button('Abrir '+panelNames[key],open));
        $('evolutionPanels').append(panel);
      }
      const row = document.createElement('div');
      row.className = 'evolution-controls';
      const visibility = button((hidden.includes(key)?'Mostrar ':'Ocultar ')+panelNames[key],()=>{
        state.evolutionHome = {order,hidden:hidden.includes(key)?hidden.filter(item=>item!==key):[...hidden,key]};
        renderHome(state);
        api().save();
      });
      const move = button('Subir '+panelNames[key],()=>{
        const next = [...order];
        [next[index-1],next[index]] = [next[index],next[index-1]];
        state.evolutionHome = {order:next,hidden};
        renderHome(state);
        api().save();
      });
      move.disabled = index===0;
      row.append(visibility,move);
      $('evolutionPanelSettings').append(row);
    }
  }

  function render() {
    const state = current();
    renderHome(state);
    renderMemory(state);
  }

  $('evolutionAsk').onclick=()=>$('question').focus();
  $('evolutionSearch').onclick=()=>$('workspaceSearch').click();
  $('memoryCancel').onclick=resetEditor;
  $('memoryEnabled').onchange=()=>{
    current().privateMemoryEnabled = $('memoryEnabled').checked;
    save('Preferencia guardada.');
  };
  $('memoryForm').onsubmit=event=>{
    event.preventDefault();
    const state = current();
    const title = $('memoryTitle').value.trim();
    const body = $('memoryText').value.trim();
    if(!title||!body){$('privacyStatus').textContent='Escribe un título y un recuerdo.';return;}
    if(!editing&&memories(state).length>=200){$('privacyStatus').textContent='Se alcanzó el límite de 200 recuerdos por espacio.';return;}
    const previous=memories(state).find(memory=>memory.id===editing);
    const record={...previous,id:editing||crypto.randomUUID(),title,text:body,
      createdAt:previous?previous.createdAt||'':new Date().toISOString(),
      category:$('memoryCategory').value,context:$('memoryContext').value.trim()};
    state.privateMemories = editing?memories(state).map(item=>item.id===editing?record:item):[record,...memories(state)];
    resetEditor();
    save('Recuerdo guardado.');
  };
  $('exportSpace').onclick=()=>{
    if(!window.nexoAccount.isReady())return;
    const {messages,...space} = window.liftsPersonalization.snapshot(current());
    const link = document.createElement('a');
    const url = URL.createObjectURL(new Blob([JSON.stringify(space,null,2)],{type:'application/json'}));
    link.href = url;
    link.download = 'lifts-mi-espacio.json';
    link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  $('memorySearch').oninput=()=>renderMemory(current());
  $('memoryArchived').onchange=()=>renderMemory(current());
  function reset() {
    resetEditor();
    $('memorySearch').value='';
    $('memoryArchived').checked=false;
    renderMemory(current());
    $('privacyStatus').textContent='';
  }
  window.addEventListener('nexo-state',reset);
  window.liftsEvolution = {render,reset,handle(text) {
    const route = window.liftsEvolutionCore.lookup(text,memories(current())) || window.liftsEvolutionCore.route(text);
    if(!route)return null;
    const target=window.liftsNexusCore?.location(route.target,route.template||'');
    return {reply:route.reply,open:target?()=>window.liftsNexus.open(target):undefined};
  }};
  render();
})();
