'use strict';
(()=>{
  const $=id=>document.getElementById(id),workspace=window.liftsWorkspace;
  const dateFormat=new Intl.DateTimeFormat('es-MX',{dateStyle:'full'});
  const widgets=$('desktopWidgets'),options=$('desktopWidgetOptions'),status=$('desktopWidgetStatus');
  const cards=new Map([...widgets.children].map(card=>[card.dataset.widget,card]));
  let busy=false;
  function layout(){
    const stored=workspace.getState().desktopWidgets||{};
    const order=[...new Set([...(stored.order||[]),...cards.keys()])].filter(key=>cards.has(key));
    for(const key of order){
      const card=cards.get(key);card.hidden=(stored.hidden||[]).includes(key);widgets.append(card);
    }
    controls();
  }
  function controls(){
    options.replaceChildren();
    const order=[...widgets.children];
    for(const [index,card] of order.entries()){
      const label=card.querySelector('h3').textContent,row=document.createElement('div');
      row.className='evolution-controls';
      const field=document.createElement('label'),check=document.createElement('input');
      check.type='checkbox';check.checked=!card.hidden;check.onchange=()=>{card.hidden=!check.checked;};
      field.append(check,' Mostrar '+label);row.append(field);
      for(const [direction,offset] of [['Subir',-1],['Bajar',1]]){
        const button=document.createElement('button');
        button.type='button';button.className='secondary';button.textContent=direction+' panel '+label;
        button.disabled=!order[index+offset];
        button.onclick=()=>{
          const neighbor=order[index+offset];
          if(offset<0)neighbor.before(card);else neighbor.after(card);
          controls();
        };
        row.append(button);
      }
      options.append(row);
    }
  }
  $('desktopWidgetSave').onclick=async()=>{
    if(busy)return;
    const state=workspace.getState(),previous=state.desktopWidgets,order=[...widgets.children];
    state.desktopWidgets={order:order.map(card=>card.dataset.widget),hidden:order.filter(card=>card.hidden).map(card=>card.dataset.widget)};
    busy=true;status.textContent='Guardando…';
    try{
      if(!await workspace.save())throw new Error();
      if(workspace.getState()===state)status.textContent='Paneles guardados.';
    }catch{
      if(workspace.getState()===state){state.desktopWidgets=previous;status.textContent='No se pudo guardar. Puedes reintentar.';}
    }finally{
      if(workspace.getState()===state)busy=false;
    }
  };
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
  window.addEventListener('lifts-page',event=>{if(event.detail.page==='desktop'){layout();render();}});
  window.addEventListener('nexo-state',()=>{
    for(const id of ['desktopTasks','desktopAlerts','desktopFavorites'])$(id).replaceChildren();
    $('desktopNext').textContent='';busy=false;status.textContent='';layout();
  });
})();
