'use strict';
(()=>{
  const $=id=>document.getElementById(id), workspace=window.liftsWorkspace, nav=$('workspaceSections');
  const groups=[...nav.querySelectorAll('[data-nav-group]')];
  const groupMap=new Map(groups.map(group=>[group.dataset.navGroup,group]));
  const defaultOpen=groups.filter(group=>group.open).map(group=>group.dataset.navGroup);
  const tools=new Map([...nav.querySelectorAll('[data-page]')].map(button=>[
    button.dataset.page,button.textContent.trim().replace(/^[◈✓♢▤▦✧◎]\s*/,'')
  ]));
  const pin=$('workspacePin'),status=$('workspaceNavStatus'),menu=$('workspaceMobileMenu');
  let recent=[],busy=false;
  function node(parent,tag,content){
    const el=document.createElement(tag);el.textContent=content;parent.append(el);return el;
  }
  function button(parent,content,action){
    const el=node(parent,'button',content);el.type='button';el.className='secondary';el.onclick=action;return el;
  }
  const saved=()=>workspace.getState().workspaceNavigation||{};
  function groupSettings(){
    const root=$('workspaceGroupSettings');root.replaceChildren();
    const order=[...nav.children];
    order.forEach((group,index)=>{
      const label=group.querySelector('summary').textContent;
      const row=node(root,'div','');row.className='evolution-controls';
      const control=node(row,'label',''),visible=node(control,'input','');
      visible.type='checkbox';visible.checked=!group.hidden;control.append(' Mostrar '+label);
      visible.onchange=()=>{group.hidden=!visible.checked;};
      const up=button(row,'Subir '+label,()=>{nav.insertBefore(group,order[index-1]);groupSettings();});
      const down=button(row,'Bajar '+label,()=>{nav.insertBefore(group,order[index+1].nextElementSibling);groupSettings();});
      up.disabled=index===0;down.disabled=index===order.length-1;
    });
  }
  function shortcuts(){
    const favorites=$('workspaceFavorites'), history=$('workspaceRecent');
    favorites.replaceChildren();history.replaceChildren();pin.replaceChildren();
    const keys=(saved().favorites||[]).filter(id=>tools.has(id));
    if(!keys.length)node(favorites,'p','Todavía no hay favoritos.');
    for(const id of keys){
      button(favorites,tools.get(id),()=>workspace.open(id));
      button(favorites,'Quitar '+tools.get(id),()=>save({...saved(),favorites:keys.filter(item=>item!==id)},'Favorito retirado.'));
    }
    for(const [id,label] of tools)if(!keys.includes(id))node(pin,'option',label).value=id;
    if(!recent.length)node(history,'p','Abre una herramienta para verla aquí.');
    for(const id of recent)button(history,tools.get(id),()=>workspace.open(id));
  }
  async function save(value,message){
    if(busy)return;
    const state=workspace.getState(),previous=state.workspaceNavigation;
    state.workspaceNavigation=value;busy=true;status.textContent='Guardando…';
    try{
      if(!await workspace.save())throw new Error();
      if(workspace.getState()===state)status.textContent=message;
    }catch{
      if(workspace.getState()===state){state.workspaceNavigation=previous;status.textContent='No se pudo guardar. Reintenta.';}
    }finally{
      if(workspace.getState()===state){busy=false;shortcuts();}
    }
  }
  $('workspacePinForm').onsubmit=event=>{
    event.preventDefault();
    const id=pin.value,keys=saved().favorites||[];
    if(tools.has(id)&&!keys.includes(id))void save({...saved(),favorites:[...keys,id]},'Favorito guardado.');
  };
  $('workspaceSaveMenu').onclick=()=>{
    const items=[...nav.children];
    void save({...saved(),order:items.map(item=>item.dataset.navGroup),
      hidden:items.filter(item=>item.hidden).map(item=>item.dataset.navGroup),
      open:items.filter(item=>item.open).map(item=>item.dataset.navGroup)},'Menú guardado.');
  };
  menu.onclick=()=>{
    const open=menu.getAttribute('aria-expanded')!=='true';
    menu.setAttribute('aria-expanded',String(open));
    nav.classList.toggle('mobile-closed',!open);
  };
  function reset(){
    busy=false;recent=[];status.textContent='';
    const prefs=saved();
    const keys=[...new Set([...(prefs.order||[]),...groupMap.keys()])];
    for(const key of keys){
      const group=groupMap.get(key);
      if(!group)continue;
      group.hidden=(prefs.hidden||[]).includes(key);
      group.open=(prefs.open||defaultOpen).includes(key);
      nav.append(group);
    }
    menu.setAttribute('aria-expanded','true');nav.classList.remove('mobile-closed');
    groupSettings();shortcuts();
  }
  window.addEventListener('nexo-state',reset);
  window.addEventListener('lifts-page',event=>{
    const id=event.detail.page;
    if(id==='home'||!tools.has(id))return;
    recent=[id,...recent.filter(item=>item!==id)].slice(0,6);shortcuts();
  });
  window.liftsNavigation={reset};
  reset();
})();
