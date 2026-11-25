'use strict';
((root)=>{
  const strategies={
    unclear:['Falta de claridad','Actuar','Define el primer paso físico. Ejemplo: abre el informe y escribe el encabezado.','Gollwitzer · Intenciones de implementación','10.1037/0003-066X.54.7.493'],
    perfection:['Perfeccionismo','Actuar','Escribe un criterio de entrega suficiente. Trabaja cinco minutos en una versión identificada como borrador.','Rozental y cols. · Revisión de intervenciones sobre procrastinación','10.3389/fpsyg.2018.01588'],
    fear:['Miedo a equivocarme','Actuar','Escribe qué temes que ocurra. Prepara una prueba pequeña y reversible para comprobarlo.','Rozental y cols. · Revisión de intervenciones sobre procrastinación','10.3389/fpsyg.2018.01588'],
    overload:['Demasiadas decisiones o tareas','Reorganizar','Anota los compromisos fuera de tu cabeza. Elige uno por urgencia real y disponibilidad, y deja escrito cuándo revisarás los otros.','Michie y cols. · COM-B','10.1186/1748-5908-6-42'],
    distraction:['Distracción o impulso','Actuar','Elige una distracción y reduce su acceso durante cinco minutos. Decide de antemano qué harás cuando reaparezca.','Gollwitzer · Intenciones de implementación','10.1037/0003-066X.54.7.493'],
    tired:['Fatiga o poco descanso','Descansar','Elige una pausa posible o reprograma según tu carga. Anota cuándo vas a reevaluar si tienes energía suficiente.','Rasch y Born · Sueño y memoria','10.1152/physrev.00032.2012'],
    feelings:['Malestar que quiero evitar','Actuar','Nombra el malestar sin convertirlo en una orden. Si es tolerable, prueba una acción breve y revisa cómo te fue.','Sirois y Pychyl · Regulación del estado de ánimo','10.1111/spc3.12011'],
    motivation:['La tarea parece poco valiosa','Reorganizar','Escribe a qué objetivo contribuye. Si el vínculo es débil, decide si puedes reducir, renegociar o retirar la tarea.','Ryan y Deci · Autodeterminación','10.1037/0003-066X.55.1.68'],
    priority:['Otra prioridad legítima','Reorganizar','Reserva un momento para revisar el compromiso aplazado y registra la prioridad que cambió.','Michie y cols. · COM-B','10.1186/1748-5908-6-42'],
    waiting:['Me faltan recursos o información','Reorganizar','Define el dato o material que falta, quién puede aportarlo y cuándo darás seguimiento.','Michie y cols. · COM-B','10.1186/1748-5908-6-42']
  };
  function motivation(values){
    const parsed=values.map(value=>{
      const text=String(value).trim();
      if(!/^\d{1,4}(?:[.,]\d{1,4})?$/.test(text))throw new Error('Usa valores decimales no negativos.');
      return Number(text.replace(',','.'));
    });
    const [expectancy,value,impulsivity,delay]=parsed;
    if(parsed.length!==4||expectancy>1)throw new Error('Usa una expectativa de 0 a 1.');
    return {parsed,result:expectancy*value/(1+impulsivity*delay)};
  }
  function summary(entries,now){
    const recent=entries.filter(item=>item.at<=now&&item.at>=now-7*86400000);
    const factors={};
    for(const item of recent){
      if(Object.hasOwn(strategies,item.barrier))factors[item.barrier]=(factors[item.barrier]||0)+1;
    }
    return {count:recent.length,factors,helped:recent.filter(item=>item.result==='helped').length,
      evaluated:recent.filter(item=>item.result!=='pending').length};
  }
  const phases=[
    ['Autoconocimiento',['Registra el contexto en que aplazaste algo.','Compara un aplazamiento útil con una evitación.','Identifica una restricción que puedas cambiar.']],
    ['Inicio',['Escribe un primer paso físico y reversible.','Prueba un plan si–entonces.','Prepara el entorno antes de comenzar.']],
    ['Concentración',['Elige un objetivo para un bloque breve.','Anota una interrupción y cómo retomaste.','Decide cuándo conviene hacer una pausa.']],
    ['Autonomía',['Revisa cuál estrategia repetirías y por qué.','Ajusta una expectativa que haya resultado poco realista.','Deja escrito cómo retomarás después de una interrupción.']]
  ];
  function trainingStep(total,index){
    if(!Number.isInteger(total)||total<4||total>60||!Number.isInteger(index)||index<0||index>=total)return null;
    let phase=Math.floor(index*4/total);
    if(total===30)phase=index<7?0:index<14?1:index<21?2:3;
    const [name,activities]=phases[phase];
    return {name,activity:index===total-1?'Compara tu observación actual con el punto de partida. Anota qué te funcionó y qué ajustarás.':activities[index%activities.length]};
  }
  function agendaSignals(tasks,day){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return [];
    return tasks.filter(item=>!item.done&&!item.archived&&!['reminder','break','day-review'].includes(item.kind)&&
      typeof item.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(item.date)&&item.date<day).slice(0,5);
  }
  const api={strategies,motivation,summary,trainingStep,agendaSignals};
  if(typeof module==='object')module.exports=api;else root.liftsMindCore=api;
})(globalThis);
