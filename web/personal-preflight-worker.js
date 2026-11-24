import {inspectPdf} from './personal-preflight-core.js';
self.addEventListener('message',async({data})=>{
  try{self.postMessage({pages:await inspectPdf(await data.file.arrayBuffer(),data.options)});}
  catch(error){self.postMessage({error:error.message||'No se pudo revisar el PDF.'});}
});
