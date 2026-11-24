const $=id=>document.getElementById(id);
const fileInput=$('guardianPdfFile'),status=$('guardianPdfStatus'),output=$('guardianPdfOutput');
const query=$('guardianPdfQuery'),picker=$('guardianPdfPage'),preview=$('guardianPdfPreview');
const maxPages=30,maxBytes=15*1024*1024,maxChars=150000;
let loading=null,pages=[],version=0,timer=null;
const normalize=text=>text.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase('es');

function clear({resetFile=false}={}){
  version++;
  clearTimeout(timer);timer=null;
  if(loading)void loading.destroy().catch(()=>{});
  loading=null;pages=[];output.hidden=true;
  if(resetFile)fileInput.value='';
  query.value='';picker.replaceChildren();preview.value='';status.textContent='';
}
function render(){
  const selected=picker.value,term=normalize(query.value.trim());
  const matches=pages.filter(page=>page.text&&normalize(page.text).includes(term));
  picker.replaceChildren(...matches.map(page=>new Option('Página '+page.number,String(page.number))));
  if(matches.some(page=>String(page.number)===selected))picker.value=selected;
  preview.value=matches.find(page=>String(page.number)===picker.value)?.text||'';
  status.textContent=matches.length?matches.length+' páginas con texto coincidente.':'No hay páginas con texto coincidente.';
}
fileInput.onchange=async()=>{
  const file=fileInput.files?.[0];
  clear();
  const revision=version;
  if(!file)return;
  if(!file.size||file.size>maxBytes){status.textContent='Selecciona un PDF de hasta 15 MiB.';return;}
  status.textContent='Extrayendo texto…';
  timer=setTimeout(()=>{
    if(revision!==version)return;
    clear({resetFile:true});
    status.textContent='La extracción tardó demasiado. Intenta con un PDF más pequeño.';
  },30000);
  try{
    const [{GlobalWorkerOptions,getDocument},bytes]=await Promise.all([
      import('./vendor/pdfjs-6.5.438.js'),file.arrayBuffer()
    ]);
    if(revision!==version)return;
    GlobalWorkerOptions.workerSrc=new URL('./vendor/pdfjs-6.5.438-worker.js',import.meta.url).href;
    loading=getDocument({data:new Uint8Array(bytes),isEvalSupported:false,enableXfa:false,
      useWasm:false,useWorkerFetch:false,disableWorkerRendering:true});
    const pdf=await loading.promise;
    if(revision!==version)return;
    if(pdf.numPages<1||pdf.numPages>maxPages)throw new Error('Selecciona un PDF de 1 a '+maxPages+' páginas.');
    const extracted=[];
    let size=0;
    for(let number=1;number<=pdf.numPages;number++){
      const page=await pdf.getPage(number);
      const {items}=await page.getTextContent();
      if(revision!==version)return;
      const text=items.map(item=>typeof item.str==='string'?item.str+(item.hasEOL?'\n':' '):'').join('').trim();
      size+=text.length;
      if(size>maxChars)throw new Error('El texto supera el límite de 150 000 caracteres. Divide el PDF y vuelve a intentar.');
      extracted.push({number,text});
      page.cleanup();
    }
    pages=extracted;
    if(!pages.some(page=>page.text)){status.textContent='No se encontró texto seleccionable. Un PDF escaneado requiere OCR.';return;}
    output.hidden=false;render();
  }catch(error){
    if(revision===version)status.textContent=/^Selecciona un PDF|^El texto supera/.test(error.message)
      ?error.message:'No se pudo extraer el texto. Revisa que sea un PDF válido y sin contraseña.';
  }finally{
    if(revision===version){
      clearTimeout(timer);timer=null;
      if(loading){void loading.destroy().catch(()=>{});loading=null;}
    }
  }
};
query.oninput=picker.onchange=render;
$('guardianPdfDownload').onclick=()=>{
  if(!pages.length)return;
  const text=pages.map(page=>'Página '+page.number+'\n'+(page.text||'[Sin texto seleccionable]')).join('\n\n');
  const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download='lifts-texto-pdf.txt';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
};
window.addEventListener('nexo-state',()=>clear({resetFile:true}));
window.addEventListener('lifts-page',event=>{if(event.detail.page!=='utilities')clear({resetFile:true});});
