'use strict';
(function(root){
  const categories={material:'Material',ink:'Tinta',anilox:'Anilox',plate:'Placa',die:'Suaje'};
  const blank=()=>({machines:[],stock:[],orders:[],rules:[]});
  const clean=(v,max=120)=>String(v??'').trim().slice(0,max);
  const machineParameters={
    webWidth:'Ancho útil de banda (mm)',
    maxSpeed:'Velocidad máxima documentada (m/min)',
    stations:'Estaciones de impresión'
  };
  function machineSpecs(raw){
    const output={};
    for(const [key,label] of Object.entries(machineParameters)){
      const text=clean(raw[key],24);
      if(!text)continue;
      const value=Number(text.replace(',','.'));
      if(!/^\d{1,6}(?:[.,]\d{1,3})?$/.test(text)||value<=0||key==='stations'&&!Number.isInteger(value)){
        throw new Error('Revisa '+label.toLowerCase()+'. Introduce un valor positivo con la unidad indicada.');
      }
      output[key]=value;
    }
    const reference=clean(raw.parameterSource,500);
    if(Object.keys(output).length&&!reference)throw new Error('Indica la referencia técnica o el método de medición de los parámetros.');
    return {parameters:output,parameterSource:reference};
  }
  const componentTypes={estacion:'Estación de impresión',rodillo:'Rodillo',anilox:'Anilox',cilindro:'Cilindro',
    engrane:'Engranaje',suaje:'Suaje',yunque:'Yunque',secado:'Sistema de secado',servicio:'Componente de mantenimiento'};
  function machinePath(raw){
    const lines=clean(raw,3000).split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
    if(lines.length<2||lines.length>24)throw new Error('Registra de 2 a 24 componentes, uno por línea.');
    const componentKinds=[];
    const path=lines.map(line=>{
      const typed=/^\[([a-z]+)\]\s+(.+)$/.exec(line);
      const kind=typed&&Object.hasOwn(componentTypes,typed[1])?typed[1]:'';
      componentKinds.push(kind);
      return clean(kind?typed[2]:line,100);
    });
    return {path,componentKinds};
  }
  function change(space,kind,raw,id){
    if(!Object.hasOwn(blank(),kind))throw new Error('Categoría de registro inválida.');
    const name=clean(raw.name);
    if(!name)throw new Error('Escribe un nombre o código.');
    const prior=space[kind].find(item=>item.id===id);
    if(id&&!prior)throw new Error('Registro no disponible.');
    if(space[kind].some(item=>item.id!==id&&item.name.localeCompare(name,'es',{sensitivity:'base'})===0))throw new Error('Ese nombre o código ya existe.');
    let data;
    if(kind==='machines'){
      data={...machinePath(raw.path),model:clean(raw.model),source:clean(raw.source,500),...machineSpecs(raw)};
    }else if(kind==='stock'){
      const amount=clean(raw.quantity),unit=clean(raw.unit,40);
      if(!Object.hasOwn(categories,raw.category)||amount&&(!/^\d{1,12}(?:[.,]\d{1,4})?$/.test(amount)||!unit)){
        throw new Error('Elige la categoría. Para registrar cantidad, indica un número no negativo y su unidad.');
      }
      if(prior&&prior.category!==raw.category&&space.orders.some(order=>Object.values(order.items).includes(id)))throw new Error('Este artículo ya se usa en órdenes. Conserva su categoría.');
      data={category:raw.category,quantity:amount?Number(amount.replace(',','.')):null,unit,lot:clean(raw.lot)};
    }else if(kind==='orders'){
      if(!space.machines.some(item=>item.id===raw.machine))throw new Error('Elige una máquina registrada.');
      const items={};
      for(const key of Object.keys(categories)){
        if(!raw[key])continue;
        if(!space.stock.some(item=>item.id===raw[key]&&item.category===key))throw new Error('Artículo inválido para '+categories[key]+'.');
        items[key]=raw[key];
      }
      data={machine:raw.machine,items,note:clean(raw.note,500)};
    }else{
      const all=[...space.machines,...space.stock],reason=clean(raw.reason,500);
      if(raw.left===raw.right||!all.some(item=>item.id===raw.left)||!all.some(item=>item.id===raw.right)||!reason)throw new Error('Elige dos registros distintos y documenta el motivo.');
      if((all.find(item=>item.id===raw.left).category||'machine')===(all.find(item=>item.id===raw.right).category||'machine'))throw new Error('Una orden admite un solo registro por categoría. Elige categorías distintas.');
      if(space.rules.some(rule=>rule.id!==id&&[rule.left,rule.right].includes(raw.left)&&[rule.left,rule.right].includes(raw.right)))throw new Error('Ya existe una regla para ese par.');
      data={left:raw.left,right:raw.right,reason,active:raw.active!=='no'};
    }
    const item={id:id||crypto.randomUUID(),name,...data};
    return {item,space:{...space,[kind]:id?space[kind].map(current=>current.id===id?item:current):[...space[kind],item]}};
  }
  function assess(space,order){
    const all=new Map([...space.machines,...space.stock].map(item=>[item.id,item]));
    const chosen=new Set([order.machine,...Object.values(order.items)]);
    const active=space.rules.filter(rule=>rule.active!==false);
    return {
      violations:active.filter(rule=>chosen.has(rule.left)&&chosen.has(rule.right)&&all.has(rule.left)&&all.has(rule.right))
        .map(rule=>({...rule,leftName:all.get(rule.left).name,rightName:all.get(rule.right).name})),
      missing:Object.keys(categories).filter(key=>!all.has(order.items[key])).map(key=>categories[key]),
      ruleCount:active.length
    };
  }
  function trace(space,id){
    const order=space.orders.find(item=>item.id===id);
    const machine=space.machines.find(item=>item.id===order?.machine);
    if(!order||!machine)return null;
    const out={orderLink:order.id,order:order.name,machine:[machine.name,machine.model].filter(Boolean).join(' · ')};
    for(const key of Object.keys(categories)){
      const item=space.stock.find(entry=>entry.id===order.items[key]&&entry.category===key);
      out[key]=item?[item.name,item.lot].filter(Boolean).join(' · '):'';
    }
    return out;
  }
  const api={blank,categories,machineParameters,componentTypes,change,assess,trace};
  if(typeof module==='object')module.exports=api;else root.liftsIndustrialCore=api;
})(globalThis);
