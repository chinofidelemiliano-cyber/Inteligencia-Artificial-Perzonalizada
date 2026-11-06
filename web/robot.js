'use strict';
// Articulated vector interpretation of the supplied Lifts character sheet.
// No image-generation, animation service, camera, or additional AI request.
(() => {
  const hosts=[document.getElementById('companionButton'),...document.querySelectorAll('.face-avatar')];
  function artwork(id){const fill=name=>`url(#${id}-${name})`;return `<svg class="lifts-robot" viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="${id}-armor" x1="0" y1="0" x2="1" y2=".8"><stop stop-color="#fff"/><stop offset=".32" stop-color="#e9edff"/><stop offset=".61" stop-color="#8b9bc1"/><stop offset=".8" stop-color="#eae6ff"/><stop offset="1" stop-color="#9065c4"/></linearGradient>
    <linearGradient id="${id}-light"><stop stop-color="#00f5ec"/><stop offset=".5" stop-color="#29a8ff"/><stop offset="1" stop-color="#cb42ff"/></linearGradient>
    <linearGradient id="${id}-dark" x2=".9" y2="1"><stop stop-color="#152744"/><stop offset=".5" stop-color="#020713"/><stop offset="1" stop-color="#26103e"/></linearGradient>
    <radialGradient id="${id}-glass" cx=".35" cy=".1" r=".9"><stop stop-color="#254b65"/><stop offset=".45" stop-color="#030c1c"/><stop offset="1" stop-color="#080419"/></radialGradient>
  </defs>
  <ellipse class="robot-floor" cx="150" cy="378" rx="91" ry="13" fill="none" stroke="${fill('light')}" stroke-width="3" opacity=".65"/>
  <ellipse cx="150" cy="378" rx="62" ry="7" fill="#02cde9" opacity=".09"/>
  <g class="robot-frame" stroke="#192039" stroke-width="2.5" stroke-linejoin="round">
   <g class="robot-leg-art left">
    <circle cx="123" cy="274" r="16" fill="${fill('dark')}"/>
    <path d="M107 273Q120 261 136 277L137 313Q121 329 104 312Z" fill="${fill('armor')}"/>
    <path d="M108 304Q122 296 135 306L132 324Q120 332 108 322Z" fill="${fill('dark')}" stroke="#09dce9"/>
    <path d="M106 327Q117 334 132 328L136 355L144 367Q143 379 99 377L94 367Z" fill="${fill('armor')}"/>
    <path d="M96 367Q114 372 141 367L143 378Q116 385 96 378Z" fill="${fill('dark')}"/>
    <path d="M98 378Q120 383 141 377" stroke="#00f4f6" stroke-width="5"/>
   </g>
   <g class="robot-leg-art right">
    <circle cx="177" cy="274" r="16" fill="${fill('dark')}"/>
    <path d="M164 277Q180 261 193 273L196 312Q179 329 163 313Z" fill="${fill('armor')}"/>
    <path d="M165 306Q178 296 192 304L192 322Q180 332 168 324Z" fill="${fill('dark')}" stroke="#ba55fa"/>
    <path d="M168 328Q182 334 194 327L206 367L201 377Q157 379 156 367L164 355Z" fill="${fill('armor')}"/>
    <path d="M159 367Q185 372 204 367L204 378Q182 385 157 378Z" fill="${fill('dark')}"/>
    <path d="M159 378Q180 383 202 377" stroke="${fill('light')}" stroke-width="5"/>
   </g>
   <g class="robot-torso-art">
    <path d="M108 231L192 231L186 270Q150 296 114 270Z" fill="${fill('armor')}"/>
    <path d="M123 253Q150 263 177 253L171 273H129Z" fill="${fill('dark')}"/>
    <rect x="135" y="165" width="30" height="24" rx="10" fill="${fill('dark')}"/>
    <path d="M108 181Q150 168 192 181L188 224L174 245Q150 259 126 245L112 224Z" fill="${fill('armor')}"/>
    <path d="M116 185Q150 176 184 185L180 215Q150 237 120 215Z" fill="${fill('dark')}" stroke="${fill('light')}" stroke-width="2"/>
    <ellipse cx="150" cy="202" rx="29" ry="20" fill="#04091d" stroke="#c4d1ff" stroke-width="1.5"/>
    <text x="150" y="208" fill="#fff" stroke="none" text-anchor="middle" font-family="system-ui,sans-serif" font-size="19" font-style="italic" font-weight="900">Lifts</text>
    <path d="M131 214Q152 221 175 207" fill="none" stroke="${fill('light')}" stroke-width="2"/>
    <path d="M124 230L136 240H164L176 230" fill="none" stroke="#fafbff" stroke-width="4"/>
   </g>
   <g class="robot-arm-art left">
    <circle cx="103" cy="190" r="15" fill="${fill('dark')}"/>
    <path d="M102 175Q81 175 76 195L91 210L109 194Z" fill="${fill('armor')}"/>
    <path d="M78 202L94 211L87 237L70 233Z" fill="${fill('armor')}"/>
    <circle cx="78" cy="238" r="10" fill="${fill('dark')}" stroke="#00cedd"/>
    <g class="robot-forearm left">
     <path d="M69 240Q81 236 87 247L89 270L68 275L61 262Z" fill="${fill('armor')}"/>
     <path d="M68 273Q80 267 87 277L86 288L78 296L64 290L62 281Z" fill="${fill('dark')}"/>
     <path d="M65 276L73 283L72 290M75 273L81 280L80 289" stroke="#dce9ff" stroke-width="3" fill="none"/>
    </g>
   </g>
   <g class="robot-arm-art right">
    <circle cx="197" cy="190" r="15" fill="${fill('dark')}"/>
    <path d="M198 175Q219 175 224 195L209 210L191 194Z" fill="${fill('armor')}"/>
    <path d="M222 202L206 211L213 237L230 233Z" fill="${fill('armor')}"/>
    <circle cx="222" cy="238" r="10" fill="${fill('dark')}" stroke="#bd56ff"/>
    <g class="robot-forearm right">
     <path d="M213 247Q219 236 231 240L239 262L232 275L211 270Z" fill="${fill('armor')}"/>
     <path d="M213 277Q220 267 232 273L238 281L236 290L222 296L214 288Z" fill="${fill('dark')}"/>
     <path d="M235 276L227 283L228 290M225 273L219 280L220 289" stroke="#dce9ff" stroke-width="3" fill="none"/>
    </g>
   </g>
   <g class="robot-head-art">
    <path d="M79 76Q83 22 150 20Q219 22 224 77L222 126Q208 171 150 174Q91 172 77 127Z" fill="${fill('armor')}"/>
    <path d="M107 27Q149 10 191 29L181 47Q150 38 119 46Z" fill="${fill('dark')}"/>
    <path d="M110 29Q150 16 188 30" fill="none" stroke="${fill('light')}" stroke-width="5"/>
    <ellipse cx="78" cy="100" rx="19" ry="33" fill="${fill('armor')}"/>
    <ellipse cx="78" cy="100" rx="12" ry="27" fill="${fill('dark')}" stroke="#00e3f4" stroke-width="3"/>
    <path d="M78 81V119M72 86L85 94L71 105L84 113" fill="none" stroke="${fill('light')}" stroke-width="2"/>
    <ellipse cx="222" cy="100" rx="19" ry="33" fill="${fill('armor')}"/>
    <ellipse cx="222" cy="100" rx="12" ry="27" fill="${fill('dark')}" stroke="#b955ff" stroke-width="3"/>
    <path d="M222 81V119M216 86L229 94L215 105L228 113" fill="none" stroke="${fill('light')}" stroke-width="2"/>
    <path d="M95 79Q99 58 123 64Q151 71 178 64Q201 58 207 80L210 119Q204 151 151 154Q98 152 91 120Z" fill="${fill('glass')}" stroke="#64799e" stroke-width="2"/>
    <path d="M100 79Q106 70 123 74" fill="none" stroke="#ecfaff" stroke-width="3" opacity=".4"/>
    <g class="robot-eyes" fill="none" stroke="#00eeff" stroke-width="6" stroke-linecap="round">
     <g class="eyes-happy"><path d="M111 106Q124 88 136 106M165 106Q178 88 190 106"/></g>
     <g class="eyes-focused"><path d="M110 98L137 105M164 105L191 98"/><path d="M122 105V113M177 105V113" stroke-width="9"/></g>
     <g class="eyes-curious"><ellipse cx="124" cy="103" rx="8" ry="12" fill="#00eeff" stroke="none"/><ellipse cx="178" cy="103" rx="8" ry="12" fill="#00eeff" stroke="none"/></g>
     <g class="eyes-wink"><path d="M111 106Q124 88 136 106M166 96L184 105L166 111"/></g>
    </g>
    <path class="robot-mouth-art" d="M141 128Q151 136 161 128" fill="none" stroke="#39e9f7" stroke-width="3" stroke-linecap="round"/>
    <ellipse class="robot-speaking-mouth" cx="151" cy="132" rx="10" ry="7" fill="#00eeff" stroke="none"/>
    <path d="M102 154Q149 175 199 154" fill="none" stroke="${fill('light')}" stroke-width="3"/>
   </g>
  </g>
  <g class="robot-sparkles" stroke="${fill('light')}" stroke-width="3" fill="none"><path d="M35 69V85M27 77H43M258 48V62M251 55H265"/></g>
 </svg>`;}
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
