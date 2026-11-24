'use strict';
(function(root){
  const kinds=['machines','stock','calibration'];
  const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
  const valid=(kind,id)=>kinds.includes(kind)&&typeof id==='string'&&uuid.test(id);
  function parse(hash){
    const match=/^#ficha\/(machines|stock|calibration)\/([^/]+)$/.exec(hash);
    return match&&valid(match[1],match[2])?{kind:match[1],id:match[2]}:null;
  }
  function owns(state,kind,id){
    if(!valid(kind,id))return false;
    if(kind==='calibration')return (state.nexusJournal||[]).some(item=>item.kind===kind&&item.id===id);
    return (state.industrial?.[kind]||[]).some(item=>item.id===id);
  }
  if(typeof module==='object'){module.exports={parse,owns};return;}
  const workspace=root.liftsWorkspace,status=document.getElementById('fieldLinkStatus');
  function openFromLink(){
    const target=parse(location.hash),state=workspace.getState();
    if(!target||!root.nexoAccount?.isReady()||!state.onboardingCompleted)return;
    history.replaceState(history.state,'',location.pathname+location.search);
    if(owns(state,target.kind,target.id)){
      const opened=target.kind==='calibration'?root.liftsJournal.openRecord(target.id):root.liftsIndustrial.openAsset(target.kind,target.id);
      if(opened)return;
    }
    workspace.open('field');
    status.textContent='Esa ficha no está disponible en esta cuenta.';
  }
  root.liftsFieldLinks={
    prepare(kind,id){
      if(!root.nexoAccount?.isReady()||!owns(workspace.getState(),kind,id))return;
      const link=new URL(location.pathname,location.origin);
      link.hash='ficha/'+kind+'/'+id;
      root.liftsUtilities.prepareQr(link.href);
    }
  };
  root.addEventListener('nexo-state',()=>{status.textContent='';queueMicrotask(openFromLink);});
  root.addEventListener('lifts-page',event=>{if(event.detail.page==='home')queueMicrotask(openFromLink);});
  root.addEventListener('hashchange',openFromLink);
})(globalThis);
