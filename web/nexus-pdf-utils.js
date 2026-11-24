import {pdfLimits,validateFiles} from './nexus-pdf-core.js';

export function mount(container){
  function node(parent,tag,text){
    const element=document.createElement(tag);
    if(text)element.textContent=text;
    parent.append(element);
    return element;
  }
  function button(parent,text,callback){
    const target=node(parent,'button',text);
    target.type='button';
    target.onclick=callback;
    return target;
  }
  function control(parent,text,tag,id){
    const label=node(parent,'label',text),field=node(parent,tag);
    label.htmlFor=field.id=id;
    return field;
  }

  const panel=node(container,'section');
  node(panel,'h3','Combinar y extraer páginas de PDF');
  node(panel,'p','El navegador procesa los archivos en este dispositivo. El nuevo PDF conserva las páginas. Los enlaces, anotaciones, formularios y firmas digitales quedan fuera.');
  const form=node(panel,'form');
  const mode=control(form,'Operación de PDF','select','nexusPdfMode');
  for(const [value,label] of [['merge','Combinar archivos'],['extract','Extraer páginas']]){
    node(mode,'option',label).value=value;
  }
  const filePicker=control(form,'Archivos PDF','input','nexusPdfFiles');
  filePicker.type='file';filePicker.accept='.pdf,application/pdf';filePicker.multiple=true;
  const fileList=node(form,'ol');
  const selection=node(form,'div');selection.hidden=true;
  const pages=control(selection,'Páginas que quieres extraer','input','nexusPdfPages');
  pages.maxLength=2500;
  pages.placeholder='1,3-5,8';
  node(selection,'p','Escribe las páginas de origen en el orden deseado. Cada página se incluye una vez.');
  const generate=node(form,'button','Generar PDF');
  generate.type='submit';
  const cancel=button(form,'Cancelar operación de PDF',()=>stop('Operación cancelada.'));
  cancel.className='secondary';
  const status=node(panel,'p');status.setAttribute('role','status');
  const download=node(panel,'a','Descargar PDF generado');

  let files=[],worker=null,timer=null,url='';
  function clearDownload(){
    if(url)URL.revokeObjectURL(url);
    url='';
    download.hidden=true;
    download.removeAttribute('href');
  }
  function render(){
    const busy=Boolean(worker);
    filePicker.disabled=mode.disabled=pages.disabled=generate.disabled=busy;
    cancel.hidden=!busy;
    fileList.replaceChildren();
    for(const [index,file] of files.entries()){
      const row=node(fileList,'li',file.name);
      if(mode.value==='extract')continue;
      for(const [offset,direction] of [[-1,'Subir'],[1,'Bajar']]){
        const move=button(row,direction,()=>{
          [files[index],files[index+offset]]=[files[index+offset],files[index]];
          clearDownload();
          render();
          fileList.children[index+offset].querySelector('button:not([disabled])')?.focus();
        });
        move.className='secondary';
        move.setAttribute('aria-label',direction+' PDF '+(index+1));
        move.disabled=busy||!files[index+offset];
      }
    }
  }
  function stop(message){
    worker?.terminate();
    worker=null;
    clearTimeout(timer);timer=null;
    if(message)status.textContent=message;
    render();
  }

  mode.onchange=()=>{
    filePicker.multiple=mode.value==='merge';
    selection.hidden=mode.value!=='extract';
    filePicker.value='';files=[];status.textContent='';
    clearDownload();render();
  };
  filePicker.onchange=()=>{
    files=Array.from(filePicker.files);
    status.textContent='';
    clearDownload();render();
  };
  pages.oninput=()=>{clearDownload();status.textContent='';};
  form.onsubmit=event=>{
    event.preventDefault();
    if(worker)return;
    clearDownload();
    try{
      validateFiles(files,mode.value);
      if(mode.value==='extract'&&!pages.value.trim())throw new Error('Indica qué páginas quieres extraer.');
      const job=new Worker(new URL('./nexus-pdf-worker.js',import.meta.url),{type:'module'});
      worker=job;
      job.onmessage=({data})=>{
        if(worker!==job)return;
        if(data.error){stop(data.error);return;}
        stop('Listo. '+data.pages+' páginas en el PDF generado.');
        url=URL.createObjectURL(new Blob([data.bytes],{type:'application/pdf'}));
        download.href=url;
        download.download=mode.value==='merge'?'lifts-pdf-combinado.pdf':'lifts-paginas-extraidas.pdf';
        download.hidden=false;
      };
      job.onerror=()=>{if(worker===job)stop('No se pudo iniciar el procesamiento de PDF.');};
      timer=setTimeout(()=>{if(worker===job)stop('La operación tardó demasiado. Prueba con menos páginas o archivos más pequeños.');},45000);
      status.textContent='Procesando el PDF en este dispositivo…';
      render();
      job.postMessage({files,mode:mode.value,pages:pages.value});
    }catch(error){stop(error.message);}
  };
  node(panel,'p','Límites por operación: '+pdfLimits.maxFiles+' archivos al combinar, 20 MiB en total y '+pdfLimits.maxPages+' páginas de salida.');
  clearDownload();
  render();
  return ()=>{
    stop();
    clearDownload();
    panel.remove();
  };
}
