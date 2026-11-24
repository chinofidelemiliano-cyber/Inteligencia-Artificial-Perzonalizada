'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const api=window.liftsWorkspace;
  const root=document.documentElement;
  const sections=[
    ['Chat','home'],['Agenda','tasks'],['Recordatorios','reminders'],['Academia de flexografía','academy'],
    ['Trabajo y cursos breves','work'],['Crear imágenes','images'],['Ingeniería · Placas y distorsión','engineering'],['Lifts Excel · Inventario, desperdicio y Pareto','excel'],['Diagnóstico guiado · Comparar fotografías','diagnostics'],['Propuestas de logotipo','identity'],['Mi perfil','profile'],['Hábitos y dinero','routines']
  ];
  let searchVersion=0;
  function remember(name,value){try{localStorage.setItem(name,value);}catch{}}
  function read(name){try{return localStorage.getItem(name);}catch{return null;}}
  function applyTheme(light) {
    root.dataset.liftsTheme=light?'light':'dark';
    $('workspaceTheme').textContent=light?'Tema oscuro':'Tema claro';
    $('workspaceTheme').setAttribute('aria-pressed',String(light));
  }
  function fold(collapsed) {
    root.classList.toggle('sidebar-folded',collapsed);
    $('workspaceSidebar').textContent=collapsed?'Ampliar menú':'Plegar menú';
    $('workspaceSidebar').setAttribute('aria-expanded',String(!collapsed));
  }
  applyTheme(read('lifts-theme')==='light');
  fold(read('lifts-sidebar')==='folded');
  $('workspaceTheme').onclick=()=>{
    const light=root.dataset.liftsTheme!=='light';
    applyTheme(light);remember('lifts-theme',light?'light':'dark');
  };
  $('workspaceSidebar').onclick=()=>{
    const collapsed=!root.classList.contains('sidebar-folded');
    fold(collapsed);remember('lifts-sidebar',collapsed?'folded':'open');
  };

  const normalize=text=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const query=$('workspaceQuery');
  const results=$('workspaceSearchResults');
  const dialog=$('workspaceSearchDialog');
  function add(label,go) {
    const el=document.createElement('button');el.type='button';el.className='secondary';el.textContent=label;
    el.onclick=()=>{dialog.close();go();};results.append(el);
  }
  async function search() {
    const value=query.value.trim(),version=++searchVersion;
    const term=normalize(value);
    results.replaceChildren();
    for(const [label,page] of sections){
      if(!normalize(label).includes(term))continue;
      add(label,()=>page==='academy'?window.liftsAcademy.open():api.open(page));
    }
    if(!term)return;
    for(const task of api.getState().tasks.filter(task=>!task.archived && normalize(String(task.title)).includes(term)).slice(0,5)){
      add(task.title+' · '+(task.kind==='reminder'?'Recordatorios':'Agenda'),()=>api.open(task.kind==='reminder'?'reminders':'tasks'));
    }
    for(const item of (api.getState().engineeringRecords||[]).filter(item=>normalize(item.data.name+' '+item.data.model).includes(term)).slice(0,4)){
      add(item.data.name+' · Ficha de ingeniería',()=>api.open('engineering'));
    }
    for(const item of (api.getState().diagnosticCases||[]).filter(item=>normalize(item.data.name+' '+item.data.symptoms).includes(term)).slice(0,4)){
      add(item.data.name+' · Caso de diagnóstico',()=>api.open('diagnostics'));
    }
    try {
      const lessons=await window.liftsAcademy.search(value);
      if(version!==searchVersion||!dialog.open)return;
      for(const lesson of lessons)add(lesson.label,()=>window.liftsAcademy.open('lesson',lesson.key));
      if(!results.children.length)results.textContent='Sin coincidencias.';
    } catch {
      if(version===searchVersion&&!results.children.length)results.textContent='No se pudo buscar en las lecciones.';
    }
  }
  $('workspaceSearch').onclick=()=>{dialog.showModal();query.focus();void search();};
  query.oninput=search;
  $('workspaceAlerts').onclick=()=>{
    const items=$('workspaceAlertItems');
    const due=window.liftsWork.due(api.getState().tasks);
    items.replaceChildren();
    if(!due.length)items.textContent='No tienes avisos pendientes ahora.';
    else for(const task of due){
      const row=document.createElement('p');row.textContent=task.title;items.append(row);
    }
    $('workspaceAlertsDialog').showModal();
  };
  $('workspaceOpenReminders').onclick=()=>{$('workspaceAlertsDialog').close();api.open('reminders');};
  window.addEventListener('lifts-page',event=>{
    root.dataset.liftsPage=event.detail?.page || 'home';
  });
  window.addEventListener('nexo-state',()=>{
    searchVersion++;query.value='';results.replaceChildren();
    for(const id of ['workspaceSearchDialog','workspaceAlertsDialog'])if($(id).open)$(id).close();
    $('workspaceAlertItems').replaceChildren();
  });
})();
