'use strict';
// Continuous original artwork with a single outline; no fragment articulation.
// No image-generation, animation service, camera, or additional AI request.
(() => {
  const hosts=[document.getElementById('companionButton'),...document.querySelectorAll('.face-avatar')];
  function artwork(id){
    const sheet='/assets/lifts-character-sheet.png';
    // Each pose is rendered as one continuous image: no transplanted head,
    // artificial mouth, or independently rotated fragments from a flat sheet.
    return `<svg class="lifts-robot" viewBox="460 60 180 310" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="${id}-outline"><path d="M548 76C525 75 509 83 501 103L497 111C486 113 486 127 488 142C489 152 497 157 505 158L520 169L519 174C505 176 499 183 493 197L484 218C479 228 475 237 477 246C478 255 487 263 496 260L503 252L507 237L513 229L516 243L511 260C505 271 503 285 502 298L496 314C492 319 490 326 491 336C508 342 533 341 551 338L553 324L557 338C574 341 599 342 616 336C616 324 611 316 605 308L600 289C598 274 592 261 587 250L584 231L591 237L594 253C601 264 615 263 624 253C630 245 627 233 623 222L616 206C609 189 604 179 589 175L578 172L577 168C593 164 606 157 611 150C614 147 616 135 615 124C615 116 612 111 607 110C602 90 587 79 566 76Z"/></clipPath>
        <clipPath id="${id}-turned-outline"><path d="M548 76C524 76 509 82 502 98L498 109C485 108 481 119 483 135C484 150 490 157 503 160L520 172L515 177C500 177 496 187 491 200L486 220C482 234 483 246 491 255C496 263 505 263 510 252L513 237L518 233L521 249C513 267 510 285 507 304L501 319C496 325 495 333 497 337C515 343 539 342 552 338L554 325L559 338C577 342 600 342 617 337C617 328 613 321 606 314L599 291L593 269L586 250L581 235L587 233L590 249C595 260 604 265 614 258C622 253 623 242 618 229L611 208C606 189 600 179 587 176L578 172L580 168C593 165 605 158 610 149C616 141 616 123 610 115L606 108C601 89 587 79 566 76Z"/></clipPath>
        <linearGradient id="${id}-light"><stop stop-color="#00f5ec"/><stop offset="1" stop-color="#bc38ff"/></linearGradient>
      </defs>
      <ellipse class="robot-floor" cx="550" cy="351" rx="69" ry="8" fill="none" stroke="url(#${id}-light)" stroke-width="2" opacity=".65"/>
      <g class="robot-frame"><g class="robot-head-art"><image clip-path="url(#${id}-outline)" class="robot-view view-front" href="${sheet}" width="1536" height="1024"/><g clip-path="url(#${id}-turned-outline)"><image class="robot-view view-turned" href="${sheet}" x="-200" width="1536" height="1024"/></g></g></g>
      <g class="robot-sparkles" stroke="url(#${id}-light)" stroke-width="2" fill="none"><path d="M478 95V109M471 102H485M624 80V94M617 87H631"/></g>
    </svg>`;
  }
  hosts.forEach((host,i)=>{host.classList.add('robot-surface');host.innerHTML=artwork('lifts-bot-'+i);});
  let currentPage='home',voice='idle',celebration=null;
  function refresh(){hosts.forEach(host=>{host.dataset.phase=voice;host.dataset.scene=currentPage;});}
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
