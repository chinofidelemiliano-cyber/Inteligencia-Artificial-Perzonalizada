'use strict';
((root)=>{
  const localDate=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const localInput=date=>`${localDate(date)}T${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
  function interval(date,time,duration){const start=new Date(`${date}T${time}`);const minutes=Number(duration);if(!Number.isFinite(start.getTime()) || !Number.isFinite(minutes) || minutes<5 || minutes>720)return null;return{start:start.getTime(),end:start.getTime()+minutes*60000};}
  function overlaps(a,b){return a.start<b.end && b.start<a.end;}
  function plan(tasks,date,startTime='09:00',endTime='17:00'){
    const shift=interval(date,startTime,5);const end=interval(date,endTime,5);if(!shift || !end)return{error:'Revisa la fecha y el horario de tu jornada.'};
    let stop=end.start;if(stop<=shift.start){const following=new Date(stop);following.setDate(following.getDate()+1);stop=following.getTime();}
    const fixed=tasks.filter(t=>!t.done && t.startAt).map(t=>({start:Date.parse(t.startAt),end:Date.parse(t.startAt)+(Number(t.duration)||25)*60000})).filter(b=>Number.isFinite(b.start)&&b.end>shift.start&&b.start<stop).sort((a,b)=>a.start-b.start);
    const pending=tasks.filter(t=>!t.done&&!t.startAt&&(!t.date||t.date<=date)).sort((a,b)=>(Number(a.priority)||2)-(Number(b.priority)||2)||(a.date||'9999').localeCompare(b.date||'9999'));
    const scheduled=[],remaining=[];let cursor=shift.start;
    for(const task of pending){const minutes=Math.min(720,Math.max(5,Number(task.duration)||25));let candidate={start:cursor,end:cursor+minutes*60000};for(const block of fixed){if(overlaps(candidate,block)){candidate={start:block.end,end:block.end+minutes*60000};}}
      if(candidate.end>stop){remaining.push(task.id);continue;}scheduled.push({id:task.id,startAt:new Date(candidate.start).toISOString(),duration:minutes});cursor=candidate.end;
    }
    return{scheduled,remaining};
  }
  function due(tasks,now=Date.now()){return tasks.filter(t=>!t.done&&t.reminderAt&&Number.isFinite(Date.parse(t.reminderAt))&&Date.parse(t.reminderAt)<=now&&t.remindedFor!==t.reminderAt);}
  const escapeICS=value=>String(value).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
  function fold(line){let result='',size=0;for(const character of line){const length=new TextEncoder().encode(character).length;if(size+length>75){result+='\r\n ';size=1;}result+=character;size+=length;}return result;}
  const utc=value=>new Date(value).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
  function calendar(tasks,now=new Date()){
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Lifts//Agenda//ES','CALSCALE:GREGORIAN'];
    for(const t of tasks){const start=t.startAt || t.reminderAt;if(t.done||!start||!Number.isFinite(Date.parse(start)))continue;lines.push('BEGIN:VEVENT',`UID:${escapeICS(t.id)}@lifts`, `DTSTAMP:${utc(now)}`,`DTSTART:${utc(start)}`,`DTEND:${utc(Date.parse(start)+(Number(t.duration)||25)*60000)}`,`SUMMARY:${escapeICS(t.title)}`);
      if(t.reminderAt&&Number.isFinite(Date.parse(t.reminderAt)))lines.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:Recordatorio de Lifts',`TRIGGER;VALUE=DATE-TIME:${utc(t.reminderAt)}`,'END:VALARM');lines.push('END:VEVENT');}
    lines.push('END:VCALENDAR');return lines.map(fold).join('\r\n')+'\r\n';
  }
  const api={localDate,localInput,interval,overlaps,plan,due,calendar};root.liftsWork=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
