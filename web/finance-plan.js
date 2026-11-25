'use strict';
(function(root){
  function cents(raw){
    const value=typeof raw==='string'&&raw.trim().match(/^(\d{1,9})(?:[.,](\d{1,2}))?$/);
    if(!value)throw new Error('Introduce un monto sin separador de millares y con hasta dos decimales.');
    return Number(value[1])*100+Number((value[2]||'').padEnd(2,'0'));
  }
  function record(raw,id,previous){
    const name=String(raw.name||'').trim(),kind=raw.kind;
    if(!name||name.length>80||!['saving','debt'].includes(kind))throw new Error('Indica un nombre y un tipo válido.');
    const target=cents(raw.target),current=cents(raw.current);
    if(!target)throw new Error('El monto de referencia debe ser mayor que cero.');
    return {name,kind,target,current,id:previous?.id||id};
  }
  function progress(item){
    const amount=item.kind==='debt'?item.target-item.current:item.current;
    return {remaining:item.kind==='debt'?item.current:Math.max(0,item.target-item.current),percent:100*amount/item.target};
  }
  if(typeof module==='object'){module.exports={record,progress};return;}
  const $=id=>document.getElementById(id),app=root.liftsWorkspace,form=$('financePlanForm'),list=$('financePlanRecords');
  const status=$('financePlanStatus'),cancel=$('financePlanCancel'),submit=form.querySelector('button'),kind=$('financePlanType');
  const money=new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'});
  const amount=new Intl.NumberFormat('es-MX',{maximumFractionDigits:1});
  let editing=null,busy=false;
  const items=()=>app.getState().financePlan||[];
  function node(parent,tag,text=''){
    const el=document.createElement(tag);el.textContent=text;parent.append(el);return el;
  }
  function button(parent,text,action){
    const el=node(parent,'button',text);el.type='button';el.className='secondary';el.disabled=busy;el.onclick=action;return el;
  }
  function labels(){
    $('financePlanTargetLabel').textContent=kind.value==='debt'?'Saldo inicial de referencia (MXN)':'Monto meta (MXN)';
    $('financePlanCurrentLabel').textContent=kind.value==='debt'?'Saldo pendiente actual (MXN)':'Ahorro actual (MXN)';
  }
  function clearEditor(){editing=null;form.reset();cancel.hidden=true;labels();}
  function render(){
    list.replaceChildren();submit.disabled=busy;cancel.disabled=busy;
    if(!items().length)node(list,'p','Todavía no hay fichas financieras.');
    for(const item of items()){
      const row=node(list,'article');
      const {remaining,percent}=progress(item),debt=item.kind==='debt';
      node(row,'h4',item.name);
      node(row,'p',(debt?'Saldo inicial':'Meta')+' '+money.format(item.target/100)+' · '+(debt?'Saldo pendiente':'Ahorrado')+' '+money.format(item.current/100));
      node(row,'p',(debt?'Reducción del saldo respecto al inicial':'Avance de la meta')+' '+amount.format(percent)+' %. Pendiente '+money.format(remaining/100)+'.');
      button(row,'Editar '+item.name,()=>{
        editing=item.id;
        form.elements.name.value=item.name;kind.value=item.kind;
        form.elements.target.value=(item.target/100).toFixed(2);form.elements.current.value=(item.current/100).toFixed(2);
        cancel.hidden=false;labels();form.elements.name.focus();
      });
      button(row,'Retirar '+item.name,async()=>{
        if(!confirm('¿Retirar esta ficha financiera?'))return;
        if(await save(items().filter(entry=>entry.id!==item.id),'Ficha retirada.')&&editing===item.id)clearEditor();
      });
    }
  }
  async function save(value,message){
    if(busy)return false;
    const owner=app.getState(),before=owner.financePlan;
    owner.financePlan=value;busy=true;status.textContent='Guardando…';render();
    try{
      if(!await app.save())throw new Error();
      if(app.getState()===owner){status.textContent=message;return true;}
    }catch{
      if(app.getState()===owner){owner.financePlan=before;status.textContent='No se pudo guardar. Reintenta.';}
    }finally{
      if(app.getState()===owner){busy=false;render();}
    }
    return false;
  }
  form.onsubmit=async event=>{
    event.preventDefault();if(busy)return;
    try{
      const previous=items().find(item=>item.id===editing);
      if(!previous&&items().length>=50)throw new Error('El espacio admite hasta 50 fichas.');
      const item=record(Object.fromEntries(new FormData(form)),crypto.randomUUID(),previous);
      const entries=previous?items().map(entry=>entry.id===item.id?item:entry):[item,...items()];
      if(await save(entries,'Ficha financiera guardada.'))clearEditor();
    }catch(error){status.textContent=error.message;}
  };
  $('financeOpenPlan').onclick=()=>{
    const panel=$('financePlan');panel.open=true;panel.querySelector('summary').focus();
  };
  kind.onchange=labels;cancel.onclick=clearEditor;
  function reset(){busy=false;clearEditor();status.textContent='';$('financePlan').open=false;render();}
  root.addEventListener('nexo-state',reset);
  root.addEventListener('lifts-page',event=>{if(event.detail.page==='routines')render();});
  root.liftsFinancePlan={reset};
  render();
})(globalThis);
