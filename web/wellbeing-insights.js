'use strict';
(function(root){
  const fields={sleepHours:'Horas de sueño',energy:'Energía percibida (0 a 10)',stress:'Estrés percibido (0 a 10)'};
  function summarize(records,day,days){
    if(!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(day)||![7,14].includes(days))return [];
    const end=Date.parse(day+'T00:00:00Z');
    if(!Number.isFinite(end)||new Date(end).toISOString().slice(0,10)!==day)return [];
    const start=new Date(end-(days-1)*86400000).toISOString().slice(0,10);
    const chosen=records.filter(item=>item.day>=start&&item.day<=day);
    return Object.entries(fields).map(([key,label])=>{
      const values=chosen.map(item=>item[key]).filter(value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=(key==='sleepHours'?24:10));
      return {label,count:values.length,mean:values.length?values.reduce((a,b)=>a+b,0)/values.length:null};
    });
  }
  function bmi(weight,height){
    const kg=Number(weight),m=Number(height)/100;
    if(!Number.isFinite(kg)||!Number.isFinite(m)||kg<=0||kg>700||m<0.5||m>3)throw new Error('Revisa el peso en kilogramos y la estatura en centímetros.');
    return kg/(m*m);
  }
  function sleep(start,end,overnight){
    const parse=value=>{
      if(!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value))throw new Error('Elige horas válidas.');
      const [h,m]=value.split(':').map(Number);
      return h*60+m;
    };
    const minutes=parse(end)-parse(start)+(overnight?1440:0);
    if(minutes<=0||minutes>1440)throw new Error('Revisa el orden de las horas y si el despertar fue al día siguiente.');
    return {hours:Math.floor(minutes/60),minutes:minutes%60};
  }
  if(typeof module==='object'){module.exports={summarize,bmi,sleep};return;}
  const $=id=>document.getElementById(id),app=root.liftsWorkspace;
  const summary=$('wellbeingTrendResult'),period=$('wellbeingTrendPeriod');
  const format=new Intl.NumberFormat('es-MX',{maximumFractionDigits:2});
  function render(){
    const state=app.getState(),target=$('wellbeingTrend');
    if(!target.open)return;
    const entries=state.personalConsent===true?root.liftsWellbeing.history(state.personalCheckins):[];
    const values=summarize(entries,root.liftsWork.localDate(new Date()),Number(period.value));
    summary.replaceChildren();
    for(const {label,count,mean} of values){
      const item=document.createElement('li');
      item.textContent=label+' · '+(count>=2?format.format(mean)+' de promedio, '+count+' registros':'Datos insuficientes ('+count+' registro)');
      summary.append(item);
    }
  }
  $('wellbeingTrend').addEventListener('toggle',render);
  period.onchange=render;
  const calculators=[
    ['wellbeingBmi','wellbeingBmiResult',data=>'IMC = '+data.get('weight')+' ÷ ('+data.get('height')+' ÷ 100)² = '+format.format(bmi(data.get('weight'),data.get('height')))+' kg/m².'],
    ['wellbeingSleep','wellbeingSleepResult',data=>{
      const duration=sleep(data.get('start'),data.get('end'),data.has('overnight'));
      return duration.hours+' h '+duration.minutes+' min entre las dos horas.';
    }]
  ];
  for(const [id,result,calculate] of calculators){
    $(id).oninput=()=>{$(result).textContent='';};
    $(id).onsubmit=event=>{
      event.preventDefault();
      try{$(result).textContent=calculate(new FormData(event.currentTarget));}
      catch(error){$(result).textContent=error.message;}
    };
  }
  const reset=()=>{
    $('wellbeingTrend').open=false;summary.replaceChildren();period.value='7';
    for(const [id,result] of calculators){$(id).reset();$(result).textContent='';}
  };
  root.addEventListener('nexo-state',reset);
  root.addEventListener('lifts-page',event=>{if(event.detail.page==='profile')render();});
  root.liftsWellbeingInsights={render,reset};
})(globalThis);
