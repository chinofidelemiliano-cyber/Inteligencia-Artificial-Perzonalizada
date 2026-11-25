'use strict';
(()=>{
  const $=id=>document.getElementById(id),app=window.liftsWorkspace;
  const form=$('desktopActionForm'),status=$('desktopActionStatus');
  const legacy={task:'draft-task',reminder:'draft-reminder',idea:'draft-idea',focus:'open-focus',expense:'open-expense'};
  const actions=new Map([
    ...Object.entries(legacy).map(([key,id])=>[key,[window.liftsNexusCore.tools[id].label,()=>window.liftsNexus.open({id,key:''})]]),
    ...[...window.liftsNavigation.tools].filter(([key])=>key!=='desktop').map(([key,label])=>['page:'+key,[label,()=>app.open(key)]])
  ]);
  function node(parent,tag,label=''){
    const item=document.createElement(tag);item.textContent=label;parent.append(item);return item;
  }
  for(const [id,[label]] of actions)node($('desktopActionTarget'),'option',label).value=id;
  const items=()=>app.getState().workspaceActions||[];
  let busy=false,editing=null;
  const submit=form.querySelector('button');
  function clearEditor(){editing=null;form.reset();submit.textContent='Agregar a mis atajos';}
  function button(parent,label,action){
    const el=node(parent,'button',label);el.className='secondary';el.type='button';el.onclick=action;return el;
  }
  function render(){
    const host=$('desktopActions'),editor=$('desktopActionSettings');
    host.replaceChildren();editor.replaceChildren();
    submit.disabled=busy;
    const shortcuts=items(),groups=new Map();
    if(!shortcuts.length)node(host,'p','Aún no tienes atajos de acción.');
    shortcuts.forEach((item,index)=>{
      const action=actions.get(item.target);
      if(!action)return;
      const name=item.name||action[0],group=item.group||'Accesos';
      if(!groups.has(group)){
        const section=node(host,'section');
        node(section,'h4',group);
        groups.set(group,node(section,'div'));
        groups.get(group).className='evolution-controls';
      }
      const shortcut=button(groups.get(group),name,action[1]);
      if(item.icon){
        const symbol=document.createElement('span');symbol.textContent=item.icon+' ';
        symbol.setAttribute('aria-hidden','true');shortcut.prepend(symbol);
      }
      const row=node(editor,'div');row.className='evolution-controls';
      node(row,'span',name);
      function move(offset){
        const next=[...items()];
        [next[index],next[index+offset]]=[next[index+offset],next[index]];
        void save(next,'Orden guardado.');
      }
      button(row,'Subir atajo '+name,()=>move(-1)).disabled=busy||index===0;
      button(row,'Bajar atajo '+name,()=>move(1)).disabled=busy||index===shortcuts.length-1;
      button(row,'Editar atajo '+name,()=>{
        editing=item.id;
        for(const key of ['target','name','group','icon'])form.elements[key].value=item[key]||'';
        submit.textContent='Guardar cambios del atajo';
        form.elements.name.focus();
      }).disabled=busy;
      button(row,'Quitar atajo '+name,async()=>{if(await save(items().filter(entry=>entry.id!==item.id),'Atajo retirado.')&&editing===item.id)clearEditor();}).disabled=busy;
    });
  }
  async function save(next,message){
    if(busy)return false;
    const state=app.getState(),before=state.workspaceActions;
    state.workspaceActions=next;busy=true;status.textContent='Guardando…';render();
    try{
      if(!await app.save())throw new Error();
      if(app.getState()===state){status.textContent=message;return true;}
    }catch{
      if(app.getState()===state){state.workspaceActions=before;status.textContent='No se pudo guardar. Reintenta.';}
    }finally{
      if(app.getState()===state){busy=false;render();}
    }
    return false;
  }
  form.onsubmit=async event=>{
    event.preventDefault();
    const {target,name,group,icon}=Object.fromEntries(new FormData(form));
    if(!actions.has(target)||(!editing&&items().length>=24)){status.textContent='El escritorio admite hasta 24 atajos válidos.';return;}
    const item={target,name:name.trim(),group:group.trim(),icon,id:editing||crypto.randomUUID()};
    const next=editing?items().map(entry=>entry.id===editing?item:entry):[...items(),item];
    if(await save(next,'Atajo guardado.'))clearEditor();
  };
  function reset(){busy=false;status.textContent='';clearEditor();render();}
  window.addEventListener('nexo-state',reset);
  window.addEventListener('lifts-page',event=>{if(event.detail.page==='desktop')render();});
  window.liftsDesktopActions={reset};
  render();
})();
