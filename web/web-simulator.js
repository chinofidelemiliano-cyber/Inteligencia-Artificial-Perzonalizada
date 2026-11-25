'use strict';
(function(root){
  function positive(raw,label,integer=false){
    const text=String(raw??'').trim();
    const pattern=integer?/^\d{1,6}$/:/^\d{1,6}(?:[.,]\d{1,4})?$/;
    const value=Number(text.replace(',','.'));
    if(!pattern.test(text)||value<=0)throw new Error('Revisa '+label+'. Indica un valor positivo '+(integer?'entero.':'con la unidad indicada.'));
    return value;
  }
  function simulate(raw){
    const speed=positive(raw.speed,'la velocidad inicial'),alternate=positive(raw.alternate,'la velocidad alternativa');
    const length=positive(raw.length,'la longitud de secado'),print=positive(raw.print,'la repetición de impresión');
    const cut=positive(raw.cut,'la repetición de corte'),cycles=positive(raw.cycles,'los intervalos',true);
    return {seconds:[60*length/speed,60*length/alternate],repetitions:[1000*speed/print,1000*alternate/print],
      drift:(cut-print)*cycles};
  }
  if(typeof module==='object'){module.exports={simulate};return;}
  const $=id=>document.getElementById(id),form=$('webSimForm'),status=$('webSimStatus'),visual=$('webSimVisual');
  const format=new Intl.NumberFormat('es-MX',{maximumSignificantDigits:9});
  function svg(parent,tag,attrs,content){
    const node=document.createElementNS('http://www.w3.org/2000/svg',tag);
    for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);
    if(content!==undefined)node.textContent=content;
    parent.append(node);return node;
  }
  function clear(){visual.replaceChildren();status.textContent='';}
  form.oninput=clear;
  form.onsubmit=event=>{
    event.preventDefault();clear();
    try{
      const {seconds,repetitions,drift}=simulate(Object.fromEntries(new FormData(form)));
      status.textContent='Paso por secado: '+seconds.map(value=>format.format(value)+' s').join(' frente a ')+
        '. Repeticiones por minuto: '+repetitions.map(value=>format.format(value)).join(' frente a ')+
        '. Desfase de corte frente a impresión: '+format.format(drift)+' mm. Supuestos: velocidades y pasos constantes; sin deslizamiento.';
      const chart=svg(visual,'svg',{viewBox:'0 0 560 118',width:'100%',role:'img','aria-label':'Comparación de tiempos de paso por secado'});
      const max=Math.max(...seconds);
      seconds.forEach((value,index)=>{
        const y=22+index*51;
        svg(chart,'text',{x:3,y:y+16,fill:'currentColor','font-size':16},index===0?'Inicial':'Alternativa');
        svg(chart,'rect',{x:115,y,width:330*value/max,height:25,rx:3,fill:index===0?'#095499':'#8055ff'});
        svg(chart,'text',{x:465,y:y+16,fill:'currentColor','font-size':16},format.format(value)+' s');
      });
    }catch(error){status.textContent=error.message;}
  };
  root.addEventListener('nexo-state',()=>{form.reset();clear();$('webSim').open=false;});
})(globalThis);
