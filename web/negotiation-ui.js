'use strict';
(() => {
  const host=document.getElementById('negotiationContent');
  if(!host)return;
  const api=window.liftsWorkspace, core=window.liftsNegotiationCore;
  let active='', choices=[], saved=false, saving=false, generation=0, notice='';
  function node(parent,tag,text,style) {
    const element=document.createElement(tag);
    if(text!==undefined)element.textContent=text;
    if(style)element.className=style;
    parent.append(element);
    return element;
  }
  function button(parent,label,action){
    const control=node(parent,'button',label,'secondary');
    control.type='button';control.onclick=action;
    return control;
  }
  function focus(element){
    element.tabIndex=-1;
    element.focus();
  }
  function goHome(){
    active='';choices=[];saved=false;notice='';
    render(true);
  }
  function open(id,history=null){
    active=id;choices=history?[...history.choices]:[];
    saved=Boolean(history);notice='';
    render(true);
  }
  function renderCatalog(moveFocus){
    const heading=node(host,'h3','Casos de práctica');
    if(moveFocus)focus(heading);
    node(host,'p','Elige cómo responder en conversaciones simuladas. Tus elecciones cambian el diálogo y reciben observaciones de claridad, argumentos y coherencia.');
    const cases=node(host,'div',undefined,'academy-course-grid');
    for(const [id,scenario] of Object.entries(core.scenarios)){
      const card=node(cases,'article',undefined,'academy-tile');
      node(card,'h4',scenario.title);
      node(card,'p',scenario.role);
      button(card,'Practicar: '+scenario.title,()=>open(id));
    }
    const history=api.getState().negotiationHistory||[];
    if(!history.length)return;
    node(host,'h3','Prácticas guardadas');
    node(host,'p','Se conservan las últimas 20 prácticas que guardes en tu cuenta.');
    const entries=node(host,'ul');
    const date=new Intl.DateTimeFormat('es-MX',{dateStyle:'medium'});
    for(const item of history){
      try{
        const result=core.play(item.scenario,item.choices);
        if(!result.finished)continue;
        const shown=date.format(new Date(item.at));
        const entry=node(entries,'li');
        button(entry,'Revisar: '+result.scenario.title+' · '+shown,()=>open(item.scenario,item));
      }catch{}
    }
  }
  async function savePractice(status,control){
    if(saving||saved)return;
    saving=true;control.disabled=true;
    status.textContent='Guardando práctica…';
    const version=generation,state=api.getState(),previous=state.negotiationHistory;
    state.negotiationHistory=[{id:crypto.randomUUID(),scenario:active,choices:[...choices],at:new Date().toISOString()},...(previous||[])].slice(0,20);
    try{
      if(!await api.save())throw new Error();
      if(version!==generation)return;
      saved=true;notice='Práctica guardada.';
    }catch{
      if(version!==generation)return;
      state.negotiationHistory=previous;
      notice='No se confirmó el guardado. Vuelve a intentarlo.';
    }finally{
      if(version===generation){saving=false;render();}
    }
  }
  function transcript(parent,turns){
    const details=node(parent,'details');
    node(details,'summary','Revisar el diálogo completo');
    const steps=node(details,'ol');
    for(const turn of turns){
      const line=node(steps,'li');
      node(line,'p','Interlocutor: '+turn.prompt);
      node(line,'p','Tu respuesta: '+turn.reply);
      node(line,'p','Reacción: '+turn.reaction);
      node(line,'p','Observación: '+turn.feedback);
    }
  }
  function render(moveFocus=false){
    host.replaceChildren();
    if(!active){renderCatalog(moveFocus);return;}
    const result=core.play(active,choices);
    const header=node(host,'h3',result.scenario.title);
    const toolbar=node(host,'div',undefined,'evolution-controls');
    const back=button(toolbar,'Volver a casos',()=>{
      if(result.finished||!choices.length||confirm('¿Salir de esta práctica? El diálogo en curso se perderá.'))goHome();
    });
    back.disabled=saving;
    node(host,'p',result.scenario.role);
    const last=result.turns.at(-1);
    if(last){
      const feedback=node(host,'div',undefined,'notice');
      feedback.setAttribute('role','status');
      node(feedback,'p','Reacción del interlocutor: '+last.reaction);
      node(feedback,'p','Observación: '+last.feedback);
    }
    if(result.finished){
      const resultHeading=node(host,'h4','Revisión de la práctica');
      if(moveFocus)focus(resultHeading);
      node(host,'p','Los conteos describen las respuestas de este diálogo simulado. Sirven para elegir qué practicar.');
      const list=node(host,'ul');
      for(const [key,label] of Object.entries(core.criteria)){
        node(list,'li',label+': '+result.marks[key]+' de '+result.turns.length+' intervenciones.');
      }
      transcript(host,result.turns);
      const status=node(host,'p',notice);status.setAttribute('role','status');
      if(!saved)button(host,'Guardar práctica en mi cuenta',event=>savePractice(status,event.currentTarget));
      if(saved&&!notice)node(host,'p','Esta práctica está guardada en tu cuenta.');
      const retry=button(host,'Repetir este caso',()=>open(active));
      retry.disabled=saving;
      return;
    }
    const prompt=node(host,'h4','Intervención '+(result.turns.length+1));
    if(moveFocus)focus(choices.length?prompt:header);
    node(host,'p',result.step.prompt);
    const answers=node(host,'div',undefined,'academy-tabs');
    for(const [id,answer] of Object.entries(result.step.options)){
      button(answers,answer.reply,()=>{choices.push(id);render(true);});
    }
    if(result.turns.length)transcript(host,result.turns);
  }
  function reset(){
    generation++;active='';choices=[];saved=false;saving=false;notice='';render();
  }
  window.addEventListener('nexo-state',reset);
  window.liftsNegotiation={reset};
  reset();
})();
