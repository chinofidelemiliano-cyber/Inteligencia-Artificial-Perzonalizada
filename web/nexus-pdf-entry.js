'use strict';
(() => {
  const details=document.getElementById('nexusPdfTools');
  const panel=document.getElementById('nexusPdfPanel');
  const status=document.getElementById('nexusPdfLoading');
  let cleanup=null,loading=false,generation=0;

  details.addEventListener('toggle',async()=>{
    if(!details.open||cleanup||loading)return;
    const version=generation;
    loading=true;
    status.textContent='Cargando herramientas de PDF…';
    try{
      const {mount}=await import('./nexus-pdf-utils.js');
      if(version!==generation)return;
      cleanup=mount(panel);
      status.textContent='';
    }catch{
      if(version===generation)status.textContent='No se pudo cargar la herramienta. Cierra y vuelve a abrir el panel para reintentar.';
    }finally{if(version===generation)loading=false;}
  });

  function reset(){
    generation++;
    if(cleanup)cleanup();
    cleanup=null;loading=false;
    panel.replaceChildren();status.textContent='';details.open=false;
  }
  window.liftsPdfEntry={reset};
  window.addEventListener('nexo-state',reset);
})();
