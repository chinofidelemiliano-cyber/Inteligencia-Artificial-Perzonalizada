'use strict';
(function(root){
  function readings(raw){
    const tokens=raw.trim().split(/\s+/);
    if(tokens.length>40||tokens.some(token=>!/^[-+]?\d{1,10}(?:[.,]\d{1,10})?$/.test(token))){
      throw new Error('Escribe de 1 a 40 valores decimales separados por espacios.');
    }
    return tokens.map(token=>token.replace(',','.')).join(' ');
  }
  function clock(ms){
    const tenths=Math.max(0,Math.floor(ms/100));
    return String(Math.floor(tenths/600)).padStart(2,'0')+':'+String(Math.floor(tenths/10)%60).padStart(2,'0')+'.'+tenths%10;
  }
  if(typeof module==='object'){module.exports={readings,clock};return;}
  const $=id=>document.getElementById(id);
  const start=$('fieldStart'),status=$('fieldStatus'),form=$('fieldMeasure');
  let elapsed=0,started=null,timer=null;
  function render(){
    $('fieldClock').textContent=clock(elapsed+(started===null?0:performance.now()-started));
    start.textContent=started!==null?'Pausar cronómetro':elapsed?'Continuar cronómetro':'Iniciar cronómetro';
  }
  function pause(){
    clearInterval(timer);timer=null;
    if(started!==null)elapsed+=performance.now()-started;
    started=null;render();
  }
  start.onclick=()=>{
    if(started!==null){pause();return;}
    started=performance.now();timer=setInterval(render,100);render();
  };
  $('fieldReset').onclick=()=>{pause();elapsed=0;render();};
  $('fieldProcedures').onclick=()=>root.liftsJournal.prepareDraft('playbook');
  form.onsubmit=event=>{
    event.preventDefault();
    try{
      const title=$('fieldMeasureTitle').value.trim(),unit=$('fieldMeasureUnits').value.trim();
      if(!title||!unit)throw new Error('Indica qué mediste y con qué unidad.');
      const values=readings($('fieldMeasureValues').value);
      const notes=$('fieldMeasureNotes').value.trim();
      const opened=root.liftsJournal.prepareDraft('experiment',{
        title,question:'Medición de '+title,readings:values,unit,conditions:notes
      });
      if(opened)status.textContent='Borrador preparado. Revisa el registro y guárdalo desde Nexus.';
    }catch(error){status.textContent=error.message;}
  };
  root.addEventListener('nexo-state',()=>{pause();elapsed=0;render();form.reset();status.textContent='';});
  root.addEventListener('lifts-page',event=>{if(event.detail.page!=='field'&&started!==null)pause();});
})(globalThis);
