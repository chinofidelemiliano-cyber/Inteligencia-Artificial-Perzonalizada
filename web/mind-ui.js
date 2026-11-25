'use strict';
(()=>{
  const $=id=>document.getElementById(id),workspace=window.liftsWorkspace,core=window.liftsMindCore;
  const barrier=$('mindBarrier'),outcome=$('mindOutcome'),status=$('mindStatus');
  let draft=null,busy=false;
  function node(parent,tag,text=''){
    const element=document.createElement(tag);element.textContent=text;parent.append(element);return element;
  }
  function button(parent,text,action){
    const el=node(parent,'button',text);el.type='button';el.className='secondary';el.disabled=busy;el.onclick=action;return el;
  }
  function fields(target,prefix,definitions){
    const container=$(target);
    for(const [name,label,type] of definitions){
      const id=prefix+name;
      node(container,'label',label).htmlFor=id;
      const input=node(container,type==='long'?'textarea':'input');input.id=id;input.name=name;
      input.maxLength=type==='long'?500:200;
      if(type==='decimal')input.inputMode='decimal';
    }
  }
  const thoughts=[
    ['situation','Situación'],['thought','Pensamiento automático','long'],['emotion','Emoción'],
    ['intensity','Intensidad percibida (0 a 10)','decimal'],['conduct','Conducta'],
    ['for','Evidencia a favor','long'],['against','Evidencia en contra','long'],
    ['alternative','Interpretación alternativa','long'],['action','Acción que puedo realizar']
  ];
  fields('mindThoughtFields','thought-',thoughts);
  fields('mindPlanFields','plan-',[
    ['wish','Deseo o actividad'],['result','Resultado esperado'],['obstacle','Obstáculo o señal'],['action','Acción concreta']
  ]);
  fields('mindMotivationFields','motivation-',[
    ['expectancy','Expectativa de lograrlo (0 a 1)','decimal'],['value','Valor percibido','decimal'],
    ['impulsivity','Impulsividad en la escala elegida','decimal'],['delay','Demora en una unidad constante','decimal']
  ]);
  for(const [key,value] of Object.entries(core.strategies))node(barrier,'option',value[0]).value=key;
  const data=()=>workspace.getState().mind||{interventions:[],thoughts:[]};
  const formValues=form=>Object.fromEntries([...new FormData(form)].map(([key,value])=>[key,value.trim()]));
  const date=new Intl.DateTimeFormat('es-MX',{dateStyle:'medium'});
  const resultNames={pending:'Por probar',helped:'Me ayudó',partial:'Ayudó en parte',none:'No me ayudó'};

  async function store(next,message){
    if(busy)return false;
    const state=workspace.getState(),before=state.mind;
    state.mind=next;busy=true;status.textContent='Guardando…';render();
    try{
      if(!await workspace.save())throw new Error();
      if(workspace.getState()!==state)return false;
      status.textContent=message;return true;
    }catch{
      if(workspace.getState()===state){state.mind=before;status.textContent='No se pudo guardar. Reintenta.';}
      return false;
    }finally{
      if(workspace.getState()===state){busy=false;render();}
    }
  }
  function drop(key,id){
    if(confirm('¿Eliminar este registro de Mind de tu espacio?')){
      const current=data();void store({...current,[key]:current[key].filter(item=>item.id!==id)},'Registro eliminado.');
    }
  }
  function resultPicker(container,item){
    const result=node(container,'select');
    result.setAttribute('aria-label','Resultado de '+item.task);
    for(const [key,text] of Object.entries(resultNames))node(result,'option',text).value=key;
    result.value=item.result;result.disabled=busy;
    result.onchange=()=>{
      const current=data();
      void store({...current,interventions:current.interventions.map(entry=>entry.id===item.id?{...entry,result:result.value}:entry)},'Resultado guardado.');
    };
  }
  function render(){
    const current=data(), stats=core.summary(current.interventions,Date.now());
    const summary=$('mindSummary'),history=$('mindHistory'),reflection=$('mindThoughtList');
    outcome.querySelector('button').disabled=busy;
    $('mindThoughtForm').querySelector('button').disabled=busy;
    summary.replaceChildren();history.replaceChildren();reflection.replaceChildren();
    node(summary,'h4','Últimos siete días');
    node(summary,'p',stats.count?stats.count+' intervenciones registradas · '+(stats.evaluated?stats.helped+' de '+stats.evaluated+' evaluadas ayudaron a avanzar.':'Falta registrar los resultados.'):'Datos insuficientes. Guarda una intervención para revisar tus registros.');
    const obstacles=node(summary,'ul');
    for(const [key,count] of Object.entries(stats.factors))node(obstacles,'li',core.strategies[key][0]+' · '+count);
    const signals=$('mindAgendaSignals');
    signals.replaceChildren();
    const late=core.agendaSignals(workspace.getState().tasks||[],window.liftsWork.localDate(new Date()));
    if(late.length){
      node(signals,'h4','Pendientes con fecha pasada');
      node(signals,'p','La fecha sirve para revisar el motivo. Puede haber cambios legítimos de prioridad, descanso o falta de recursos.');
      for(const item of late)button(signals,'Revisar '+item.title,()=>{
        $('mindTask').value=item.title.slice(0,160);
        $('mindIntervention').dispatchEvent(new Event('input'));
        $('mindTask').focus();
      });
    }
    renderTraining();
    for(const item of current.interventions){
      const entry=node(history,'article');
      node(entry,'h4',item.task);
      node(entry,'p',date.format(item.at)+' · '+core.strategies[item.barrier][0]+' · '+item.action);
      if(item.emotion)node(entry,'p','Emoción registrada: '+item.emotion);
      resultPicker(entry,item);
      button(entry,'Eliminar intervención',()=>drop('interventions',item.id));
    }
    for(const item of current.thoughts){
      const entry=node(reflection,'details');
      node(entry,'summary',item.situation+' · '+date.format(item.at));
      for(const [key,label] of thoughts)if(item[key])node(entry,'p',label+': '+item[key]);
      button(entry,'Eliminar reflexión',()=>drop('thoughts',item.id));
    }
  }
  function renderTraining(){
    const program=data().training,host=$('mindTrainingProgress');
    $('mindTrainingStart').hidden=Boolean(program);
    $('mindTrainingStart').querySelector('button').disabled=busy;
    $('mindTrainingStep').querySelector('button').disabled=busy;
    $('mindTrainingStep').hidden=!program||program.sessions.length===program.total;
    host.replaceChildren();
    if(!program)return;
    node(host,'p',program.sessions.length+' de '+program.total+' sesiones registradas');
    node(host,'p','Punto de partida: '+program.baseline);
    const next=core.trainingStep(program.total,program.sessions.length);
    if(next)node(host,'p',next.name+' · '+next.activity);
    else node(host,'p','Observación final: '+program.sessions.at(-1).note);
    if(program.sessions.length){
      const detail=node(host,'details');node(detail,'summary','Observaciones anteriores');
      const entries=node(detail,'ol');
      for(const item of program.sessions)node(entries,'li',date.format(item.at)+' · '+item.note);
    }
    button(host,'Eliminar programa',()=>{
      if(confirm('¿Eliminar este programa y sus observaciones?')){
        const {training,...rest}=data();
        void store(rest,'Programa eliminado.');
      }
    });
  }
  $('mindTrainingStart').onsubmit=async event=>{
    event.preventDefault();
    const current=data(),total=Number($('mindTrainingDays').value),baseline=$('mindTrainingBaseline').value.trim();
    if(current.training||!baseline||!core.trainingStep(total,0))return;
    if(await store({...current,training:{total,baseline,sessions:[]}},'Programa guardado.'))event.target.reset();
  };
  $('mindTrainingStep').onsubmit=async event=>{
    event.preventDefault();
    const current=data(),program=current.training,note=$('mindTrainingNote').value.trim();
    if(!program||!note||program.sessions.length>=program.total)return;
    const sessions=[...program.sessions,{note,at:Date.now()}];
    if(await store({...current,training:{...program,sessions}},'Sesión registrada.'))event.target.reset();
  };
  $('mindIntervention').oninput=()=>{
    draft=null;outcome.hidden=true;$('mindAdvice').replaceChildren();
  };
  $('mindIntervention').onsubmit=event=>{
    event.preventDefault();
    const values=formValues(event.currentTarget),strategy=core.strategies[values.barrier];
    if(!values.task||!strategy){status.textContent='Indica la actividad y el obstáculo.';return;}
    draft=values;
    const advice=$('mindAdvice');
    advice.replaceChildren();
    node(advice,'p',strategy[1]+' · '+strategy[2]);
    node(advice,'p','Sugerencia educativa basada en el obstáculo que elegiste.');
    node(advice,'a',strategy[3]).href='https://doi.org/'+strategy[4];
    outcome.reset();outcome.hidden=false;
    $('mindAction').focus();
  };
  outcome.onsubmit=async event=>{
    event.preventDefault();
    const values=formValues(outcome),current=data();
    if(!draft||!values.action||!Object.hasOwn(resultNames,values.result))return;
    const item={...draft,...values,id:crypto.randomUUID(),at:Date.now()};
    if(current.interventions.length>=200){status.textContent='El espacio admite 200 intervenciones. Exporta o elimina registros antes de guardar otro.';return;}
    if(await store({...current,interventions:[item,...current.interventions]},'Intervención guardada. Puedes actualizar su resultado en Evolución.')){
      draft=null;$('mindIntervention').reset();outcome.reset();outcome.hidden=true;$('mindAdvice').replaceChildren();
    }
  };
  $('mindThoughtForm').onsubmit=async event=>{
    event.preventDefault();
    const values=formValues(event.currentTarget),current=data();
    if(!values.situation||!values.thought){status.textContent='Escribe la situación y el pensamiento automático.';return;}
    if(values.intensity&&!/^(?:[0-9]|10)$/.test(values.intensity)){status.textContent='Indica una intensidad entera de 0 a 10.';return;}
    if(current.thoughts.length>=100){status.textContent='El espacio admite 100 reflexiones.';return;}
    if(await store({...current,thoughts:[{...values,id:crypto.randomUUID(),at:Date.now()},...current.thoughts]},'Reflexión guardada.'))$('mindThoughtForm').reset();
  };
  $('mindPlanForm').onsubmit=event=>{
    event.preventDefault();
    const {wish,result,obstacle,action}=formValues(event.currentTarget);
    if(!wish||!obstacle||!action){status.textContent='Indica el deseo, el obstáculo y la acción.';return;}
    window.liftsWorkUI.prepareTask(wish,{steps:[...(result?['Resultado esperado: '+result]:[]),'Si '+obstacle+', entonces '+action]});
  };
  $('mindMotivation').onsubmit=event=>{
    event.preventDefault();
    try{
      const {parsed:[e,v,i,d],result}=core.motivation(Object.values(formValues(event.currentTarget)));
      $('mindMotivationResult').textContent='('+e+' × '+v+') ÷ (1 + '+i+' × '+d+') = '+new Intl.NumberFormat('es-MX',{maximumSignificantDigits:8}).format(result)+'.';
    }catch(error){$('mindMotivationResult').textContent=error.message;}
  };
  function focus(quick){
    const active=workspace.getState().focusSession;
    workspace.open('tasks');
    if(quick&&!$('tasks').hidden&&(!active||active.finished)){
      $('focusMinutes').value=5;
      $('startFocus').click();
    }
    $('focusClock').scrollIntoView({block:'center'});
  }
  $('mindQuick').onclick=()=>focus(true);
  $('mindFocus').onclick=()=>focus(false);
  $('mindReminder').onclick=()=>window.liftsReminders.open('Revisar mi próximo paso');
  $('mindExperiment').onclick=()=>window.liftsJournal.prepareDraft('experiment',{
    title:'Experimento de autorregulación',question:'¿Qué cambia si pruebo una estrategia?',conditions:'Compara una línea base con un periodo de observación similar. Registra cambios de contexto.'
  });
  $('mindExport').onclick=()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify(data(),null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='lifts-mind.json';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  function reset(){
    busy=false;draft=null;status.textContent='';
    for(const id of ['mindIntervention','mindOutcome','mindThoughtForm','mindPlanForm','mindMotivation','mindTrainingStart','mindTrainingStep'])$(id).reset();
    outcome.hidden=true;$('mindAdvice').replaceChildren();$('mindMotivationResult').textContent='';
    for(const detail of $('mind').querySelectorAll('details'))detail.open=false;
    render();
  }
  window.addEventListener('nexo-state',reset);
  window.addEventListener('lifts-page',event=>{if(event.detail.page==='mind')render();});
  window.liftsMind={reset};
  render();
})();
