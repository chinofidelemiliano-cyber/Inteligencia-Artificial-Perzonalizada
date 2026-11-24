import {criteria} from './personal-preflight-core.js';
const $=id=>document.getElementById(id);
const form=$('preflightForm'), status=$('preflightStatus'), results=$('preflightResults'), download=$('preflightDownload');
const format=value=>new Intl.NumberFormat('es-MX',{maximumFractionDigits:3}).format(value);
let worker,timer,report;
function append(parent,tag,value){
  const el=document.createElement(tag);el.textContent=value||'';parent.append(el);return el;
}
function stop(){
  worker?.terminate();worker=null;clearTimeout(timer);timer=null;
}
function reset(){
  stop();form.reset();results.replaceChildren();download.hidden=true;status.textContent='';report=null;
}
form.oninput=()=>{
  stop();results.replaceChildren();download.hidden=true;status.textContent='';report=null;
};
function show(pages,filename){
  report={pages,filename};
  const table=append(results,'table');
  append(table,'caption','Cajas geométricas por página');
  const head=append(append(table,'thead'),'tr');
  for(const label of ['Página','Caja usada','Ancho × alto (mm)','Giro','Dimensiones','Sangrado mínimo']){
    append(head,'th',label).scope='col';
  }
  const body=append(table,'tbody');
  for(const item of pages){
    const row=append(body,'tr');
    for(const value of [String(item.page),item.hasTrim?'TrimBox':'CropBox por defecto',format(item.width)+' × '+format(item.height),
      item.rotation+'°',item.dimensions,item.minBleed===null?item.bleed:format(item.minBleed)+' mm · '+item.bleed])append(row,'td',value);
  }
  download.hidden=false;
}
form.onsubmit=event=>{
  event.preventDefault();stop();results.replaceChildren();download.hidden=true;report=null;
  try{
    const file=$('preflightFile').files?.[0];
    if(!file?.size||file.size>20*1024*1024)throw new Error('Selecciona un PDF de hasta 20 MiB.');
    const options=criteria(Object.fromEntries(new FormData(form)));
    const job=new Worker(new URL('./personal-preflight-worker.js',import.meta.url),{type:'module'});
    worker=job;status.textContent='Revisando las cajas del PDF…';
    const fail=message=>{if(worker===job){stop();status.textContent=message;}};
    job.onerror=()=>fail('El navegador no pudo abrir el motor de revisión.');
    job.onmessage=({data})=>{
      if(worker!==job)return;
      if(data.error){fail(data.error);return;}
      stop();show(data.pages,file.name);
      status.textContent='Revisión geométrica completa. Comprueba los puntos de revisión manual abajo.';
    };
    timer=setTimeout(()=>fail('La revisión excedió el tiempo disponible. Prueba un PDF más pequeño.'),45000);
    job.postMessage({file,options});
  }catch(error){status.textContent=error.message;}
};
download.onclick=()=>{
  if(!report)return;
  const sections=report.pages.map(item=>({heading:'Página '+item.page,body:
    format(item.width)+' × '+format(item.height)+' mm · '+(item.hasTrim?'TrimBox':'CropBox')+' · Giro '+item.rotation+'°. Dimensiones: '+item.dimensions+
    '. Sangrado: '+(item.minBleed===null?'sin medición':format(item.minBleed)+' mm')+' · '+item.bleed+'.'}));
  sections.push({heading:'Revisión manual',body:'Comprueba contenido en el sangrado, fuentes, resolución de imágenes, tintas, sobreimpresión, transparencia, troquel, códigos, textos y líneas delgadas.'});
  const pdf=window.liftsPdf.make({title:'Revisión geométrica de PDF',subtitle:report.filename,sections});
  const url=URL.createObjectURL(new Blob([pdf],{type:'application/pdf'}));
  const link=document.createElement('a');link.href=url;link.download='lifts-preflight.pdf';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
};
window.liftsPreflight={reset};
window.addEventListener('nexo-state',reset);
