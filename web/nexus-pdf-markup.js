import {checkMarkupFile,markupLimits,visualToPdf} from './nexus-pdf-markup-core.js';

export function mountPdfMarkup(root){
  const node=(parent,tag,text='')=>{
    const element=document.createElement(tag);
    element.textContent=text;
    parent.append(element);
    return element;
  };
  const button=(parent,label,action)=>{
    const element=node(parent,'button',label);
    element.type='button';
    element.onclick=action;
    return element;
  };
  const field=(parent,label,id)=>{
    node(parent,'label',label).htmlFor=id;
    const element=node(parent,'input');
    element.id=id;
    return element;
  };

  const panel=node(root,'section');
  node(panel,'h3','Resaltar regiones de un PDF');
  node(panel,'p','Selecciona un PDF de hasta 20 MiB y 300 páginas. Los resaltados se integran en una copia de las páginas. Los enlaces, anotaciones, formularios y firmas digitales quedan fuera.');
  const picker=field(panel,'PDF para resaltar','markupPdfFile');
  picker.type='file';picker.accept='application/pdf,.pdf';
  const status=node(panel,'p');status.setAttribute('role','status');
  const viewer=node(panel,'section');
  viewer.hidden=true;
  const nav=node(viewer,'div');
  nav.className='evolution-controls';
  const previous=button(nav,'Página anterior',()=>go(pageIndex-1));
  const next=button(nav,'Página siguiente',()=>go(pageIndex+1));
  const counter=node(nav,'span');counter.setAttribute('aria-live','polite');
  const pointer=button(viewer,'Seleccionar con el puntero',()=>{
    selecting=!selecting;
    pointer.setAttribute('aria-pressed',String(selecting));
    stage.style.touchAction=selecting?'none':'';
    stage.style.cursor=selecting?'crosshair':'';
    hint.textContent=selecting?'Arrastra sobre la página para marcar una región.':'';
  });
  const hint=node(viewer,'p');
  const stage=node(viewer,'div');
  stage.style.position='relative';stage.style.width='fit-content';stage.style.maxWidth='100%';
  const manual=node(viewer,'details');
  node(manual,'summary','Seleccionar por posición y tamaño');
  node(manual,'p','Las posiciones y los tamaños se expresan en porcentaje de la página visible, desde la esquina superior izquierda.');
  const inputs=node(manual,'div');
  inputs.className='field-grid';
  const geometry=[
    ['left','Desde la izquierda (%)','10'],['top','Desde arriba (%)','10'],
    ['width','Ancho de la selección (%)','50'],['height','Alto de la selección (%)','10']
  ].map(([key,label,value])=>{
    const input=field(node(inputs,'div'),label,'markup-'+key);
    input.type='number';input.min='0';input.max='100';input.step='0.1';input.defaultValue=value;
    return [key,input];
  });
  const addManual=button(manual,'Añadir región',()=>{
    addMark(Object.fromEntries(geometry.map(([key,input])=>[key,input.valueAsNumber/100])));
  });
  const list=node(viewer,'ol');
  const generate=button(viewer,'Preparar copia resaltada',prepareDownload);
  const download=node(viewer,'a','Descargar PDF resaltado');
  download.download='lifts-pdf-resaltado.pdf';download.hidden=true;

  let version=0,previewVersion=0,pageIndex=0,file,loading,pdf,renderTask,viewport,overlay,exportJob,exportTimer,url='';
  let marks=[],selecting=false,drag=null,annotationMode;
  function setStatus(message){status.textContent=message;}
  function clearExport(){
    exportJob?.terminate();exportJob=null;
    clearTimeout(exportTimer);exportTimer=null;
    if(url)URL.revokeObjectURL(url);
    url='';
    download.hidden=true;download.removeAttribute('href');
  }
  function controls(){
    const ready=Boolean(viewport);
    const total=pdf?.numPages||0;
    previous.disabled=pageIndex<1;
    next.disabled=pageIndex>=total-1;
    counter.textContent=total?'Página '+(pageIndex+1)+' de '+total:'';
    pointer.disabled=addManual.disabled=!ready;
    generate.disabled=!marks.length||Boolean(exportJob);
  }
  function clearPreview(){
    renderTask?.cancel();renderTask=null;viewport=overlay=drag=null;
    stage.replaceChildren();stage.style.touchAction='';stage.style.cursor='';
    selecting=false;pointer.setAttribute('aria-pressed','false');hint.textContent='';
  }
  function clearDocument(){
    version++;previewVersion++;
    clearExport();clearPreview();
    const previousLoad=loading;
    loading=pdf=file=null;
    if(previousLoad)void previousLoad.destroy().catch(()=>{});
    marks=[];pageIndex=0;list.replaceChildren();viewer.hidden=true;
    manual.open=false;
    for(const [,input] of geometry)input.value=input.defaultValue;
    setStatus('');
  }
  pointer.setAttribute('aria-pressed','false');

  function region(element,box,preview=false){
    const percent=value=>(100*value)+'%';
    Object.assign(element.style,{
      position:'absolute',left:percent(box.left),top:percent(box.top),width:percent(box.width),height:percent(box.height),
      background:'rgba(255, 209, 0, .38)',boxSizing:'border-box',outline:preview?'1px dashed #835f00':''
    });
  }

  function showMarks(){
    list.replaceChildren();
    overlay?.replaceChildren();
    for(const [index,mark] of marks.entries()){
      if(mark.page!==pageIndex)continue;
      if(overlay)region(node(overlay,'div'),mark.visual);
      const row=node(list,'li','Resaltado '+(index+1));
      button(row,'Quitar resaltado '+(index+1),()=>{
        clearExport();
        marks.splice(index,1);
        showMarks();controls();setStatus('Resaltado eliminado.');
      }).className='secondary';
    }
  }

  function addMark(box){
    if(!viewport)return;
    if(marks.length>=markupLimits.maxMarks){setStatus('Puedes añadir hasta '+markupLimits.maxMarks+' resaltados.');return;}
    try{
      const geometry=visualToPdf(box,viewport);
      clearExport();marks.push({page:pageIndex,...geometry,visual:box});
      showMarks();controls();
      setStatus('Resaltado añadido. '+marks.length+' en el documento.');
    }catch(error){setStatus(error.message);}
  }

  const clamp=value=>Math.min(1,Math.max(0,value));
  function point(event){
    const bounds=stage.getBoundingClientRect();
    return [clamp((event.clientX-bounds.left)/bounds.width),clamp((event.clientY-bounds.top)/bounds.height)];
  }
  function boxBetween([ax,ay],[bx,by]){
    return {left:Math.min(ax,bx),top:Math.min(ay,by),width:Math.abs(ax-bx),height:Math.abs(ay-by)};
  }
  stage.onpointerdown=event=>{
    if(!selecting||!viewport||event.button!==0||drag)return;
    event.preventDefault();
    stage.setPointerCapture(event.pointerId);
    drag={id:event.pointerId,start:point(event),indicator:node(overlay,'div')};
  };
  stage.onpointermove=event=>{
    if(drag?.id!==event.pointerId)return;
    region(drag.indicator,boxBetween(drag.start,point(event)),true);
  };
  stage.onpointerup=event=>{
    if(drag?.id!==event.pointerId)return;
    const box=boxBetween(drag.start,point(event));
    drag.indicator.remove();drag=null;
    if(box.width<.004||box.height<.004){setStatus('Arrastra para seleccionar un área visible.');return;}
    addMark(box);
  };
  stage.onpointercancel=stage.onlostpointercapture=event=>{
    if(drag?.id!==event.pointerId)return;
    drag.indicator.remove();drag=null;
  };

  async function go(index){
    if(!pdf||index<0||index>=pdf.numPages)return;
    const revision=++previewVersion;
    pageIndex=index;
    clearPreview();controls();
    setStatus('Dibujando la página…');
    try{
      const page=await pdf.getPage(index+1);
      if(revision!==previewVersion)return;
      const full=page.getViewport({scale:1});
      if(!Number.isFinite(full.width)||!Number.isFinite(full.height)||full.width<=0||full.height<=0){
        throw new Error('Tamaño de página inválido.');
      }
      const scale=Math.min(2,markupLimits.maxEdge/full.width,markupLimits.maxEdge/full.height,
        Math.sqrt(markupLimits.maxPixels/full.width/full.height));
      const view=page.getViewport({scale});
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.floor(view.width));canvas.height=Math.max(1,Math.floor(view.height));
      canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Vista del PDF, página '+(index+1));
      canvas.style.display='block';canvas.style.maxWidth='100%';canvas.style.height='auto';
      renderTask=page.render({canvas,viewport:view,annotationMode});
      await renderTask.promise;
      if(revision!==previewVersion)return;
      renderTask=null;viewport=view;
      stage.append(canvas);
      overlay=node(stage,'div');
      overlay.setAttribute('aria-hidden','true');
      Object.assign(overlay.style,{position:'absolute',inset:'0',pointerEvents:'none'});
      showMarks();controls();setStatus('Página disponible para resaltar.');
    }catch{
      if(revision===previewVersion){renderTask=null;controls();setStatus('No se pudo dibujar esta página.');}
    }
  }

  picker.onchange=async()=>{
    const selected=picker.files[0];
    clearDocument();
    if(!selected)return;
    const revision=version;
    setStatus('Abriendo el PDF en este dispositivo…');
    try{
      checkMarkupFile(selected.size);
      const renderer=await import('./vendor/pdfjs-6.5.438.js');
      if(revision!==version)return;
      renderer.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdfjs-6.5.438-worker.js',import.meta.url).href;
      annotationMode=renderer.AnnotationMode.DISABLE;
      const bytes=await selected.arrayBuffer();
      if(revision!==version)return;
      loading=renderer.getDocument({
        data:new Uint8Array(bytes),isEvalSupported:false,enableXfa:false,useWasm:false,useWorkerFetch:false,
        disableAutoFetch:true,disableRange:true,disableStream:true,disableWorkerRendering:true,
        maxImageSize:markupLimits.maxPixels,canvasMaxAreaInBytes:markupLimits.maxPixels*4
      });
      const opened=await loading.promise;
      if(revision!==version)return;
      if(!opened.numPages||opened.numPages>markupLimits.maxPages){
        clearDocument();
        setStatus('Admite documentos de 1 a '+markupLimits.maxPages+' páginas.');
        return;
      }
      pdf=opened;file=selected;viewer.hidden=false;
      await go(0);
    }catch(error){
      if(revision!==version)return;
      clearDocument();
      setStatus(selected.size>markupLimits.maxBytes||!selected.size?error.message:'No se pudo abrir el PDF. Revisa el archivo y usa una copia sin contraseña.');
    }
  };

  function prepareDownload(){
    if(!file||!marks.length||exportJob)return;
    clearExport();
    try{
      const job=new Worker(new URL('./nexus-pdf-markup-worker.js',import.meta.url),{type:'module'});
      exportJob=job;
      const fail=message=>{
        if(exportJob!==job)return;
        clearExport();controls();setStatus(message);
      };
      job.onmessage=({data})=>{
        if(exportJob!==job)return;
        if(data.error){fail(data.error);return;}
        clearExport();controls();
        url=URL.createObjectURL(new Blob([data.bytes],{type:'application/pdf'}));
        download.href=url;download.hidden=false;
        setStatus('Copia disponible para descargar.');
      };
      job.onerror=()=>fail('No se pudo iniciar la edición local del PDF.');
      exportTimer=setTimeout(()=>fail('La edición tardó demasiado. Prueba con un PDF más pequeño.'),45000);
      controls();setStatus('Preparando la copia en este dispositivo…');
      job.postMessage({file,marks:marks.map(({visual,...mark})=>mark)});
    }catch{
      clearExport();controls();setStatus('No se pudo iniciar la edición local del PDF.');
    }
  }

  controls();
  return ()=>{
    clearDocument();
    picker.value='';
    panel.remove();
  };
}
