'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const api = window.liftsWorkspace;
  const work = window.liftsWork;
  const form = $('reminderForm');
  const status = $('reminderFormStatus');
  const save = $('saveReminder');
  const list = $('reminderItems');
  let editing = '';
  let generation = 0;
  const repeatSelect = $('reminderRepeat');
  const intervalInput = $('reminderInterval');

  function syncInterval() {
    const custom = repeatSelect.value === 'custom';
    $('reminderIntervalField').hidden = !custom;
    intervalInput.disabled = !custom;
    intervalInput.required = custom;
  }
  function setRepeat(repeat) {
    const minutes = work.repeatMinutes(repeat);
    repeatSelect.value = minutes && minutes!==5 && minutes!==10 ? 'custom' : (repeat || '');
    intervalInput.value = minutes || 15;
    syncInterval();
  }
  repeatSelect.onchange = syncInterval;
  syncInterval();

  function reset() {
    generation++;
    editing = '';
    form.reset();
    syncInterval();
    status.textContent = '';
    save.disabled = false;
    $('cancelReminderEdit').hidden = true;
    $('reminderDate').min = work.localInput(new Date());
  }

  function open(title = '', date, settings = {}) {
    reset();
    api.open('reminders');
    $('reminderTitle').value = title.slice(0, 240);
    if (date) $('reminderDate').value = work.localInput(date);
    setRepeat(settings.repeat);
    $('reminderIntensity').value = String(settings.intensity || 2);
    $('reminderTitle').focus();
  }

  function edit(task) {
    const current = Date.parse(task.reminderAt);
    const next = current<=Date.now() ? work.nextReminder({...task,reminderAt:task.reminderAnchorAt || task.reminderAt}) : '';
    const date = new Date(next || task.reminderAt);
    open(task.title, Number.isFinite(date.getTime()) ? date : undefined);
    editing = task.id;
    setRepeat(task.reminderRepeat);
    $('reminderIntensity').value = String(task.priority || 2);
    $('cancelReminderEdit').hidden = false;
  }

  async function persist(message) {
    const version = generation;
    save.disabled = true;
    try {
      if (await api.save() === false) throw new Error();
      if (version === generation) {
        reset();
        status.textContent = message;
        api.render();
        return true;
      }
    } catch {
      if (version === generation) status.textContent = 'No se confirmó el guardado. Revisa tu conexión y reintenta.';
    } finally {
      if (version === generation) save.disabled = false;
    }
    return false;
  }

  form.onsubmit = event => {
    event.preventDefault();
    const title = $('reminderTitle').value.trim();
    const date = new Date($('reminderDate').value);
    if (!title || !Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) {
      status.textContent = 'Escribe el recordatorio y selecciona una fecha y hora futuras.';
      return;
    }

    const state = api.getState();
    const reminderAt = date.toISOString();
    const reminderRepeat = repeatSelect.value==='custom' ? 'minutes:'+Number(intervalInput.value) : repeatSelect.value;
    if (repeatSelect.value==='custom' && !work.repeatMinutes(reminderRepeat)) {
      status.textContent = 'Elige un intervalo entero entre 5 y 1440 minutos.';
      return;
    }
    const priority = Number($('reminderIntensity').value);
    let task = state.tasks.find(item=>item.id===editing);
    if (!task) {
      task = {id:crypto.randomUUID(), kind:'reminder', done:false};
      state.tasks.push(task);
      editing = task.id;
    }
    const oldNext = Date.parse(task.reminderAt)<=Date.now()
      ? work.nextReminder({...task,reminderAt:task.reminderAnchorAt || task.reminderAt}) : '';
    if ((task.reminderAt !== reminderAt && oldNext !== reminderAt) || task.reminderRepeat !== reminderRepeat) {
      task.reminderAnchorAt = reminderRepeat ? reminderAt : '';
      task.reminderTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      task.remindedFor = '';
      task.notifiedFor = '';
      task.snoozedFrom = '';
    }
    const rescheduled = task.reminderAt !== reminderAt && !oldNext;
    Object.assign(task, {title,reminderAt,reminderRepeat,priority});
    if (rescheduled && !reminderRepeat) task.reminderPaused = false;
    if (task.kind === 'reminder') task.date = work.localDate(date);
    $('cancelReminderEdit').hidden = false;
    void persist('Recordatorio guardado.');
  };

  $('cancelReminderEdit').onclick = reset;
  function render() {
    list.replaceChildren();
    const tasks = api.getState().tasks.filter(task=>!task.done && !task.archived && task.reminderAt)
      .sort((a,b)=>Date.parse(a.reminderAt)-Date.parse(b.reminderAt));
    if (!tasks.length) list.textContent = 'Todavía no tienes recordatorios activos.';
    for (const task of tasks) {
      const row = document.createElement('article');
      row.className = 'reminder-card';
      const title = document.createElement('strong');
      title.textContent = task.title;
      const details = document.createElement('p');
      const date = new Date(task.reminderAt);
      const repetition = work.repeatLabel(task.reminderRepeat);
      const intensity = {1:'Alta',3:'Suave'}[task.priority] || 'Normal';
      const timing = Number.isFinite(date.getTime()) ? date.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}) : 'Revisa la fecha';
      const seen = task.reminderPaused ? ' · En pausa' : task.remindedFor === task.reminderAt ? ' · Visto' : '';
      details.textContent = timing + ' · ' + repetition + ' · Intensidad ' + intensity.toLowerCase() +
        (task.kind === 'reminder' ? '' : ' · Vinculado a Agenda') + seen;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'secondary';
      button.textContent = 'Editar aviso';
      button.onclick = ()=>edit(task);
      const pause = document.createElement('button');
      pause.type = 'button';
      pause.className = 'secondary';
      pause.textContent = task.reminderPaused ? 'Reanudar' : 'Pausar';
      pause.onclick = async ()=>{
        if (save.disabled) return;
        const version = generation;
        const previous = {...task};
        if (task.reminderPaused && Date.parse(task.reminderAt)<=Date.now()) {
          const next = work.nextReminder({...task,reminderAt:task.reminderAnchorAt || task.reminderAt});
          if (!next) {
            edit(task);
            status.textContent = 'Selecciona una nueva fecha y hora para reanudar el aviso.';
            return;
          }
          task.reminderAt = next;
          task.snoozedFrom = '';
        }
        task.reminderPaused = !task.reminderPaused;
        pause.disabled = true;
        if (await persist(task.reminderPaused ? 'Aviso en pausa.' : 'Aviso reanudado.') === false && version === generation) {
          Object.assign(task,previous);
          pause.disabled = false;
        }
      };
      const disable = document.createElement('button');
      disable.type = 'button';
      disable.className = 'secondary';
      disable.textContent = 'Desactivar';
      disable.onclick = async ()=>{
        if (save.disabled || !confirm('¿Desactivar este aviso?')) return;
        disable.disabled = true;
        const version = generation;
        const state = api.getState();
        const previous = {...task};
        const index = state.tasks.indexOf(task);
        const cancelled = state.googleCancelledTasks;
        if (state.googleCalendarId && !task.startAt) {
          state.googleCancelledTasks = [...new Set([...(state.googleCancelledTasks || []),task.id])];
        }
        if (task.kind === 'reminder') state.tasks.splice(index,1);
        else Object.assign(task,{reminderAt:'',reminderAnchorAt:'',reminderRepeat:'',remindedFor:'',notifiedFor:'',snoozedFrom:''});
        if (await persist('Aviso desactivado.') === false && generation === version) {
          if (task.kind === 'reminder') state.tasks.splice(index,0,task);
          else Object.assign(task,previous);
          state.googleCancelledTasks = cancelled;
          disable.disabled = false;
        }
      };
      row.append(title,details,button,pause,disable);
      list.append(row);
    }
  }
  window.addEventListener('nexo-state',()=>{reset();render();});
  window.liftsReminders = {open,reset,render};
})();
