'use strict';
(() => {
  const api=window.liftsWorkspace, core=window.liftsBuilderCore;
  const $=id=>document.getElementById(id);
  const editor=$('builderEditor'), output=$('builderRun'), list=$('builderLibrary'), status=$('builderStatus'), fields=$('builderFields');
  let active='',busy=false,pending=false,currentTool=null,observed;
  const tools=()=>api.getState().builderTools||[];
  const node=(parent,tag,label)=>{
    const el=document.createElement(tag);
    if(label!==undefined)el.textContent=label;
    parent.append(el);return el;
  };
  function button(parent,label,run){
    const el=node(parent,'button',label);el.type='button';el.className='secondary';el.onclick=run;return el;
  }
  function control(parent,label,tag='input',name='',value=''){
    const wrap=node(parent,'label',label);
    const el=node(wrap,tag);el.name=name;el.value=value;return el;
  }
  function options(el,labels,selected){
    for(const [key,label] of Object.entries(labels)){const op=node(el,'option',label);op.value=key;}
    el.value=selected;
  }
  function addField(field={}){
    if(fields.childElementCount>=16)return;
    const row=node(fields,'fieldset');row.className='builder-field';node(row,'legend','Campo');
    control(row,'Código','input','key',field.key||'').maxLength=24;
    control(row,'Etiqueta','input','label',field.label||'').maxLength=60;
    const type=control(row,'Tipo','select','type');
    options(type,core.types,field.type||'text');
    const choices=control(row,'Opciones separadas por |','input','options',field.options?.join('|')||'');
    choices.maxLength=300;
    const sync=()=>{choices.parentElement.hidden=type.value!=='select';};
    type.onchange=sync;sync();
    button(row,'Quitar campo',()=>row.remove());
  }
  function seed(tool){
    editor.reset();fields.replaceChildren();output.replaceChildren();
    editor.elements.namedItem('name').value=tool?.name||'';
    editor.elements.namedItem('formula').value=tool?.formula||'';
    editor.elements.namedItem('unit').value=tool?.unit||'';
    editor.elements.namedItem('limit').value=tool?.limit||'';
    for(const field of tool?.fields||[{}])addField(field);
    currentTool=null;
  }
  function read(){
    return core.definition({...Object.fromEntries(new FormData(editor)),fields:[...fields.children].map(row=>
      Object.fromEntries([...row.querySelectorAll('[name]')].map(el=>[el.name,el.value])))});
  }
  function open(item,track=true){
    active=item.id;seed(item.spec);renderLibrary();preview(item.spec,item);
    window.liftsNexus?.checkpoint('builder-record',item.id,item.spec.name,track);
  }
  function openSaved(id){
    const item=tools().find(tool=>tool.id===id);
    if(!item)return false;
    api.open('builder');
    if($('builder').hidden)return false;
    open(item);return true;
  }
  function setItems(items){api.getState().builderTools=items;}
  async function save(){
    if(busy)return;
    const owner=api.getState();
    busy=true;pending=true;$('builderRetry').hidden=true;status.textContent='Guardando…';
    try{
      if(!await api.save())throw new Error();
      if(owner!==api.getState())return;
      pending=false;status.textContent='Cambios guardados.';
    }catch{
      if(owner===api.getState()){
        status.textContent='El cambio sigue en esta sesión. Reintenta guardarlo.';
        $('builderRetry').hidden=false;
      }
    }finally{if(owner===api.getState())busy=false;}
  }
  function renderLibrary(){
    list.replaceChildren();
    if(!tools().length)node(list,'p','Crea una herramienta o parte de una plantilla.');
    for(const item of tools()){
      const row=node(list,'div');row.className='evolution-controls';
      button(row,item.spec.name+(item.archived?' · archivada':''),()=>open(item));
      button(row,item.archived?'Reactivar '+item.spec.name:'Archivar '+item.spec.name,()=>{
        if(busy||pending)return;
        if(!item.archived&&!confirm('¿Archivar esta herramienta? Podrás reactivarla después.'))return;
        setItems(tools().map(tool=>tool.id===item.id?{...tool,archived:!tool.archived}:tool));
        if(active===item.id){active='';seed();}
        renderLibrary();void save();
      });
    }
  }
  function download(spec){
    const url=URL.createObjectURL(new Blob([JSON.stringify({format:'lifts-tool-v1',...spec},null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='lifts-herramienta.json';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  const formatResult=(number,unit)=>new Intl.NumberFormat('es-MX',{maximumSignificantDigits:10}).format(number)+(unit?' '+unit:'');
  function preview(spec,item=null){
    currentTool=spec;
    output.replaceChildren();
    node(output,'h3',spec.name);
    if(spec.formula)node(output,'code',spec.formula);
    const form=node(output,'form');
    const mapped={number:'number',money:'number',percent:'number',date:'date',time:'time',checkbox:'checkbox',text:'text'};
    for(const field of spec.fields){
      if(field.type==='select'){
        const select=control(form,field.label,'select',field.key);
        options(select,Object.fromEntries(field.options.map(choice=>[choice,choice])),field.options[0]);
      }else{
        const input=control(form,field.label,'input',field.key);
        input.type=mapped[field.type];input.step='any';input.maxLength=240;
        if(field.type==='checkbox')input.style.width='auto';
      }
    }
    const calculate=node(form,'button',spec.formula?'Calcular':'Revisar captura');calculate.type='submit';
    const result=node(form,'p');result.setAttribute('role','status');
    const allow=item&&!item.archived;
    const commit=allow?button(form,'Guardar captura',()=>{
      try{
        if(busy||pending)return;
        const checked=core.calculate(spec,Object.fromEntries(new FormData(form)));
        const latest=tools().find(tool=>tool.id===item.id);
        if(!latest||latest.archived||latest.spec!==spec)throw new Error('Vuelve a abrir la herramienta guardada.');
        if(latest.rows.length>=100)throw new Error('Se alcanzó el límite de 100 capturas para esta herramienta.');
        const row={id:crypto.randomUUID(),at:new Date().toISOString(),unit:spec.unit,...checked};
        const updated={...latest,rows:[row,...latest.rows]};
        setItems(tools().map(tool=>tool.id===item.id?updated:tool));
        showRows(updated);void save();
      }catch(error){result.textContent=error.message;}
    }):null;
    form.onsubmit=event=>{
      event.preventDefault();
      try{
        const checked=core.calculate(spec,Object.fromEntries(new FormData(form)));
        result.textContent=checked.result===null?'Captura válida.':('Resultado: '+formatResult(checked.result,spec.unit)+(checked.warning?' · Supera el límite configurado.':''));
      }catch(error){result.textContent=error.message;}
    };
    const history=node(output,'div');
    function showRows(value){
      history.replaceChildren();node(history,'h4','Capturas guardadas');
      if(!value.rows.length)node(history,'p','Aún no hay capturas.');
      for(const row of value.rows){
        const entry=node(history,'details');
        node(entry,'summary',new Date(row.at).toLocaleString('es-MX')+(row.result===null?'':' · '+formatResult(row.result,row.unit??value.spec.unit)));
        for(const [key,value] of Object.entries(row.values))node(entry,'p',key+': '+value);
      }
    }
    if(item)showRows(item);
    if(commit)commit.disabled=false;
  }
  function checkedPreview(){
    try{preview(read());status.textContent='';}
    catch(error){status.textContent=error.message;}
  }
  $('builderPreview').onclick=checkedPreview;
  $('builderAddField').onclick=()=>addField();
  $('builderNew').onclick=()=>{active='';seed();};
  $('builderDuplicate').onclick=()=>{
    try{const config=read();active='';seed({...config,name:config.name.slice(0,72)+' · copia'});}
    catch(error){status.textContent=error.message;}
  };
  $('builderSample').onchange=event=>{
    const sample=core.samples[event.target.value];
    if(sample){active='';seed(sample);event.target.value='';}
  };
  $('builderExport').onclick=()=>{try{download(read());}catch(error){status.textContent=error.message;}};
  $('builderImport').onchange=async event=>{
    const input=event.currentTarget, file=input.files?.[0],owner=api.getState();
    if(!file)return;
    try{
      if(file.size>65536)throw new Error('Selecciona una definición JSON de hasta 64 KiB.');
      const raw=JSON.parse(await file.text());
      if(owner!==api.getState())return;
      if(raw?.format!=='lifts-tool-v1'||!Array.isArray(raw.fields))throw new Error('Formato de herramienta inválido.');
      const spec=core.definition({...raw,fields:raw.fields.map(field=>({...field,options:Array.isArray(field?.options)?field.options.join('|'):''}))});
      active='';seed(spec);status.textContent='Definición cargada como borrador.';
    }catch(error){if(owner===api.getState())status.textContent=error.message;}
    finally{input.value='';}
  };
  editor.onsubmit=event=>{
    event.preventDefault();if(busy||pending)return;
    try{
      const spec=read(),previous=tools().find(item=>item.id===active);
      if(!previous&&tools().length>=30)throw new Error('Se alcanzó el límite de 30 herramientas.');
      const item=previous?{...previous,spec,versions:JSON.stringify(previous.spec)===JSON.stringify(spec)?previous.versions:[previous.spec,...previous.versions].slice(0,10)}:
        {id:crypto.randomUUID(),spec,rows:[],archived:false,versions:[]};
      setItems(previous?tools().map(tool=>tool.id===active?item:tool):[item,...tools()]);
      open(item,false);void save();
    }catch(error){status.textContent=error.message;}
  };
  $('builderRestore').onclick=()=>{
    const item=tools().find(entry=>entry.id===active);
    if(!item?.versions?.length){status.textContent='Esta herramienta todavía no tiene versiones anteriores.';return;}
    seed(item.versions[0]);status.textContent='Versión anterior abierta como borrador. Pulsa Guardar herramienta para aplicarla.';
  };
  $('builderRetry').onclick=()=>{if(pending)void save();};
  function reset(){
    observed=api.getState();active='';busy=pending=false;status.textContent='';$('builderRetry').hidden=true;
    $('builderImport').value='';$('builderSample').value='';seed();renderLibrary();
  }
  window.addEventListener('nexo-state',reset);
  window.addEventListener('lifts-page',event=>{if(event.detail.page==='builder'&&observed!==api.getState())reset();});
  window.liftsBuilder={reset,openSaved};
  reset();
})();
