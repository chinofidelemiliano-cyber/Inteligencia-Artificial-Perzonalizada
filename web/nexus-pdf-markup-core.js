import {pdfLimits} from './nexus-pdf-core.js';

export const markupLimits={...pdfLimits,maxMarks:150,maxEdge:1600,maxPixels:2_000_000};

export function visualToPdf(visual,viewport){
  const {left,top,width,height}=visual;
  if(![left,top,width,height].every(Number.isFinite)||
    left<0||top<0||width<=0||height<=0||left+width>1.000000001||top+height>1.000000001){
    throw new Error('La selección debe quedar dentro de la página y tener ancho y alto positivos.');
  }
  const corners=[
    [left,top],[left+width,top],[left,top+height],[left+width,top+height]
  ].map(([x,y])=>viewport.convertToPdfPoint(x*viewport.width,y*viewport.height));
  const xs=corners.map(point=>point[0]),ys=corners.map(point=>point[1]);
  const x=Math.min(...xs),y=Math.min(...ys);
  return {x,y,width:Math.max(...xs)-x,height:Math.max(...ys)-y};
}

export function checkMarkupFile(size){
  if(!Number.isFinite(size)||size<=0||size>markupLimits.maxBytes){
    throw new Error('Selecciona un PDF con contenido de hasta 20 MiB.');
  }
}

export async function highlightPdf(bytes,marks){
  checkMarkupFile(bytes.byteLength);
  if(!Array.isArray(marks)||marks.length<1||marks.length>markupLimits.maxMarks){
    throw new Error('Añade entre 1 y '+markupLimits.maxMarks+' resaltados.');
  }
  const {PDFDocument,PDFName,rgb}=await import('./vendor/cantoo-pdf-lib-2.11.1.js');
  let document;
  try{document=await PDFDocument.load(bytes,{updateMetadata:false,ignoreEncryption:false});}
  catch{throw new Error('No se pudo editar el PDF. Usa una copia válida y sin contraseña.');}
  const total=document.getPageCount();
  if(!total||total>markupLimits.maxPages)throw new Error('Admite documentos de hasta '+markupLimits.maxPages+' páginas.');
  const tolerance=.001;
  for(const {page:index,x,y,width,height} of marks){
    if(!Number.isInteger(index)||index<0||index>=total||![x,y,width,height].every(Number.isFinite)||width<=0||height<=0){
      throw new Error('Revisa que los resaltados estén dentro de la página.');
    }
    const page=document.getPage(index);
    const crop=page.getCropBox();
    if(x<crop.x-tolerance||y<crop.y-tolerance||x+width>crop.x+crop.width+tolerance||y+height>crop.y+crop.height+tolerance){
      throw new Error('Un resaltado quedó fuera de la región visible de su página.');
    }
    page.drawRectangle({x,y,width,height,color:rgb(1,.82,0),opacity:.38,borderWidth:0});
  }
  for(const page of document.getPages()){
    page.node.delete(PDFName.of('Annots'));
    page.node.delete(PDFName.of('AA'));
  }
  const output=await PDFDocument.create();
  for(const page of await output.copyPages(document,document.getPageIndices()))output.addPage(page);
  return output.save({addDefaultPage:false,updateFieldAppearances:false});
}
