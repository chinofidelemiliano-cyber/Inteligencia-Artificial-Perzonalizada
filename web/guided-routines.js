'use strict';
(function(root){
  const templates={
    'Preparación matutina':['Revisar compromisos','Elegir una prioridad','Preparar materiales'],
    'Antes de salir de casa':['Comprobar llaves y documentos','Revisar ruta y tiempo de traslado'],
    'Entrada al trabajo':['Revisar avisos del turno','Confirmar prioridades y recursos'],
    'Preparación de materiales':['Confirmar la lista con la orden vigente','Comprobar cantidades y estado'],
    'Preparación de reuniones':['Definir el objetivo','Preparar preguntas y documentos','Acordar cómo registrar decisiones'],
    'Preparación de máquinas':['Consultar el procedimiento autorizado','Verificar inspecciones requeridas con el responsable','Registrar cualquier anomalía antes del arranque'],
    'Sesión de estudio':['Elegir un objetivo','Estudiar con un ejemplo | 20','Explicar lo aprendido sin apuntes'],
    'Organización del hogar':['Identificar una zona','Ordenar y retirar lo innecesario | 10','Revisar qué queda pendiente'],
    'Cierre laboral':['Registrar resultados','Dejar anotada la próxima acción','Confirmar compromisos para mañana'],
    'Preparación nocturna':['Revisar la primera cita de mañana','Dejar listos los objetos necesarios'],
    'Preparación de viaje':['Confirmar documentos e itinerario','Preparar equipaje','Compartir el plan si corresponde'],
    'Revisión semanal':['Revisar tareas y compromisos','Registrar un aprendizaje','Elegir prioridades para la siguiente semana']
  };

  function parseSteps(raw){
    const lines=raw.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
    if(!lines.length||lines.length>20)throw new Error('Agrega entre 1 y 20 pasos.');
    return lines.map(line=>{
      const parts=line.split('|').map(part=>part.trim());
      const [text,minutes='',condition='']=parts;
      if(parts.length>3||!text||text.length>180||(minutes&&!/^(?:[1-9]|[1-9][0-9]|1[01][0-9]|120)$/.test(minutes))||
          (condition&&condition.toLowerCase()!=='opcional'))throw new Error('Revisa cada paso. La duración puede ser de 1 a 120 minutos y el último campo puede decir «opcional».');
      return {text,minutes:Number(minutes),optional:Boolean(condition)};
    });
  }

  function nextRun(run,routine,action,now){
    const step=routine.steps[run.index];
    if(!step)throw new Error('La rutina ya terminó.');
    if(action==='timer'){
      if(!step.minutes)throw new Error('El paso no tiene temporizador.');
      return {...run,endsAt:now+step.minutes*60000};
    }
    if(action!=='done'&&(action!=='skip'||!step.optional))throw new Error('Completa el paso antes de avanzar.');
    const index=run.index+1;
    return {...run,index,endsAt:0,results:[...run.results,{index:run.index,status:action,at:now}],finishedAt:index===routine.steps.length?now:null};
  }

  if(typeof module==='object'){module.exports={parseSteps,nextRun};return;}
  const $=id=>document.getElementById(id),app=root.liftsWorkspace;
  const form=$('guidedForm'),picker=$('guidedSaved'),template=$('guidedTemplate'),host=$('guidedRunner'),status=$('guidedStatus');
  let busy=false,timer=null,spoken;
  function node(parent,tag,content){
    const el=document.createElement(tag);el.textContent=content;parent.append(el);return el;
  }
  function button(label,action){
    const el=node(host,'button',label);el.type='button';el.className='secondary';el.onclick=action;el.disabled=busy;
  }
  function option(parent,label,value){
    node(parent,'option',label).value=value;
  }
  for(const name of Object.keys(templates))option(template,name,name);
  const get=()=>app.getState().guidedRoutines||{items:[],run:null,history:[]};
  const selected=()=>get().items.find(item=>item.id===picker.value);
  function load(){
    const item=selected();
    form.reset();
    if(!item)return;
    $('guidedTitle').value=item.title;
    $('guidedMaterials').value=item.materials;
    $('guidedSteps').value=item.steps.map(step=>step.text+(step.minutes||step.optional?' | '+(step.minutes||''):'')+(step.optional?' | opcional':'')).join('\n');
  }
  function render(){
    clearInterval(timer);timer=null;
    const data=get(),previous=picker.value;
    picker.replaceChildren();option(picker,'Rutina nueva','');
    for(const item of data.items)option(picker,item.title,item.id);
    picker.value=data.items.some(item=>item.id===previous)?previous:'';
    form.querySelector('button').disabled=busy;
    host.replaceChildren();
    if(data.history.length){
      const history=node(host,'details','');
      node(history,'summary','Resultados guardados');
      const list=node(history,'ul','');
      for(const result of data.history){
        const date=new Intl.DateTimeFormat('es-MX',{dateStyle:'short',timeStyle:'short'}).format(result.finishedAt);
        const entry=node(list,'li',result.routine.title+' · '+date);
        const steps=node(entry,'ul','');
        for(const step of result.results)node(steps,'li',result.routine.steps[step.index].text+' · '+(step.status==='done'?'Realizado':'Omitido'));
      }
    }
    const routine=data.run?.routine;
    const run=data.run;
    const draft=selected();
    if(draft&&(!run||run.finishedAt)){
      button('Iniciar '+draft.title,()=>save({...data,run:{routine:structuredClone(draft),index:0,endsAt:0,results:[],startedAt:Date.now(),finishedAt:null}},'Rutina iniciada.'));
    }
    if(!run)return;
    node(host,'h3',routine.title);
    if(run.finishedAt){
      node(host,'p','Rutina completada. '+run.results.filter(result=>result.status==='done').length+' pasos realizados y '+run.results.filter(result=>result.status==='skip').length+' omitidos.');
      return;
    }
    if(routine.materials)node(host,'p',routine.materials);
    const step=routine.steps[run.index];
    node(host,'p','Paso '+(run.index+1)+' de '+routine.steps.length);
    node(host,'p',step.text);
    function advance(action){
      if(busy)return;
      try{
        const update=nextRun(run,routine,action,Date.now());
        const history=update.finishedAt?[update,...data.history].slice(0,20):data.history;
        void save({...data,run:update,history},update.finishedAt?'Resultado guardado.':'Avance guardado.');
      }catch(error){status.textContent=error.message;}
    }
    button('Marcar paso realizado',()=>advance('done'));
    if(step.optional)button('Omitir paso opcional',()=>advance('skip'));
    button('Cancelar ejecución',()=>{
      if(confirm('¿Cancelar esta ejecución y descartar sus pasos en curso?'))void save({...data,run:null},'Ejecución cancelada.');
    });
    if(step.minutes){
      button('Iniciar '+step.minutes+' min',()=>advance('timer'));
      if(run.endsAt){
        const countdown=node(host,'p','');
        const tick=()=>{
          const remaining=Math.max(0,Math.ceil((run.endsAt-Date.now())/1000));
          countdown.textContent=remaining?'Tiempo restante '+Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0'):'Terminó el tiempo. Verifica el paso antes de marcarlo.';
          if(!remaining)clearInterval(timer);
        };
        timer=setInterval(tick,1000);tick();
      }
    }
    if(root.speechSynthesis&&root.SpeechSynthesisUtterance)button('Escuchar paso',()=>{
      if(spoken)root.speechSynthesis.cancel();
      spoken=new SpeechSynthesisUtterance(step.text);spoken.lang='es-MX';
      spoken.onend=()=>{spoken=null;};
      root.speechSynthesis.speak(spoken);
    });
  }
  async function save(value,message){
    if(busy)return false;
    const state=app.getState(),before=state.guidedRoutines;
    state.guidedRoutines=value;busy=true;render();
    try{
      if(!await app.save())throw new Error();
      if(app.getState()!==state)return false;
      status.textContent=message;return true;
    }catch{
      if(app.getState()===state){state.guidedRoutines=before;status.textContent='No se pudo guardar. Reintenta la acción.';}
      return false;
    }finally{
      if(app.getState()===state){busy=false;render();}
    }
  }
  form.onsubmit=async event=>{
    event.preventDefault();if(busy)return;
    try{
      const data=get(),title=$('guidedTitle').value.trim(),existing=selected();
      if(!title)throw new Error('Escribe el nombre de la rutina.');
      if(!existing&&data.items.length>=30)throw new Error('El espacio admite hasta 30 rutinas.');
      const item={id:existing?.id||crypto.randomUUID(),title,materials:$('guidedMaterials').value.trim(),steps:parseSteps($('guidedSteps').value)};
      const items=existing?data.items.map(row=>row.id===item.id?item:row):[item,...data.items];
      if(await save({...data,items},'Rutina guardada.')){picker.value=item.id;render();}
    }catch(error){status.textContent=error.message;}
  };
  picker.onchange=()=>{load();render();};
  $('guidedUse').onclick=()=>{
    if(busy)return;
    picker.value='';load();
    $('guidedTitle').value=template.value;
    $('guidedSteps').value=templates[template.value].join('\n');render();
  };
  root.addEventListener('nexo-state',()=>{
    if(spoken){root.speechSynthesis.cancel();spoken=null;}
    busy=false;picker.value='';load();status.textContent='';
    $('guidedRoutines').open=false;render();
  });
  root.addEventListener('lifts-page',event=>{
    if(event.detail.page==='routines')render();
    else{clearInterval(timer);if(spoken){root.speechSynthesis.cancel();spoken=null;}}
  });
  render();
})(globalThis);
