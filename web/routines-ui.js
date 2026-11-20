'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const api = window.liftsWorkspace;
  const work = window.liftsWork;
  const currency = new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'});
  const money = cents => currency.format(cents/100);
  const today = () => work.localDate(new Date());
  const presets = [
    {id:'water',title:'Tomar un vaso de agua',label:'Hidratación',hour:10},
    {id:'move',title:'Hacer una pausa y moverme',label:'Pausa activa',hour:13},
    {id:'check-in',title:'¿Cómo te fue hoy? Tómate un momento para revisarlo',label:'Revisión personal',hour:19},
    {id:'money',title:'Revisar mis gastos y mi presupuesto',label:'Revisión de dinero',hour:19,repeat:'weekly'}
  ];
  let editing = '';
  let generation = 0;
  let saving = false;

  function element(parent,tag,text) {
    const item = document.createElement(tag);
    item.textContent = text;
    parent.append(item);
    return item;
  }
  function action(parent,label,handler) {
    const button = element(parent,'button',label);
    button.type = 'button';
    button.className = 'secondary';
    button.onclick = handler;
    return button;
  }
  function renderRoutines() {
    const choices = $('routineChoices');
    choices.replaceChildren();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate()-6);
    for (const preset of presets) {
      const task = api.getState().tasks.find(item=>item.habitId===preset.id && !item.archived && !item.done);
      const card = document.createElement('article');
      card.className = 'learning-option';
      choices.append(card);
      element(card,'h3',preset.label);
      if (task) {
        const count = (task.habitCompletions || []).filter(day=>day>=work.localDate(cutoff)&&day<=today()).length;
        element(card,'p',count+(count===1?' registro':' registros')+' en los últimos 7 días'+
          (work.reminderEnded(task) ? ' · Finalizado' : task.reminderPaused ? ' · En pausa' : ''));
        if (work.reminderOccurrence(task)) {
          const done = action(card,'Ya lo hice',()=>window.liftsReminders.complete(task,done));
        }
        action(card,'Ajustar aviso',()=>window.liftsReminders.edit(task));
      } else {
        action(card,'Preparar aviso',()=>{
          const first = new Date();
          first.setHours(preset.hour,0,0,0);
          if (first.getTime()<=Date.now()) first.setDate(first.getDate()+1);
          window.liftsReminders.open(preset.title,first,{repeat:preset.repeat || 'daily',habitId:preset.id});
        });
      }
    }
  }

  const emptyLedger = () => ({budgets:{},entries:[]});
  const ledger = () => api.getState().finance || emptyLedger();
  function cents(value) {
    const parts = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(value);
    return parts ? Number(parts[1])*100+Number((parts[2] || '').padEnd(2,'0')) : null;
  }
  function resetEntry() {
    $('moneyForm').reset();
    $('moneyDate').value = today();
    $('moneySave').textContent = 'Registrar movimiento';
    $('moneyCancel').hidden = true;
    editing = '';
  }
  function reset() {
    generation++;
    saving = false;
    $('moneyStatus').textContent = '';
    $('moneyMonth').value = today().slice(0,7);
    resetEntry();
  }
  function renderMoney() {
    const month = $('moneyMonth').value || today().slice(0,7);
    const data = ledger();
    const cap = data.budgets[month];
    $('budgetAmount').value = Number.isSafeInteger(cap) ? (cap/100).toFixed(2) : '';
    const summary = $('moneySummary');
    const list = $('moneyEntries');
    summary.replaceChildren();
    list.replaceChildren();
    const entries = data.entries.filter(entry=>entry.date.startsWith(month+'-')).sort((a,b)=>b.date.localeCompare(a.date));
    const income = entries.filter(entry=>entry.type==='income').reduce((sum,entry)=>sum+entry.cents,0);
    const expenses = entries.filter(entry=>entry.type==='expense').reduce((sum,entry)=>sum+entry.cents,0);
    element(summary,'p','Ingresos '+money(income)+' · Gastos '+money(expenses)+' · Saldo registrado '+money(income-expenses));
    if (Number.isSafeInteger(cap)) {
      element(summary,'p',expenses>cap?'Exceso sobre tu tope '+money(expenses-cap):'Disponible del tope '+money(cap-expenses));
    }
    const byCategory = new Map();
    for (const entry of entries) {
      if (entry.type === 'expense') byCategory.set(entry.category,(byCategory.get(entry.category) || 0)+entry.cents);
      const row = document.createElement('article');
      row.className = 'reminder-card';
      list.append(row);
      element(row,'strong',(entry.type==='income'?'Ingreso':'Gasto')+' · '+money(entry.cents));
      element(row,'p',[entry.date,entry.category,entry.note].filter(Boolean).join(' · '));
      action(row,'Editar',()=>{
        if(saving)return;
        editing = entry.id;
        for (const [id,value] of Object.entries({moneyType:entry.type,moneyAmount:(entry.cents/100).toFixed(2),
          moneyDate:entry.date,moneyCategory:entry.category,moneyNote:entry.note})) $(id).value = value;
        $('moneySave').textContent = 'Guardar movimiento';
        $('moneyCancel').hidden = false;
        $('moneyAmount').focus();
      });
      action(row,'Eliminar',async()=>{
        if (saving || !confirm('¿Eliminar este movimiento del presupuesto?')) return;
        if(await saveFinance({...data,entries:data.entries.filter(item=>item.id!==entry.id)},'Movimiento eliminado.') && editing===entry.id)resetEntry();
      });
    }
    if (!entries.length) element(list,'p','Todavía no hay movimientos registrados para este mes.');
    if (byCategory.size) element(summary,'p',[...byCategory].sort((a,b)=>b[1]-a[1]).map(([category,total])=>category+' '+money(total)).join(' · '));
  }

  async function saveFinance(value,message) {
    if (saving) return false;
    saving = true;
    const version = generation;
    const state = api.getState();
    const previous = state.finance;
    state.finance = value;
    try {
      if (await api.save()===false) throw new Error();
      if (version!==generation) return false;
      $('moneyStatus').textContent = message;
      renderMoney();
      return true;
    } catch {
      if (version===generation) {
        state.finance = previous;
        $('moneyStatus').textContent = 'No se confirmó el guardado. Revisa tu conexión y vuelve a intentarlo.';
      }
      return false;
    } finally {
      if (version===generation) saving = false;
    }
  }

  $('budgetForm').onsubmit = event=>{
    event.preventDefault();
    const month = $('moneyMonth').value;
    const cap = cents($('budgetAmount').value);
    if (!/^\d{4}-\d{2}$/.test(month) || cap===null) {
      $('moneyStatus').textContent = 'Elige un mes y escribe un monto con hasta dos decimales.';
      return;
    }
    const data = ledger();
    void saveFinance({...data,budgets:{...data.budgets,[month]:cap}},'Tope del mes guardado.');
  };
  $('moneyForm').onsubmit = async event=>{
    event.preventDefault();
    const amount = cents($('moneyAmount').value);
    const date = $('moneyDate').value;
    if (!amount || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      $('moneyStatus').textContent = 'Escribe un monto mayor a cero y elige la fecha.';
      return;
    }
    const data = ledger();
    const item = {id:editing || crypto.randomUUID(),type:$('moneyType').value,cents:amount,date,
      category:$('moneyCategory').value,note:$('moneyNote').value.trim()};
    const entries = [item,...data.entries.filter(entry=>entry.id!==item.id)];
    if (await saveFinance({...data,entries},'Movimiento guardado.')) {
      $('moneyMonth').value = date.slice(0,7);
      resetEntry();
      renderMoney();
    }
  };

  $('moneyMonth').onchange = renderMoney;
  $('moneyCancel').onclick = resetEntry;
  function render() {
    renderRoutines();
    renderMoney();
  }
  window.addEventListener('nexo-state',()=>{reset();render();});
  window.liftsRoutines = {reset,render,open(){
    api.open('routines');
  }};
  reset();
  render();
})();
