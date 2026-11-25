'use strict';
(function (root) {
  const kinds={
    mission:{label:'Misiones',fields:{area:'Área de vida o trabajo',objective:'Objetivo',scope:'Alcance',deliverable:'Entregable esperado',available:'Información disponible',missing:'Información faltante',constraints:'Restricciones',stages:'Etapas (una por línea)',tools:'Herramientas',dependencies:'Dependencias',risks:'Riesgos y prevención',acceptance:'Criterios de aceptación',evidence:'Evidencia de entrega y verificación',next:'Próxima acción'}},
    decision:{label:'Decisiones',fields:{problem:'Problema',alternatives:'Alternativas',information:'Información disponible',criteria:'Criterios',argumentsFor:'A favor',argumentsAgainst:'En contra',choice:'Decisión',expected:'Resultado esperado',actual:'Resultado real',lesson:'Aprendizaje',reviewDate:'Próxima revisión (AAAA-MM-DD)',evidence:'Evidencia de la revisión'}},
    knowledge:{label:'Conocimiento',fields:{summary:'Conocimiento',source:'Fuente',author:'Autor',date:'Fecha de la fuente',version:'Versión',evidence:'Evidencia',applicability:'Aplicabilidad',limitations:'Limitaciones',conflicts:'Fuentes contradictorias'}},
    lesson:{label:'Lecciones aprendidas',fields:{situation:'Situación',cause:'Causa y cómo se confirmó',action:'Acción',result:'Resultado',evidence:'Evidencia',lesson:'Aprendizaje',prevention:'Prevención'}},
    review:{label:'Revisión crítica',fields:{claim:'Idea a evaluar',facts:'Hechos y fuentes',hypotheses:'Hipótesis y opiniones',assumptions:'Suposiciones',contradictions:'Contradicciones o sesgos',counterarguments:'Argumentos y explicaciones alternativas',risks:'Riesgos y premortem',tests:'Evidencia pendiente y prueba de descarte'}},
    experiment:{label:'Experimentos',fields:{question:'Pregunta',hypothesis:'Hipótesis',independent:'Variables independientes',dependent:'Variables dependientes',controls:'Variables controladas',conditions:'Condiciones iniciales',procedure:'Procedimiento',readings:'Mediciones numéricas en la misma unidad (separadas por espacios)',unit:'Unidad de las mediciones',repeats:'Repeticiones',groups:'Grupos para ANOVA (una línea por grupo, ej. A: 1 2 3)',factorial:'Diseño factorial 2×2 (una línea por combinación: --, +-, -+, ++)',uncertainty:'Incertidumbre',conclusion:'Conclusiones y limitaciones'}},
    scenario:{label:'Escenarios de costos',fields:{unit:'Moneda o unidad de costo',base:'Costo base',favorable:'Costo favorable',adverse:'Costo desfavorable',assumptions:'Suposiciones',constraints:'Restricciones',risks:'Riesgos'}},
    risk:{label:'Riesgos',fields:{area:'Categoría del riesgo',description:'Situación',cause:'Causa',impactDetail:'Consecuencia',scale:'Máximo de la escala (2 a 10)',likelihood:'Probabilidad estimada en tu escala',impact:'Impacto en tu escala',detection:'Dificultad de detección (opcional)',prevent:'Prevención',contingency:'Plan de contingencia',owner:'Responsable',reviewDate:'Fecha de revisión (AAAA-MM-DD)'}},
    qualityCost:{label:'Costos de calidad',fields:{unit:'Moneda',rework:'Retrabajos',waste:'Desperdicios',downtime:'Tiempos muertos',returns:'Devoluciones',complaints:'Reclamaciones',reprints:'Reimpresiones',consumables:'Consumos adicionales',prevention:'Prevención',inspection:'Inspección',cause:'Causa registrada',action:'Acción correctiva'}},
    change:{label:'Control de cambios',fields:{before:'Estado anterior',proposal:'Cambio propuesto',reason:'Justificación',risks:'Riesgos',approval:'Autorización registrada',tests:'Pruebas',results:'Resultados',evidence:'Evidencia',rollback:'Plan de reversión'}},
    playbook:{label:'Procedimientos',fields:{objective:'Objetivo',preparation:'Preparación',stages:'Pasos (uno por línea)',tools:'Herramientas',warnings:'Advertencias',checks:'Verificaciones',expected:'Resultado esperado',actual:'Resultado registrado'}},
    meeting:{label:'Reuniones',fields:{agenda:'Agenda',agreements:'Acuerdos',decisions:'Decisiones',owner:'Responsable',due:'Fecha acordada',next:'Próxima acción para la agenda'}},
    note:{label:'Notas',fields:{content:'Contenido'}},
    reading:{label:'Lectura activa',fields:{document:'Documento o referencia',page:'Página (número entero)',excerpt:'Fragmento seleccionado',annotation:'Anotación',concept:'Concepto relacionado',question:'Duda para investigar'}},
    lifeArea:{label:'Áreas de vida',fields:{purpose:'Qué importa en esta área',resources:'Recursos y apoyos',routine:'Cómo quiero revisarla'}},
    goal:{label:'Objetivos a largo plazo',fields:{area:'Área de vida o trabajo',objective:'Objetivo personal',due:'Fecha objetivo (AAAA-MM-DD)',priority:'Prioridad actual y motivo',stages:'Etapas (una por línea)',skills:'Habilidades por desarrollar',next:'Próxima acción',evidence:'Resultado o evidencia'}},
    household:{label:'Inventario del hogar',fields:{area:'Área de vida o trabajo',location:'Ubicación',model:'Modelo o identificación',purchase:'Compra y costo registrado',warranty:'Garantía y vencimiento',manual:'Referencia al manual',maintenance:'Reparaciones o mantenimiento',next:'Próximo mantenimiento',date:'Fecha del aviso (AAAA-MM-DD)'}},
    vehicle:{label:'Vehículos',fields:{model:'Modelo o identificación',odometer:'Kilometraje y unidad',service:'Servicio previsto',date:'Próximo servicio (AAAA-MM-DD)',insurance:'Seguro o documentación',notes:'Historial y observaciones'}},
    subscription:{label:'Suscripciones',fields:{provider:'Proveedor',amount:'Costo y moneda',frequency:'Frecuencia',date:'Próxima renovación (AAAA-MM-DD)',review:'Decisión sobre renovación',notes:'Notas'}},
    maintenance:{label:'Mantenimiento industrial',fields:{asset:'Equipo o artículo industrial',date:'Fecha programada (AAAA-MM-DD)',task:'Servicio previsto',source:'Referencia o procedimiento',result:'Resultado y comprobación'}},
    calibration:{label:'Calibraciones',fields:{identifier:'Identificador del instrumento',range:'Rango y unidad',reference:'Patrón o certificado',result:'Resultado registrado',uncertainty:'Incertidumbre documentada',date:'Fecha de próxima calibración (AAAA-MM-DD)',owner:'Responsable'}},
    travel:{label:'Viajes',fields:{area:'Área de vida o trabajo',destination:'Destino',dates:'Fechas e itinerario',budget:'Presupuesto y moneda',activities:'Actividades previstas',packing:'Equipaje',documents:'Documentos pendientes',references:'Fuentes o reservas anotadas'}},
    question:{label:'Preguntas abiertas',fields:{topic:'Tema',importance:'Importancia',question:'Pregunta',missing:'Información faltante',sources:'Posibles fuentes',next:'Próxima investigación',answer:'Respuesta sustentada'}}
  };
  const statuses={
    mission:{active:'Activa',paused:'Pausada',cancelled:'Cancelada',done:'Entregada y verificada'},
    knowledge:{pending:'Pendiente de comprobación',verified:'Verificada',documented:'Documentada',experience:'Experiencia personal',hypothesis:'Hipótesis',estimate:'Estimación',obsolete:'Obsoleta'},
    subscription:{active:'Activa',cancelled:'Cancelada'},
    maintenance:{planned:'Planificado',done:'Realizado',cancelled:'Cancelado'},
    calibration:{active:'En servicio',retired:'Fuera de servicio'},
    risk:{open:'Registrado',monitor:'En seguimiento',closed:'Cerrado'},
    change:{draft:'Propuesto',testing:'En pruebas',validated:'Validado',reverted:'Revertido'},
    goal:{active:'Activo',paused:'Pausado',done:'Alcanzado',abandoned:'Abandonado'},
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
  const failureCosts=['rework','waste','downtime','returns','complaints','reprints','consumables'];
  function qualityCosts(data){
    const unit=clean(data.unit,40);
    if(!unit)throw new Error('Indica una moneda.');
    const amounts={};
    for(const key of [...failureCosts,'prevention','inspection']){
      const value=clean(data[key],40);
      if(!value)continue;
      if(!/^\d{1,12}(?:[.,]\d{1,2})?$/.test(value))throw new Error('Captura '+kinds.qualityCost.fields[key]+' con hasta dos decimales y sin símbolos.');
      amounts[key]=Math.round(Number(value.replace(',','.'))*100);
    }
    if(!Object.keys(amounts).length)throw new Error('Captura al menos un costo.');
    const sum=keys=>keys.reduce((total,key)=>total+(amounts[key]||0),0)/100;
    return {unit,failures:sum(failureCosts),preventionInspection:sum(['prevention','inspection']),
      missing:[...failureCosts,'prevention','inspection'].filter(key=>!Object.hasOwn(amounts,key)).map(key=>kinds.qualityCost.fields[key])};
  }
  function riskScore(raw){
    const scale=Number(raw.scale),p=Number(raw.likelihood),i=Number(raw.impact);
    const detection=raw.detection===''||raw.detection===undefined?null:Number(raw.detection);
    if(!Number.isInteger(scale)||scale<2||scale>10||
      [p,i,...(detection===null?[]:[detection])].some(value=>!Number.isInteger(value)||value<1||value>scale)){
      throw new Error('Configura una escala entera de 2 a 10 y puntúa de 1 hasta ese máximo.');
    }
    return {score:p*i,maximum:scale**2,priorityNumber:detection===null?null:p*i*detection};
  }
  const historyLimit=12;
  function journalContent(record) {
    const data=Object.fromEntries(Object.keys(kinds[record.kind].fields).map(key=>[key,record.data?.[key]||'']));
    return {title:record.title,data,status:record.status||'',completed:[...(record.completed||[])]};
  }

  function retainVersion(next,previous) {
    if(!previous)return next;
    const history=previous.history||[];
    const old=journalContent(previous);
    if(JSON.stringify(old)===JSON.stringify(journalContent(next)))return previous;
    return {...next,history:[{
      id:crypto.randomUUID(),at:previous.updatedAt||previous.createdAt,...old,
      ...(previous.restoredFrom?{restoredFrom:previous.restoredFrom}:{})
    },...history].slice(0,historyLimit)};
  }

  function record(kind,raw,previous=null) {
    if(!Object.hasOwn(kinds,kind))throw new Error('Tipo de registro desconocido.');
    const title=clean(raw.title,100);
    if(!title)throw new Error('Escribe un título.');
    const data=Object.fromEntries(Object.keys(kinds[kind].fields).map(key=>[key,clean(raw[key])]));
    const choices=Object.keys(statuses[kind]||{});
    const status=choices.includes(raw.status)?raw.status:choices[0]||'';
    const completed=['mission','playbook','goal'].includes(kind)?steps(data.stages).filter(stage=>raw.completed?.includes(stage)):[];
    if(kind==='mission'&&status==='done'&&(!steps(data.stages).length||!data.objective||!data.deliverable||!data.acceptance||!data.evidence||completed.length!==steps(data.stages).length)){
      throw new Error('Para cerrar la misión, registra el objetivo, el entregable, los criterios y la evidencia. Marca todas las etapas realizadas.');
    }
    if(kind==='goal'){
      if(!data.objective)throw new Error('Describe el objetivo.');
      if(data.due&&!dateKey(data.due))throw new Error('Indica una fecha objetivo válida en formato AAAA-MM-DD.');
      if(status==='done'&&(!data.evidence||!steps(data.stages).length||completed.length!==steps(data.stages).length)){
        throw new Error('Registra la evidencia y completa las etapas antes de marcar el objetivo como alcanzado.');
      }
    }
    if(kind==='reading'&&(!data.document||data.page&&!/^[1-9]\d{0,5}$/.test(data.page))){
      throw new Error('Indica el documento y, si se conoce, una página positiva.');
    }
    if(['household','vehicle','subscription','calibration'].includes(kind)&&data.date&&!dateKey(data.date))throw new Error('Indica una fecha de aviso válida en formato AAAA-MM-DD.');
    if(status==='verified'&&(!data.source||!data.evidence))throw new Error('Agrega la fuente y la evidencia antes de marcar el conocimiento como verificado.');
    if(kind==='maintenance'){
      if(!/^(?:machines|stock):[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(data.asset)||!dateKey(data.date)||!data.task)
        throw new Error('Elige un activo, una fecha válida y describe el servicio.');
      if(status==='done'&&!data.result)throw new Error('Registra el resultado antes de marcar el servicio como realizado.');
    }
    if(kind==='decision'&&data.reviewDate&&!dateKey(data.reviewDate))throw new Error('Indica una fecha de revisión válida en formato AAAA-MM-DD.');
    if(kind==='scenario')compareCosts(data);
    if(kind==='risk'){
      riskScore(data);
      if(data.reviewDate&&!dateKey(data.reviewDate))throw new Error('Escribe una fecha de revisión válida.');
    }
    if(kind==='qualityCost')qualityCosts(data);
    if(status==='validated'&&(!data.approval||!data.tests||!data.results||!data.evidence||!data.rollback)){
      throw new Error('Registra autorización, pruebas, resultados, evidencia y plan de reversión.');
    }
    if(status==='answered'&&!data.answer)throw new Error('Registra la respuesta antes de cerrar la pregunta.');
    const now=new Date().toISOString();
    return retainVersion({id:previous?.id||crypto.randomUUID(),kind,title,data,status,completed,
      createdAt:previous?.createdAt||now,updatedAt:now},previous);
  }

  function decisionReviews(item){
    if(item?.kind!=='decision')return [];
    const snapshots=[{at:item.updatedAt,data:item.data},...(item.history||[])];
    const entries=[];
    for(const {at,data} of snapshots){
      const review={at,expected:data?.expected||'',actual:data?.actual||'',evidence:data?.evidence||'',lesson:data?.lesson||''};
      if(!review.actual&&!review.evidence&&!review.lesson)continue;
      const previous=entries.at(-1);
      if(previous&&['expected','actual','evidence','lesson'].every(key=>previous[key]===review[key]))continue;
      entries.push(review);
    }
    return entries;
  }
  function restoreRecord(previous,versionId) {
    const version=previous.history?.find(item=>item.id===versionId);
    if(!version)throw new Error('Esta versión ya no está disponible.');
    const restored=record(previous.kind,{...version.data,title:version.title,status:version.status,completed:version.completed},previous);
    return restored===previous?previous:{...restored,restoredFrom:version.id};
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
  function dateKey(value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
    const date=new Date(value+'T00:00:00Z');
    return Number.isFinite(+date)&&date.toISOString().slice(0,10)===value;
  }

  function lifeMap(records){
    const key=value=>value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/\s+/g,' ').trim();
    const groups=new Map();
    for(const item of records){
      if(item.kind==='lifeArea'){
        const id=key(item.title);
        if(!groups.has(id))groups.set(id,{title:item.title,areas:[],items:[]});
        groups.get(id).areas.push(item);
      }
    }
    const unassigned=[];
    for(const item of records){
      if(!['goal','mission','household','travel'].includes(item.kind))continue;
      const area=clean(item.data?.area);
      if(!area){unassigned.push(item);continue;}
      const id=key(area);
      if(!groups.has(id))groups.set(id,{title:area,areas:[],items:[]});
      groups.get(id).items.push(item);
    }
    return {groups:[...groups.values()].sort((a,b)=>a.title.localeCompare(b.title,'es')),unassigned};
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
  function factorialEffects(raw){
    const cells=new Map();
    for(const line of clean(raw).split(/\r?\n/).map(value=>value.trim()).filter(Boolean)){
      const match=/^([+-]{2}):\s*(.+)$/.exec(line);
      if(!match||cells.has(match[1]))throw new Error('Escribe una línea por combinación: --, +-, -+ y ++, seguida de dos puntos y las mediciones.');
      cells.set(match[1],measurementSummary(match[2]));
    }
    if(cells.size!==4||new Set([...cells.values()].map(cell=>cell.count)).size!==1)
      throw new Error('Registra las cuatro combinaciones con el mismo número de mediciones, al menos dos por combinación.');
    const [ll,hl,lh,hh]=['--','+-','-+','++'].map(key=>cells.get(key).mean);
    return {cells:[...cells].map(([key,data])=>({key,...data})),
      a:(hl+hh-ll-lh)/2,b:(lh+hh-ll-hl)/2,interaction:(hh+ll-hl-lh)/2};
  }
  function oneWayAnova(raw){
    const lines=clean(raw).split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
    if(lines.length<2||lines.length>20)throw new Error('Registra entre 2 y 20 grupos.');
    const names=new Set();
    const groups=lines.map(line=>{
      const index=line.indexOf(':');
      if(index<=0)throw new Error('Usa una línea por grupo con el formato Nombre: medición medición.');
      const name=line.slice(0,index).trim();
      if(names.has(name.toLowerCase()))throw new Error('Usa nombres distintos para los grupos.');
      names.add(name.toLowerCase());
      return {name,...measurementSummary(line.slice(index+1))};
    });
    const count=groups.reduce((sum,group)=>sum+group.count,0);
    const mean=groups.reduce((sum,group)=>sum+group.count*group.mean,0)/count;
    const between=groups.reduce((sum,group)=>sum+group.count*(group.mean-mean)**2,0);
    const within=groups.reduce((sum,group)=>sum+(group.count-1)*group.deviation**2,0);
    if(within===0)throw new Error('Hace falta variación dentro de al menos un grupo para calcular F.');
    const dfBetween=groups.length-1,dfWithin=count-groups.length;
    return {groups,dfBetween,dfWithin,between,within,f:(between/dfBetween)/(within/dfWithin)};
  }
  const api={kinds,statuses,relationStates,steps,record,decisionReviews,restoreRecord,historyLimit,relation,compareCosts,timeline,measurementSummary,dateKey,lifeMap,qualityCosts,riskScore,factorialEffects,oneWayAnova,graphNodes,graphView,linkedCases};
  if(typeof module==='object')module.exports=api;
  else root.liftsNexusJournal=api;
})(globalThis);
