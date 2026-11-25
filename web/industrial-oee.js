'use strict';
(function(root){
  function oee(raw){
    function read(key,integer){
      const text=String(raw[key]??'').trim();
      const pattern=integer?/^\d{1,10}$/:/^\d{1,7}(?:[.,]\d{1,4})?$/;
      if(!pattern.test(text))throw new Error('Introduce valores no negativos. Las piezas deben ser enteras.');
      return Number(text.replace(',','.'));
    }
    const planned=read('planned'),stopped=read('stopped'),cycle=read('cycle'),pieces=read('pieces',true),good=read('good',true);
    if(!(planned>0)||cycle<=0||stopped>=planned||pieces<=0||good>pieces)
      throw new Error('Revisa el tiempo planificado, el paro, el ciclo y el conteo. Debe haber tiempo operativo y producción; las conformes no pueden superar el total.');
    const operating=planned-stopped;
    const availability=operating/planned,performance=cycle*pieces/(60*operating),quality=good/pieces;
    return {operating,stopped,scrap:pieces-good,availability,performance,quality,oee:availability*performance*quality};
  }
  if(typeof module==='object'){module.exports={oee};return;}
  const $=id=>document.getElementById(id),form=$('industrialOeeForm'),status=$('industrialOeeResult'),draft=$('industrialOeeNote');
  const percent=new Intl.NumberFormat('es-MX',{style:'percent',maximumFractionDigits:2});
  let summary='';
  function clear(){summary='';status.textContent='';draft.hidden=true;}
  form.oninput=clear;
  form.onsubmit=event=>{
    event.preventDefault();clear();
    try{
      const data=Object.fromEntries(new FormData(form)),result=oee(data);
      summary='Disponibilidad '+percent.format(result.availability)+' · Rendimiento '+percent.format(result.performance)+
        ' · Calidad '+percent.format(result.quality)+' · OEE '+percent.format(result.oee)+
        '. Tiempo operativo '+result.operating+' min. Paro '+result.stopped+' min. Piezas no conformes '+result.scrap+'.';
      if(result.performance>1+1e-9)summary+=' El rendimiento supera 100 %. Comprueba la unidad, el ciclo ideal y el conteo.';
      status.textContent=summary;
      summary+='\nDatos de entrada: '+data.planned+' min planificados, '+data.stopped+' min de paro, '+data.cycle+' s/pieza, '+data.pieces+' piezas totales, '+data.good+' conformes.';
      draft.hidden=false;
    }catch(error){status.textContent=error.message;}
  };
  draft.onclick=()=>{if(summary)root.liftsJournal.prepareDraft('note',{title:'Indicadores del turno',content:summary});};
  root.addEventListener('nexo-state',()=>{form.reset();clear();$('industrialOee').open=false;});
})(globalThis);
