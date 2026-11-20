'use strict';
(() => {
  const work = window.liftsWork;
  const api = window.liftsWorkspace;
  function dateFrom(day) {
    const now = new Date();
    if (day === 'mañana') now.setDate(now.getDate() + 1);
    if (!day || day === 'hoy' || day === 'mañana') return now;
    const date = new Date(day + 'T12:00');
    return Number.isFinite(date.getTime()) && work.localDate(date) === day ? date : null;
  }
  function handle(text) {
    const input = text.trim().replace(/^[¿¡]/, '').replace(/[.?!]$/, '');
    if (/^(?:hazme|prepárame|quiero|crea|genera)\b.*\b(?:examen|cuestionario|prueba)\b.*\bflexografía\b/i.test(input)) {
      const advanced = /avanzad/i.test(input);
      return {reply:'Preparé el cuestionario de flexografía. Puedes resolver la práctica incluida o generar una nueva con IA.',
        open:()=>window.liftsFlexoQuizUI.open(advanced)};
    }
    const reminder = /^(?:recuérdame|recuerdame)\s+(.+?)(?:\s+(hoy|mañana|\d{4}-\d{2}-\d{2}))?\s+a\s+las?\s+(\d{1,2})(?::(\d{2}))?(?:\s*(a\.?m\.?|p\.?m\.?))?((?:[,\s]+(?:con intensidad (?:alta|normal|suave)|cada (?:d[ií]a|semana|dos d[ií]as|2 d[ií]as|[0-9]{1,4} minutos?)|d[ií]as alternos|a diario)){0,2})$/i.exec(input);
    if (reminder) {
      const [, title, day, hour, minute, period, preferences] = reminder;
      const intensity = /intensidad alta/i.test(preferences) ? 1 : /intensidad suave/i.test(preferences) ? 3 : 2;
      const minutesMatch = /cada ([0-9]{1,4}) minutos?/i.exec(preferences);
      const repeat = minutesMatch ? 'minutes:'+Number(minutesMatch[1]) :
        /cada (?:dos|2) d[ií]as|d[ií]as alternos/i.test(preferences) ? 'alternate' :
        /cada semana/i.test(preferences) ? 'weekly' : /cada d[ií]a|a diario/i.test(preferences) ? 'daily' : '';
      if (minutesMatch && !work.repeatMinutes(repeat)) return {reply:'El intervalo debe ser de 5 a 1440 minutos.'};
      const date = dateFrom(day?.toLowerCase());
      let hours = Number(hour);
      const minutes = Number(minute || 0);
      if (!date || hours > 23 || minutes > 59 || (period && (hours < 1 || hours > 12)))
        return {reply:'Revisa la fecha y la hora. Por ejemplo, «Recuérdame revisar los anilox mañana a las 09:00».'};
      if (period) hours = hours % 12 + (period.toLowerCase().startsWith('p') ? 12 : 0);
      date.setHours(hours, minutes, 0, 0);
      if (!day && date <= new Date()) date.setDate(date.getDate() + 1);
      if (date <= new Date()) return {reply:'Esa hora ya pasó. Indícame una fecha y hora futuras.'};
      return {reply:'Preparé el recordatorio para ' + date.toLocaleString('es-MX', {dateStyle:'long',timeStyle:'short'}) +
        '. Revisa la intensidad y la repetición y guarda el aviso en Recordatorios.',
        open:()=>window.liftsReminders.open(title, date, {intensity,repeat})};
    }
    const frequent = /^(?:recuérdame|recuerdame)\s+(.+?)\s+cada\s+(\d{1,4})\s+minutos?$/i.exec(input);
    if (frequent) {
      const repeat = 'minutes:'+Number(frequent[2]);
      const minutes = work.repeatMinutes(repeat);
      if (!minutes) return {reply:'El intervalo debe ser de 5 a 1440 minutos.'};
      const start = new Date((Math.ceil(Date.now()/60000)+minutes)*60000);
      return {reply:'Preparé un aviso cada '+minutes+' minutos. Revisa cuándo empieza y guárdalo en Recordatorios.',
        open:()=>window.liftsReminders.open(frequent[1],start,{repeat})};
    }
    if (/^(?:ay[uú]dame a |quiero )?(?:crear|hacer|agregar|programar)\s+(?:(?:un|unos|dos|[0-9]+)\s+)?recordat/i.test(input)) {
      return {reply:'Vamos a preparar los avisos. Escribe el primero y elige fecha, repetición e intensidad. Puedes guardar los demás en la misma sección.',
        open:()=>window.liftsReminders.open()};
    }
    if (/^(?:recuérdame|recuerdame)\b/i.test(input)) return {reply:'¿En qué fecha y a qué hora? Puedes decir «Recuérdame revisar los anilox mañana a las 09:00».'};
    if (/^(?:qué|que|cuáles|cuales)\s+pendientes\b.*\besta semana\b/i.test(input)) {
      const end = new Date();
      end.setDate(end.getDate() + (7 - (end.getDay() || 7)));
      const cutoff = work.localDate(end);
      const tasks = api.getState().tasks.filter(t=>!t.done && !t.archived &&
        [t.date, t.startAt && work.localDate(new Date(t.startAt))].some(date=>date && date<=cutoff));
      tasks.sort((a,b)=>(a.priority||2)-(b.priority||2)||(a.date||'9999').localeCompare(b.date||'9999'));
      const unscheduled = api.getState().tasks.filter(t=>!t.done&&!t.archived&&!t.date&&!t.startAt).length;
      return {reply:(tasks.length ? 'Hasta el domingo, incluidos los vencidos:\n' + tasks.slice(0,20)
        .map(t=>'• '+t.title+' · '+(t.date || work.localDate(new Date(t.startAt)))).join('\n') +
        (tasks.length > 20 ? '\nConsulta los demás en Agenda.' : '') : 'No tienes pendientes con fecha hasta el domingo.') +
        (unscheduled ? '\nTambién tienes '+unscheduled+' pendientes sin fecha.' : '')};
    }
    if (/^(?:organiza|planifica|reorganiza)\s+mi\s+(?:día|jornada)(?:\s|$)/i.test(input)) {
      const date = work.localDate(dateFrom(/\bmañana\b/i.test(input) ? 'mañana' : 'hoy'));
      const urgent = /\b(?:urgente|imprevisto)\b/i.test(input);
      return {reply:urgent ? 'Preparé un borrador con prioridad alta. Indícame qué surgió y cuánto tiempo necesitas. Al guardarlo, vuelve a pulsar Planifica mi día para reorganizar los bloques flexibles.' :
        'Preparé una propuesta con tus pendientes y descansos. Puedes revisar el horario y aplicarlo desde Agenda.',
        open:()=>urgent?window.liftsWorkUI.prepareUrgent(date):window.liftsWorkUI.preparePlan(date, /^reorganiza/i.test(input))};
    }
    return null;
  }
  window.liftsAssistantActions = {handle};
})();
