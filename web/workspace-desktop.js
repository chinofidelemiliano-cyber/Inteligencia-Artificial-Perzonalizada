'use strict';
(()=>{
  const $=id=>document.getElementById(id),workspace=window.liftsWorkspace;
  const dateFormat=new Intl.DateTimeFormat('es-MX',{dateStyle:'full'});
  function list(host,items,empty){
    host.replaceChildren();
    for(const text of items.length?items:[empty]){
      const row=document.createElement('li');row.textContent=text;host.append(row);
    }
  }
  function render(){
    const state=workspace.getState(),now=new Date(),work=window.liftsWork,today=work.localDate(now);
    $('desktopDate').textContent=dateFormat.format(now);
    const tasks=(state.tasks||[]).filter(item=>!item.done&&!item.archived&&item.kind!=='reminder');
    const current=tasks.filter(item=>item.date===today||item.startAt&&Number.isFinite(Date.parse(item.startAt))&&work.localDate(new Date(item.startAt))===today);
    const todays=[...current].sort((a,b)=>(a.priority||2)-(b.priority||2)).slice(0,6);
    list($('desktopTasks'),todays.map(item=>item.title),'Sin tareas pendientes para hoy.');
    const alerts=work.due(state.tasks||[]).slice(0,6);
    list($('desktopAlerts'),alerts.map(item=>item.title),'Sin avisos pendientes.');
    $('desktopNext').textContent=state.nexusContext?.next||'Aún no hay una próxima acción registrada en Nexus.';
    const favorites=$('desktopFavorites');
    favorites.replaceChildren();
    for(const id of state.workspaceNavigation?.favorites||[]){
      const label=window.liftsNavigation.tools.get(id);
      if(!label||id==='desktop')continue;
      const button=document.createElement('button');button.type='button';button.className='secondary';
      button.textContent=label;button.onclick=()=>workspace.open(id);favorites.append(button);
    }
  }
  $('desktopManage').onclick=()=>{
    workspace.open('home');
    const settings=$('workspaceShortcuts');
    settings.open=true;settings.querySelector('summary').focus();
  };
  window.addEventListener('lifts-page',event=>{if(event.detail.page==='desktop')render();});
  window.addEventListener('nexo-state',()=>{
    for(const id of ['desktopTasks','desktopAlerts','desktopFavorites'])$(id).replaceChildren();
    $('desktopNext').textContent='';
  });
})();
