'use strict';
((root)=>{
  const day=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const addDays=(d,n)=>{const v=new Date(d);v.setDate(v.getDate()+n);return v;};
  function parse(text,now=new Date()){
    const source=String(text||'').slice(0,8000).replace(/\b(?:y|también|tambien)\s+(?=(?:llamar|revisar|enviar|comprar|pagar|terminar|preparar|entregar|montar|estudiar|hacer|ir|responder|organizar)\b)/gi,'; ');
    const chunks=source.split(/[\n;]+|,(?!\d)/).map(v=>v.trim()).filter(Boolean);
    const items=[],warnings=[];const numbers={un:1,una:1,uno:1,dos:2,tres:3,cuatro:4,cinco:5,diez:10,quince:15,veinte:20,veinticinco:25,treinta:30,cuarenta:40,cincuenta:50,sesenta:60,noventa:90};
    for(const raw of chunks.slice(0,30)){
      const plain=norm(raw);let date='',duration=25;const assumptions=[];
      const explicit=raw.match(/\b(\d{4}-\d{2}-\d{2})\b/);
      if(explicit){const v=new Date(explicit[1]+'T12:00');if(Number.isFinite(v.getTime())&&day(v)===explicit[1])date=explicit[1];else assumptions.push('La fecha escrita no es válida; revísala.');}
      else if(/pasado manana/.test(plain))date=day(addDays(now,2));else if(/\bmanana\b/.test(plain))date=day(addDays(now,1));else if(/\bhoy\b/.test(plain))date=day(now);
      else if(/\ben (?:un|dos|tres|\d{1,2}) dias?\b/.test(plain)){const value=plain.match(/\ben (un|dos|tres|\d{1,2}) dias?\b/)[1];date=day(addDays(now,numbers[value]||Number(value)));}
      else{const names=['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];const index=names.findIndex(n=>new RegExp('\\b'+n+'\\b').test(plain));if(index>=0){let offset=(index-now.getDay()+7)%7;if(!offset&&/proxim[oa]/.test(plain))offset=7;date=day(addDays(now,offset));}}
      const minutes=plain.match(/\b(\d{1,3})\s*(?:minutos?|mins?|min)\b/),hours=plain.match(/\b(\d{1,2}(?:[.,]\d)?)\s*(?:horas?|hrs?|h)\b/);
      const wordHour=plain.match(/\b(un|una|dos|tres|cuatro|cinco) horas?\b/),wordMinute=plain.match(/\b(un|uno|dos|tres|cuatro|cinco|diez|quince|veinte|veinticinco|treinta|cuarenta|cincuenta|sesenta|noventa) minutos?\b/);
      if(/media hora/.test(plain))duration=30;else if(hours)duration=Math.round(Number(hours[1].replace(',','.'))*60)+(minutes?Number(minutes[1]):wordMinute?numbers[wordMinute[1]]:0);else if(wordHour)duration=numbers[wordHour[1]]*60+(minutes?Number(minutes[1]):wordMinute?numbers[wordMinute[1]]:0);else if(minutes)duration=Number(minutes[1]);else if(wordMinute)duration=numbers[wordMinute[1]];else assumptions.push('Duración estimada: 25 min.');
      if((hours||wordHour)&&/y media\b/.test(plain))duration+=30;
      if(/\b(?:diario|diariamente|cada dia|cada semana)\b/.test(plain))assumptions.push('No programé repeticiones: este borrador crea una sola tarea.');
      if(duration<5||duration>720){duration=Math.min(720,Math.max(5,duration));assumptions.push('Ajusté la duración al rango de 5 a 720 min.');}
      if(/\b(?:reunion|cita|consulta|entrevista|evento|clase)\b/.test(plain))assumptions.push('Si es una cita con día y hora fijos, regístrala primero en la agenda. Aquí la fecha se toma como objetivo, no como reserva fija.');
      if(!date)assumptions.push('Sin fecha límite: te propondré un día disponible.');
      if(/\ba las?\s+\d|\b\d{1,2}:\d{2}\b/.test(plain))assumptions.push('Hay una hora en el texto. No la tomé como cita fija; confírmala en la agenda antes de aplicar el plan.');
      let title=raw.replace(/^\s*(?:[-*]\s+|\d+[.)]\s+)/,'').replace(/^(?:por favor\s+)?(?:organ[ií]zame(?:\s+(?:mi\s+d[ií]a|estos?\s+pendientes|los?\s+pendientes))?|organiza(?:\s+(?:mi\s+d[ií]a|estos?\s+pendientes|los?\s+pendientes))?|planif[ií]came|planifica|mis pendientes son|tengo que|necesito|debo)\s*:?\s*/i,'').replace(/^(?:tengo que|necesito|debo)\s+/i,'').trim();
      if(!title||/^(?:mi d[ií]a|mis pendientes|mi jornada|mi trabajo|hoy|mañana)[.!?\s]*$/i.test(title))continue;
      items.push({id:'draft-'+items.length,title:title.slice(0,240),date,priority:/\burgente\b|\bprioridad alta\b/.test(plain)?1:/\b(?:sin prisa|prioridad baja)\b/.test(plain)?3:2,duration,done:false,assumptions});
    }
    if(chunks.length>30)warnings.push('Solo preparé los primeros 30 pendientes. Divide el resto en otra propuesta.');
    return{items,warnings};
  }
  function canPrepare(text){const value=norm(text);if(/[¿?]/.test(value)||/\bno tengo que\b/.test(value))return false;return /\b(?:organiza|organizame|planifica|planificame|programa|programame|tengo que|mis pendientes)\b/.test(value)&&!/^\s*(?:como|que es|por que)/.test(value)&&(/[:;\n]/.test(value)||/\b(?:llamar|revisar|enviar|comprar|pagar|terminar|preparar|entregar|montar|estudiar|responder)\b/.test(value));}
  function plan(tasks,drafts,options={},now=new Date()){
    const date=options.date||day(now),start=options.start||'09:00',end=options.end||'17:00';
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(new Date(date+'T12:00').getTime())||!/^([01]\d|2[0-3]):[0-5]\d$/.test(start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(end))return{error:'Revisa el día y las horas de tu jornada.'};
    if(day(new Date(date+'T12:00'))!==date)return{error:'La fecha de inicio no es válida.'};
    const days=Math.min(7,Math.max(1,Number(options.days)||3)),focus=Math.min(120,Math.max(15,Number(options.focus)||50)),pause=Math.min(30,Math.max(3,Number(options.pause)||5)),lead=Math.min(60,Math.max(0,Number(options.lead)||5));
    const stamp=now.getTime();const movable=tasks.filter(t=>!t.done&&t.kind!=='break'&&t.kind!=='personal-checkin'&&(!t.startAt||(options.replanExpired&&Date.parse(t.startAt)+(Number(t.duration)||25)*60000<=stamp)));
    const candidates=[...(options.includeExisting===false?[]:movable),...drafts].map(t=>({...t,duration:Math.min(720,Math.max(5,Number(t.duration)||25))})).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||(Number(a.priority)||2)-(Number(b.priority)||2));
    const ids=new Set(options.includeExisting===false?[]:movable.map(t=>t.id));
    const fixedTasks=tasks.filter(t=>!t.done&&t.startAt&&!ids.has(t.id));
    const fixed=fixedTasks.map(t=>({start:Date.parse(t.startAt),end:Date.parse(t.startAt)+(Number(t.duration)||25)*60000})).filter(b=>Number.isFinite(b.start)&&b.end>b.start).sort((a,b)=>a.start-b.start);
    const entries=[],remaining=[...candidates],warnings=[];
    const find=(cursor,length,stop)=>{let from=cursor;for(const block of fixed){if(from+length<=block.start)break;if(from<block.end&&from+length>block.start)from=block.end;}return from+length<=stop?from:null;};
    for(let index=0;index<days&&remaining.length;index++){
      const current=day(addDays(new Date(date+'T12:00'),index));let cursor=Math.max(new Date(current+'T'+start).getTime(),Math.ceil(stamp/300000)*300000);let stop=new Date(current+'T'+end).getTime();if(stop<=new Date(current+'T'+start).getTime())stop=addDays(new Date(current+'T'+end),1).getTime();let effort=0;
      for(let i=0;i<remaining.length;){const task=remaining[i];const from=find(cursor,task.duration*60000,stop);if(from===null){i++;continue;}
        const at=new Date(from).toISOString(),endAt=new Date(from+task.duration*60000).toISOString();entries.push({id:task.id,title:task.title,kind:'task',startAt:at,endAt,duration:task.duration,date:task.date||day(new Date(from)),priority:task.priority||2,reminderAt:new Date(Math.max(stamp,from-lead*60000)).toISOString(),late:!!task.date&&day(new Date(from))>task.date,isNew:drafts.some(t=>t.id===task.id)});cursor=from+task.duration*60000;effort+=task.duration;remaining.splice(i,1);
        if(task.duration>focus)warnings.push('«'+task.title+'» supera tu intervalo de enfoque. Considera dividirla; esta propuesta conserva la tarea completa.');
        if(effort>=focus){const rest=find(cursor,pause*60000,stop);if(rest!==null){entries.push({id:'pause-'+entries.length,title:'Pausa sugerida',kind:'break',startAt:new Date(rest).toISOString(),endAt:new Date(rest+pause*60000).toISOString(),duration:pause,date:day(new Date(rest)),priority:3,reminderAt:new Date(rest).toISOString(),isNew:true});cursor=rest+pause*60000;effort=0;}}
      }
    }
    if(entries.some(e=>e.late))warnings.push('Algunas tareas quedarían después de su fecha objetivo. Revisa su alcance o negocia la entrega; no cambié esa fecha.');
    if(remaining.length)warnings.push('No todo cabe. Puedes ampliar los días, reducir el alcance o dividir tareas grandes.');
    const rangeStart=new Date(date+'T'+start).getTime();let rangeEnd=new Date(day(addDays(new Date(date+'T12:00'),days-1))+'T'+end).getTime();if(end<=start)rangeEnd=addDays(new Date(rangeEnd),1).getTime();
    const reserved=fixedTasks.filter(t=>Date.parse(t.startAt)>=rangeStart&&Date.parse(t.startAt)<rangeEnd).map(t=>({...t,endAt:new Date(Date.parse(t.startAt)+(Number(t.duration)||25)*60000).toISOString(),existing:true}));
    return{entries,reserved,remaining:remaining.map(t=>({id:t.id,title:t.title,duration:t.duration})),warnings:[...new Set(warnings)],timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone};
  }
  function followup(tasks,session,now=Date.now()){
    if(session&&!session.paused&&!session.finished&&session.endsAt>now)return{type:'focus',task:tasks.find(t=>t.id===session.taskId),at:session.endsAt,message:session.kind==='break'?'Estás en tu pausa. Cuando termine, elegimos el siguiente paso.':'Vas bien: una cosa a la vez. Tu próxima pausa será al terminar este bloque.'};
    if(session?.finished&&session.kind!=='break')return{type:'break',task:tasks.find(t=>!t.done&&t.kind==='break'&&Date.parse(t.startAt)<=now+300000&&Date.parse(t.startAt)+(Number(t.duration)||5)*60000>now),message:'Terminaste un bloque de enfoque. ¿Te viene bien descansar 5 minutos antes de continuar?'};
    const pending=tasks.filter(t=>!t.done&&t.kind!=='personal-checkin'&&(!t.coachCheckAfter||Date.parse(t.coachCheckAfter)<=now));
    const current=pending.filter(t=>t.startAt&&Date.parse(t.startAt)<=now&&Date.parse(t.startAt)+(Number(t.duration)||25)*60000>now).sort((a,b)=>a.startAt.localeCompare(b.startAt))[0];
    if(current)return{type:current.kind==='break'?'break':'current',task:current,message:current.kind==='break'?'Tienes una pausa sugerida ahora. Tómala cuando tu actividad lo permita.':'Ahora habías reservado tiempo para «'+current.title+'». ¿Cómo vas?'};
    const ended=pending.find(t=>t.kind!=='break'&&t.startAt&&Date.parse(t.startAt)+(Number(t.duration)||25)*60000<=now);
    if(ended)return{type:'check',task:ended,message:'Ya pasó el bloque de «'+ended.title+'». ¿Lo terminaste o lo reorganizamos?'};
    const next=pending.filter(t=>t.startAt&&Date.parse(t.startAt)>now).sort((a,b)=>a.startAt.localeCompare(b.startAt))[0];
    if(next)return{type:'next',task:next,at:Date.parse(next.startAt),message:'Tu siguiente bloque es «'+next.title+'». Podemos preparar lo necesario con calma.'};
    const unplanned=pending.filter(t=>t.kind!=='break').sort((a,b)=>(a.priority||2)-(b.priority||2))[0];
    return unplanned?{type:'plan',task:unplanned,message:'Tienes pendiente «'+unplanned.title+'». ¿Le damos un espacio en tu jornada?'}:{type:'empty',message:'Cuéntame qué necesitas hacer, cuándo lo debes entregar y cuánto podría tardar. Prepararemos una jornada que deje espacio para descansar.'};
  }
  const api={parse,plan,followup,canPrepare};root.liftsCoaching=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
