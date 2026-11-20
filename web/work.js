'use strict';
((root)=>{
  const localDate=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const localInput=date=>`${localDate(date)}T${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
  function interval(date,time,duration){const start=new Date(`${date}T${time}`);const minutes=Number(duration);if(!Number.isFinite(start.getTime()) || !Number.isFinite(minutes) || minutes<5 || minutes>720)return null;return{start:start.getTime(),end:start.getTime()+minutes*60000};}
  function overlaps(a,b){return a.start<b.end && b.start<a.end;}
  function plan(tasks,date,startTime='09:00',endTime='17:00', options={}){
    const shift=interval(date,startTime,5);const end=interval(date,endTime,5);if(!shift || !end)return{error:'Revisa la fecha y el horario de tu jornada.'};
    let stop=end.start;if(stop<=shift.start){const following=new Date(stop);following.setDate(following.getDate()+1);stop=following.getTime();}
    const earliest=Math.max(shift.start,options.now || shift.start);
    const movable=t=>{
      if(!t.startAt)return true;
      if(t.date&&t.date>date)return false;
      const start=Date.parse(t.startAt);
      const expired=start+(Number(t.duration)||25)*60000<=(options.now || shift.start);
      return (options.recover&&expired&&(localDate(new Date(start))<date || options.reorganize&&t.planned===true)) ||
        (options.reorganize&&t.planned===true&&start>=earliest&&start<stop);
    };
    const fixed=[...tasks.filter(t=>!movable(t)),...(options.events || [])].filter(t=>!t.done && t.startAt).map(t=>({start:Date.parse(t.startAt),end:Date.parse(t.startAt)+(Number(t.duration)||25)*60000})).filter(b=>Number.isFinite(b.start)&&b.end>shift.start&&b.start<stop).sort((a,b)=>a.start-b.start);
    const pending=tasks.filter(t=>!t.done&&movable(t)&&(!t.date||t.date<=date)).sort((a,b)=>(Number(a.priority)||2)-(Number(b.priority)||2)||(a.date||'9999').localeCompare(b.date||'9999'));
    const scheduled=[],remaining=[];let cursor=earliest;
    for(const task of pending){const minutes=Math.min(720,Math.max(5,Number(task.duration)||25));let candidate={start:cursor,end:cursor+minutes*60000};for(const block of fixed){if(overlaps(candidate,block)){candidate={start:block.end,end:block.end+minutes*60000};}}
      if(candidate.end>stop){remaining.push(task.id);continue;}scheduled.push({id:task.id,startAt:new Date(candidate.start).toISOString(),duration:minutes});cursor=candidate.end+(options.breakMinutes || 0)*60000;
    }
    return{scheduled,remaining};
  }
  function repeatMinutes(repeat) {
    const match=/^minutes:([1-9][0-9]{0,3})$/.exec(repeat || '');
    const minutes=Number(match?.[1]);
    return minutes>=5 && minutes<=1440 ? minutes : 0;
  }
  function repeatLabel(repeat) {
    const minutes=repeatMinutes(repeat);
    return minutes ? 'Cada '+minutes+' min' : ({daily:'A diario',alternate:'Días alternos',weekly:'Cada semana'}[repeat] || 'Una vez');
  }
  function reminderOccurrence(task, now=Date.now()) {
    const active=Date.parse(task.reminderAt);
    if(task.done||task.archived||task.reminderPaused||!Number.isFinite(active)||active>now)return '';
    const anchor=Date.parse(task.reminderAnchorAt);
    const occurrence=task.snoozedFrom ? active : recurrenceAt(Number.isFinite(anchor)?anchor:active,task,now,false);
    if(!Number.isFinite(occurrence)||occurrence<active)return '';
    const iso=new Date(occurrence).toISOString();
    return task.remindedFor===iso || (occurrence===active&&task.remindedFor===task.reminderAt) ? '' : iso;
  }
  function due(tasks,now=Date.now()){return tasks.filter(task=>reminderOccurrence(task,now));}
  function nextReminder(task, now=Date.now()) {
    if(!repeatMinutes(task.reminderRepeat)&&!['daily','alternate','weekly'].includes(task.reminderRepeat))return '';
    const date=recurrenceAt(Date.parse(task.reminderAt),task,now,true);
    return Number.isFinite(date)?new Date(date).toISOString():'';
  }
  function recurrenceAt(base,task,now,next){
    if(!Number.isFinite(base)||base>now)return base;
    const minutes=repeatMinutes(task.reminderRepeat);
    if(minutes){
      const step=minutes*60000;
      return base+(Math.floor((now-base)/step)+Number(next))*step;
    }
    const days={daily:1,alternate:2,weekly:7}[task.reminderRepeat];
    if(!days)return base;
    const settings={year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'};
    let formatter;
    try{formatter=new Intl.DateTimeFormat('en-CA',{...settings,timeZone:task.reminderTimeZone});}
    catch{formatter=new Intl.DateTimeFormat('en-CA',settings);}
    // Express the reminder's wall time on a UTC timeline so adding days preserves
    // the displayed hour in its original time zone, even on a different device.
    function wallTime(time){
      const parts=Object.fromEntries(formatter.formatToParts(time).map(part=>[part.type,Number(part.value)]));
      return Date.UTC(parts.year,parts.month-1,parts.day,parts.hour,parts.minute,parts.second)+new Date(time).getUTCMilliseconds();
    }
    function instant(wall){
      const candidates=[wall-43200000,wall+43200000].map(time=>wall-(wallTime(time)-time));
      const exact=candidates.filter(time=>wallTime(time)===wall);
      return Math.max(...(exact.length?exact:candidates));
    }
    const step=days*86400000;
    const origin=wallTime(base);
    const elapsed=Math.max(0,Math.floor((wallTime(now)-origin)/step));
    let wall=origin+elapsed*step;
    let candidate=elapsed ? instant(wall) : base;
    if(next&&candidate<=now)candidate=instant(wall+step);
    if(!next&&candidate>now)candidate=elapsed===1 ? base : instant(wall-step);
    return candidate;
  }
  function taskKey(title){return String(title).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
  const escapeICS=value=>String(value).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
  function fold(line){let result='',size=0;for(const character of line){const length=new TextEncoder().encode(character).length;if(size+length>75){result+='\r\n ';size=1;}result+=character;size+=length;}return result;}
  const utc=value=>new Date(value).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
  function calendar(tasks,now=new Date()){
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Lifts//Agenda//ES','CALSCALE:GREGORIAN'];
    for(const t of tasks){const start=t.startAt || (!t.reminderPaused && t.reminderAt);if(t.done||t.archived||!start||!Number.isFinite(Date.parse(start)))continue;lines.push('BEGIN:VEVENT',`UID:${escapeICS(t.id)}@lifts`, `DTSTAMP:${utc(now)}`,`DTSTART:${utc(start)}`,`DTEND:${utc(Date.parse(start)+(Number(t.duration)||25)*60000)}`,`SUMMARY:${escapeICS(t.title)}`);
      if(!t.reminderPaused&&t.reminderAt&&Number.isFinite(Date.parse(t.reminderAt)))lines.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:Recordatorio de Lifts',`TRIGGER;VALUE=DATE-TIME:${utc(t.reminderAt)}`,'END:VALARM');lines.push('END:VEVENT');}
    lines.push('END:VCALENDAR');return lines.map(fold).join('\r\n')+'\r\n';
  }
  const api={localDate,localInput,interval,overlaps,plan,due,reminderOccurrence,nextReminder,repeatMinutes,repeatLabel,taskKey,calendar};root.liftsWork=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
