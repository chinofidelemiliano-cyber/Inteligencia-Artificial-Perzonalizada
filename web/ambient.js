'use strict';
// Decorative local effects. No AI calls, camera, tracking, or additional services.
(() => {
  const workspace=document.getElementById('workspace');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');let paused=false;
  try{paused=localStorage.getItem('lifts-effects-paused')==='true';}catch{}
  const sky=document.createElement('div');sky.className='ambient-sky';sky.setAttribute('aria-hidden','true');
  for(let i=0;i<42;i++){const star=document.createElement('span');star.className='ambient-star';star.style.cssText=`--x:${(i*37+11)%100}%;--y:${(i*61+7)%100}%;--size:${i%6===0?3:1.5}px;--delay:${-(i%11)}s;--duration:${4+i%5}s`;sky.append(star);}
  for(let i=0;i<3;i++){const meteor=document.createElement('span');meteor.className='ambient-meteor';meteor.style.cssText=`--x:${25+i*31}%;--y:${8+i*23}%;--delay:${-18+i*6}s`;sky.append(meteor);}
  document.body.prepend(sky);
  const floating=document.getElementById('floatingCompanion');
  const dock=document.createElement('div');dock.className='companion-dock';dock.dataset.state='rest';
  const pair=document.createElement('div');pair.className='dock-pair';floating.before(dock);dock.append(pair);pair.append(floating);
  const pet=document.createElement('div');pet.className='dock-pet';pet.setAttribute('aria-hidden','true');
  const poses={sit:[22,767,111,165],wave:[674,770,117,160],look:[640,58,170,204]};
  // Use complete poses; do not cut joints out of a flattened character sheet.
  pet.innerHTML=`<svg class="pet-art" viewBox="0 0 180 210" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">${Object.entries(poses).map(([name,[x,y,w,h]])=>`<svg class="pet-pose pet-${name}" x="0" y="0" width="180" height="210" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMax meet"><defs><clipPath id="dock-pose-${name}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs><image clip-path="url(#dock-pose-${name})" data-src="/assets/lifts-pet-sheet.png" width="1536" height="1024"/></svg>`).join('')}</svg>`;
  pair.prepend(pet);
  const greeting=document.createElement('span');greeting.className='dock-greeting';greeting.textContent='¡Hola!';greeting.setAttribute('aria-hidden','true');pair.append(greeting);
  const recall=document.createElement('button');recall.type='button';recall.className='dock-recall secondary';recall.textContent='‹';recall.setAttribute('aria-label','Mostrar a Lifts y su mascota');dock.append(recall);
  const toggle=document.createElement('button');toggle.type='button';toggle.className='ambient-motion-toggle secondary';toggle.textContent='✦';document.getElementById('logout').after(toggle);
  const sequence=[['greeting',2800],['rest',18000],['turn',1300],['leave',1100],['hidden',3200],['return',1100]];
  let step=0,timer=null,hovered=false;
  const face=floating.querySelector('.face-avatar');
  function engaged(){return hovered||dock.contains(document.activeElement)||face.dataset.phase!=='idle';}
  function halted(){return paused||reduced.matches||document.hidden||workspace.hidden||engaged();}
  function clear(){clearTimeout(timer);timer=null;}
  function advance(){clear();if(halted()){dock.dataset.state='rest';return;}const [state,delay]=sequence[step];dock.dataset.state=state;step=(step+1)%sequence.length;timer=setTimeout(advance,delay);}
  function restart(){clear();dock.dataset.state='rest';step=0;if(!halted())advance();}
  function sync(){document.body.classList.toggle('effects-paused',paused||document.hidden);document.body.classList.toggle('effects-reduced',reduced.matches);toggle.setAttribute('aria-pressed',String(paused));toggle.title=paused?'Reanudar animaciones':'Pausar animaciones';toggle.setAttribute('aria-label',toggle.title+' decorativas');if(!workspace.hidden)pet.querySelectorAll('image').forEach(image=>{if(!image.hasAttribute('href'))image.setAttribute('href',image.dataset.src);});restart();}
  toggle.onclick=()=>{paused=!paused;try{localStorage.setItem('lifts-effects-paused',String(paused));}catch{}sync();};
  recall.onclick=()=>{clear();dock.dataset.state='greeting';step=1;floating.focus();};
  floating.addEventListener('pointerenter',()=>{hovered=true;restart();});floating.addEventListener('pointerleave',()=>{hovered=false;restart();});
  dock.addEventListener('focusin',()=>{clear();dock.dataset.state='rest';});dock.addEventListener('focusout',()=>queueMicrotask(restart));
  new MutationObserver(restart).observe(face,{attributes:true,attributeFilter:['data-phase']});
  new MutationObserver(sync).observe(workspace,{attributes:true,attributeFilter:['hidden']});
  reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  window.addEventListener('lifts-page',restart);window.addEventListener('nexo-state',sync);window.addEventListener('pagehide',clear);sync();
})();
