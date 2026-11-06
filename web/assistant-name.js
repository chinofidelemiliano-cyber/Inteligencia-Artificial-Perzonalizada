'use strict';
((root)=>{
  const blocked=new Set(['puta','puto','putas','putos','putita','putito','pendejo','pendeja','pendejos','pendejas','cabron','cabrona','cabrones','pinche','pinches','mierda','chingada','chingado','chingatumadre','verga','culero','culera','maricon','gilipollas','fuck','fucker','shit','bitch','asshole'].map(word=>word.replace(/(.)\1+/g,'$1')));
  const normalize=text=>text.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[013457]/g,c=>({'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t'}[c])).replace(/(.)\1+/g,'$1');
  function validate(value){
    if(typeof value!=='string')return{valid:false,error:'Escribe un nombre válido.'};
    const name=value.normalize('NFC').trim().replace(/\s+/g,' ') || 'Lifts';
    if(name.length<2 || name.length>32)return{valid:false,error:'Usa entre 2 y 32 caracteres.'};
    if(!/^[\p{L}\p{M}\p{N} '-]+$/u.test(name) || !/\p{L}/u.test(name))return{valid:false,error:'Usa letras, números, espacios, guiones o apóstrofos.'};
    const words=normalize(name).split(/[ '-]+/).map(word=>word.replace(/\d+$/,''));
    const plainWords=name.split(/[ '-]+/).map(word=>normalize(word.replace(/\d+$/,'')));
    if([...words,...plainWords].some(word=>blocked.has(word)) || blocked.has(words.join('')))return{valid:false,error:'Elige un nombre respetuoso, sin palabras ofensivas.'};
    return{valid:true,name};
  }
  const api={validate};root.liftsAssistantName=api;
  if(typeof module!=='undefined' && module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
