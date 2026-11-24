'use strict';
(function(root){
  const trim=(value,max=120)=>typeof value==='string'?value.trim().slice(0,max):'';
  const nameKey=value=>value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
  function addNode(map,raw,id=crypto.randomUUID()){
    const name=trim(raw.name);
    if(!name||map.nodes.some(node=>nameKey(node.name)===nameKey(name)))throw new Error('Escribe un nombre de variable distinto.');
    if(map.nodes.length>=20)throw new Error('Cada mapa admite hasta 20 variables.');
    return {...map,nodes:[...map.nodes,{id,name,bottleneck:raw.bottleneck===true,notes:trim(raw.notes,500)}]};
  }
  function addEdge(map,raw,id=crypto.randomUUID()){
    if(raw.from===raw.to||![raw.from,raw.to].every(value=>map.nodes.some(node=>node.id===value)))throw new Error('Elige dos variables distintas del mapa.');
    if(map.edges.some(edge=>edge.from===raw.from&&edge.to===raw.to)||map.edges.length>=55)throw new Error('La relación ya existe o alcanzaste 55 relaciones.');
    const label=trim(raw.label),evidence=trim(raw.evidence,500),lag=trim(raw.lag,16);
    if(!label||!['positive','negative','unknown'].includes(raw.sign)||!['hypothesis','observed'].includes(raw.status))throw new Error('Describe la relación y elige dirección y estado.');
    if(raw.status==='observed'&&!evidence)throw new Error('Escribe la evidencia de la observación.');
    if(lag&&!/^\d{1,6}(?:[.,]\d{1,2})?$/.test(lag))throw new Error('Registra las horas como número no negativo o deja el retraso sin medir.');
    return {...map,edges:[...map.edges,{id,from:raw.from,to:raw.to,label,sign:raw.sign,status:raw.status,evidence,lag:lag?Number(lag.replace(',','.')):null}]};
  }
  function graph(map){
    const outgoing=new Map(map.nodes.map(node=>[node.id,[]]));
    for(const edge of map.edges)outgoing.get(edge.from)?.push(edge);
    return outgoing;
  }
  function cycles(map){
    const outgoing=graph(map),visited=new Set(),stack=[],results=[];
    function walk(id){
      visited.add(id);stack.push(id);
      for(const edge of outgoing.get(id)||[]){
        const at=stack.indexOf(edge.to);
        if(at>=0&&results.length<8)results.push([...stack.slice(at),edge.to]);
        else if(!visited.has(edge.to))walk(edge.to);
      }
      stack.pop();
    }
    for(const item of map.nodes)if(!visited.has(item.id))walk(item.id);
    return results;
  }
  function downstream(map,source){
    if(!map.nodes.some(node=>node.id===source))return [];
    const outgoing=graph(map);
    const found=new Map([[source,{id:source,steps:0,lag:0,hypothesis:false}]]);
    for(const previous of found.values()){
      for(const edge of outgoing.get(previous.id)||[]){
        if(found.has(edge.to))continue;
        found.set(edge.to,{id:edge.to,steps:previous.steps+1,lag:previous.lag===null||edge.lag===null?null:previous.lag+edge.lag,
          hypothesis:previous.hypothesis||edge.status!=='observed'});
      }
    }
    return [...found.values()].slice(1);
  }
  const core={addNode,addEdge,cycles,downstream};
  if(typeof module==='object'){module.exports=core;return;}

  const $=id=>document.getElementById(id), app=root.liftsWorkspace;
  const stored=()=>app.getState().systemsMaps||[];
  const picker=$('systemsPick'), name=$('systemsTitle'), diagram=$('systemsDiagram'), list=$('systemsComponents'), result=$('systemsResults'), message=$('systemsStatus');
  let draft,selected='',busy=false,pending=false;
  const empty=()=>({id:crypto.randomUUID(),name:'',nodes:[],edges:[]});
  const find=id=>draft.nodes.find(node=>node.id===id)?.name||'Variable';
  function node(parent,tag,label){
    const element=document.createElement(tag);element.textContent=label||'';parent.append(element);return element;
  }
  function button(parent,label,onClick){
    const el=node(parent,'button',label);el.type='button';el.className='secondary';el.onclick=onClick;return el;
  }
  function svg(parent,tag,attributes,content=''){
    const element=document.createElementNS('http://www.w3.org/2000/svg',tag);
    for(const [key,value] of Object.entries(attributes))element.setAttribute(key,value);
    if(content)element.textContent=content;
    parent.append(element);return element;
  }
  function fillOptions(target,values,blank='Selecciona una variable'){
    const prior=target.value;
    target.replaceChildren();
    node(target,'option',blank).value='';
    for(const item of values)node(target,'option',item.name).value=item.id;
    if(values.some(item=>item.id===prior))target.value=prior;
  }
  function updateMaps(){fillOptions(picker,stored(),'Mapa nuevo');picker.value=selected;}
  function render(){
    fillOptions($('systemsFrom'),draft.nodes);fillOptions($('systemsTo'),draft.nodes);fillOptions($('systemsTrace'),draft.nodes);
    list.replaceChildren();diagram.replaceChildren();
    const view=svg(diagram,'svg',{viewBox:'0 0 560 430',role:'img','aria-label':'Diagrama de las variables y relaciones registradas'});
    const marker=svg(svg(view,'defs',{}),'marker',{id:'systems-arrow',markerWidth:8,markerHeight:8,refX:7,refY:4,orient:'auto'});
    svg(marker,'path',{d:'M0 0 L8 4 L0 8 Z',fill:'#7494aa'});
    const positions=new Map(draft.nodes.map((item,index)=>{
      const angle=(index/Math.max(1,draft.nodes.length))*Math.PI*2-Math.PI/2;
      const radius=draft.nodes.length===1?0:1;
      return [item.id,[280+204*Math.cos(angle)*radius,215+157*Math.sin(angle)*radius]];
    }));
    for(const edge of draft.edges){
      const [x,y]=positions.get(edge.from),[tx,ty]=positions.get(edge.to),distance=Math.hypot(tx-x,ty-y);
      const dx=(tx-x)/distance,dy=(ty-y)/distance;
      const mx=(x+tx)/2-dy*28,my=(y+ty)/2+dx*28;
      const path=svg(view,'path',{d:'M '+(x+dx*22)+' '+(y+dy*22)+' Q '+mx+' '+my+' '+(tx-dx*30)+' '+(ty-dy*30),stroke:'#7494aa','stroke-width':2,fill:'none','marker-end':'url(#systems-arrow)',...(edge.status==='hypothesis'?{'stroke-dasharray':'6 4'}:{})});
      svg(path,'title',{},edge.label);
    }
    draft.nodes.forEach((item,index)=>{
      const [cx,cy]=positions.get(item.id);
      const circle=svg(view,'circle',{cx,cy,r:22,fill:item.bottleneck?'#de6396':'#103349',stroke:'#20d9f5','stroke-width':2});
      svg(circle,'title',{},item.name);
      svg(view,'text',{x:cx,y:cy+5,'text-anchor':'middle',fill:'#edf5ff','font-size':'13'},String(index+1));
      const row=node(list,'li',(index+1)+'. '+item.name+(item.bottleneck?' · Cuello de botella marcado':''));
      if(item.notes)node(row,'p',item.notes);
      button(row,'Quitar '+item.name,()=>{
        if(busy||pending||!confirm('¿Quitar esta variable y sus relaciones del borrador?'))return;
        draft={...draft,nodes:draft.nodes.filter(node=>node.id!==item.id),edges:draft.edges.filter(edge=>edge.from!==item.id&&edge.to!==item.id)};
        render();
      });
    });
    const relations=$('systemsLinks');
    relations.replaceChildren();
    for(const edge of draft.edges){
      const row=node(relations,'li',find(edge.from)+' → '+find(edge.to)+' · '+edge.label+' · '+{positive:'Aumenta',negative:'Disminuye',unknown:'Efecto sin determinar'}[edge.sign]+
        ' · '+(edge.status==='hypothesis'?'Hipótesis':'Observación registrada')+' · '+(edge.lag===null?'Retraso sin medir':edge.lag+' h'));
      if(edge.evidence)node(row,'p',edge.evidence);
      button(row,'Quitar relación '+edge.label,()=>{
        if(busy||pending)return;
        draft={...draft,edges:draft.edges.filter(item=>item.id!==edge.id)};render();
      });
    }
    result.replaceChildren();
    for(const loop of cycles(draft))node(result,'p','Ciclo registrado: '+loop.map(find).join(' → '));
    if(!result.childElementCount)node(result,'p','Sin ciclos detectados en las relaciones dibujadas.');
    const selected=$('systemsTrace').value;
    if(selected){
      const paths=downstream(draft,selected);
      for(const item of paths)node(result,'p',find(item.id)+' · '+(item.steps===1?'Consecuencia directa':'Alcanzable en '+item.steps+' relaciones')+
        ' · '+(item.lag===null?'Retraso sin medir':item.lag+' h en la ruta más corta')+' · '+(item.hypothesis?'Incluye hipótesis':'Relaciones observadas'));
    }
  }
  function guarded(event,run){
    event.preventDefault();if(busy||pending)return;
    try{run(Object.fromEntries(new FormData(event.currentTarget)));event.currentTarget.reset();message.textContent='Borrador actualizado. Guarda el mapa para conservarlo.';render();}
    catch(error){message.textContent=error.message;}
  }
  $('systemsNode').onsubmit=event=>guarded(event,data=>{draft=addNode(draft,{...data,bottleneck:data.bottleneck==='on'});});
  $('systemsEdge').onsubmit=event=>guarded(event,data=>{draft=addEdge(draft,data);});
  $('systemsTrace').onchange=render;
  picker.onchange=()=>{
    if(busy||pending){picker.value=selected;return;}
    selected=picker.value;
    draft=structuredClone(stored().find(item=>item.id===selected)||empty());
    name.value=draft.name;
    $('systemsNode').reset();$('systemsEdge').reset();message.textContent='';render();
  };
  async function persist(){
    if(busy)return;
    const owner=app.getState();busy=true;pending=true;$('systemsRetry').hidden=true;message.textContent='Guardando…';
    try{
      if(!await app.save())throw new Error();
      if(app.getState()===owner){pending=false;message.textContent='Mapa guardado.';}
    }catch{
      if(app.getState()===owner){message.textContent='El mapa sigue en esta sesión. Reintenta guardarlo.';$('systemsRetry').hidden=false;}
    }finally{if(app.getState()===owner)busy=false;}
  }
  $('systemsSave').onclick=()=>{
    if(busy||pending)return;
    const title=trim(name.value,100);
    if(!title||!draft.nodes.length){message.textContent='Escribe un título y agrega al menos una variable.';return;}
    if(!selected&&stored().length>=30){message.textContent='Se alcanzó el límite de 30 mapas.';return;}
    draft={...draft,name:title};const value=structuredClone(draft);
    app.getState().systemsMaps=selected?stored().map(item=>item.id===selected?value:item):[value,...stored()];
    selected=value.id;updateMaps();void persist();
  };
  $('systemsRetry').onclick=()=>{if(pending)void persist();};
  function reset(){
    selected='';busy=pending=false;draft=empty();name.value='';message.textContent='';
    $('systemsRetry').hidden=true;$('systemsNode').reset();$('systemsEdge').reset();$('systemsTrace').value='';
    updateMaps();render();
  }
  root.liftsSystems={reset};
  root.addEventListener('nexo-state',reset);
  reset();
})(globalThis);
