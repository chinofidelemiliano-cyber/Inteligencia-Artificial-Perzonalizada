'use strict';
(function(root){
  const radar=typeof module==='object'?require('./personal-radar.js'):root.liftsRadar;
  const types={task:'Tarea vencida',calibration:'Calibración próxima',budget:'Presupuesto excedido',review:'Repaso previsto'};
  const actions={open:'Abrir el origen',reminder:'Preparar un recordatorio'};
  const normalize=value=>String(value||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
  function define(raw,id){
    const name=String(raw.name||'').trim(),condition=String(raw.condition||'').trim();
    if(!name||name.length>80||condition.length>80||!Object.hasOwn(types,raw.when)||!Object.hasOwn(actions,raw.then)){
      throw new Error('Revisa el nombre, el evento, la condición y la acción.');
    }
    return {id,name,condition,when:raw.when,then:raw.then,paused:false};
  }
  function evaluate(state,day){
    const signals=radar.signals(state,day).filter(item=>{
      const saved=state.personalRadar?.[item.id];
      return saved?.status!=='resolved'&&(saved?.status!=='snoozed'||saved.until<=day);
    });
    const calibrations=new Set((state.nexusJournal||[]).filter(item=>item.kind==='calibration').map(item=>item.id));
    const event=signal=>signal.id.startsWith('record:')?(calibrations.has(signal.destination.key)?'calibration':''):signal.id.split(':')[0];
    return (state.workspaceAutomations?.rules||[]).filter(rule=>!rule.paused).flatMap(rule=>signals.filter(signal=>
      rule.when===event(signal)&&normalize(signal.title+' '+signal.detail).includes(normalize(rule.condition))
    ).slice(0,5).map(signal=>({rule,signal})));
  }
  if(typeof module==='object'){module.exports={define,evaluate};return;}
  const $=id=>document.getElementById(id),app=root.liftsWorkspace,form=$('automationForm'),status=$('automationStatus');
  const state=()=>app.getState().workspaceAutomations||{rules:[],history:[]};
  const localDay=()=>root.liftsWork.localDate(new Date());
  let busy=false;
  function node(parent,tag,text=''){
    const item=document.createElement(tag);item.textContent=text;parent.append(item);return item;
  }
  function button(parent,label,fn){
    const item=node(parent,'button',label);item.type='button';item.className='secondary';item.disabled=busy;item.onclick=fn;return item;
  }
  function render(){
    const {rules,history}=state(),host=$('automationRules'),matches=$('automationMatches'),log=$('automationHistory');
    host.replaceChildren();matches.replaceChildren();log.replaceChildren();
    form.querySelector('button').disabled=busy;$('automationRun').disabled=busy||rules.every(item=>item.paused);
    if(!rules.length)node(host,'p','Todavía no tienes reglas.');
    for(const rule of rules){
      const row=node(host,'div');
      node(row,'p',rule.name+' · '+types[rule.when]+' · '+actions[rule.then]+(rule.paused?' · Pausada':'')+(rule.condition?' · Contiene «'+rule.condition+'»':''));
      button(row,rule.paused?'Reactivar '+rule.name:'Pausar '+rule.name,()=>{
        const current=state();
        void save({...current,rules:current.rules.map(item=>item.id===rule.id?{...item,paused:!item.paused}:item)},'Regla actualizada.');
      });
      button(row,'Eliminar '+rule.name,()=>{
        if(!confirm('¿Eliminar esta regla?'))return;
        const current=state();
        void save({...current,rules:current.rules.filter(item=>item.id!==rule.id)},'Regla eliminada.');
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
        else if(signal.destination.page)app.open(signal.destination.id);
        else root.liftsNexus.open(signal.destination);
      });
    }
    if(!found.length)node(matches,'p','Sin coincidencias ahora.');
    for(const item of history)node(log,'li',new Intl.DateTimeFormat('es-MX',{dateStyle:'short',timeStyle:'short'}).format(item.at)+' · '+item.total+' coincidencias en '+item.rules+' reglas activas');
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
      if(app.getState()===owner){busy=false;render();}
    }
    return false;
  }
  form.onsubmit=async event=>{
    event.preventDefault();
    if(busy)return;
    const current=state();
    try{
      if(current.rules.length>=30)throw new Error('El espacio admite hasta 30 reglas.');
      const item=define(Object.fromEntries(new FormData(form)),crypto.randomUUID());
      if(await save({...current,rules:[...current.rules,item]},'Regla guardada.'))form.reset();
    }catch(error){status.textContent=error.message;}
  };
  $('automationRun').onclick=()=>{
    const current=state(),matches=evaluate(app.getState(),localDay());
    const item={at:Date.now(),total:matches.length,rules:current.rules.filter(rule=>!rule.paused).length};
    void save({...current,history:[item,...current.history].slice(0,50)},'Revisión guardada.');
  };
  $('desktopOpenAutomation').onclick=()=>{
    app.open('operations');$('automationPanel').open=true;$('automationPanel').querySelector('summary').focus();
  };
  function reset(){busy=false;form.reset();status.textContent='';$('automationPanel').open=false;render();}
  root.addEventListener('nexo-state',reset);
  root.addEventListener('lifts-page',event=>{if(['operations','desktop'].includes(event.detail.page))render();});
  root.liftsAutomations={reset};
  render();
})(globalThis);
