import {checkMarkupFile,highlightPdf} from './nexus-pdf-markup-core.js';

self.addEventListener('message',async({data})=>{
  try{
    const {file,marks}=data;
    checkMarkupFile(file?.size);
    const bytes=await highlightPdf(await file.arrayBuffer(),marks);
    self.postMessage({bytes},[bytes.buffer]);
  }catch(error){
    self.postMessage({error:error instanceof Error?error.message:'No se pudo generar la copia.'});
  }
});
