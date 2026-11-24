'use strict';
(() => {
  const record=document.getElementById('fieldRecord'), stop=document.getElementById('fieldStopAudio');
  const discard=document.getElementById('fieldDiscardAudio'), audio=document.getElementById('fieldAudio');
  const download=document.getElementById('fieldDownloadAudio'), status=document.getElementById('fieldAudioStatus');
  const supported=typeof MediaRecorder==='function'&&typeof navigator.mediaDevices?.getUserMedia==='function';
  const stopTracks=stream=>stream?.getTracks().forEach(track=>track.stop());
  const extensions={'audio/webm':'webm','audio/mp4':'m4a','audio/ogg':'ogg','audio/wav':'wav'};
  let active=null,url='';

  function show(message=''){
    record.disabled=!supported||Boolean(active||url);
    stop.disabled=active?.recorder?.state!=='recording';
    discard.hidden=!url;
    audio.hidden=!url;
    download.hidden=!url;
    status.textContent=supported?message:'Este navegador no permite grabar audio aquí.';
  }

  function clear(message=''){
    const current=active;
    active=null;
    clearTimeout(current?.timer);
    if(current?.recorder?.state==='recording')current.recorder.stop();
    stopTracks(current?.stream);
    if(url){
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      download.removeAttribute('href');
      URL.revokeObjectURL(url);
      url='';
    }
    show(message);
  }

  function finish(session){
    if(active!==session)return;
    clearTimeout(session.timer);
    stopTracks(session.stream);
    active=null;
    const type=session.recorder.mimeType||session.chunks[0]?.type;
    const clip=new Blob(session.chunks,{type});
    if(!clip.size){show('No se capturó audio. Vuelve a intentarlo.');return;}
    url=URL.createObjectURL(clip);
    audio.src=url;
    download.href=url;
    const extension=extensions[clip.type.split(';')[0]];
    download.download='lifts-observacion'+(extension?'.'+extension:'');
    show('Observación lista para escuchar y descargar.');
  }

  record.onclick=async()=>{
    if(!supported||active||url)return;
    const session={chunks:[]};
    active=session;
    show('Esperando permiso del micrófono…');
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      if(active!==session){stopTracks(stream);return;}
      session.stream=stream;
      const recorder=new MediaRecorder(stream);
      session.recorder=recorder;
      recorder.ondataavailable=event=>{
        if(active===session&&event.data.size)session.chunks.push(event.data);
      };
      recorder.onstop=()=>finish(session);
      recorder.onerror=()=>{if(active===session)clear('La grabación se interrumpió. Vuelve a intentarlo.');};
      recorder.start();
      session.timer=setTimeout(()=>{if(active===session)stop.click();},60000);
      show('Grabando…');
    }catch(error){
      if(active!==session)return;
      clear(error.name==='NotAllowedError'?'No se concedió permiso para usar el micrófono.':'No se pudo iniciar el micrófono.');
    }
  };
  stop.onclick=()=>{
    if(active?.recorder?.state!=='recording')return;
    active.recorder.stop();
    stopTracks(active.stream);
    show('Preparando el audio…');
  };
  discard.onclick=()=>clear('Observación descartada.');
  window.addEventListener('lifts-page',event=>{if(event.detail.page!=='field')clear();});
  window.addEventListener('nexo-state',()=>clear());
  window.addEventListener('pagehide',()=>clear());
  show();
})();
