'use strict';
(function(root){
  const {measurementSummary}=typeof module==='object'?require('./nexus-journal.js'):root.liftsNexusJournal;
  function number(raw,label){
    const text=String(raw??'').trim();
    if(!/^[+-]?\d{1,10}(?:[.,]\d{1,8})?$/.test(text))throw new Error('Revisa '+label+'.');
    return Number(text.replace(',','.'));
  }
  function calculate(raw){
    const lower=number(raw.lower,'el límite inferior'),upper=number(raw.upper,'el límite superior');
    if(upper<=lower)throw new Error('El límite superior debe superar al inferior.');
    const {count,mean,deviation}=measurementSummary(raw.readings);
    if(!(deviation>0))throw new Error('La muestra no presenta variación medible. Revisa la resolución y la muestra.');
    const indices=spread=>[(upper-lower)/(6*spread),Math.min(upper-mean,mean-lower)/(3*spread)];
    const [pp,ppk]=indices(deviation);
    let cp=null,cpk=null;
    if(String(raw.within??'').trim()){
      const within=number(raw.within,'la desviación dentro de subgrupos');
      if(within<=0)throw new Error('La desviación dentro de subgrupos debe ser positiva.');
      [cp,cpk]=indices(within);
    }
    return {count,mean,deviation,pp,ppk,cp,cpk};
  }
  if(typeof module==='object'){module.exports={calculate};return;}
  const form=document.getElementById('processPerformanceForm'),result=document.getElementById('processPerformanceResult');
  const format=new Intl.NumberFormat('es-MX',{maximumSignificantDigits:6});
  form.oninput=()=>{result.textContent='';};
  form.onsubmit=event=>{
    event.preventDefault();
    try{
      const {count,mean,deviation,pp,ppk,cp,cpk}=calculate(Object.fromEntries(new FormData(form)));
      result.textContent=count+' mediciones · Media '+format.format(mean)+' · Desviación muestral '+format.format(deviation)+
        ' · Pp = '+format.format(pp)+' · Ppk = '+format.format(ppk)+
        (cp===null?'. Para Cp y Cpk, introduce la desviación dentro de subgrupos.':' · Cp = '+format.format(cp)+' · Cpk = '+format.format(cpk)+'.');
    }catch(error){result.textContent=error.message;}
  };
  root.addEventListener('nexo-state',()=>{form.reset();result.textContent='';document.getElementById('processPerformance').open=false;});
})(globalThis);
