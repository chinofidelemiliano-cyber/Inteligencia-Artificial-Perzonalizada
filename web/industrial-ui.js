'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const api=window.liftsWorkspace, core=window.liftsIndustrialCore;
  const space=()=>api.getState().industrial||core.blank();
  const form=$('industrialForm'), mode=$('industrialKind'), list=$('industrialList'), status=$('industrialStatus'), visual=$('industrialVisual');
  const labels={machines:'Máquinas y recorridos',stock:'Inventario industrial',orders:'Órdenes internas',rules:'Matriz y reglas de compatibilidad'};
  let current='',epoch=0,busy=false;
  function node(parent,tag,text){
    const el=document.createElement(tag);if(text!==undefined)el.textContent=text;parent.append(el);return el;
  }
  function button(parent,label,action){
    const el=node(parent,'button',label);el.type='button';el.className='secondary';el.onclick=action;return el;
  }
  function choices(el,options){
    for(const [id,name] of options){const entry=node(el,'option',name);entry.value=id;}
  }
  function field(label,key,value='',options=null,tag='input'){
    const wrap=node(form,'label',label), el=node(wrap,options?'select':tag);
    el.name=key;el.setAttribute('aria-label',label);
    if(options)choices(el,[['','Por seleccionar'],...options]);
    else el.maxLength=tag==='textarea'?2400:120;
    el.value=value??'';return el;
  }
  function svg(parent,tag,attrs,label){
    const el=document.createElementNS('http://www.w3.org/2000/svg',tag);
    for(const [key,value] of Object.entries(attrs))el.setAttribute(key,value);
    if(label!==undefined)el.textContent=label;
    parent.append(el);
  }
  function draw(machine){
    const wrapper=node(visual,'div');wrapper.className='industrial-diagram';
    const diagram=document.createElementNS('http://www.w3.org/2000/svg','svg');
    diagram.setAttribute('width',machine.path.length*164);diagram.setAttribute('height',94);
    diagram.setAttribute('role','img');diagram.setAttribute('aria-label','Secuencia registrada: '+machine.path.join(' → '));
    wrapper.append(diagram);
    machine.path.forEach((name,index)=>{
      const x=index*164;
      if(index)svg(diagram,'path',{d:'M '+(x-24)+' 47 H '+(x-1)+' m -7 -5 l 7 5 -7 5',fill:'none',stroke:'currentColor'});
      svg(diagram,'rect',{x,y:20,width:140,height:54,rx:12,fill:'#103349',stroke:'#20d9f5'});
      svg(diagram,'text',{x:x+70,y:51,'text-anchor':'middle',fill:'#edf5ff'},(index+1)+'. '+(name.length>12?name.slice(0,12)+'…':name));
    });
    const detail=node(visual,'p','Selecciona un paso para ver el nombre completo.');
    detail.setAttribute('role','status');
    const actions=node(visual,'div');actions.className='evolution-controls';
    machine.path.forEach((name,index)=>button(actions,'Paso '+(index+1),()=>{
      const type=core.componentTypes[machine.componentKinds?.[index]];
      detail.textContent=(index+1)+'. '+name+(type?' · '+type:'');
    }));
    if(machine.source)node(visual,'p','Referencia registrada: '+machine.source);
  }
  function inspect(kind,item){
    visual.replaceChildren();
    if(!item)return;
    node(visual,'h4',item.name);
    if(kind==='machines'){
      draw(item);
      const specs=Object.entries(core.machineParameters).filter(([key])=>Number.isFinite(item.parameters?.[key]));
      if(specs.length){
        const list=node(visual,'dl');
        const format=new Intl.NumberFormat('es-MX',{maximumFractionDigits:3});
        for(const [key,label] of specs){node(list,'dt',label);node(list,'dd',format.format(item.parameters[key]));}
        node(visual,'p','Referencia de parámetros: '+item.parameterSource);
      }
    }
    if(kind==='machines'){
      const cases=window.liftsDiagnostics?.casesForMachine(item.id)||[];
      if(cases.length)node(visual,'h4','Diagnósticos vinculados a la máquina');
      for(const linked of cases)button(visual,linked.data.name,()=>window.liftsNexus.open({id:'diagnostic-record',key:linked.id}));
    }
    if(['machines','stock'].includes(kind)){
      button(visual,'Preparar QR privado',()=>window.liftsFieldLinks.prepare(kind,item.id));
      button(visual,'Preparar mantenimiento',()=>window.liftsJournal.prepareDraft('maintenance',{
        title:('Mantenimiento de '+item.name).slice(0,100),asset:kind+':'+item.id
      }));
      const maintenance=(api.getState().nexusJournal||[]).filter(row=>row.kind==='maintenance'&&row.data.asset===kind+':'+item.id);
      if(maintenance.length)node(visual,'h4','Historial de mantenimiento');
      for(const row of maintenance)button(visual,row.title,()=>window.liftsNexus.open({id:'journal-record',key:row.id}));
    }
    if(kind==='rules'){
      node(visual,'p',(item.active===false?'Regla inactiva':'Regla activa')+' · '+core.compatibilityStates[item.compatibility||'incompatible']);
      if(item.compatibilitySource)node(visual,'p','Fuente: '+item.compatibilitySource);
      if(item.conditions)node(visual,'p','Condiciones: '+item.conditions);
    }
    if(kind!=='orders')return;
    const result=core.assess(space(),item);
    node(visual,'p',result.violations.length?'Incompatibilidades según las reglas registradas:':result.ruleCount?'Ninguna regla registrada coincide con esta combinación.':'Aún no hay reglas configuradas.');
    for(const rule of result.violations)node(visual,'p',rule.leftName+' + '+rule.rightName+' — '+rule.reason);
    if(result.missing.length)node(visual,'p','Sin asignar: '+result.missing.join(', ')+'.');
    node(visual,'p','Contrasta los resultados con las especificaciones aplicables antes de liberar la orden.');
    const cases=window.liftsDiagnostics?.casesForOrder(item.id)||[];
    node(visual,'h4','Casos vinculados');
    if(!cases.length)node(visual,'p','Todavía no hay casos vinculados a esta orden.');
    for(const linked of cases)button(visual,linked.data.name,()=>window.liftsNexus.open({id:'diagnostic-record',key:linked.id}));
  }
  function render(){
    const kind=mode.value,data=space(),item=data[kind].find(entry=>entry.id===current);
    const options=items=>items.map(entry=>[entry.id,entry.name]);
    form.replaceChildren();list.replaceChildren();
    field('Nombre o código industrial','name',item?.name).required=true;
    if(kind==='machines'){
      field('Modelo de máquina','model',item?.model);
      field('Referencia del recorrido','source',item?.source);
      for(const [key,label] of Object.entries(core.machineParameters)){
        field(label,key,item?.parameters?.[key]).inputMode=key==='stations'?'numeric':'decimal';
      }
      field('Referencia o método de medición de los parámetros','parameterSource',item?.parameterSource,null,'textarea');
      const typed=item?.path.map((name,index)=>item.componentKinds?.[index]?'['+item.componentKinds[index]+'] '+name:name);
      const path=field('Componentes en orden (uno por línea)','path',typed?.join('\n'),null,'textarea');
      path.maxLength=3000;
      node(form,'p','Tipos opcionales: [estacion], [rodillo], [anilox], [cilindro], [engrane], [suaje], [yunque], [secado] y [servicio]. Ejemplo: [rodillo] Entrada.');

    }else if(kind==='stock'){
      field('Categoría industrial','category',item?.category,Object.entries(core.categories));
      field('Cantidad disponible','quantity',item?.quantity);
      field('Unidad de inventario','unit',item?.unit);
      field('Lote de inventario','lot',item?.lot);
    }else if(kind==='orders'){
      field('Máquina registrada','machine',item?.machine,options(data.machines));
      for(const [key,label] of Object.entries(core.categories))field(label+' de la orden',key,item?.items[key],options(data.stock.filter(entry=>entry.category===key)));
      field('Notas de la orden','note',item?.note,null,'textarea');
    }else{
      const subjects=options([...data.machines,...data.stock]);
      field('Primer registro','left',item?.left,subjects);field('Segundo registro','right',item?.right,subjects);
      field('Motivo o referencia de la regla','reason',item?.reason,null,'textarea');
      field('Estado de compatibilidad','compatibility',item?.compatibility||'incompatible',Object.entries(core.compatibilityStates)).required=true;
      field('Fuente técnica de compatibilidad','compatibilitySource',item?.compatibilitySource,null,'textarea');
      field('Condiciones de aplicación','conditions',item?.conditions,null,'textarea');
      field('Aplicar regla a las órdenes','active',item?.active===false?'no':'yes',[['yes','Activa'],['no','Inactiva']]).required=true;
    }
    node(form,'button','Guardar registro industrial').type='submit';
    if(item)button(form,'Nuevo registro industrial',()=>{current='';render();});
    if(!data[kind].length)node(list,'p','Todavía no hay registros en esta categoría.');
    for(const entry of data[kind])button(list,'Abrir '+entry.name,()=>{current=entry.id;render();});
    inspect(kind,item);
  }
  async function persist(){
    const version=epoch;busy=true;
    $('industrialRetry').hidden=true;status.textContent='Guardando…';
    try{
      if(!await api.save())throw new Error();
      if(version===epoch)status.textContent='Registro industrial guardado.';
    }catch{
      if(version===epoch){status.textContent='El cambio quedó en esta sesión. Reintenta antes de salir.';$('industrialRetry').hidden=false;}
    }finally{if(version===epoch)busy=false;}
  }
  $('industrialRetry').onclick=()=>{if(!busy)void persist();};
  form.onsubmit=event=>{
    event.preventDefault();if(busy)return;
    try{
      const updated=core.change(space(),mode.value,Object.fromEntries(new FormData(form)),current);
      api.getState().industrial=updated.space;
      current=updated.item.id;render();refreshOrders();refreshPairs();pairResult.replaceChildren();void persist();
    }catch(error){status.textContent=error.message;}
  };
  function refreshOrders(){
    const picker=$('diagnosticOrderPick'), selected=picker.value;
    picker.replaceChildren();
    choices(picker,[['','Selecciona una orden interna'],...space().orders.map(item=>[item.id,item.name])]);
    if(space().orders.some(item=>item.id===selected))picker.value=selected;
  }
  const pairForm=$('compatibilityPair'),pairResult=$('compatibilityResult');
  function refreshPairs(){
    const data=space(),list=[['','Selecciona un activo'],...[...data.machines,...data.stock].map(item=>[item.id,item.name])];
    for(const select of pairForm.querySelectorAll('select')){
      const prior=select.value;select.replaceChildren();choices(select,list);
      if(list.some(([key])=>key===prior))select.value=prior;
    }
  }
  pairForm.onchange=()=>pairResult.replaceChildren();
  pairForm.onsubmit=event=>{
    event.preventDefault();pairResult.replaceChildren();
    try{
      const {left,right}=Object.fromEntries(new FormData(pairForm));
      const result=core.comparePair(space(),left,right),rule=result.rule;
      node(pairResult,'p',result.leftName+' + '+result.rightName+' · '+core.compatibilityStates[result.status]);
      if(rule){
        node(pairResult,'p',rule.reason);
        if(rule.compatibilitySource)node(pairResult,'p','Fuente: '+rule.compatibilitySource);
        if(rule.conditions)node(pairResult,'p','Condiciones: '+rule.conditions);
      }else node(pairResult,'p','No hay una regla activa registrada para este par.');
    }catch(error){node(pairResult,'p',error.message);}
  };
  choices(mode,Object.entries(labels));
  mode.onchange=()=>{current='';render();};
  $('diagnosticImportOrder').onclick=()=>{
    const source=core.trace(space(),$('diagnosticOrderPick').value);
    if(source)window.liftsDiagnostics.applyOrder(source);
    else $('diagnosticStatus').textContent='Selecciona una orden guardada.';
  };
  function reset(){
    epoch++;busy=false;current='';mode.value='machines';status.textContent='';
    $('industrialRetry').hidden=true;$('industrialPanel').open=false;
    pairForm.reset();pairResult.replaceChildren();render();refreshOrders();refreshPairs();
  }
  function openOrder(id){
    if(!space().orders.some(item=>item.id===id))return false;
    api.open('engineering');if($('engineering').hidden)return false;
    $('industrialPanel').open=true;mode.value='orders';current=id;render();
    window.liftsNexus?.checkpoint('industrial-order-record',id,space().orders.find(item=>item.id===id).name);
    $('industrialPanel').scrollIntoView({block:'start'});
    return true;
  }
  function openAsset(kind,id){
    if(!['machines','stock'].includes(kind)||!space()[kind].some(item=>item.id===id))return false;
    api.open('engineering');
    if($('engineering').hidden)return false;
    $('industrialPanel').open=true;mode.value=kind;current=id;render();
    $('industrialPanel').scrollIntoView({block:'start'});
    return true;
  }
  window.liftsIndustrial={reset,openOrder,openAsset};
  window.addEventListener('nexo-state',reset);
  window.addEventListener('lifts-page',event=>{
    if(event.detail.page==='engineering')refreshPairs();
    if(event.detail.page==='engineering'&&mode.value==='orders')inspect('orders',space().orders.find(item=>item.id===current));
  });
  reset();
})();
