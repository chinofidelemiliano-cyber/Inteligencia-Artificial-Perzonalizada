'use strict';
// Original uploaded PNG displayed through SVG viewports and articulated masks.
// No image-generation, animation service, camera, or additional AI request.
(() => {
  const hosts=[document.getElementById('companionButton'),...document.querySelectorAll('.face-avatar')];
  function artwork(id){
    const sheet='/assets/lifts-character-sheet.png';
    const image=`<image href="${sheet}" x="-460" y="-60" width="1536" height="1024"/>`;
    const part=(name,shape)=>`<clipPath id="${id}-${name}">${shape}</clipPath>`;
    const piece=name=>`<g clip-path="url(#${id}-${name})">${image}</g>`;
    const faces={happy:[470,460,160,124],wink:[642,460,160,124],curious:[812,458,160,126],excited:[982,458,163,126],focused:[1157,458,160,126]};
    return `<svg class="lifts-robot" viewBox="0 0 200 310" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <defs>
      ${part('torso','<path d="M63 111L116 111L130 135L125 166L117 197L99 215L72 209L56 177L52 143Z"/>')}
      ${part('left-arm','<path d="M52 114L66 123L59 142L52 151L51 169L57 183L43 203L24 202L13 185L14 158L24 134L35 117Z"/>')}
      ${part('right-arm','<path d="M119 114L138 116L154 137L164 159L171 185L161 203L143 202L134 186L130 163L125 148L115 132Z"/>')}
      ${part('left-leg','<path d="M59 194L78 194L93 209L87 230L86 245L98 263L96 282L30 282L30 267L42 248L44 224Z"/>')}
      ${part('right-leg','<path d="M101 196L123 195L139 217L145 242L152 258L162 272L157 282L99 283L96 268L103 247L95 225Z"/>')}
      <linearGradient id="${id}-light"><stop stop-color="#00f5ec"/><stop offset="1" stop-color="#bc38ff"/></linearGradient>
      <clipPath id="${id}-face"><path d="M24 36Q27 6 70 4Q118 -1 143 25L153 57Q158 92 121 108Q70 127 29 101Q9 90 10 63Z"/></clipPath>
    </defs>
    <ellipse class="robot-floor" cx="96" cy="292" rx="71" ry="9" fill="none" stroke="url(#${id}-light)" stroke-width="2" opacity=".7"/>
    <g class="robot-frame">
      <g class="robot-leg-art left">${piece('left-leg')}</g>
      <g class="robot-leg-art right">${piece('right-leg')}</g>
      <g class="robot-torso-art">${piece('torso')}</g>
      <g class="robot-arm-art left">${piece('left-arm')}</g>
      <g class="robot-arm-art right">${piece('right-arm')}</g>
      <g class="robot-head-art">
       ${Object.entries(faces).map(([name,[x,y,w,h]])=>`<g class="sheet-face face-${name}" clip-path="url(#${id}-face)"><svg x="0" y="0" width="160" height="120" viewBox="${x} ${y} ${w} ${h}"><image href="${sheet}" width="1536" height="1024"/></svg></g>`).join('')}
       <g class="sheet-mouth"><ellipse cx="92" cy="84" rx="14" ry="9" fill="#020618"/><ellipse class="robot-speaking-mouth" cx="92" cy="84" rx="8" ry="5" fill="#00eaff"/></g>
      </g>
    </g>
    <g class="robot-sparkles" stroke="url(#${id}-light)" stroke-width="2" fill="none"><path d="M12 50V65M5 57H20M175 28V42M168 35H182"/></g>
   </svg>`;
  }
  hosts.forEach((host,i)=>{host.classList.add('robot-surface');host.innerHTML=artwork('lifts-bot-'+i);host.dataset.expression='happy';});
  let currentPage='home',voice='idle',celebration=null;
  function refresh(){const expression=voice==='thinking'?'focused':voice==='listening'?'curious':currentPage==='images'?'curious':currentPage==='work'||currentPage==='tasks'?'focused':'happy';hosts.forEach(host=>{host.dataset.expression=expression;host.dataset.phase=voice;host.dataset.scene=currentPage;});}
  function setPhase(value){voice=value;refresh();}
  window.addEventListener('lifts-voice',event=>setPhase(event.detail.phase==='speaking'?'speaking':'idle'));
  window.addEventListener('lifts-chat-state',event=>{if(event.detail.phase==='thinking')setPhase('thinking');if(event.detail.phase==='error'||(event.detail.phase==='reply'&&voice==='thinking'))setPhase('idle');});
  window.addEventListener('lifts-page',event=>{currentPage=event.detail.page;refresh();});
  window.addEventListener('lifts-task-created',()=>{clearTimeout(celebration);hosts.forEach(host=>host.dataset.celebrate='true');celebration=setTimeout(()=>hosts.forEach(host=>delete host.dataset.celebrate),2400);});
  window.addEventListener('nexo-state',()=>{clearTimeout(celebration);hosts.forEach(host=>delete host.dataset.celebrate);voice='idle';refresh();});
  // Conversation phase updates include microphone states, not only audio events.
  const observer=new MutationObserver(()=>{const value=document.getElementById('faceAvatar').dataset.phase;if(value!==voice){voice=value;refresh();}});
  observer.observe(document.getElementById('faceAvatar'),{attributes:true,attributeFilter:['data-phase']});refresh();
})();
