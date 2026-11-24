'use strict';
(() => {
  const $ = id => document.getElementById(id);
  let editing = null;
  const panelNames = {agenda:'Agenda',reminders:'Recordatorios',academy:'Aprendizaje'};
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
    if(!memories(state).length)list.append(text('li','Todavía no hay recuerdos guardados.'));
    for(const memory of memories(state)) {
      const entry = text('li','');
      entry.append(text('strong',memory.title),text('p',memory.text));
      entry.append(button('Editar '+memory.title,()=>{
        editing = memory.id;
        $('memoryTitle').value = memory.title;
        $('memoryText').value = memory.text;
        $('memorySave').textContent = 'Guardar cambios';
        $('memoryCancel').hidden = false;
        $('memoryTitle').focus();
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
    const sections = {
      agenda:[due+' tareas para hoy o vencidas',()=>api().open('tasks')],
      reminders:[pending.filter(task=>task.kind==='reminder').length+' recordatorios sin completar',()=>api().open('reminders')],
      academy:['Abrir el catálogo y retomar tus lecciones',()=>window.liftsAcademy.open()]
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
    const record={id:editing||crypto.randomUUID(),title,text:body};
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
  function reset() {
    resetEditor();
    $('privacyStatus').textContent='';
  }
  window.addEventListener('nexo-state',reset);
  window.liftsEvolution = {render,reset,handle(text) {
    const route = window.liftsEvolutionCore.route(text);
    if(!route)return null;
    const actions = {
      engineering:()=>api().open('engineering'),
      library:()=>window.liftsAcademy.open('library'),
      excel:()=>window.liftsExcel.open(route.template),
      diagnostics:()=>api().open('diagnostics')
    };
    return {reply:route.reply,open:actions[route.target]};
  }};
  render();
})();
