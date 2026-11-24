'use strict';
(function(root){
  const verdicts={useful:'Útil',incorrect:'Incorrecta',incomplete:'Incompleta',correction:'Requiere corrección'};
  const clean=(value,length)=>typeof value==='string'?value.trim().slice(0,length):'';
  const normalize=value=>value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
  function draft(raw){
    const topic=clean(raw.topic,120), correction=clean(raw.correction,1200);
    if(!topic||!Object.hasOwn(verdicts,raw.verdict))throw new Error('Indica el tema y el tipo de evaluación.');
    if(['incorrect','correction'].includes(raw.verdict)&&!correction)throw new Error('Escribe una corrección concreta para poder recuperarla después.');
    return {id:crypto.randomUUID(),at:new Date().toISOString(),topic,verdict:raw.verdict,correction};
  }
  function search(records,query){
    const term=normalize(query.trim());
    return records.filter(item=>normalize(item.topic+' '+item.correction).includes(term));
  }
  const core={verdicts,draft,search};
  if(typeof module==='object'){module.exports=core;return;}
  const $=id=>root.document.getElementById(id);
  const api=root.liftsWorkspace, form=$('nexusFeedbackForm'), status=$('nexusFeedbackStatus');
  const topic=form.elements.namedItem('topic'), verdict=form.elements.namedItem('verdict');
  const records=()=>api.getState().nexusFeedback||[];
  let busy=false;
  for(const [id,label] of Object.entries(verdicts))verdict.add(new Option(label,id));
  function render(){
    const list=$('nexusFeedbackList');
    list.replaceChildren();
    for(const item of search(records(),$('nexusFeedbackQuery').value)){
      const row=document.createElement('li');
      row.id='feedback-'+item.id;
      const heading=document.createElement('strong');
      heading.textContent=item.topic+' · '+verdicts[item.verdict];
      row.append(heading);
      if(item.correction){
        const correction=document.createElement('p');
        correction.textContent=item.correction;row.append(correction);
      }
      const remove=document.createElement('button');
      remove.type='button';remove.className='secondary';remove.textContent='Eliminar evaluación';remove.disabled=busy;
      remove.setAttribute('aria-label','Eliminar evaluación: '+item.topic);
      remove.onclick=()=>{
        if(!busy&&confirm('¿Eliminar esta evaluación y su corrección?')){
          void save(records().filter(entry=>entry.id!==item.id),'Evaluación eliminada.');
        }
      };
      row.append(remove);list.append(row);
    }
    if(!list.childElementCount){
      const empty=document.createElement('li');empty.textContent='Todavía no hay evaluaciones que coincidan.';list.append(empty);
    }
  }
  async function save(items,message){
    const space=api.getState(),previous=space.nexusFeedback;
    busy=true;space.nexusFeedback=items;status.textContent='Guardando…';
    form.querySelector('button').disabled=true;
    render();
    try{
      if(!await api.save())throw new Error();
      if(space!==api.getState())return false;
      status.textContent=message;
      return true;
    }catch{
      if(space===api.getState()){
        if(space.nexusFeedback===items)space.nexusFeedback=previous;
        status.textContent='No se confirmó el guardado. Puedes reintentar.';
      }
      return false;
    }finally{
      if(space===api.getState()){busy=false;form.querySelector('button').disabled=false;render();}
    }
  }
  form.onsubmit=async event=>{
    event.preventDefault();
    if(busy)return;
    if(records().length>=100){status.textContent='Hay 100 evaluaciones guardadas. Elimina alguna para añadir otra.';return;}
    try{
      const item=draft(Object.fromEntries(new FormData(form)));
      if(await save([item,...records()],'Evaluación guardada.'))form.reset();
    }catch(error){status.textContent=error.message;}
  };
  $('nexusFeedbackQuery').oninput=render;
  function openRecord(id){
    if(!records().some(item=>item.id===id))return false;
    api.open('operations');
    if($('operations').hidden)return false;
    $('nexusFeedbackPanel').open=true;
    $('nexusFeedbackQuery').value='';
    render();
    $('feedback-'+id)?.scrollIntoView({block:'center'});
    return true;
  }
  function prepare(question){
    api.open('operations');
    if($('operations').hidden)return;
    $('nexusFeedbackPanel').open=true;
    if(!topic.value.trim())topic.value=clean(question,120);
    topic.focus();
  }
  function reset(){
    busy=false;form.reset();form.querySelector('button').disabled=false;status.textContent='';
    $('nexusFeedbackQuery').value='';$('nexusFeedbackPanel').open=false;render();
  }
  root.liftsFeedback={prepare,openRecord,reset,search:query=>search(records(),query)};
  root.addEventListener('nexo-state',reset);
  reset();
})(globalThis);
