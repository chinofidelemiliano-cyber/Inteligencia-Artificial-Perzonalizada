'use strict';
(() => {
  const $=id=>document.getElementById(id);const api=window.liftsWorkspace;
  let pending='',delivered=false,hadSession=false;
  function clear(){if($('question').value.trim()===pending)$('question').value='';pending='';delivered=false;sync();}
  function useChat(){if(!pending||!stateReady())return;if($('question').value.trim()&&$('question').value.trim()!==pending&&!confirm('¿Reemplazar el borrador del chat por tu dictado?'))return;delivered=true;api.open('home');$('question').value=pending;$('question').focus();$('voiceLinkStatus').textContent='Dictado listo. Revísalo y pulsa Enviar cuando quieras.';}
  function stateReady(){return !$('workspace').hidden&&api.getState().onboardingCompleted;}
  function sync(){const signedIn=!$('workspace').hidden;if(hadSession&&!signedIn){pending='';delivered=false;hadSession=false;}$('voiceLinkAuthNotice').hidden=!pending||signedIn;$('voiceLinkBanner').hidden=!pending||!signedIn;$('useVoiceChat').disabled=!stateReady();$('useVoiceTask').disabled=!stateReady();
    if(signedIn)hadSession=true;
    if(!pending)return;
    if(!stateReady()){$('voiceLinkStatus').textContent='Tu dictado está en espera. Completa la bienvenida o continúa sin personalizar para usarlo.';return;}
    if(!delivered){delivered=true;const draft=$('question').value.trim();if(!draft){api.open('home');$('question').value=pending;$('voiceLinkStatus').textContent='Tu dictado está preparado en el chat. Revísalo antes de enviarlo.';}else $('voiceLinkStatus').textContent='Llegó un dictado. Elige dónde usarlo; tu borrador actual no se reemplazó.';}
  }
  function receive(){const incoming=window.liftsShortcut.parse(location.href);if(!incoming)return;
    // URL fragments do not travel in HTTP requests; remove the dictation from the address bar immediately.
    try{history.replaceState(history.state,'',incoming.cleanUrl);}catch{}
    if(incoming.error){pending='';$('shortcutError').hidden=false;$('shortcutError').textContent=incoming.error;sync();return;}
    pending=incoming.text;delivered=false;$('shortcutError').hidden=true;sync();
  }
  $('useVoiceChat').onclick=useChat;
  $('useVoiceTask').onclick=()=>{if(!pending||!stateReady())return;window.liftsWorkUI?.prepareTask(pending);$('voiceLinkStatus').textContent='Tarea preparada. Revisa su título, fecha y recordatorio y pulsa Agregar tarea para guardarla.';};
  $('dismissVoiceLink').onclick=clear;
  window.addEventListener('nexo-state',()=>queueMicrotask(sync));window.addEventListener('lifts-page',()=>queueMicrotask(sync));window.addEventListener('hashchange',receive);
  window.addEventListener('lifts-message-sent',event=>{if(pending&&event.detail?.text.trim()===pending)clear();});
  window.addEventListener('lifts-task-created',event=>{if(pending&&event.detail?.title===pending.slice(0,240).trim())clear();});
  receive();sync();
})();
