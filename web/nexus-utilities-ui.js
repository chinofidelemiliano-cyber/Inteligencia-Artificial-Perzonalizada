'use strict';

(function(){
  const root=document.getElementById('nexusUtilities');
  const core=window.liftsUtilitiesCore;
  if(!root||!core)return;
  const modeNames={compare:'Comparar textos',dates:'Calcular fechas',radix:'Convertir bases',base64:'Texto y Base64',image:'Redimensionar imágenes',qr:'Generar código QR'};

  function node(parent,tag,text,attributes={}){
    const child=document.createElement(tag);
    if(text!==undefined)child.textContent=text;
    for(const [key,value] of Object.entries(attributes))child.setAttribute(key,value);
    parent.append(child);
    return child;
  }

  function field(parent,label,key,tag,attributes={}){
    const id='utility-'+key;
    node(parent,'label',label,{for:id});
    return node(parent,tag,undefined,{id,name:key,...attributes});
  }

  function textResult(output,label,value){
    const result=field(output,label,'result','textarea',{rows:'4',readonly:''});
    result.value=value;
  }

  function drawComparison(form,results){
    const before=field(form,'Texto anterior','before','textarea',{rows:'5',maxlength:'16000'});
    const after=field(form,'Texto nuevo','after','textarea',{rows:'5',maxlength:'16000'});
    return ()=>{
      const result=core.compareText(before.value,after.value);
      node(results,'p','Líneas añadidas: '+result.added+' · Quitadas: '+result.removed+' · Sin cambios: '+result.unchanged);
      if(!result.changes.length)return;
      const list=node(results,'ol');
      for(const change of result.changes){
        const prefix=change.kind==='added'?'Añadida, línea nueva ':'Quitada, línea anterior ';
        const row=node(list,'li');
        node(row,'strong',prefix+change.line);
        const line=node(row,'pre',change.text||'Línea vacía');
        line.style.whiteSpace='pre-wrap';
        line.style.overflowWrap='anywhere';
      }
    };
  }

  function drawDates(form,results){
    const start=field(form,'Fecha inicial','start','input',{type:'date',min:'0001-01-01',max:'9999-12-31',required:''});
    const operation=field(form,'Operación de fecha','date-operation','select');
    node(operation,'option','Días entre dos fechas',{value:'between'});
    node(operation,'option','Desplazar una fecha',{value:'offset'});
    const endPanel=node(form,'div');
    const end=field(endPanel,'Fecha final','end','input',{type:'date',min:'0001-01-01',max:'9999-12-31',required:''});
    const daysPanel=node(form,'div',undefined,{hidden:''});
    const days=field(daysPanel,'Días de desplazamiento','offset','input',{type:'number',step:'1',disabled:''});
    operation.onchange=()=>{
      const offset=operation.value==='offset';
      endPanel.hidden=offset;end.disabled=offset;
      daysPanel.hidden=!offset;days.disabled=!offset;days.required=offset;
    };
    return ()=>{
      if(operation.value==='offset')node(results,'p','Fecha resultante: '+core.addDays(start.value,days.valueAsNumber));
      else node(results,'p','Fecha final − fecha inicial: '+core.daysBetween(start.value,end.value)+' días naturales.');
    };
  }

  function drawRadix(form,results){
    const value=field(form,'Número a convertir','number','input',{type:'text',maxlength:'257',required:''});
    const from=field(form,'Base de origen','from','select');
    const to=field(form,'Base de destino','to','select');
    for(const select of [from,to]){
      for(const [number,label] of [['2','2 · Binaria'],['8','8 · Octal'],['10','10 · Decimal'],['16','16 · Hexadecimal']]){
        node(select,'option',label,{value:number});
      }
    }
    from.value='10';to.value='16';
    return ()=>textResult(results,'Resultado de la conversión',core.convertBase(value.value,Number(from.value),Number(to.value)));
  }

  function drawBase64(form,results){
    const mode=field(form,'Operación Base64','base64-operation','select');
    node(mode,'option','Convertir texto a Base64',{value:'encode'});
    node(mode,'option','Convertir Base64 a texto',{value:'decode'});
    const value=field(form,'Contenido a convertir','base64-value','textarea',{rows:'5',maxlength:'16000'});
    mode.onchange=()=>{value.maxLength=mode.value==='encode'?16000:64000;};
    return ()=>{
      const result=mode.value==='decode'?core.decodeText(value.value):core.encodeText(value.value);
      textResult(results,'Resultado de la conversión',result);
    };
  }

  async function openImage(file){
    try{
      if(typeof createImageBitmap==='function')return await createImageBitmap(file);
      const source=URL.createObjectURL(file);
      try{
        const image=new Image();
        await new Promise((resolve,reject)=>{
          image.onload=resolve;image.onerror=reject;image.src=source;
        });
        return image;
      }finally{URL.revokeObjectURL(source);}
    }catch{
      throw new Error('El navegador no pudo abrir la imagen.');
    }
  }

  function downloadFile(blob,filename){
    const url=URL.createObjectURL(blob);
    const link=node(document.body,'a',undefined,{href:url,download:filename});
    link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function drawImage(form,results){
    node(form,'p','PNG o JPEG, hasta 16 MiB y 24 megapíxeles. Se conserva la proporción y se reduce la imagen si supera los límites elegidos.');
    const file=field(form,'Archivo de imagen','image-file','input',{type:'file',accept:'image/png,image/jpeg,.png,.jpg,.jpeg',required:''});
    const edge={type:'number',min:'1',max:String(core.maxOutputEdge),step:'1',value:'1600',required:''};
    const width=field(form,'Ancho máximo en píxeles','image-width','input',edge);
    const height=field(form,'Alto máximo en píxeles','image-height','input',edge);
    const format=field(form,'Formato de salida','image-format','select');
    node(format,'option','PNG',{value:'image/png'});
    node(format,'option','JPEG',{value:'image/jpeg'});
    const qualityPanel=node(form,'div',undefined,{hidden:''});
    const quality=field(qualityPanel,'Calidad JPEG (%)','image-quality','input',{type:'number',min:'10',max:'100',value:'80',step:'1',disabled:''});
    node(qualityPanel,'p','JPEG convierte las zonas transparentes en blancas.');
    format.onchange=()=>{
      const jpeg=format.value==='image/jpeg';
      qualityPanel.hidden=!jpeg;quality.disabled=!jpeg;quality.required=jpeg;
    };

    return async isCurrent=>{
      const source=file.files[0],type=format.value,maxWidth=width.valueAsNumber,maxHeight=height.valueAsNumber,compression=quality.valueAsNumber/100;
      if(!source||source.size>core.maxImageBytes)throw new Error('Elige una imagen de hasta 16 MiB.');
      core.inspectImage(await source.arrayBuffer());
      if(!isCurrent())return;
      const image=await openImage(source);
      try{
        if(!isCurrent())return;
        const originalWidth=image.naturalWidth||image.width,originalHeight=image.naturalHeight||image.height;
        const output=core.fitImage(originalWidth,originalHeight,maxWidth,maxHeight);
        const canvas=document.createElement('canvas');
        canvas.width=output.width;canvas.height=output.height;
        const context=canvas.getContext('2d');
        if(!context)throw new Error('El navegador no admite la conversión de imágenes.');
        if(type==='image/jpeg'){
          context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);
        }
        context.imageSmoothingQuality='high';
        context.drawImage(image,0,0,canvas.width,canvas.height);
        const blob=await new Promise(resolve=>canvas.toBlob(resolve,type,compression));
        if(!isCurrent())return;
        if(!blob||blob.type!==type)throw new Error('El navegador no pudo generar el formato elegido.');
        const formatSize=bytes=>new Intl.NumberFormat('es-MX',{maximumFractionDigits:1}).format(bytes/1024)+' KiB';
        node(results,'p','Original: '+originalWidth+' × '+originalHeight+' px · '+formatSize(source.size)+'.');
        node(results,'p','Resultado: '+output.width+' × '+output.height+' px · '+formatSize(blob.size)+'.');
        const jpeg=type==='image/jpeg';
        node(results,'button',jpeg?'Descargar JPEG':'Descargar PNG',{type:'button'}).onclick=()=>downloadFile(blob,jpeg?'lifts-imagen.jpg':'lifts-imagen.png');
      }finally{image.close?.();}
    };
  }

  function drawQr(form,results){
    const payload=field(form,'Texto o enlace del código QR','qr-payload','textarea',{rows:'4',maxlength:'500',required:''});
    node(form,'p','Hasta 500 bytes de texto UTF-8. Cualquiera que escanee el código podrá leer su contenido.',{class:'notice'});
    return async isCurrent=>{
      const value=payload.value;
      const {qrMatrix}=await import('./nexus-utilities-qr.js');
      if(!isCurrent())return;
      const matrix=qrMatrix(value);
      const moduleSize=8,quietZone=4;
      const canvas=document.createElement('canvas');
      canvas.width=canvas.height=(matrix.length+quietZone*2)*moduleSize;
      canvas.style.maxWidth='100%';
      canvas.style.height='auto';
      canvas.setAttribute('role','img');
      canvas.setAttribute('aria-label','Vista previa del código QR');
      const context=canvas.getContext('2d');
      if(!context)throw new Error('El navegador no admite la generación de imágenes.');
      context.fillStyle='#fff';
      context.fillRect(0,0,canvas.width,canvas.height);
      context.fillStyle='#000';
      for(const [row,modules] of matrix.entries()){
        for(const [column,dark] of modules.entries()){
          if(dark)context.fillRect((column+quietZone)*moduleSize,(row+quietZone)*moduleSize,moduleSize,moduleSize);
        }
      }
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
      if(!isCurrent())return;
      if(!blob)throw new Error('El navegador no pudo generar el PNG.');
      results.append(canvas);
      const actions=node(results,'p');
      node(actions,'button','Descargar código QR',{type:'button'}).onclick=()=>downloadFile(blob,'lifts-codigo-qr.png');
    };
  }

  const drawers={compare:drawComparison,dates:drawDates,radix:drawRadix,base64:drawBase64,image:drawImage,qr:drawQr};
  function mount(){
    root.replaceChildren();
    const card=node(root,'article',undefined,{class:'card'});
    node(card,'h2','Utilidades locales');
    node(card,'p','El contenido se procesa en tu navegador y se borra al cambiar de herramienta o de cuenta.',{class:'notice'});
    const mode=field(card,'Herramienta','mode','select');
    for(const [key,name] of Object.entries(modeNames))node(mode,'option',name,{value:key});
    const panel=node(card,'div');
    function render(){
      panel.replaceChildren();
      const form=node(panel,'form');
      const results=document.createElement('div');
      const run=drawers[mode.value](form,results);
      const imageMode=mode.value==='image';
      const qrMode=mode.value==='qr';
      const submit=node(form,'button',imageMode?'Procesar imagen':qrMode?'Generar código QR':'Calcular',{type:'submit'});
      const status=node(panel,'p','',{role:'status'});
      panel.append(results);
      let revision=0;
      form.oninput=()=>{
        revision++;submit.disabled=false;status.textContent='';results.replaceChildren();
      };
      form.onsubmit=async event=>{
        event.preventDefault();
        const current=++revision;
        const isCurrent=()=>form.isConnected&&revision===current;
        results.replaceChildren();
        submit.disabled=true;
        if(imageMode||qrMode)status.textContent=imageMode?'Procesando imagen…':'Generando código QR…';
        try{
          await run(isCurrent);
          if(isCurrent())status.textContent=imageMode?'Imagen lista.':qrMode?'Código QR listo.':'Resultado calculado.';
        }catch(error){if(isCurrent())status.textContent=error.message;}
        finally{if(isCurrent())submit.disabled=false;}
      };
    }
    mode.onchange=render;
    render();
  }

  window.liftsUtilities={reset:mount};
  window.addEventListener('nexo-state',mount);
  mount();
})();
