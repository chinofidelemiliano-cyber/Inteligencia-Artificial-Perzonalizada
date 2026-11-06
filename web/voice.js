'use strict';
(() => {
  const el=id=>document.getElementById(id);
  const synth=window.speechSynthesis;
  let preferences={voiceURI:'',rate:1};let voices=[];let generation=0;let statusId='voiceStatus';
  function emit(phase,text=''){window.dispatchEvent?.(new CustomEvent('lifts-voice',{detail:{phase,text,target:statusId}}));}
  function stop(){generation++;emit('idle');synth?.cancel();el('voiceStatus').textContent='';el('voiceSampleStatus').textContent='';}
  function refresh(){
    if(!synth || !window.SpeechSynthesisUtterance){el('voiceStatus').textContent='Este navegador no ofrece lectura por voz.';el('readLatest').disabled=true;el('stopVoice').disabled=true;el('voiceSelect').disabled=true;el('previewVoice').disabled=true;el('stopVoiceSample').disabled=true;el('voiceSampleStatus').textContent='Este navegador no ofrece lectura por voz.';return;}
    voices=synth.getVoices();const spanish=voices.filter(v=>v.lang.toLowerCase().startsWith('es'));
    el('voiceSelect').replaceChildren();
    const automatic=document.createElement('option');automatic.value='';automatic.textContent='Automática · español';el('voiceSelect').append(automatic);
    for(const voice of spanish){const option=document.createElement('option');option.value=voice.voiceURI;option.textContent=voice.name+' · '+voice.lang+(voice.localService?' · local':'');el('voiceSelect').append(option);}
    el('voiceSelect').value=spanish.some(v=>v.voiceURI===preferences.voiceURI)?preferences.voiceURI:'';
    el('voiceRate').value=String(preferences.rate);
  }
  function configure(value={}){preferences={voiceURI:typeof value.voiceURI==='string'?value.voiceURI:'',rate:[0.85,1,1.15].includes(Number(value.rate))?Number(value.rate):1};refresh();}
  function speak(text,target='voiceStatus'){
    stop();statusId=target;if(!synth || !window.SpeechSynthesisUtterance){el(statusId).textContent='La voz no está disponible en este navegador.';emit('error');return;}
    const cleaned=String(text || '').replace(/[*#`]/g,'').trim();if(!cleaned){el(statusId).textContent='Aún no hay una respuesta para escuchar.';return;}
    const selected=voices.find(v=>v.voiceURI===el('voiceSelect').value) || voices.find(v=>v.lang==='es-MX') || voices.find(v=>v.lang.startsWith('es'));
    const chunks=cleaned.match(/[\s\S]{1,220}(?:\s|$)|[\s\S]{1,220}/g) || [cleaned];
    const version=generation;
    function next(){
      if(version!==generation)return;
      const part=chunks.shift();if(!part){el(statusId).textContent='Lectura terminada.';emit('finished');return;}
      const utterance=new window.SpeechSynthesisUtterance(part);utterance.lang=selected?.lang || 'es-MX';if(selected)utterance.voice=selected;
      utterance.rate=Number(el('voiceRate').value) || 1;
      utterance.onstart=()=>{if(version===generation)emit('speaking',cleaned);};
      utterance.onend=next;utterance.onerror=()=>{if(version===generation){el(statusId).textContent='No se pudo reproducir esta voz. Prueba otra voz o revisa el sonido del dispositivo.';emit('error');}};
      el(statusId).textContent=statusId==='voiceSampleStatus'?'Reproduciendo voz de muestra…':'Leyendo respuesta…';synth.speak(utterance);
    }
    synth.resume?.();next();
  }
  window.liftsVoice={configure,speak,stop};el('stopVoice').onclick=stop;el('stopVoiceSample').onclick=stop;
  el('previewVoice').onclick=()=>speak('Hola. Esta es una muestra de mi voz. Puedo acompañarte a organizar tu día y explicarte las cosas paso a paso.','voiceSampleStatus');
  synth?.addEventListener('voiceschanged',refresh);
  window.addEventListener('nexo-state',stop);window.addEventListener('pagehide',stop);
  configure();
})();
