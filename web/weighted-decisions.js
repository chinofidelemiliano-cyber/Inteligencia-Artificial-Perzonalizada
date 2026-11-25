'use strict';
(function(root){
  const normalize=value=>value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
  function rows(text,min,max,label){
    const list=text.split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map(line=>line.split('|').map(value=>value.trim()));
    if(list.length<min||list.length>max)throw new Error('Registra entre '+min+' y '+max+' '+label+'.');
    if(list.some(row=>!row[0]||row[0].length>60)||new Set(list.map(row=>normalize(row[0]))).size!==list.length)
      throw new Error('Usa nombres distintos de hasta 60 caracteres.');
    return list;
  }
  function decimal(raw,max){
    if(!/^\d{1,4}(?:[.,]\d{1,4})?$/.test(raw))throw new Error('Introduce números no negativos.');
    const value=Number(raw.replace(',','.'));
    if(value>max)throw new Error('Un valor supera el máximo de '+max+'.');
    return value;
  }
  function compare(criteriaText,optionsText){
    const criteria=rows(criteriaText,1,8,'criterios').map(([name,...weights])=>{
      if(weights.length!==1)throw new Error('Escribe cada criterio como nombre | peso.');
      return {name,weight:decimal(weights[0],1000)};
    });
    const total=criteria.reduce((sum,item)=>sum+item.weight,0);
    if(!total)throw new Error('Al menos un criterio debe tener peso positivo.');
    const options=rows(optionsText,2,10,'alternativas').map(([name,...values])=>{
      if(values.length!==criteria.length)throw new Error('Cada alternativa debe incluir una puntuación por criterio.');
      const scores=values.map(value=>decimal(value,10));
      return {name,scores,result:scores.reduce((sum,score,index)=>sum+score*criteria[index].weight,0)/total};
    });
    options.sort((a,b)=>b.result-a.result);
    const best=options.filter(item=>Math.abs(item.result-options[0].result)<1e-9).map(item=>item.name);
    return {criteria,options,best};
  }
  if(typeof module==='object'){module.exports={compare};return;}
  const $=id=>document.getElementById(id),form=$('weightedDecisionForm'),status=$('decisionMatrixStatus');
  const host=$('decisionMatrixResult'),draft=$('decisionDraft');
  const format=new Intl.NumberFormat('es-MX',{maximumFractionDigits:3});
  let current=null;
  function element(parent,tag,content=''){
    const node=document.createElement(tag);node.textContent=content;parent.append(node);return node;
  }
  function clear(){current=null;host.replaceChildren();status.textContent='';draft.hidden=true;}
  form.oninput=clear;
  form.onsubmit=event=>{
    event.preventDefault();clear();
    try{
      const {problem,criteria,options}=Object.fromEntries([...new FormData(form)].map(([key,value])=>[key.slice('matrix_'.length),value]));
      if(!problem.trim())throw new Error('Escribe la decisión por tomar.');
      const result=compare(criteria,options);
      current={problem:problem.trim(),...result};
      const table=element(host,'table'),header=element(element(table,'thead'),'tr');
      element(table,'caption','Comparación de alternativas según los pesos elegidos');
      for(const label of ['Alternativa',...result.criteria.map(item=>item.name+' · peso '+item.weight),'Puntuación ponderada'])element(header,'th',label).scope='col';
      const body=element(table,'tbody');
      for(const item of result.options){
        const row=element(body,'tr');
        element(row,'th',item.name).scope='row';
        for(const value of [...item.scores,item.result])element(row,'td',format.format(value));
      }
      status.textContent=(result.best.length>1?'Empate en el primer lugar. ':'Mayor puntuación con tus criterios. ')+result.best.join(', ')+'.';
      draft.hidden=false;
    }catch(error){status.textContent=error.message;}
  };
  draft.onclick=()=>{
    if(!current)return;
    const {problem,criteria,options}=current;
    root.liftsJournal.prepareDraft('decision',{
      title:problem,problem,criteria:criteria.map(item=>item.name+' | peso '+item.weight).join('\n'),
      alternatives:options.map(item=>item.name+' | '+item.scores.join(' | ')+' → '+format.format(item.result)+'/10').join('\n')
    });
  };
  root.addEventListener('nexo-state',()=>{form.reset();clear();$('weightedDecision').open=false;});
})(globalThis);
