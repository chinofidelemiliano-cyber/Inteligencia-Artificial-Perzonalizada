'use strict';
(() => {
  function bind(detailsId,panelId,statusId,load){
    const details=document.getElementById(detailsId);
    const panel=document.getElementById(panelId);
    const status=document.getElementById(statusId);
    if(!details||!panel||!status)return ()=>{};
    let cleanup=null,loading=false,generation=0;

    details.addEventListener('toggle',async()=>{
      if(!details.open||cleanup||loading)return;
      const version=generation;
      loading=true;
      status.textContent='Cargando herramientas de PDF…';
      try{
        const mount=await load();
        if(version!==generation||!details.open)return;
        cleanup=mount(panel);
        status.textContent='';
      }catch{
        if(version===generation)status.textContent='No se pudo cargar la herramienta. Cierra y vuelve a abrir el panel para reintentar.';
      }finally{if(version===generation)loading=false;}
    });

    return ()=>{
      generation++;
      if(cleanup)cleanup();
      cleanup=null;loading=false;
      panel.replaceChildren();status.textContent='';details.open=false;
    };
  }
  const resetEditor=bind('nexusPdfTools','nexusPdfPanel','nexusPdfLoading',
    async()=>(await import('./nexus-pdf-utils.js')).mount);
  const resetMarkup=bind('nexusPdfMarkup','nexusPdfMarkupPanel','nexusPdfMarkupLoading',
    async()=>(await import('./nexus-pdf-markup.js')).mountPdfMarkup);
  function reset(){resetEditor();resetMarkup();}
  window.liftsPdfEntry={reset};
  window.addEventListener('nexo-state',reset);
})();
