'use strict';

(function(){
  const root=document.getElementById('nexusUtilities');
  const core=window.liftsUtilitiesCore;
  if(!root||!core)return;
  const modeNames={compare:'Comparar textos',dates:'Calcular fechas',radix:'Convertir bases',base64:'Texto y Base64'};

  function node(parent,tag,text,attributes={}){
    const child=document.createElement(tag);
    if(text!==undefined)child.textContent=text;
    for(const [key,value] of Object.entries(attributes))child.setAttribute(key,value);
    parent.append(child);
    return child;
  }

  function field(parent,label,key,tag,attributes={}){
    const id='utility-'+key;
    node(parent,'label',label,{for:id});
    return node(parent,tag,undefined,{id,name:key,...attributes});
  }

  function textResult(output,label,value){
    const result=field(output,label,'result','textarea',{rows:'4',readonly:''});
    result.value=value;
  }

  function drawComparison(form,results){
    const before=field(form,'Texto anterior','before','textarea',{rows:'5',maxlength:'16000'});
    const after=field(form,'Texto nuevo','after','textarea',{rows:'5',maxlength:'16000'});
    return ()=>{
      const result=core.compareText(before.value,after.value);
      node(results,'p','Líneas añadidas: '+result.added+' · Quitadas: '+result.removed+' · Sin cambios: '+result.unchanged);
      if(!result.changes.length)return;
      const list=node(results,'ol');
      for(const change of result.changes){
        const prefix=change.kind==='added'?'Añadida, línea nueva ':'Quitada, línea anterior ';
        const row=node(list,'li');
        node(row,'strong',prefix+change.line);
        const line=node(row,'pre',change.text||'Línea vacía');
        line.style.whiteSpace='pre-wrap';
        line.style.overflowWrap='anywhere';
      }
    };
  }

  function drawDates(form,results){
    const start=field(form,'Fecha inicial','start','input',{type:'date',min:'0001-01-01',max:'9999-12-31',required:''});
    const operation=field(form,'Operación de fecha','date-operation','select');
    node(operation,'option','Días entre dos fechas',{value:'between'});
    node(operation,'option','Desplazar una fecha',{value:'offset'});
    const endPanel=node(form,'div');
    const end=field(endPanel,'Fecha final','end','input',{type:'date',min:'0001-01-01',max:'9999-12-31',required:''});
    const daysPanel=node(form,'div',undefined,{hidden:''});
    const days=field(daysPanel,'Días de desplazamiento','offset','input',{type:'number',step:'1',disabled:''});
    operation.onchange=()=>{
      const offset=operation.value==='offset';
      endPanel.hidden=offset;end.disabled=offset;
      daysPanel.hidden=!offset;days.disabled=!offset;days.required=offset;
    };
    return ()=>{
      if(operation.value==='offset')node(results,'p','Fecha resultante: '+core.addDays(start.value,days.valueAsNumber));
      else node(results,'p','Fecha final − fecha inicial: '+core.daysBetween(start.value,end.value)+' días naturales.');
    };
  }

  function drawRadix(form,results){
    const value=field(form,'Número a convertir','number','input',{type:'text',maxlength:'257',required:''});
    const from=field(form,'Base de origen','from','select');
    const to=field(form,'Base de destino','to','select');
    for(const select of [from,to]){
      for(const [number,label] of [['2','2 · Binaria'],['8','8 · Octal'],['10','10 · Decimal'],['16','16 · Hexadecimal']]){
        node(select,'option',label,{value:number});
      }
    }
    from.value='10';to.value='16';
    return ()=>textResult(results,'Resultado de la conversión',core.convertBase(value.value,Number(from.value),Number(to.value)));
  }

  function drawBase64(form,results){
    const mode=field(form,'Operación Base64','base64-operation','select');
    node(mode,'option','Convertir texto a Base64',{value:'encode'});
    node(mode,'option','Convertir Base64 a texto',{value:'decode'});
    const value=field(form,'Contenido a convertir','base64-value','textarea',{rows:'5',maxlength:'16000'});
    mode.onchange=()=>{value.maxLength=mode.value==='encode'?16000:64000;};
    return ()=>{
      const result=mode.value==='decode'?core.decodeText(value.value):core.encodeText(value.value);
      textResult(results,'Resultado de la conversión',result);
    };
  }

  const drawers={compare:drawComparison,dates:drawDates,radix:drawRadix,base64:drawBase64};
  function mount(){
    root.replaceChildren();
    const card=node(root,'article',undefined,{class:'card'});
    node(card,'h2','Utilidades locales');
    node(card,'p','El contenido se procesa en tu navegador y se borra al cambiar de herramienta o de cuenta.',{class:'notice'});
    const mode=field(card,'Herramienta','mode','select');
    for(const [key,name] of Object.entries(modeNames))node(mode,'option',name,{value:key});
    const panel=node(card,'div');
    function render(){
      panel.replaceChildren();
      const form=node(panel,'form');
      const results=document.createElement('div');
      const run=drawers[mode.value](form,results);
      node(form,'button','Calcular',{type:'submit'});
      const status=node(panel,'p','',{role:'status'});
      panel.append(results);
      form.oninput=()=>{status.textContent='';results.replaceChildren();};
      form.onsubmit=event=>{
        event.preventDefault();
        results.replaceChildren();
        try{run();status.textContent='Resultado calculado.';}
        catch(error){status.textContent=error.message;}
      };
    }
    mode.onchange=render;
    render();
  }

  window.liftsUtilities={reset:mount};
  window.addEventListener('nexo-state',mount);
  mount();
})();
