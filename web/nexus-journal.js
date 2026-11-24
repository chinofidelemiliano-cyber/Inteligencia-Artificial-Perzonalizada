'use strict';
(function (root) {
  const kinds={
    mission:{label:'Misiones',fields:{objective:'Objetivo',scope:'Alcance',deliverable:'Entregable esperado',available:'Información disponible',missing:'Información faltante',constraints:'Restricciones',stages:'Etapas (una por línea)',tools:'Herramientas',dependencies:'Dependencias',risks:'Riesgos y prevención',acceptance:'Criterios de aceptación',evidence:'Evidencia de entrega y verificación',next:'Próxima acción'}},
    decision:{label:'Decisiones',fields:{problem:'Problema',alternatives:'Alternativas',information:'Información disponible',criteria:'Criterios',argumentsFor:'A favor',argumentsAgainst:'En contra',choice:'Decisión',expected:'Resultado esperado',actual:'Resultado real',lesson:'Aprendizaje'}},
    knowledge:{label:'Conocimiento',fields:{summary:'Conocimiento',source:'Fuente',author:'Autor',date:'Fecha de la fuente',version:'Versión',evidence:'Evidencia',applicability:'Aplicabilidad',limitations:'Limitaciones',conflicts:'Fuentes contradictorias'}},
    lesson:{label:'Lecciones aprendidas',fields:{situation:'Situación',cause:'Causa y cómo se confirmó',action:'Acción',result:'Resultado',evidence:'Evidencia',lesson:'Aprendizaje',prevention:'Prevención'}},
    review:{label:'Revisión crítica',fields:{claim:'Idea a evaluar',facts:'Hechos y fuentes',hypotheses:'Hipótesis y opiniones',assumptions:'Suposiciones',contradictions:'Contradicciones o sesgos',counterarguments:'Argumentos y explicaciones alternativas',risks:'Riesgos y premortem',tests:'Evidencia pendiente y prueba de descarte'}},
    experiment:{label:'Experimentos',fields:{question:'Pregunta',hypothesis:'Hipótesis',independent:'Variables independientes',dependent:'Variables dependientes',controls:'Variables controladas',conditions:'Condiciones iniciales',procedure:'Procedimiento',readings:'Mediciones numéricas en la misma unidad (separadas por espacios)',unit:'Unidad de las mediciones',repeats:'Repeticiones',uncertainty:'Incertidumbre',conclusion:'Conclusiones y limitaciones'}},
    scenario:{label:'Escenarios de costos',fields:{unit:'Moneda o unidad de costo',base:'Costo base',favorable:'Costo favorable',adverse:'Costo desfavorable',assumptions:'Suposiciones',constraints:'Restricciones',risks:'Riesgos'}},
    change:{label:'Control de cambios',fields:{before:'Estado anterior',proposal:'Cambio propuesto',reason:'Justificación',risks:'Riesgos',approval:'Autorización registrada',tests:'Pruebas',results:'Resultados',evidence:'Evidencia',rollback:'Plan de reversión'}},
    playbook:{label:'Procedimientos',fields:{objective:'Objetivo',preparation:'Preparación',stages:'Pasos (uno por línea)',tools:'Herramientas',warnings:'Advertencias',checks:'Verificaciones',expected:'Resultado esperado',actual:'Resultado registrado'}},
    meeting:{label:'Reuniones',fields:{agenda:'Agenda',agreements:'Acuerdos',decisions:'Decisiones',owner:'Responsable',due:'Fecha acordada',next:'Próxima acción para la agenda'}},
    question:{label:'Preguntas abiertas',fields:{topic:'Tema',importance:'Importancia',question:'Pregunta',missing:'Información faltante',sources:'Posibles fuentes',next:'Próxima investigación',answer:'Respuesta sustentada'}}
  };
  const statuses={
    mission:{active:'Activa',paused:'Pausada',cancelled:'Cancelada',done:'Entregada y verificada'},
    knowledge:{pending:'Pendiente de comprobación',verified:'Verificada',documented:'Documentada',experience:'Experiencia personal',hypothesis:'Hipótesis',estimate:'Estimación',obsolete:'Obsoleta'},
    change:{draft:'Propuesto',testing:'En pruebas',validated:'Validado',reverted:'Revertido'},
    question:{open:'Abierta',researching:'En investigación',answered:'Respondida'}
  };
  const relationStates={recorded:'Registrada',suggested:'Sugerida',verified:'Verificada'};
  const clean=(value,limit=1500)=>typeof value==='string'?value.trim().slice(0,limit):'';
  const steps=value=>[...new Set(clean(value).split(/\r?\n/).map(line=>line.trim()).filter(Boolean))];
  function compareCosts({base,favorable,adverse,unit}) {
    const values=[base,favorable,adverse].map(value=>{
      const input=clean(value,40);
      return /^\d{1,12}(?:[.,]\d{1,2})?$/.test(input)?Math.round(Number(input.replace(',','.'))*100):NaN;
    });
    if(!clean(unit,1500)||values.some(value=>!Number.isSafeInteger(value))){
      throw new Error('Indica la unidad y los tres costos en números no negativos con hasta dos decimales.');
    }
    const [baseline,low,high]=values;
    return {unit:clean(unit),rows:[
      {label:'Base',value:baseline/100,difference:0},
      {label:'Favorable',value:low/100,difference:(low-baseline)/100},
      {label:'Desfavorable',value:high/100,difference:(high-baseline)/100}
    ]};
  }
  function record(kind,raw,previous=null) {
    if(!Object.hasOwn(kinds,kind))throw new Error('Tipo de registro desconocido.');
    const title=clean(raw.title,100);
    if(!title)throw new Error('Escribe un título.');
    const data=Object.fromEntries(Object.keys(kinds[kind].fields).map(key=>[key,clean(raw[key])]));
    const choices=Object.keys(statuses[kind]||{});
    const status=choices.includes(raw.status)?raw.status:choices[0]||'';
    const completed=['mission','playbook'].includes(kind)?steps(data.stages).filter(stage=>raw.completed?.includes(stage)):[];
    if(status==='done'&&(!steps(data.stages).length||!data.objective||!data.deliverable||!data.acceptance||!data.evidence||completed.length!==steps(data.stages).length)){
      throw new Error('Para cerrar la misión, registra el objetivo, el entregable, los criterios y la evidencia. Marca todas las etapas realizadas.');
    }
    if(status==='verified'&&(!data.source||!data.evidence))throw new Error('Agrega la fuente y la evidencia antes de marcar el conocimiento como verificado.');
    if(kind==='scenario')compareCosts(data);
    if(status==='validated'&&(!data.approval||!data.tests||!data.results||!data.evidence||!data.rollback)){
      throw new Error('Registra autorización, pruebas, resultados, evidencia y plan de reversión.');
    }
    if(status==='answered'&&!data.answer)throw new Error('Registra la respuesta antes de cerrar la pregunta.');
    return {id:previous?.id||crypto.randomUUID(),kind,title,data,status,completed,createdAt:previous?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
  }
  function relation(raw,records) {
    const {from,to,status}=raw;
    const title=clean(raw.title,120),evidence=clean(raw.evidence);
    if(from===to||!records.some(item=>item.id===from)||!records.some(item=>item.id===to)||!title||!Object.hasOwn(relationStates,status)){
      throw new Error('Elige dos registros distintos, describe su relación e indica el estado.');
    }
    if(status==='verified'&&!evidence)throw new Error('Agrega evidencia para verificar la relación.');
    return {id:crypto.randomUUID(),from,to,title,evidence,status};
  }
  function graphNodes(space) {
    return [
      ...(space.nexusJournal||[]).map(item=>({id:item.id,title:item.title,category:kinds[item.kind]?.label,target:'journal-record'})),
      ...(space.engineeringRecords||[]).map(item=>({id:item.id,title:item.data?.name,category:'Ficha de Ingeniería',target:'engineering-record'})),
      ...(space.diagnosticCases||[]).map(item=>({id:item.id,title:item.data?.name,category:'Caso de diagnóstico',target:'diagnostic-record'}))
    ].filter(item=>item.id&&item.title&&item.category);
  }

  function graphView(nodes,links) {
    const byId=new Map(nodes.map(node=>[node.id,node]));
    return links.filter(link=>byId.has(link.from)&&byId.has(link.to)&&Object.hasOwn(relationStates,link.status))
      .map(link=>({...link,origin:byId.get(link.from),destination:byId.get(link.to)}));
  }

  function linkedCases(nodes,edges) {
    const groups=new Map();
    for(const edge of edges) {
      if(edge.status!=='verified'||!edge.evidence?.trim())continue;
      const pair=[edge.origin,edge.destination];
      const engineering=pair.find(node=>node.target==='engineering-record');
      const diagnosis=pair.find(node=>node.target==='diagnostic-record');
      if(!engineering||!diagnosis)continue;
      if(!groups.has(engineering.id))groups.set(engineering.id,new Map());
      const cases=groups.get(engineering.id);
      if(!cases.has(diagnosis.id))cases.set(diagnosis.id,{diagnosis,links:[]});
      cases.get(diagnosis.id).links.push(edge);
    }
    return nodes.filter(node=>groups.get(node.id)?.size>=2)
      .map(engineering=>({engineering,cases:[...groups.get(engineering.id).values()]}));
  }

  function timeline(space,start,end) {
    const source=[
      [(space.nexusJournal||[]),'createdAt',item=>item.title,item=>kinds[item.kind]?.label,'journal-record'],
      [(space.engineeringRecords||[]),'at',item=>item.data?.name,()=> 'Ingeniería','engineering-record'],
      [(space.diagnosticCases||[]),'at',item=>item.data?.name,()=> 'Diagnóstico','diagnostic-record'],
      [(space.tasks||[]).filter(task=>task.done),'completedAt',item=>item.title,()=> 'Tarea completada','tasks']
    ];
    return source.flatMap(([records,field,title,type,target])=>records.flatMap(item=>{
      const at=Date.parse(item[field]),label=title(item),category=type(item);
      return Number.isFinite(at)&&at>=start&&at<end&&label&&category?[{at,label,category,target,id:item.id}]:[];
    })).sort((a,b)=>b.at-a.at);
  }

  function measurementSummary(raw) {
    const inputs=clean(raw).split(/\s+/);
    if(inputs.length<2||inputs.some(input=>!/^[-+]?\d{1,10}(?:[.,]\d{1,8})?$/.test(input))){
      throw new Error('Introduce al menos dos mediciones, separadas por espacios o saltos de línea.');
    }
    let count=0,mean=0,sumSquaredDeviations=0;
    for(const input of inputs){
      const value=Number(input.replace(',','.'));
      count++;
      const delta=value-mean;
      mean+=delta/count;
      sumSquaredDeviations+=delta*(value-mean);
    }
    return {count,mean,deviation:Math.sqrt(sumSquaredDeviations/(count-1))};
  }
  const api={kinds,statuses,relationStates,steps,record,relation,compareCosts,timeline,measurementSummary,graphNodes,graphView,linkedCases};
  if(typeof module==='object')module.exports=api;
  else root.liftsNexusJournal=api;
})(globalThis);
