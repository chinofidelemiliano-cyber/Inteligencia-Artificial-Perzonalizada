'use strict';
(function(root){
  const radar=typeof module==='object'?require('./personal-radar.js'):root.liftsRadar;
  const types={task:'Tarea vencida',calibration:'Calibración próxima',budget:'Presupuesto excedido',review:'Repaso previsto',household:'Mantenimiento previsto',followup:'Seguimiento de Guardian'};
  const actions={open:'Abrir el origen',reminder:'Preparar un recordatorio'};
  const normalize=value=>String(value||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
  function define(raw,id){
    const name=String(raw.name||'').trim(),condition=String(raw.condition||'').trim();
    if(!name||name.length>80||condition.length>80||!Object.hasOwn(types,raw.when)||!Object.hasOwn(actions,raw.then)){
      throw new Error('Revisa el nombre, el evento, la condición y la acción.');
    }
    const priority=raw.priority||'';
    if(!['','alta','media'].includes(priority))throw new Error('Selecciona una prioridad válida.');
    return {id,name,condition,priority,when:raw.when,then:raw.then,paused:false};
  }
  function evaluate(state,day){
    const signals=radar.signals(state,day).filter(item=>{
      const saved=state.personalRadar?.[item.id];
      return saved?.status!=='resolved'&&(saved?.status!=='snoozed'||saved.until<=day);
    });
    const recordKinds=new Map((state.nexusJournal||[]).map(item=>[item.id,item.kind]));
    const event=signal=>{
      if(!signal.id.startsWith('record:'))return signal.id.split(':')[0];
      const kind=recordKinds.get(signal.destination.key);
      return kind==='maintenance'?'household':kind;
    };
    return (state.workspaceAutomations?.rules||[]).filter(rule=>!rule.paused).flatMap(rule=>signals.filter(signal=>
      rule.when===event(signal)&&(!rule.priority||rule.priority===signal.priority)&&normalize(signal.title+' '+signal.detail).includes(normalize(rule.condition))
    ).slice(0,5).map(signal=>({rule,signal})));
  }
  if(typeof module==='object'){module.exports={define,evaluate};return;}
  const $=id=>document.getElementById(id),app=root.liftsWorkspace,form=$('automationForm'),status=$('automationStatus');
  const state=()=>app.getState().workspaceAutomations||{rules:[],history:[]};
  const localDay=()=>root.liftsWork.localDate(new Date());
  function destination(signal){
    const target=signal?.destination;
    return root.liftsNexusCore.location(target?.id,target?.key)||
      (target?.id==='task-record'?root.liftsNexusCore.location('tasks'):null);
  }
  function available(target){
    const owner=app.getState();
    if(target.id==='task-record')return owner.tasks.some(item=>item.id===target.key&&!item.archived&&item.kind!=='reminder');
    if(target.id==='guardian-followup-record')return (owner.guardianFollowups||[]).some(item=>item.id===target.key);
    if(target.id==='journal-record')return (owner.nexusJournal||[]).some(item=>item.id===target.key);
    return true;
  }
  let busy=false,editing=null,monitor=null;
  const frequency=$('automationFrequency'),interval=$('automationInterval');
  const frequencies=[0,5,15,30];
  function monitorDesktop(){
    clearInterval(monitor);monitor=null;
    const minutes=state().minutes;
    if(!frequencies.includes(minutes)||!minutes||$('desktop').hidden||document.hidden)return;
    monitor=setInterval(()=>{
      if(document.hidden||$('desktop').hidden||busy)return;
      render();
    },minutes*60000);
  }
  const submit=form.querySelector('button'),cancel=$('automationCancelEdit');
  function clearEditor(){
    editing=null;form.reset();submit.textContent='Guardar regla';cancel.hidden=true;
  }
  cancel.onclick=clearEditor;
  function node(parent,tag,text=''){
    const item=document.createElement(tag);item.textContent=text;parent.append(item);return item;
  }
  function button(parent,label,fn){
    const item=node(parent,'button',label);item.type='button';item.className='secondary';item.disabled=busy;item.onclick=fn;return item;
  }
  function render(){
    const {rules,history}=state(),host=$('automationRules'),matches=$('automationMatches'),log=$('automationHistory');
    host.replaceChildren();matches.replaceChildren();log.replaceChildren();
    submit.disabled=busy;cancel.disabled=busy;frequency.querySelector('button').disabled=busy;$('automationRun').disabled=busy||rules.every(item=>item.paused);
    if(!rules.length)node(host,'p','Todavía no tienes reglas.');
    for(const rule of rules){
      const row=node(host,'div');
      node(row,'p',rule.name+' · '+types[rule.when]+' · '+actions[rule.then]+(rule.paused?' · Pausada':'')+(rule.condition?' · Contiene «'+rule.condition+'»':'')+(rule.priority?' · Prioridad '+rule.priority:''));
      button(row,rule.paused?'Reactivar '+rule.name:'Pausar '+rule.name,()=>{
        const current=state();
        void save({...current,rules:current.rules.map(item=>item.id===rule.id?{...item,paused:!item.paused}:item)},'Regla actualizada.');
      });
      button(row,'Editar '+rule.name,()=>{
        editing=rule.id;
        for(const key of ['name','condition','when','then','priority'])form.elements[key].value=rule[key]||'';
        submit.textContent='Guardar cambios de la regla';cancel.hidden=false;form.elements.name.focus();
      });
      button(row,'Eliminar '+rule.name,async()=>{
        if(!confirm('¿Eliminar esta regla?'))return;
        const current=state();
        if(await save({...current,rules:current.rules.filter(item=>item.id!==rule.id)},'Regla eliminada.')&&editing===rule.id)clearEditor();
      });
    }
    const found=evaluate(app.getState(),localDay());
    $('desktopAutomation').textContent=found.length?found.length+' coincidencias en tus reglas activas.':'Sin coincidencias en tus reglas activas.';
    for(const {rule,signal} of found){
      const row=node(matches,'article');
      node(row,'h4',rule.name+' · '+signal.title);
      node(row,'p',signal.detail);
      button(row,actions[rule.then],()=>{
        if(rule.then==='reminder')root.liftsReminders.open(signal.title.slice(0,240));
        else{
          const target=destination(signal);
          if(target&&available(target))root.liftsNexus.open(target);
          else status.textContent='El origen no está disponible en esta cuenta.';
        }
      });
    }
    if(!found.length)node(matches,'p','Sin coincidencias ahora.');
    const time=new Intl.DateTimeFormat('es-MX',{dateStyle:'short',timeStyle:'short'});
    const names=new Map(rules.map(rule=>[rule.id,rule.name]));
    const signals=new Map(radar.signals(app.getState(),localDay()).map(signal=>[signal.id,signal]));
    for(const item of history){
      const entry=node(log,'li',time.format(item.at)+' · '+item.total+' coincidencias en '+item.rules+' reglas activas');
      if(!item.matched?.length)continue;
      const detail=node(entry,'details');
      node(detail,'summary','Ver coincidencias de esta revisión');
      for(const match of item.matched){
        const signal=signals.get(match.event);
        node(detail,'p',(names.get(match.rule)||'Regla retirada')+' · '+(signal?.title||match.title||match.event));
        const target=destination(signal)||root.liftsNexusCore.location(match.target?.id,match.target?.key);
        if(target&&available(target))button(detail,'Abrir registro de origen',()=>{
          if(available(target))root.liftsNexus.open(target);
          else status.textContent='El origen no está disponible en esta cuenta.';
        });
      }
    }
  }
  async function save(value,message){
    if(busy)return false;
    const owner=app.getState(),previous=owner.workspaceAutomations;
    owner.workspaceAutomations=value;busy=true;status.textContent='Guardando…';render();
    try{
      if(!await app.save())throw new Error();
      if(app.getState()===owner){status.textContent=message;return true;}
    }catch{
      if(app.getState()===owner){owner.workspaceAutomations=previous;status.textContent='No se pudo guardar. Intenta de nuevo.';}
    }finally{
      if(app.getState()===owner){busy=false;render();monitorDesktop();}
    }
    return false;
  }
  form.onsubmit=async event=>{
    event.preventDefault();
    if(busy)return;
    const current=state();
    try{
      if(!editing&&current.rules.length>=30)throw new Error('El espacio admite hasta 30 reglas.');
      const item=define(Object.fromEntries(new FormData(form)),editing||crypto.randomUUID());
      const rules=editing?current.rules.map(rule=>rule.id===editing?{...item,paused:rule.paused}:rule):[...current.rules,item];
      if(await save({...current,rules},'Regla guardada.'))clearEditor();
    }catch(error){status.textContent=error.message;}
  };
  $('automationRun').onclick=()=>{
    const current=state(),matches=evaluate(app.getState(),localDay());
    const item={at:Date.now(),total:matches.length,rules:current.rules.filter(rule=>!rule.paused).length,matched:matches.map(({rule,signal})=>({rule:rule.id,event:signal.id,title:signal.title,target:destination(signal)}))};
    void save({...current,history:[item,...current.history].slice(0,50)},'Revisión guardada.');
  };
  frequency.onsubmit=async event=>{
    event.preventDefault();
    const minutes=Number(interval.value);
    if(!frequencies.includes(minutes))return;
    if(!await save({...state(),minutes},'Frecuencia guardada.'))interval.value=String(state().minutes||0);
  };
  $('desktopOpenAutomation').onclick=()=>{
    app.open('operations');$('automationPanel').open=true;$('automationPanel').querySelector('summary').focus();
  };
  function reset(){busy=false;clearEditor();interval.value=String(state().minutes||0);status.textContent='';$('automationPanel').open=false;render();monitorDesktop();}
  root.addEventListener('nexo-state',reset);
  root.addEventListener('lifts-page',event=>{
    if(['operations','desktop'].includes(event.detail.page)){interval.value=String(state().minutes||0);render();}
    monitorDesktop();
  });
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden&&!$('desktop').hidden)render();
    monitorDesktop();
  });
  root.liftsAutomations={reset};
  render();
})(globalThis);
