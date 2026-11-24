'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const poses={feliz:'Feliz',risa:'Risa',sorpresa:'Sorpresa',amor:'Amor',guino:'Guiño',triste:'Triste',enojo:'Enojo',duda:'Duda',sueno:'Sueño',concentrado:'Concentrado'};
  const targets=[
    {host:$('osWelcomeRobot'),character:'lifts'},
    {host:$('osWelcomePet'),character:'perro'},
    {host:$('evolutionRobot'),character:'lifts',context:true},
    {host:$('characterStudioRobot'),character:'lifts',studio:true},
    {host:$('characterStudioPet'),character:'perro',studio:true}
  ];
  const choice=$('charactersPose'), preference=$('charactersMode'), status=$('charactersStatus');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let supported,renderer,generation=0,contextPose='feliz';
  for(const [pose,label] of Object.entries(poses)){
    const option=document.createElement('option');option.value=pose;option.textContent=label;choice.append(option);
  }

  function canRender(){
    if(supported===undefined){
      try{
        const context=document.createElement('canvas').getContext('webgl2');
        supported=Boolean(context);
        context?.getExtension('WEBGL_lose_context')?.loseContext();
      }catch{supported=false;}
    }
    return supported;
  }
  function visible(host){
    if(host.closest('[hidden]'))return false;
    const box=host.getBoundingClientRect();
    return box.width>0&&box.height>0&&box.bottom>0&&box.top<innerHeight+220;
  }
  const enabled=()=>preference.value==='3d'||preference.value==='auto'&&!reduced.matches;
  function clear(target){
    target.viewer?.remove();target.viewer=null;target.pose='';
    delete target.host.dataset.character3d;
  }
  function show(target){
    if(!enabled()||!target.host||!visible(target.host))return;
    const pose=target.studio?choice.value:target.context?contextPose:'feliz';
    if(target.pose===pose)return;
    const version=generation;
    target.pose=pose;
    renderer??=import('./vendor/model-viewer-4.4.0.js').catch(error=>{renderer=null;throw error;});
    renderer.then(()=>{
      if(version!==generation||target.pose!==pose)return;
      if(!enabled()||!visible(target.host)){target.pose='';return;}
      if(!target.viewer){
        const el=document.createElement('model-viewer');
        el.className='os-character-view';
        el.setAttribute('loading','eager');
        el.setAttribute('camera-orbit','0deg 78deg auto');
        el.setAttribute('environment-image','neutral');
        el.setAttribute('alt',target.character==='lifts'?'Modelo tridimensional de Lifts':'Modelo tridimensional de la mascota de Lifts');
        el.setAttribute('shadow-intensity','0.4');
        if(target.studio){el.setAttribute('camera-controls','');el.setAttribute('touch-action','pan-y');}
        else el.setAttribute('aria-hidden','true');
        el.addEventListener('load',()=>{
          target.host.dataset.character3d='ready';
          if(target.studio)status.textContent='Modelo cargado. Puedes girarlo con el puntero o el teclado.';
        });
        el.addEventListener('error',()=>{
          clear(target);
          if(target.studio)status.textContent='El modelo no se pudo abrir. Se muestra la ilustración.';
        });
        target.host.append(el);target.viewer=el;
      }
      target.viewer.setAttribute('src','/assets/characters/'+target.character+'_'+pose+'.glb');
    }).catch(()=>{
      if(version!==generation)return;
      clear(target);
      if(target.studio)status.textContent='El visor no se pudo cargar. Se muestra la ilustración.';
    });
  }
  function update(){
    if(!enabled()){
      targets.forEach(clear);
      if(!$('characters').hidden)status.textContent='Mostrando ilustraciones.';
      return;
    }
    if(!targets.some(target=>target.host&&visible(target.host)))return;
    if(!canRender()){
      if(!$('characters').hidden)status.textContent='El dispositivo no ofrece WebGL 2. Se muestran las ilustraciones.';
      return;
    }
    targets.forEach(show);
  }
  function reset(){
    generation++;targets.forEach(clear);
    choice.value='feliz';preference.value='auto';contextPose='feliz';status.textContent='';
    requestAnimationFrame(update);
  }
  const observer=new IntersectionObserver(update,{rootMargin:'220px'});
  for(const {host} of targets)if(host)observer.observe(host);
  choice.onchange=update;
  preference.onchange=()=>{generation++;targets.forEach(clear);update();};
  reduced.addEventListener('change',()=>{generation++;targets.forEach(clear);update();});
  window.addEventListener('nexo-state',reset);
  window.addEventListener('lifts-page',()=>requestAnimationFrame(update));
  window.addEventListener('lifts-chat-state',({detail})=>{
    if(detail?.phase==='thinking')contextPose='concentrado';
    if(detail?.phase==='reply'||detail?.phase==='error')contextPose='feliz';
    update();
  });
  window.liftsCharacters={reset};
  reset();
})();
