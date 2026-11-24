'use strict';
(function(root){
  const date=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
  function signals(state,day,days=14){
    if(!date(day))return [];
    const until=new Date(Date.parse(day)+days*86400000).toISOString().slice(0,10);
    const output=[];
    const push=(id,title,detail,destination,priority='media')=>output.push({id,title,detail,destination,priority});
    for(const task of state.tasks||[]){
      if(!task.done&&!task.archived&&task.kind!=='reminder'&&date(task.date)&&task.date<day){
        push('task:'+task.id+':'+task.date,task.title,'Tarea con fecha objetivo '+task.date+'. Revisa la próxima acción.',{id:'tasks'},'alta');
      }
    }
    const records=state.nexusJournal||[];
    for(const item of records){
      const data=item.data||{};
      const upcoming={
        household:['Mantenimiento',data.date],vehicle:['Servicio de vehículo',data.date],
        subscription:['Renovación',item.status==='active'?data.date:''],
        calibration:['Calibración',item.status==='active'?data.date:''],
        goal:['Objetivo',['active','paused'].includes(item.status)?data.due:''],
        risk:['Revisión del riesgo',item.status!=='closed'?data.reviewDate:'']
      };
      if(!Object.hasOwn(upcoming,item.kind))continue;
      const [label,due]=upcoming[item.kind];
      if(date(due)&&due<=until)push('record:'+item.id+':'+due,item.title,
        label+' registrado para '+due+'. Abre la ficha para revisar su seguimiento.',
        {id:'journal-record',key:item.id},due<day?'alta':'media');
    }
    const reviews=Object.entries(state.academyProgress?.reviews||{}).filter(([,review])=>date(review?.due)&&review.due<=day);
    for(const [key,entry] of reviews)push('review:'+key+':'+entry.due,'Lección para repasar','El repaso estaba programado para '+entry.due+'. Abre Rutas y repasos.',{id:'study-paths'});
    const month=day.slice(0,7);
    const limit=state.finance?.budgets?.[month];
    const expenses=(state.finance?.entries||[]).filter(item=>item.type==='expense'&&typeof item.date==='string'&&item.date.startsWith(month+'-')&&Number.isSafeInteger(item.cents)).reduce((sum,item)=>sum+item.cents,0);
    if(Number.isSafeInteger(limit)&&expenses>limit)push('budget:'+month,'Gastos sobre el tope mensual',
      'Gastos registrados: '+(expenses/100).toFixed(2)+' · Tope: '+(limit/100).toFixed(2)+'. Revisa los gastos del mes.',{id:'routines',page:true},'alta');
    return output.sort((a,b)=>(a.priority==='alta'?0:1)-(b.priority==='alta'?0:1));
  }
  const core={signals};
  if(typeof module==='object'){module.exports=core;return;}
  const $=id=>document.getElementById(id);
  const app=root.liftsWorkspace;
  const choices={new:'Nueva',reviewed:'Revisada',tracking:'En seguimiento',resolved:'Resuelta',snoozed:'Pospuesta hasta mañana'};
  let busy=false;
  function text(parent,tag,label){
    const el=document.createElement(tag);el.textContent=label;parent.append(el);return el;
  }
  function render(){
    const state=app.getState(),day=root.liftsWork.localDate(new Date()), host=$('radarSignals');
    const visible=signals(state,day);
    const filter=$('radarFilter').value;
    host.replaceChildren();
    let shown=0;
    for(const alert of visible){
      const stored=state.personalRadar?.[alert.id];
      const status=stored?.status==='snoozed'&&stored.until<=day?'new':stored?.status||'new';
      if(filter==='active'&&['snoozed','resolved'].includes(status))continue;
      shown++;
      const card=text(host,'article','');card.className='card';
      text(card,'h3',alert.title);text(card,'p','Prioridad '+alert.priority+' · '+choices[status]);
      text(card,'p',alert.detail);
      const open=text(card,'button','Abrir registro');
      open.type='button';open.className='secondary';
      open.onclick=()=>alert.destination.page?app.open(alert.destination.id):root.liftsNexus.open(alert.destination);
      const label=text(card,'label','Estado de la alerta');
      const selector=text(label,'select','');
      selector.setAttribute('aria-label','Estado de '+alert.title);selector.disabled=busy;
      for(const [key,value] of Object.entries(choices)){const option=text(selector,'option',value);option.value=key;}
      selector.value=status;
      selector.onchange=async()=>{
        if(busy)return;
        const next=selector.value;
        const before=state.personalRadar;
        const tomorrow=root.liftsWork.localDate(new Date(Date.now()+86400000));
        state.personalRadar={...before,[alert.id]:{status:next,until:next==='snoozed'?tomorrow:''}};
        busy=true;render();
        try{if(!await app.save())throw new Error();if(app.getState()===state)$('radarStatus').textContent='Estado guardado.';}
        catch{if(app.getState()===state){state.personalRadar=before;$('radarStatus').textContent='El estado no se pudo guardar. Vuelve a intentarlo.';}}
        finally{if(app.getState()===state){busy=false;render();}}
      };
    }
    if(!shown)text(host,'p','No hay alertas en esta vista.');
  }
  function reset(){busy=false;$('radarFilter').value='active';$('radarStatus').textContent='';render();}
  $('radarFilter').onchange=render;
  root.addEventListener('lifts-page',({detail})=>{if(detail.page==='radar')render();});
  root.addEventListener('nexo-state',reset);
  root.liftsRadar={signals,reset};
  reset();
})(globalThis);
