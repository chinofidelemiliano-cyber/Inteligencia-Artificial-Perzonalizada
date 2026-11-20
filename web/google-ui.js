'use strict';
(() => {
  const api = window.liftsWorkspace;
  const work = window.liftsWork;
  const root = document.createElement('article');
  root.className = 'card';
  root.innerHTML = `
    <h3>Google Calendar y Gmail</h3>
    <p>Conecta cada servicio cuando lo necesites. Lifts usa la disponibilidad de tu calendario principal para planificar y sincroniza bloques y recordatorios en un calendario separado. Gmail muestra remitentes y asuntos recientes.</p>
    <label for="googleClientId">ID de cliente web de Google OAuth</label>
    <input id="googleClientId" maxlength="220" autocomplete="off" placeholder="…apps.googleusercontent.com">
    <div class="companion-actions">
      <button type="button" id="googleCalendar">Consultar disponibilidad del día</button>
      <button type="button" id="googleAlarms" class="secondary">Sincronizar bloques y avisos con Google Calendar</button>
      <button type="button" id="googleGmail" class="secondary">Ver correos recientes</button>
      <button type="button" id="googleClear" class="secondary">Limpiar datos de Google de esta vista</button>
    </div>
    <p id="googleStatus" role="status"></p>
    <ul id="googleResults"></ul>`;
  document.getElementById('tasks').append(root);
  const $ = id => document.getElementById(id);
  const status = $('googleStatus');
  const results = $('googleResults');
  const controls = [$('googleCalendar'), $('googleAlarms'), $('googleGmail')];
  const calendarBase = 'https://www.googleapis.com/calendar/v3';
  const gmailBase = 'https://gmail.googleapis.com/gmail/v1/users/me';
  const scopes = {
    availability:'https://www.googleapis.com/auth/calendar.freebusy',
    alarms:'https://www.googleapis.com/auth/calendar.app.created',
    gmail:'https://www.googleapis.com/auth/gmail.metadata'
  };
  let generation = 0;
  let active;
  let busyPeriods = [];
  let gis;
  let approvedClient = '';

  function loadGoogle() {
    if (window.google?.accounts?.oauth2) return Promise.resolve();
    if (!gis) gis = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      const timer = setTimeout(()=>script.onerror(), 15000);
      script.onload = () => { clearTimeout(timer); resolve(); };
      script.onerror = () => {
        clearTimeout(timer);
        script.remove();
        gis = null;
        reject(new Error('No se pudo cargar la autorización de Google.'));
      };
      document.head.append(script);
    });
    return gis;
  }
  function authorize(clientId, scope, signal) {
    return new Promise((resolve, reject) => {
      const cancel = () => reject(new Error('Se canceló la autorización.'));
      signal.addEventListener('abort', cancel, {once:true});
      const complete = fn => result => {
        signal.removeEventListener('abort', cancel);
        fn(result);
      };
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id:clientId, scope, include_granted_scopes:false,
        callback:complete(response => {
          if (!response.access_token || !window.google.accounts.oauth2.hasGrantedAllScopes(response, scope)) {
            reject(new Error('Google no concedió el permiso solicitado.'));
            return;
          }
          resolve(response.access_token);
        }),
        error_callback:complete(() => reject(new Error('La autorización de Google se cerró o fue bloqueada por el navegador.')))
      });
      tokenClient.requestAccessToken({prompt:'select_account'});
    });
  }
  async function perform(scope, operation) {
    const clientId = $('googleClientId').value.trim();
    if (!/^\d+-[a-z0-9-]+\.apps\.googleusercontent\.com$/i.test(clientId)) {
      status.textContent = 'Introduce el ID de cliente web autorizado para el origen de Lifts.';
      return;
    }
    const version = generation;
    if (!window.google?.accounts?.oauth2) {
      controls.forEach(button => { button.disabled = true; });
      status.textContent = 'Cargando la autorización de Google…';
      try {
        await loadGoogle();
        if (version === generation) status.textContent = 'Vuelve a pulsar el botón para abrir el selector de cuenta de Google.';
      } catch (error) {
        if (version === generation) status.textContent = error.message;
      } finally {
        if (version === generation) controls.forEach(button => { button.disabled = false; });
      }
      return;
    }
    if (active) return;
    controls.forEach(button => { button.disabled = true; });
    status.textContent = 'Esperando autorización de Google…';
    results.replaceChildren();
    const controller = new AbortController();
    active = controller;
    const timer = setTimeout(()=>controller.abort(), 90000);
    try {
      const accessToken = await authorize(clientId, scopes[scope], controller.signal);
      if (version !== generation || controller.signal.aborted) return;
      approvedClient = clientId;
      status.textContent = 'Consultando Google…';
      async function request(url, method='GET', body, allowed=[]) {
        const response = await fetch(url, {method, signal:controller.signal, headers:{
          Authorization:'Bearer ' + accessToken, ...(body ? {'Content-Type':'application/json'} : {})
        }, ...(body ? {body:JSON.stringify(body)} : {})});
        if (allowed.includes(response.status)) return null;
        if (!response.ok) throw new Error('Google respondió HTTP ' + response.status + '. Comprueba la cuenta, los permisos y las API habilitadas.');
        return response.status === 204 ? null : response.json();
      }
      const result = await operation(request);
      if (version !== generation || controller.signal.aborted) return;
      status.textContent = result.message;
      for (const text of result.items || []) {
        const item = document.createElement('li');
        item.textContent = text;
        results.append(item);
      }
    } catch (error) {
      if (version === generation) status.textContent = controller.signal.aborted
        ? 'La operación se agotó. Revisa los cambios en Google antes de reintentar.' : error.message;
    } finally {
      clearTimeout(timer);
      if (active === controller) {
        active = null;
        controls.forEach(button => { button.disabled = false; });
      }
    }
  }

  $('googleCalendar').onclick = () => perform('availability', async request => {
    const date = $('planDate').value;
    const start = new Date(date + 'T00:00');
    if (!Number.isFinite(start.getTime())) throw new Error('Selecciona una fecha para la jornada.');
    const end = new Date(start);
    end.setDate(end.getDate() + 2); // Include any overnight shift selected for this date.
    const data = await request(calendarBase + '/freeBusy', 'POST', {
      timeMin:start.toISOString(), timeMax:end.toISOString(), items:[{id:'primary'}]
    });
    const calendar = data.calendars?.primary;
    if (!calendar || calendar.errors?.length || !Array.isArray(calendar.busy)) throw new Error('Google no devolvió la disponibilidad del calendario principal.');
    busyPeriods = calendar.busy.map(period => ({
      startAt:period.start, duration:(Date.parse(period.end)-Date.parse(period.start))/60000
    })).filter(event => event.duration>0);
    return {message:busyPeriods.length + ' bloques ocupados consultados para ' + date +
      ' y el día siguiente. Pulsa Planifica mi día para tenerlos en cuenta.'};
  });

  function reminderEvent(task) {
    const start = new Date(task.reminderAnchorAt || task.snoozedFrom || task.reminderAt);
    const end = new Date(start.getTime() + 60000);
    const timeZone = task.reminderTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const repeat = {'daily':'DAILY','weekly':'WEEKLY'}[task.reminderRepeat];
    return {
      summary:task.title, visibility:'private', transparency:'transparent',
      start:{dateTime:start.toISOString(),timeZone}, end:{dateTime:end.toISOString(),timeZone},
      extendedProperties:{private:{liftsTask:task.id}},
      recurrence:repeat ? ['RRULE:FREQ=' + repeat] : [],
      reminders:{useDefault:false,overrides:[{method:'popup',minutes:0}]}
    };
  }

  function blockEvent(task) {
    const start = new Date(task.startAt);
    const end = new Date(start.getTime() + (Number(task.duration) || 25)*60000);
    return {
      summary:task.title, visibility:'private',
      start:{dateTime:start.toISOString()}, end:{dateTime:end.toISOString()},
      extendedProperties:{private:{liftsBlock:task.id}},
      reminders:{useDefault:false,overrides:[]}
    };
  }

  $('googleAlarms').onclick = () => {
    if (!confirm('¿Sincronizar los bloques y avisos de tus tareas con Google Calendar? Sus títulos se copiarán a un calendario privado de Lifts.')) return;
    const state = api.getState();
    const version = generation;
    void perform('alarms', async request => {
      const selections = state.tasks.filter(t => /^[a-f0-9-]{36}$/i.test(t.id) &&
        (Number.isFinite(Date.parse(t.reminderAt)) || Number.isFinite(Date.parse(t.startAt))) &&
        (state.googleCalendarId || (!t.done && !t.archived)));
      for(const id of state.googleCancelledTasks || []){
        if(/^[a-f0-9-]{36}$/i.test(id) && !selections.some(t=>t.id===id))selections.push({id,done:true,title:'Tarea eliminada'});
      }
      if (!selections.length) return {message:'Añade un bloque o recordatorio con fecha y hora antes de sincronizar.'};
      let calendarId = state.googleCalendarId;
      if (!calendarId) {
        const calendar = await request(calendarBase + '/calendars', 'POST', {
          summary:'Agenda privada de Lifts',timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone
        });
        if (version !== generation) throw new Error('La sesión cambió durante la conexión.');
        calendarId = calendar.id;
        state.googleCalendarId = calendarId;
        if (await api.save() === false) throw new Error('Google creó el calendario, pero Lifts no pudo guardar su vínculo. Revisa la conexión y reintenta desde esta página.');
      } else {
        await request(calendarBase + '/calendars/' + encodeURIComponent(calendarId));
        if (await api.save() === false) throw new Error('Guarda primero los cambios de Lifts antes de sincronizar.');
      }
      const events = calendarBase + '/calendars/' + encodeURIComponent(calendarId) + '/events';
      let saved = 0;
      let removed = 0;
      const errors = [];
      const cancelled = new Set();
      async function syncEvent(task, marker, makeEvent, wanted) {
        const eventId = (marker === 'liftsTask' ? 'lifts' : 'liftsb') + task.id.replace(/-/g,'').toLowerCase();
        async function findEvent() {
          const filter = new URLSearchParams({privateExtendedProperty:marker+'='+task.id,maxResults:'10'});
          const result = await request(events + '?' + filter);
          const matches = result.items || [];
          if (result.nextPageToken || matches.length > 1 || matches.some(item=>item.extendedProperties?.private?.[marker] !== task.id)) {
            throw new Error('Hay eventos duplicados o sin identificar en el calendario privado.');
          }
          return matches[0];
        }
        const existing = await findEvent();
        if (wanted) {
          const event = makeEvent(task);
          if (existing) await request(events+'/'+encodeURIComponent(existing.id),'PUT',event);
          else if (!await request(events,'POST',{...event,id:eventId},[409])) {
            // Google may reserve the identifier of an event that was previously deleted.
            const concurrent = await findEvent();
            if (concurrent) await request(events+'/'+encodeURIComponent(concurrent.id),'PUT',event);
            else await request(events,'POST',event);
          }
          saved++;
        } else if (existing) {
          await request(events+'/'+encodeURIComponent(existing.id),'DELETE',undefined,[404,410]);
          removed++;
        }
      }
      for (const task of selections) {
        const pending = !task.done && !task.archived;
        const wantsAlarm = pending && Number.isFinite(Date.parse(task.reminderAt)) &&
          (task.reminderRepeat || (Date.parse(task.reminderAt) > Date.now() && task.remindedFor !== task.reminderAt));
        const wantsBlock = !task.archived && Number.isFinite(Date.parse(task.startAt));
        try {
          await syncEvent(task, 'liftsTask', reminderEvent, wantsAlarm);
          await syncEvent(task, 'liftsBlock', blockEvent, wantsBlock);
          if (!wantsAlarm && !wantsBlock) cancelled.add(task.id);
        } catch (error) {
          if (active?.signal.aborted || version !== generation) throw error;
          errors.push(task.title + ' · ' + error.message);
        }
      }
      if(version===generation && state.googleCancelledTasks?.some(id=>cancelled.has(id))){
        state.googleCancelledTasks=state.googleCancelledTasks.filter(id=>!cancelled.has(id));
        if(await api.save()===false)errors.push('Google procesó las cancelaciones, pero Lifts no confirmó su guardado.');
      }
      return {message:saved + ' bloques o avisos sincronizados · ' + removed + ' cancelados · ' + errors.length +
        ' fallos. Comprueba las notificaciones de Google Calendar en cada dispositivo.',items:errors};
    });
  };

  $('googleGmail').onclick = () => perform('gmail', async request => {
    const data = await request(gmailBase + '/messages?maxResults=5&labelIds=INBOX');
    const items = await Promise.all((data.messages || []).map(async ({id}) => {
      const message = await request(gmailBase + '/messages/' + encodeURIComponent(id) +
        '?format=metadata&metadataHeaders=From&metadataHeaders=Subject');
      const headers = message.payload?.headers || [];
      const header = key => headers.find(h => h.name.toLowerCase() === key)?.value;
      return (header('subject') || 'Sin asunto') + ' · ' + (header('from') || 'Remitente sin datos');
    }));
    return {message:items.length ? 'Correos recientes de la bandeja de entrada.' : 'Tu bandeja de entrada está vacía.',items};
  });
  function reset() {
    generation++;
    active?.abort();
    active = null;
    busyPeriods = [];
    approvedClient = '';
    controls.forEach(button => { button.disabled = false; });
    results.replaceChildren();
    status.textContent = '';
  }
  $('googleClear').onclick = () => { reset(); status.textContent = 'Vista de Google limpia.'; };
  const resetAccount = () => { reset(); $('googleClientId').value = ''; };
  window.addEventListener('nexo-state', resetAccount);
  $('googleClientId').oninput = () => { if (approvedClient && approvedClient !== $('googleClientId').value.trim()) reset(); };
  window.liftsGoogle = {events:()=>busyPeriods, reset:resetAccount};
})();
