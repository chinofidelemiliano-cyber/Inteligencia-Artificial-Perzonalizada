'use strict';
((root)=>{
  const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const words={cero:0,un:1,uno:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,once:11,doce:12,trece:13,catorce:14,quince:15,dieciseis:16,diecisiete:17,dieciocho:18,diecinueve:19,veinte:20,veintiuno:21,veintidos:22,veintitres:23,treinta:30,cuarenta:40,cincuenta:50};
  const questions=[
    {key:'mood',label:'Ánimo',prompt:'¿Cómo te sientes hoy? Cuéntamelo con tus propias palabras.'},
    {key:'stress',label:'Estrés, de 0 a 10',prompt:'De cero a diez, ¿cuánto estrés sientes ahora?'},
    {key:'sleepHours',label:'Horas que dormiste',prompt:'¿Cuántas horas dormiste? Puedes decir, por ejemplo, seis y media.'},
    {key:'wakeTime',label:'Hora de despertar',prompt:'¿A qué hora te levantaste? Por ejemplo: seis treinta de la mañana.'},
    {key:'energy',label:'Energía, de 0 a 10',prompt:'¿Cómo está tu energía, de cero a diez?'},
    {key:'concerns',label:'Lo que te preocupa',prompt:'¿Hay algo que te preocupe o te esté pesando? Comparte solo lo que te resulte cómodo.'},
    {key:'personalTasks',label:'Pendientes personales',prompt:'¿Qué pendientes personales quieres combinar con tu trabajo? Puedes decir varios, separados por una pausa.'},
    {key:'goal',label:'Un paso pequeño para hoy',prompt:'¿Qué pequeña cosa te gustaría lograr hoy para sentir que avanzaste?'}
  ];
  function number(text){const s=normalize(text);const numeric=s.match(/\b\d{1,2}(?:[.,]\d{1,2})?\b/);if(numeric)return Number(numeric[0].replace(',','.'));for(const token of s.split(/\s+/))if(Object.hasOwn(words,token))return words[token];return null;}
  function parseAnswer(key,text){
    const s=normalize(text);if(/^(?:omitir|omite|pasar|paso|siguiente|no quiero responder|prefiero no responder)[.!\s]*$/.test(s))return{skip:true};
    if(['mood','concerns','personalTasks','goal'].includes(key)){const value=String(text).trim().slice(0,key==='mood'?80:key==='goal'?240:1000);return value?{value}:{error:'Puedes responder brevemente o decir omitir.'};}
    if(key==='wakeTime'){
      let hours,minutes=0;const exact=s.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/);
      if(exact){hours=Number(exact[1]);minutes=Number(exact[2]);}else{const values=s.split(/\s+/).map(token=>Object.hasOwn(words,token)?words[token]:/^\d{1,2}$/.test(token)?Number(token):null).filter(v=>v!==null);hours=values[0];if(/y media/.test(s))minutes=30;else if(/y cuarto/.test(s))minutes=15;else if(values.length>1)minutes=values[1]+(values.length>2?values[2]:0);}
      if(!Number.isFinite(hours)||hours>23||minutes>59)return{error:'Dime una hora, por ejemplo seis treinta de la mañana, o di omitir.'};
      if(/tarde|noche|\bp\s*m\b|pm/.test(s)&&hours<12)hours+=12;if(/manana|\ba\s*m\b|am/.test(s)&&hours===12)hours=0;
      return{value:String(hours).padStart(2,'0')+':'+String(minutes).padStart(2,'0'),note:'Revisa la hora en formato de 24 horas antes de aplicar el resumen.'};
    }
    if(key==='sleepHours'&&/a las|desde|hasta/.test(s))return{error:'Dime las horas que dormiste en total, por ejemplo seis horas, o di omitir.'};
    let value=key==='sleepHours'&&/media hora/.test(s)?0.5:number(text);if(key==='sleepHours'&&value!==null&&/y media|y medio/.test(s)&&Number.isInteger(value))value+=0.5;
    const max=key==='sleepHours'?24:10;if(value===null||value<0||value>max)return{error:key==='sleepHours'?'Dime cuántas horas dormiste, de cero a veinticuatro, o di omitir.':'Puedes dar un número de cero a diez o decir omitir.'};return{value};
  }
  function clean(value={}){const result={};for(const key of ['mood','concerns','personalTasks','goal'])if(typeof value[key]==='string'&&value[key].trim())result[key]=value[key].trim().slice(0,key==='mood'?80:key==='goal'?240:1000);for(const key of ['stress','sleepHours','energy'])if(typeof value[key]==='number'&&Number.isFinite(value[key])&&value[key]>=0&&value[key]<=(key==='sleepHours'?24:10))result[key]=value[key];if(typeof value.wakeTime==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(value.wakeTime))result.wakeTime=value.wakeTime;return result;}
  function recommend(input={}){
    const value=clean(input),gentle=(value.stress!==undefined&&value.stress>=7)||(value.sleepHours!==undefined&&value.sleepHours<6)||(value.energy!==undefined&&value.energy<=3);
    const notes=[];if(gentle)notes.push('Si te notas con poca reserva, probemos un ritmo más ligero: un pendiente importante y bloques de 25 minutos con pausas de 5. Puedes ajustarlo.');else notes.push('Podemos elegir una prioridad y probar bloques de 40 minutos con pausas de 5, ajustándolos a cómo te sientas.');
    if(value.mood&&/trist|preocup|agob|mal|ansios|desanim|cansad/.test(normalize(value.mood)))notes.push('Gracias por decir cómo estás. No hace falta resolver todo de una vez: elige un paso pequeño que hoy sí esté a tu alcance.');
    if(value.concerns)notes.push('Para lo que te preocupa, podemos separar una acción posible de hoy de lo que necesita más tiempo o apoyo de alguien de confianza.');
    if(value.sleepHours!==undefined)notes.push('Registraste '+value.sleepHours+' horas de sueño. Tómalo como información para ajustar tu día, no como una medida de tu valor ni un diagnóstico.');
    if(value.goal)notes.push('Tu paso elegido: «'+value.goal+'». Reservemos un espacio realista y revisemos después cómo te fue.');
    return{focus:gentle?25:40,pause:5,notes};
  }
  function history(entries){return(Array.isArray(entries)?entries:[]).filter(e=>e&&typeof e.day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(e.day)).slice(-14).map(e=>({day:e.day,savedAt:typeof e.savedAt==='string'?e.savedAt.slice(0,40):'',...clean(e)}));}
  const api={questions,parseAnswer,clean,recommend,history};root.liftsWellbeing=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
