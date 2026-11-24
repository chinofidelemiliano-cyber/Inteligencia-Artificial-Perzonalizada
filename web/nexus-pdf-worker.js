import {editPdf,validateFiles} from './nexus-pdf-core.js';

self.addEventListener('message',async({data})=>{
  try{
    const {files,mode,pages}=data;
    validateFiles(files,mode);
    const inputs=[];
    for(const file of files)inputs.push(await file.arrayBuffer());
    const result=await editPdf(inputs,mode,pages);
    self.postMessage(result,[result.bytes.buffer]);
  }catch(error){
    self.postMessage({error:error.message||'No se pudo procesar el PDF.'});
  }
});
