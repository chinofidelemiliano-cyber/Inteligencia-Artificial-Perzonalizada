'use strict';
(() => {
  const el=id=>document.getElementById(id);
  const synth=window.speechSynthesis;
  let preferences={voiceURI:'',rate:1};let voices=[];let generation=0;
  function stop(){generation++;synth?.cancel();el('voiceStatus').textContent='';}
  function refresh(){
    if(!synth || !window.SpeechSynthesisUtterance){el('voiceStatus').textContent='Este navegador no ofrece lectura por voz.';el('readLatest').disabled=true;el('stopVoice').disabled=true;el('voiceSelect').disabled=true;return;}
    voices=synth.getVoices();const spanish=voices.filter(v=>v.lang.toLowerCase().startsWith('es'));
    el('voiceSelect').replaceChildren();
    const automatic=document.createElement('option');automatic.value='';automatic.textContent='Automática · español';el('voiceSelect').append(automatic);
    for(const voice of spanish){const option=document.createElement('option');option.value=voice.voiceURI;option.textContent=voice.name+' · '+voice.lang+(voice.localService?' · local':'');el('voiceSelect').append(option);}
    el('voiceSelect').value=spanish.some(v=>v.voiceURI===preferences.voiceURI)?preferences.voiceURI:'';
    el('voiceRate').value=String(preferences.rate);
  }
  function configure(value={}){preferences={voiceURI:typeof value.voiceURI==='string'?value.voiceURI:'',rate:[0.85,1,1.15].includes(Number(value.rate))?Number(value.rate):1};refresh();}
  function speak(text){
    stop();if(!synth || !window.SpeechSynthesisUtterance){el('voiceStatus').textContent='La voz no está disponible en este navegador.';return;}
    const cleaned=String(text || '').replace(/[*#`]/g,'').trim();if(!cleaned){el('voiceStatus').textContent='Aún no hay una respuesta para escuchar.';return;}
    const selected=voices.find(v=>v.voiceURI===el('voiceSelect').value) || voices.find(v=>v.lang==='es-MX') || voices.find(v=>v.lang.startsWith('es'));
    const chunks=cleaned.match(/[\s\S]{1,220}(?:\s|$)|[\s\S]{1,220}/g) || [cleaned];
    const version=generation;
    function next(){
      if(version!==generation)return;
      const part=chunks.shift();if(!part){el('voiceStatus').textContent='Lectura terminada.';return;}
      const utterance=new window.SpeechSynthesisUtterance(part);utterance.lang=selected?.lang || 'es-MX';if(selected)utterance.voice=selected;
      utterance.rate=Number(el('voiceRate').value) || 1;
      utterance.onend=next;utterance.onerror=()=>{if(version===generation)el('voiceStatus').textContent='No se pudo reproducir esta voz. Prueba otra voz o revisa el sonido del dispositivo.';};
      el('voiceStatus').textContent='Leyendo respuesta…';synth.speak(utterance);
    }
    next();
  }
  window.liftsVoice={configure,speak,stop};el('stopVoice').onclick=stop;
  synth?.addEventListener('voiceschanged',refresh);
  window.addEventListener('nexo-state',stop);window.addEventListener('pagehide',stop);
  configure();
})();
