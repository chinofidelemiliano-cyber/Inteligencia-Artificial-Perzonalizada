'use strict';
(function(root){
  function amount(raw){
    if(typeof raw!=='string'||!/^[-+]?\d{1,10}(?:[.,]\d{1,4})?$/.test(raw.trim()))throw new Error('Revisa los saldos y cambios mensuales. Usa números decimales.');
    return Number(raw.trim().replace(',','.'));
  }
  function project(raw){
    const start=amount(raw.start),changes=['adverse','base','favorable'].map(key=>amount(raw[key]));
    const text=String(raw.months||'').trim();
    if(!/^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/.test(text))throw new Error('Escribe tres horizontes enteros separados por espacios.');
    const months=text.split(/\s+/).map(Number);
    if(months[0]<1||months[2]>600||months[0]>=months[1]||months[1]>=months[2])throw new Error('Los horizontes deben aumentar y quedar entre 1 y 600 meses.');
    return months.map(month=>({month,values:changes.map(change=>start+month*change),sensitivity:month}));
  }
  if(typeof module==='object'){module.exports={project};return;}
  const $=id=>document.getElementById(id),form=$('scenarioProjectionForm'),host=$('scenarioProjectionResult'),
    status=$('scenarioProjectionStatus'),draft=$('scenarioProjectionDraft');
  const format=new Intl.NumberFormat('es-MX',{maximumFractionDigits:4});
  let note;
  function node(parent,tag,text=''){
    const el=document.createElement(tag);el.textContent=text;parent.append(el);return el;
  }
  function clear(){note=null;host.replaceChildren();status.textContent='';draft.hidden=true;}
  form.oninput=clear;
  form.onsubmit=event=>{
    event.preventDefault();clear();
    try{
      const inputs=Object.fromEntries([...new FormData(form)].map(([key,value])=>[key.slice('scenario_'.length),value]));
      const title=inputs.title.trim(),unit=inputs.unit.trim(),assumptions=inputs.assumptions.trim();
      if(!title||!unit||!assumptions)throw new Error('Indica una decisión, una unidad y los supuestos.');
      const data=project(inputs),table=node(host,'table');
      node(table,'caption','Saldo proyectado en '+unit);
      const header=node(node(table,'thead'),'tr');
      for(const name of ['Meses','Adverso','Base','Favorable','Cambio de saldo por +1 al mes'])node(header,'th',name).scope='col';
      const body=node(table,'tbody');
      for(const item of data){
        const row=node(body,'tr');
        node(row,'th',String(item.month)).scope='row';
        for(const value of [...item.values,item.sensitivity])node(row,'td',format.format(value));
      }
      status.textContent='Saldo = inicial + meses × cambio mensual. Supuestos: '+assumptions;
      note={title,content:'Unidad: '+unit+' · Supuestos: '+assumptions+
        '\nResultados adverso / base / favorable:\n'+data.map(item=>item.month+' meses: '+item.values.map(value=>format.format(value)).join(' / ')).join('\n')};
      draft.hidden=false;
    }catch(error){status.textContent=error.message;}
  };
  draft.onclick=()=>{if(note)root.liftsJournal.prepareDraft('note',note);};
  root.addEventListener('nexo-state',()=>{form.reset();clear();$('scenarioProjection').open=false;});
})(globalThis);
