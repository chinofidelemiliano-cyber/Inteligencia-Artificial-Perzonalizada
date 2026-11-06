'use strict';
// Decorative local effects. No AI calls, camera, tracking, or additional services.
(() => {
  const workspace=document.getElementById('workspace'),main=workspace.querySelector('main');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');let paused=false,flight=null,restart=null;
  try{paused=localStorage.getItem('lifts-effects-paused')==='true';}catch{}
  const sky=document.createElement('div');sky.className='ambient-sky';sky.setAttribute('aria-hidden','true');
  for(let i=0;i<42;i++){const star=document.createElement('span');star.className='ambient-star';star.style.cssText=`--x:${(i*37+11)%100}%;--y:${(i*61+7)%100}%;--size:${i%6===0?3:1.5}px;--delay:${-(i%11)}s;--duration:${4+i%5}s`;sky.append(star);}
  for(let i=0;i<3;i++){const meteor=document.createElement('span');meteor.className='ambient-meteor';meteor.style.cssText=`--x:${25+i*31}%;--y:${8+i*23}%;--delay:${-18+i*6}s`;sky.append(meteor);}
  document.body.prepend(sky);
  const layer=document.createElement('div');layer.className='pet-layer';layer.setAttribute('aria-hidden','true');
  layer.innerHTML=`<div class="pet-runner"><svg class="pet-art" viewBox="405 770 155 150" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true"><defs><clipPath id="lifts-pet-running-outline"><path d="M481 783C470 780 460 787 454 797L447 809C444 817 450 826 458 829L465 827L466 835C462 839 459 839 454 840L448 841C442 838 438 830 435 823L436 811C432 807 427 812 428 821C426 835 432 846 442 851L438 861C430 865 425 876 422 884L415 894C411 900 413 909 421 913C429 916 436 912 440 904L450 889L463 889L476 898L486 907C498 915 516 917 530 911C537 906 533 897 525 893L518 884L514 873L517 864C532 861 542 853 546 842C550 833 543 823 540 814C537 804 529 798 521 792C516 782 507 781 498 784Z"/></clipPath></defs><g clip-path="url(#lifts-pet-running-outline)"><image data-src="/assets/lifts-pet-sheet.png" width="1536" height="1024"/></g></svg></div>`;
  main.append(layer);const runner=layer.querySelector('.pet-runner');
  const toggle=document.createElement('button');toggle.type='button';toggle.className='ambient-motion-toggle secondary';toggle.textContent='✦';toggle.setAttribute('aria-label','Pausar animaciones decorativas');document.getElementById('logout').after(toggle);
  function unavailable(){return paused||reduced.matches||document.hidden||workspace.hidden;}
  function halt(){clearTimeout(restart);restart=null;flight?.cancel();flight=null;runner.hidden=true;}
  function route(){
    halt();if(unavailable()||!runner.animate)return;
    const artwork=layer.querySelector('image');if(!artwork.hasAttribute('href'))artwork.setAttribute('href',artwork.dataset.src);
    const bounds=main.getBoundingClientRect();
    const candidates=[...main.querySelectorAll('.card,.intro,.voice-entry,.voice-stage')].map(el=>el.getBoundingClientRect()).filter(r=>r.width>0&&r.bottom>140&&r.top<innerHeight-120);
    if(!candidates.length){restart=setTimeout(route,3500);return;}
    const target=candidates[Math.floor(Date.now()/17000)%candidates.length];const width=runner.getBoundingClientRect().width||90;
    const left=Math.max(8,target.left-bounds.left-width*.6),right=Math.min(bounds.width-width-6,target.right-bounds.left-width*.35);
    const top=Math.max(8,target.top-bounds.top-width*.75),behind=target.top-bounds.top+Math.min(target.height*.4,95),bottom=Math.min(Math.max(top+80,target.bottom-bounds.top-width*.3),innerHeight-bounds.top-120);
    const mirror=Date.now()%2===0;runner.style.setProperty('--pet-facing',mirror?'-1':'1');runner.hidden=false;
    const a=mirror?right:left,b=mirror?left:right;
    // The cards paint above this layer: the pet actually passes behind them.
    flight=runner.animate([
      {transform:`translate(${a}px,${top}px)`,offset:0,opacity:0},
      {transform:`translate(${a}px,${top}px)`,offset:.05,opacity:1},
      {transform:`translate(${b}px,${top}px)`,offset:.34,opacity:1},
      {transform:`translate(${b}px,${behind}px)`,offset:.44,opacity:1},
      {transform:`translate(${target.left-bounds.left+target.width*.45}px,${behind}px)`,offset:.58,opacity:1},
      {transform:`translate(${a}px,${Math.max(top,bottom)}px)`,offset:.77,opacity:1},
      {transform:`translate(${b}px,${Math.max(top,bottom)}px)`,offset:.95,opacity:1},
      {transform:`translate(${b}px,${Math.max(top,bottom)}px)`,offset:1,opacity:0}
    ],{duration:16000,easing:'linear',fill:'both'});
    flight.onfinish=()=>{flight=null;restart=setTimeout(route,1800);};
  }
  function sync(){document.body.classList.toggle('effects-paused',paused||document.hidden);document.body.classList.toggle('effects-reduced',reduced.matches);toggle.setAttribute('aria-pressed',String(paused));toggle.title=paused?'Reanudar animaciones':'Pausar animaciones';toggle.setAttribute('aria-label',toggle.title+' decorativas');route();}
  toggle.onclick=()=>{paused=!paused;try{localStorage.setItem('lifts-effects-paused',String(paused));}catch{}sync();};
  reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  window.addEventListener('lifts-page',()=>{halt();restart=setTimeout(route,450);});
  window.addEventListener('resize',()=>{halt();restart=setTimeout(route,250);});
  window.addEventListener('scroll',()=>{halt();restart=setTimeout(route,450);},{passive:true});
  window.addEventListener('nexo-state',()=>{halt();restart=setTimeout(route,500);});window.addEventListener('pagehide',halt);
  new MutationObserver(sync).observe(workspace,{attributes:true,attributeFilter:['hidden']});sync();
})();
