'use strict';
((root)=>{
  async function read(response,onText){
    const reader=response.body?.getReader();if(!reader)throw new Error('La respuesta llegó sin contenido.');
    const decoder=new TextDecoder();let buffer='',text='',complete=false;
    function consume(block){
      const data=block.split('\n').filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trimStart()).join('\n');
      if(!data)return;
      if(data.trim()==='[DONE]'){complete=true;return;}
      let event;try{event=JSON.parse(data);}catch{throw new Error('La respuesta en tiempo real llegó con un formato inválido.');}
      if(event.error || (Array.isArray(event.errors) && event.errors.length))throw new Error('El modelo interrumpió la respuesta. Puedes reintentar tu pregunta.');
      if(typeof event.response==='string'){text+=event.response;if(text.length>60000)throw new Error('La respuesta excedió el tamaño permitido.');onText(text);}
    }
    try{
      while(!complete){const {done,value}=await reader.read();buffer+=done?decoder.decode():decoder.decode(value,{stream:true});buffer=buffer.replace(/\r\n/g,'\n');let index;
        while((index=buffer.indexOf('\n\n'))>=0){const block=buffer.slice(0,index);buffer=buffer.slice(index+2);consume(block);if(complete)break;}
        if(buffer.length>100000)throw new Error('El servicio devolvió un evento demasiado grande.');
        if(done){if(buffer.trim())consume(buffer);break;}
      }
      if(!complete || !text.trim())throw new Error('La respuesta quedó incompleta. No se guardó; tu pregunta sigue disponible para reintentar.');
      return text;
    }finally{try{await reader.cancel();}catch{}reader.releaseLock();}
  }
  if(typeof module!=='undefined' && module.exports)module.exports={read};else root.liftsStream={read};
})(typeof window!=='undefined'?window:globalThis);
