'use strict';
(() => {
  const el=id=>document.getElementById(id);
  let controller=null;
  let version=0;
  let busy=false;
  let imageURL=null;
  function discard(){
    if(imageURL)URL.revokeObjectURL(imageURL);
    imageURL=null;el('generatedImage').removeAttribute('src');el('downloadImage').removeAttribute('href');el('imageResult').hidden=true;el('imageCaption').textContent='';
  }
  function reset(){version++;controller?.abort();controller=null;busy=false;discard();el('imagePrompt').value='';el('imageStatus').textContent='';el('generateImage').disabled=false;el('generateImage').textContent='Generar imagen';}
  window.addEventListener('nexo-state',reset);
  el('discardImage').onclick=()=>{discard();el('imageStatus').textContent='Imagen descartada de esta página.';};
  el('imageForm').onsubmit=async event=>{
    event.preventDefault();const prompt=el('imagePrompt').value.trim();if(!prompt || prompt.length>2048 || busy)return;
    busy=true;const currentVersion=version;const requestController=new AbortController();controller=requestController;
    el('generateImage').disabled=true;el('generateImage').textContent='Generando…';el('imageStatus').textContent='Creando tu imagen. Puede tardar un momento…';
    const timer=setTimeout(()=>requestController.abort(),90000);
    try{
      const token=await window.nexoAccount.accessToken();if(version!==currentVersion)return;
      const response=await fetch('/api/image',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({prompt}),signal:requestController.signal});
      if(!response.ok){const result=await response.json().catch(()=>({error:'El servicio no devolvió una respuesta válida. Revisa el despliegue.'}));throw new Error(result.error || 'No se pudo crear la imagen.');}
      const mime=response.headers.get('Content-Type')?.split(';')[0];
      if(!['image/jpeg','image/png','image/webp'].includes(mime))throw new Error('El servicio no devolvió un formato de imagen válido.');
      const blob=await response.blob();if(version!==currentVersion)return;
      if(!blob.size || blob.size>18000000)throw new Error('El resultado está vacío o es demasiado grande.');
      discard();imageURL=URL.createObjectURL(blob);el('generatedImage').src=imageURL;
      el('imageCaption').textContent=prompt;el('downloadImage').href=imageURL;el('downloadImage').download='lifts-imagen.'+({'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[mime]);el('imageResult').hidden=false;
      el('imageStatus').textContent='Imagen lista. Descárgala para conservarla.';
    }catch(error){if(version===currentVersion)el('imageStatus').textContent=error.name==='AbortError'?'Se agotó el tiempo de espera. Tu descripción sigue aquí para reintentarlo.':error.message || 'No se pudo contactar con el servicio de imágenes.';}
    finally{clearTimeout(timer);if(version===currentVersion){busy=false;controller=null;el('generateImage').disabled=false;el('generateImage').textContent='Generar imagen';}}
  };
})();
