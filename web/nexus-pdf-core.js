export const pdfLimits={maxFiles:12,maxBytes:20*1024*1024,maxPages:300};

export function pageIndices(spec,total){
  if(typeof spec!=='string'||!spec.trim()||spec.length>2500)throw new Error('Escribe las páginas o rangos que quieres extraer.');
  const pages=new Set();
  for(const part of spec.split(',')){
    const range=/^\s*([1-9]\d{0,8})\s*(?:-\s*([1-9]\d{0,8})\s*)?$/.exec(part);
    if(!range)throw new Error('Usa números y rangos separados por comas, por ejemplo 1,3-5.');
    const first=Number(range[1]),last=Number(range[2]||range[1]);
    if(last<first||last>total)throw new Error('Revisa los rangos. El documento tiene '+total+' páginas.');
    if(last-first+1>pdfLimits.maxPages)throw new Error('Puedes generar hasta '+pdfLimits.maxPages+' páginas.');
    for(let page=first;page<=last;page++){
      pages.add(page-1);
      if(pages.size>pdfLimits.maxPages)throw new Error('Puedes generar hasta '+pdfLimits.maxPages+' páginas.');
    }
  }
  return [...pages];
}

export function validateFiles(files,mode,sizeKey='size'){
  if(!['merge','extract'].includes(mode))throw new Error('Elige una operación de PDF.');
  if((mode==='merge'&&(files.length<2||files.length>pdfLimits.maxFiles))||
     (mode==='extract'&&files.length!==1)){
    throw new Error(mode==='merge'?'Selecciona entre 2 y '+pdfLimits.maxFiles+' archivos PDF.':'Selecciona un PDF.');
  }
  if(files.some(file=>!Number.isFinite(file[sizeKey])||file[sizeKey]<=0))throw new Error('Selecciona archivos con contenido.');
  if(files.reduce((bytes,file)=>bytes+file[sizeKey],0)>pdfLimits.maxBytes)throw new Error('Los archivos deben sumar hasta 20 MiB.');
}

export async function editPdf(files,mode,spec){
  validateFiles(files,mode,'byteLength');
  const {PDFDocument,PDFName}=await import('./vendor/cantoo-pdf-lib-2.11.1.js');
  const output=await PDFDocument.create();
  for(const [index,bytes] of files.entries()){
    let source;
    try{
      source=await PDFDocument.load(bytes,{updateMetadata:false,ignoreEncryption:false});
    }catch{
      throw new Error('No se pudo abrir el PDF '+(index+1)+'. Verifica el archivo y usa una copia sin contraseña.');
    }
    const total=source.getPageCount();
    if(!total)throw new Error('El PDF '+(index+1)+' no tiene páginas.');
    if(mode==='merge'&&output.getPageCount()+total>pdfLimits.maxPages)throw new Error('Puedes generar hasta '+pdfLimits.maxPages+' páginas.');
    const indices=mode==='extract'?pageIndices(spec,total):source.getPageIndices();
    for(const page of await output.copyPages(source,indices)){
      page.node.delete(PDFName.of('Annots'));
      page.node.delete(PDFName.of('AA'));
      output.addPage(page);
    }
  }
  const pages=output.getPageCount();
  const bytes=await output.save({addDefaultPage:false});
  return {bytes,pages};
}
