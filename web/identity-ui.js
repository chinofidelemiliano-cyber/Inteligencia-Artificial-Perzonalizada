const api=window.liftsWorkspace;
const choices=document.getElementById('identityChoices'),status=document.getElementById('identityStatus');
const options=[
  ['metal','Metal','Trazos inclinados con contraste metálico y remate cian.'],
  ['circuit','Circuito','Líneas geométricas de grosor constante y gradiente eléctrico.'],
  ['orbit','Órbita','Trazos rectos con terminal orbital y fondo de profundidad violeta.']
];
let saving=false,generation=0;
function node(parent,tag,text){
  const el=document.createElement(tag);if(text!==undefined)el.textContent=text;parent.append(el);return el;
}
function render(){
  choices.replaceChildren();
  for(const [id,name,description] of options){
    const tile=node(choices,'article');tile.className='academy-tile';
    node(tile,'h3',name);node(tile,'p',description);
    for(const size of ['large','small']){
      const preview=node(tile,'div');preview.className='identity-preview '+size;
      const icon=node(preview,'img');icon.src='/assets/icon-192.png';icon.alt='';
      const logo=node(preview,'img');logo.src='/assets/identity/'+id+'.svg';logo.alt='Lifts · '+name;
    }
    const selected=api.getState().identityPreference===id;
    const button=node(tile,'button',selected?'Preferencia guardada':'Elegir '+name);
    button.type='button';button.className='secondary';button.disabled=selected||saving;
    button.onclick=async()=>{
      if(saving)return;
      const state=api.getState(),old=state.identityPreference,epoch=generation;
      state.identityPreference=id;saving=true;button.disabled=true;
      try{
        if(await api.save()===false)throw new Error();
        if(epoch===generation)status.textContent='Preferencia guardada: '+name+'.';
      }catch{
        if(epoch===generation){state.identityPreference=old;status.textContent='No se confirmó el guardado.';}
      }finally{if(epoch===generation){saving=false;render();}}
    };
  }
}
function reset(){generation++;saving=false;status.textContent='';choices.replaceChildren();}
window.addEventListener('nexo-state',reset);
window.addEventListener('lifts-page',event=>{if(event.detail?.page==='identity')render();});
window.liftsIdentity={reset};
