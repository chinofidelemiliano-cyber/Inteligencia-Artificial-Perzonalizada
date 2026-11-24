import {pdfLimits} from './nexus-pdf-core.js';

function number(raw,label,required=false){
  if(!raw&&!required)return null;
  if(!/^\d{1,5}(?:[.,]\d{1,3})?$/.test(raw))throw new Error('Revisa '+label+'. Usa milímetros y hasta tres decimales.');
  return Number(raw.replace(',','.'));
}
export function criteria(values){
  const width=number(values.width,'el ancho'),height=number(values.height,'el alto');
  if((width===null)!==(height===null)||width===0||height===0)throw new Error('Introduce dimensiones positivas en ambos campos o déjalos vacíos.');
  return {width,height,tolerance:number(values.tolerance,'la tolerancia',true),bleed:number(values.bleed,'el sangrado')};
}

export async function inspectPdf(bytes,options){
  if(!bytes?.byteLength||bytes.byteLength>pdfLimits.maxBytes)throw new Error('El archivo debe pesar hasta 20 MiB.');
  const {PDFDocument,PDFName}=await import('./vendor/cantoo-pdf-lib-2.11.1.js');
  let document;
  try{document=await PDFDocument.load(bytes,{updateMetadata:false,ignoreEncryption:false});}
  catch{throw new Error('No se pudo abrir el PDF. Selecciona una copia válida y sin contraseña.');}
  if(document.getPageCount()<1||document.getPageCount()>pdfLimits.maxPages)throw new Error('Selecciona un PDF de 1 a 300 páginas.');
  const mm=points=>points*25.4/72;
  return document.getPages().map((page,index)=>{
    const hasTrim=page.node.has(PDFName.of('TrimBox')),hasBleed=page.node.has(PDFName.of('BleedBox'));
    const trim=hasTrim?page.getTrimBox():page.getCropBox();
    const bleed=hasBleed?page.getBleedBox():null;
    const unitKey=PDFName.of('UserUnit');
    const userUnit=page.node.lookup(unitKey)?.asNumber?.()??1;
    if(!Number.isFinite(userUnit)||userUnit<=0)throw new Error('La unidad geométrica de la página '+(index+1)+' no es válida.');
    const rotation=page.getRotation().angle;
    const swap=Math.abs(rotation%180)===90;
    const width=mm((swap?trim.height:trim.width)*userUnit),height=mm((swap?trim.width:trim.height)*userUnit);
    const minBleed=hasTrim&&bleed?mm(Math.min(trim.x-bleed.x,trim.y-bleed.y,bleed.x+bleed.width-trim.x-trim.width,bleed.y+bleed.height-trim.y-trim.height)*userUnit):null;
    return {
      page:index+1,hasTrim,width,height,rotation,
      dimensions:options.width===null?'Informativo':!hasTrim?'Revisión manual':Math.abs(width-options.width)<=options.tolerance+1e-6&&Math.abs(height-options.height)<=options.tolerance+1e-6?'Correcto':'Advertencia',
      minBleed,bleed:options.bleed===null?'Informativo':minBleed===null?'No verificable':minBleed+1e-6>=options.bleed?'Correcto':'Advertencia'
    };
  });
}
