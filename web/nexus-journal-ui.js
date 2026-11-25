'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const api=window.liftsWorkspace, core=window.liftsNexusJournal;
  const state=()=>api.getState();
  const records=()=>state().nexusJournal||[];
  const links=()=>state().nexusRelations||[];
  const form=$('journalEditor'), list=$('journalList'), graph=$('journalGraph'), notice=$('journalStatus');
  let graphFocus='';
  let kind='mission', editing=null, epoch=0, pending=false, retry=null;
  function node(parent,tag,text) {
    const element=document.createElement(tag);
    if(text!==undefined)element.textContent=text;
    parent.append(element);
    return element;
  }
  function button(parent,label,action) {
    const control=node(parent,'button',label);
    control.type='button';control.className='secondary';control.onclick=action;
    return control;
  }
  function assetChoices(){
    const data=api.getState().industrial||{};
    return Object.fromEntries(['machines','stock'].flatMap(kind=>(data[kind]||[]).map(item=>[kind+':'+item.id,item.name])));
  }
  function input(parent,label,name,value,tag='textarea') {
    const wrapper=node(parent,'label',label);
    const control=node(wrapper,tag);
    control.name=name;control.value=value;control.maxLength=tag==='input'?100:1500;
    return control;
  }
  function select(parent,label,name,choices,value) {
    const wrapper=node(parent,'label',label);
    const control=node(wrapper,'select');
    control.name=name;
    control.setAttribute('aria-label',label);
    for(const [key,title] of Object.entries(choices)) {
      const option=node(control,'option',title);option.value=key;
    }
    if(value)control.value=value;
    return control;
  }
  async function save(success) {
    if(pending)return;
    pending=true;
    const version=epoch;
    notice.textContent='Guardando…';
    $('journalRetry').hidden=true;
    try {
      const ok=await api.save();
      if(version!==epoch)return;
      if(!ok)throw new Error();
      notice.textContent=success;
      retry=null;
    } catch {
      if(version!==epoch)return;
      retry=success;
      notice.textContent='El cambio quedó en esta sesión. Reintenta el guardado antes de salir.';
      $('journalRetry').hidden=false;
    } finally {if(version===epoch)pending=false;}
  }
  $('journalRetry').onclick=()=>{if(retry)void save(retry);};
  function renderRecordHistory(item) {
    const history=node(form,'details');
    node(history,'summary','Historial de versiones');
    node(history,'p','Se conservan hasta '+core.historyLimit+' versiones anteriores. Restaurar una versión guarda el contenido actual en el historial.');
    if(!item.history?.length){
      node(history,'p','Todavía no hay versiones anteriores.');
      return;
    }
    const format=new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeStyle:'short'});
    for(const [index,version] of item.history.entries()){
      const entry=node(history,'details');
      const date=new Date(version.at);
      const when=Number.isFinite(+date)?format.format(date):'Fecha sin registrar';
      const versionLabel='Versión anterior '+(index+1);
      node(entry,'summary',versionLabel+' · '+when+' · '+version.title);
      const content=node(entry,'dl');
      const compare=(label,before,after)=>{
        if(!before&&!after)return;
        node(content,'dt',label);
        node(content,'dd',before||'Sin registrar');
        if(before!==after)node(content,'dd','Actual: '+(after||'Sin registrar'));
      };
      compare('Título',version.title,item.title);
      const states=core.statuses[item.kind]||{};
      compare('Estado',states[version.status]||version.status,states[item.status]||item.status);
      for(const [key,label] of Object.entries(core.kinds[item.kind].fields)){
        compare(label,version.data?.[key]||'',item.data?.[key]||'');
      }
      compare('Pasos realizados',(version.completed||[]).join(' · '),(item.completed||[]).join(' · '));
      button(entry,'Restaurar '+versionLabel.toLowerCase(),()=>{
        if(pending||editing!==item.id)return;
        const current=records().find(record=>record.id===item.id);
        if(!current)return;
        if(!confirm('¿Restaurar «'+version.title+'»? La versión guardada actual quedará en el historial. Las ediciones que aún no guardaste se reemplazarán.'))return;
        try{
          const restored=core.restoreRecord(current,version.id);
          if(restored===current){notice.textContent='Esta versión coincide con el registro actual.';return;}
          commitRecord(restored,current,'Versión restaurada.');
        }catch(error){notice.textContent=error.message;}
      });
    }
  }
  function commitRecord(item,old,message) {
    state().nexusJournal=old?records().map(record=>record.id===old.id?item:record):[item,...records()];
    window.liftsNexus?.checkpoint('journal-record',item.id,item.title,false);
    renderList();renderGraph();renderEditor(item);renderTimeline();renderLifeMap();
    void save(message);
  }
  function renderEditor(item=null) {
    editing=item?.id||null;
    form.replaceChildren();
    node(form,'h3',item?'Editar '+item.title:'Nuevo registro');
    input(form,'Título del registro','title',item?.title||'','input').required=true;
    for(const [key,label] of Object.entries(core.kinds[kind].fields)){
      if(kind==='maintenance'&&key==='asset'){
        const choices={'':'Selecciona un activo',...assetChoices()};
        if(item?.data.asset&&!Object.hasOwn(choices,item.data.asset))choices[item.data.asset]='Activo histórico fuera del inventario';
        select(form,label,key,choices,item?.data.asset).required=true;
      }else input(form,label,key,item?.data[key]||'');
    }
    if(kind==='maintenance'&&item?.data.asset){
      button(form,'Abrir activo del mantenimiento',()=>{
        const [group,id]=item.data.asset.split(':');
        if(!window.liftsIndustrial.openAsset(group,id))notice.textContent='El activo no está disponible en esta cuenta.';
      });
    }
    if(core.statuses[kind])select(form,'Estado','status',core.statuses[kind],item?.status);
    if(['mission','playbook','goal'].includes(kind)) {
      const checklist=node(form,'fieldset');
      node(checklist,'legend',kind==='playbook'?'Pasos realizados':'Etapas realizadas');
      const refresh=()=>{
        const old=new Set([...checklist.querySelectorAll(':checked')].map(box=>box.value));
        checklist.querySelectorAll('label').forEach(label=>label.remove());
        for(const stage of core.steps(form.elements.namedItem('stages').value)){
          const label=node(checklist,'label');
          const box=node(label,'input');box.type='checkbox';box.name='completed';box.value=stage;
          box.checked=old.has(stage);
          label.append(document.createTextNode(stage));
        }
      };
      form.elements.namedItem('stages').oninput=refresh;
      refresh();
      for(const box of checklist.querySelectorAll('input'))box.checked=item?.completed?.includes(box.value)||false;
    }
    const saveButton=node(form,'button','Guardar registro');saveButton.type='submit';
    if(kind==='reading')button(form,'Subrayar un PDF en Utilidades',()=>window.liftsNexus.open({id:'pdf-markup',key:''}));
    if(kind==='decision'&&item){
      const history=node(form,'details');
      node(history,'summary','Cronología de revisión de la decisión');
      const entries=core.decisionReviews(item);
      if(!entries.length)node(history,'p','Todavía no hay resultados o evidencias de revisión.');
      const dates=new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeStyle:'short'});
      for(const entry of entries){
        const card=node(history,'article');
        const time=Date.parse(entry.at);
        node(card,'h4',Number.isFinite(time)?dates.format(time):'Revisión registrada');
        node(card,'p','Resultado esperado: '+(entry.expected||'Por registrar'));
        node(card,'p','Resultado observado: '+(entry.actual||'Por registrar'));
        if(entry.evidence)node(card,'p','Evidencia: '+entry.evidence);
        if(entry.lesson)node(card,'p','Aprendizaje: '+entry.lesson);
      }
    }
    if(kind==='scenario') {
      const result=node(form,'div');
      const calculate=()=>{
        result.replaceChildren();
        try {
          const summary=core.compareCosts(Object.fromEntries(new FormData(form)));
          const table=node(result,'table');
          node(table,'caption','Costo y diferencia respecto al escenario base · '+summary.unit);
          const headings=node(node(table,'thead'),'tr');
          for(const title of ['Escenario','Costo','Diferencia'])node(headings,'th',title).scope='col';
          const body=node(table,'tbody');
          const format=new Intl.NumberFormat('es-MX',{maximumFractionDigits:2});
          for(const row of summary.rows) {
            const line=node(body,'tr');
            node(line,'th',row.label).scope='row';
            node(line,'td',format.format(row.value));
            node(line,'td',format.format(row.difference));
          }
          node(result,'p','Diferencia = costo del escenario − costo base. Los resultados dependen de los valores que ingreses.');
        }catch(error){node(result,'p',error.message);}
      };
      button(form,'Comparar costos',calculate);
      if(item)calculate();
    }
    if(kind==='experiment') {
      const result=node(form,'p');
      result.setAttribute('role','status');
      button(form,'Resumir mediciones',()=>{
        try {
          const unit=form.elements.namedItem('unit').value.trim();
          if(!unit)throw new Error('Indica la unidad de medida.');
          const summary=core.measurementSummary(form.elements.namedItem('readings').value);
          const format=new Intl.NumberFormat('es-MX',{maximumSignificantDigits:8});
          result.textContent=summary.count+' lecturas. Media '+format.format(summary.mean)+' '+unit+
            '. Desviación estándar muestral '+format.format(summary.deviation)+' '+unit+
            '. La dispersión de la muestra no representa por sí sola la incertidumbre del instrumento.';
        }catch(error){result.textContent=error.message;}
      });
    }
    if(kind==='experiment'){
      const instructions=node(form,'details');node(instructions,'summary','Cómo usar un diseño factorial 2×2');
      node(instructions,'p','El primer signo indica el nivel del factor A y el segundo el de B. Usa cuatro líneas, por ejemplo «--: 8 10», y el mismo número de mediciones por combinación. Define los factores y niveles en el registro.');
      const result=node(form,'div');result.setAttribute('role','status');
      button(form,'Calcular efectos factoriales',()=>{
        result.replaceChildren();
        try{
          const summary=core.factorialEffects(form.elements.namedItem('factorial').value);
          const unit=form.elements.namedItem('unit').value.trim();
          if(!unit)throw new Error('Indica la unidad de medida.');
          const format=new Intl.NumberFormat('es-MX',{maximumSignificantDigits:7});
          node(result,'p','Efecto A '+format.format(summary.a)+' · Efecto B '+format.format(summary.b)+' · Interacción '+format.format(summary.interaction)+' '+unit+'.');
          const list=node(result,'ul');
          for(const cell of summary.cells)node(list,'li',cell.key+' · n = '+cell.count+' · media '+format.format(cell.mean)+' '+unit);
          node(result,'p','Efectos descriptivos: se comparan las medias de los niveles alto y bajo. Comprueba el diseño, el orden de ejecución y la variabilidad antes de generalizar.');
        }catch(error){node(result,'p',error.message);}
      });
    }
    if(kind==='experiment'){
      const result=node(form,'div');
      result.setAttribute('role','status');
      button(form,'Calcular ANOVA de una vía',()=>{
        result.replaceChildren();
        try{
          const data=core.oneWayAnova(form.elements.namedItem('groups').value);
          const format=new Intl.NumberFormat('es-MX',{maximumSignificantDigits:7});
          node(result,'p','F = '+format.format(data.f)+' · grados de libertad '+data.dfBetween+' y '+data.dfWithin+'.');
          node(result,'p','La prueba supone observaciones independientes, residuos aproximadamente normales y varianzas similares. Este cálculo muestra F y sus grados de libertad; la conclusión requiere contrastarlos con el criterio de prueba.');
          const list=node(result,'ul');
          for(const group of data.groups)node(list,'li',group.name+' · n = '+group.count+' · media '+format.format(group.mean));
        }catch(error){node(result,'p',error.message);}
      });
    }
    if(kind==='risk'){
      const result=node(form,'div');result.setAttribute('role','status');
      button(form,'Calcular índice de riesgo',()=>{
        try{
          const scores=core.riskScore(Object.fromEntries(new FormData(form)));
          result.textContent='Puntuación subjetiva: '+scores.score+' de '+scores.maximum+
            (scores.priorityNumber===null?'.':' · Número de prioridad con detección: '+scores.priorityNumber+'.');
        }catch(error){result.textContent=error.message;}
      });
    }
    if(kind==='qualityCost'){
      const result=node(form,'div');
      result.setAttribute('role','status');
      button(form,'Sumar costos registrados',()=>{
        result.replaceChildren();
        try{
          const data=core.qualityCosts(Object.fromEntries(new FormData(form)));
          const format=new Intl.NumberFormat('es-MX',{maximumFractionDigits:2});
          node(result,'p','Fallas registradas: '+format.format(data.failures)+' '+data.unit+'.');
          node(result,'p','Prevención e inspección registradas: '+format.format(data.preventionInspection)+' '+data.unit+'.');
          if(data.missing.length)node(result,'p','Sin importe registrado: '+data.missing.join(', ')+'.');
        }catch(error){node(result,'p',error.message);}
      });
    }
    if(item?.kind==='meeting'&&item.data.next)button(form,'Preparar acuerdo como tarea',()=>{
      window.liftsWorkUI.prepareTask(item.data.next);
      const due=item.data.due;
      if(/^\d{4}-\d{2}-\d{2}$/.test(due))$('taskDate').value=due;
    });
    if(item?.kind==='meeting')button(form,'Descargar minuta PDF',()=>{
      const sections=Object.entries(core.kinds.meeting.fields).filter(([key])=>item.data[key])
        .map(([key,heading])=>({heading,body:item.data[key]}));
      if(!sections.length){notice.textContent='Registra y guarda los detalles de la reunión primero.';return;}
      const pdf=window.liftsPdf.make({title:'Minuta de reunión',subtitle:item.title,sections});
      const url=URL.createObjectURL(new Blob([pdf],{type:'application/pdf'}));
      const link=document.createElement('a');link.href=url;link.download='lifts-minuta.pdf';link.click();
      setTimeout(()=>URL.revokeObjectURL(url),30000);
    });
    if(item?.kind==='calibration')button(form,'Preparar QR privado',()=>window.liftsFieldLinks.prepare('calibration',item.id));
    if(item&&['vehicle','subscription','calibration'].includes(item.kind)&&item.data.date){
      const actions={vehicle:'Servicio de ',subscription:'Renovación de ',calibration:'Calibración de '};
      button(form,'Preparar aviso con esta fecha',()=>{
        window.liftsReminders.open(actions[item.kind]+item.title,new Date(item.data.date+'T09:00:00'));
      });
    }
    if(item?.kind==='household'&&item.data.next)button(form,'Preparar aviso de mantenimiento',()=>{
      const date=item.data.date?new Date(item.data.date+'T09:00:00'):undefined;
      window.liftsReminders.open(item.data.next,date);
    });
    if(item){
      button(form,'Dejar de editar',()=>renderEditor());
      renderRecordHistory(item);
    }
  }
  form.onsubmit=event=>{
    event.preventDefault();
    if(pending)return;
    try{
      const values=new FormData(form);
      const old=records().find(item=>item.id===editing);
      if(kind==='maintenance'&&values.get('asset')!==old?.data.asset&&!Object.hasOwn(assetChoices(),values.get('asset')))
        throw new Error('Elige un activo del inventario de tu cuenta.');
      const item=core.record(kind,{...Object.fromEntries(values),completed:values.getAll('completed')},old);
      if(old&&item===old&&!retry){notice.textContent='El registro ya está actualizado.';return;}
      commitRecord(item,old,'Registro guardado.');
    }catch(error){notice.textContent=error.message;}
  };
  function renderList() {
    list.replaceChildren();
    const query=$('journalQuery').value.trim().toLocaleLowerCase('es');
    const items=records().filter(item=>item.kind===kind&&[item.title,...Object.values(item.data)].some(text=>text.toLocaleLowerCase('es').includes(query)));
    if(!items.length)node(list,'p','Sin registros que coincidan.');
    for(const item of items){
      const row=node(list,'article');row.className='reminder-card';
      node(row,'h3',item.title);
      if(item.status)node(row,'p',core.statuses[item.kind][item.status]);
      if(['mission','playbook'].includes(item.kind)){
        node(row,'p',item.completed.length+' de '+core.steps(item.data.stages).length+(item.kind==='playbook'?' pasos realizados':' etapas realizadas'));
      }
      button(row,'Abrir '+item.title,()=>{openRecord(item.id);form.elements.namedItem('title').focus();});
    }
  }
  function openNode(item) {
    if(item.target==='journal-record')return openRecord(item.id);
    return window.liftsNexus.open({id:item.target,key:item.id});
  }

  function renderNeighborhood(parent,all,edges,names) {
    const region=node(parent,'section');
    region.className='nexus-map';
    node(region,'h3','Mapa de relaciones');
    const picker=select(region,'Registro central','focus',names,Object.hasOwn(names,graphFocus)?graphFocus:all[0].id);
    const branches=node(region,'div');
    branches.className='nexus-map-branches';
    const redraw=()=>{
      graphFocus=picker.value;
      branches.replaceChildren();
      const center=all.find(item=>item.id===graphFocus);
      const hub=node(branches,'div');
      hub.className='nexus-map-hub';
      button(hub,names[center.id],()=>openNode(center));
      const nearby=edges.filter(edge=>edge.from===center.id||edge.to===center.id);
      if(!nearby.length){node(branches,'p','Este registro todavía no tiene relaciones guardadas.');return;}
      const connections=node(branches,'ul');
      for(const edge of nearby){
        const outgoing=edge.from===center.id;
        const related=outgoing?edge.destination:edge.origin;
        const row=node(connections,'li');
        node(row,'p',(outgoing?'→ ':'← ')+edge.title+' · '+core.relationStates[edge.status]);
        if(edge.evidence)node(row,'p',edge.evidence);
        button(row,names[related.id],()=>{picker.value=related.id;redraw();picker.focus();});
        button(row,'Abrir registro relacionado',()=>openNode(related));
      }
    };
    picker.onchange=redraw;
    redraw();
  }

  function renderTraces(parent,all,edges) {
    const section=node(parent,'section');
    node(section,'h3','Fichas con casos recurrentes');
    node(section,'p','Agrupa fichas con dos o más casos distintos vinculados mediante relaciones verificadas con evidencia. Compartir una ficha no demuestra una causa común.');
    const groups=core.linkedCases(all,edges);
    if(!groups.length){node(section,'p','Todavía no hay fichas con dos casos vinculados de esa forma.');return;}
    for(const group of groups) {
      const article=node(section,'article');
      node(article,'h4',group.engineering.title+' · '+group.cases.length+' casos');
      button(article,'Abrir ficha de Ingeniería',()=>openNode(group.engineering));
      const list=node(article,'ul');
      for(const entry of group.cases) {
        const row=node(list,'li');
        button(row,entry.diagnosis.title,()=>openNode(entry.diagnosis));
        for(const link of entry.links)node(row,'p',link.title+' · '+link.evidence);
      }
    }
  }

  function renderGraph() {
    graph.replaceChildren();
    const all=core.graphNodes(state());
    if(all.length<2){node(graph,'p','Guarda dos registros de Nexus, Ingeniería o Diagnóstico para relacionarlos.');return;}
    const edges=core.graphView(all,links());
    const names=Object.fromEntries(all.map(item=>[item.id,item.title+' · '+item.category]));
    renderNeighborhood(graph,all,edges,names);
    const relationForm=node(graph,'form');
    let relationId=null;
    select(relationForm,'Desde','from',names);
    select(relationForm,'Hacia','to',names);
    input(relationForm,'Relación','title','','input');
    select(relationForm,'Estado de la relación','status',core.relationStates);
    input(relationForm,'Evidencia de la relación','evidence','');
    const relationSave=node(relationForm,'button','Registrar relación');
    relationSave.type='submit';
    relationForm.onsubmit=event=>{
      event.preventDefault();
      if(pending)return;
      try{
        const item=core.relation(Object.fromEntries(new FormData(relationForm)),all);
        if(links().some(link=>link.id!==relationId&&link.from===item.from&&link.to===item.to&&link.title===item.title))throw new Error('Ya existe esa relación.');
        state().nexusRelations=relationId?links().map(link=>link.id===relationId?{...item,id:relationId}:link):[item,...links()];
        renderGraph();void save('Relación guardada.');
      }catch(error){notice.textContent=error.message;}
    };
    const map=node(graph,'ul');
    for(const link of edges){
      const row=node(map,'li',names[link.from]+' → '+link.title+' → '+names[link.to]+' · '+core.relationStates[link.status]);
      if(link.evidence)node(row,'p',link.evidence);
      button(row,'Editar relación',()=>{
        relationId=link.id;
        for(const key of ['from','to','title','status','evidence'])relationForm.elements.namedItem(key).value=link[key]||'';
        relationSave.textContent='Guardar cambios de relación';
        relationForm.elements.namedItem('title').focus();
      });
      for(const key of ['from','to'])button(row,'Abrir '+names[link[key]],()=>openNode(key==='from'?link.origin:link.destination));
    }
    renderTraces(graph,all,edges);
  }
  function openRecord(id) {
    const item=records().find(entry=>entry.id===id);
    if(!item)return false;
    api.open('journal');
    if($('journal').hidden)return false;
    kind=item.kind;
    $('journalKind').value=kind;
    renderList();renderEditor(item);
    window.liftsNexus?.checkpoint('journal-record',id,item.title);
    return true;
  }
  function prepareDraft(next,values={}){
    if(!Object.hasOwn(core.kinds,next))return false;
    if(!$('journal').hidden&&form.elements.namedItem('title')?.value.trim()&&
      !confirm('¿Abrir otro borrador? Las ediciones sin guardar del registro actual se reemplazarán.'))return false;
    api.open('journal');
    if($('journal').hidden)return false;
    kind=next;picker.value=kind;$('journalQuery').value='';
    renderList();renderEditor();
    for(const key of ['title',...Object.keys(core.kinds[kind].fields)]){
      const control=form.elements.namedItem(key);
      if(typeof values[key]==='string')control.value=control.tagName==='SELECT'?values[key]:values[key].slice(0,control.maxLength);
    }
    form.elements.namedItem('title').focus();
    return true;
  }

  function renderLifeMap(){
    const result=core.lifeMap(records()), region=$('journalLifeItems');
    region.replaceChildren();
    const draw=(title,items)=>{
      const section=node(region,'article',undefined);
      node(section,'h4',title);
      const list=node(section,'ul');
      for(const item of items){
        const row=node(list,'li');
        button(row,item.title,()=>openRecord(item.id));
        if(item.status)node(row,'span',' · '+core.statuses[item.kind][item.status]);
      }
    };
    for(const group of result.groups)draw(group.title,[...group.areas,...group.items]);
    if(result.unassigned.length)draw('Sin área asignada',result.unassigned);
    if(!result.groups.length&&!result.unassigned.length)node(region,'p','Crea un área u objetivo para empezar a construir tu mapa.');
  }
  $('journalLifeMap').addEventListener('toggle',()=>{if($('journalLifeMap').open)renderLifeMap();});
  function renderTimeline() {
    const view=$('journalTimelineItems');
    view.replaceChildren();
    const period=$('journalPeriod').value;
    const start=new Date();
    start.setHours(0,0,0,0);
    if(period==='week')start.setDate(start.getDate()-(start.getDay()+6)%7);
    if(period==='month')start.setDate(1);
    if(period==='year')start.setMonth(0,1);
    const end=new Date(start);
    if(period==='year')end.setFullYear(end.getFullYear()+1);
    else if(period==='month')end.setMonth(end.getMonth()+1);
    else end.setDate(end.getDate()+(period==='week'?7:1));
    const query=$('journalTimelineQuery').value.trim().toLowerCase();
    const events=core.timeline(state(),+start,+end).filter(item=>(item.label+' '+item.category).toLowerCase().includes(query));
    if(!events.length)node(view,'li','Sin acontecimientos registrados para ese filtro y periodo.');
    for(const {at,label,category,target,id} of events){
      const row=node(view,'li',new Date(at).toLocaleDateString('es-MX')+' · '+category+' · ');
      button(row,label,()=>window.liftsNexus.open({id:target,key:target.endsWith('-record')?id:''}));
    }
  }
  $('journalTimeline').addEventListener('toggle',renderTimeline);
  $('journalPeriod').onchange=renderTimeline;
  $('journalTimelineQuery').oninput=renderTimeline;
  window.addEventListener('lifts-page',({detail})=>{if(detail.page==='journal'){
    if($('journalTimeline').open)renderTimeline();
    renderGraph();
  }});
  const picker=$('journalKind');
  for(const [key,schema] of Object.entries(core.kinds)){const option=node(picker,'option',schema.label);option.value=key;}
  picker.onchange=()=>{kind=picker.value;renderList();renderEditor();};
  $('journalQuery').oninput=renderList;
  function reset(){
    epoch++;pending=false;retry=null;kind='mission';graphFocus='';
    $('journalRetry').hidden=true;
    $('journalLinks').open=false;
    $('journalLifeMap').open=false;
    $('journalTimeline').open=false;
    $('journalTimelineQuery').value='';$('journalPeriod').value='day';
    picker.value=kind;$('journalQuery').value='';notice.textContent='';
    renderList();renderEditor();renderGraph();renderTimeline();renderLifeMap();
  }
  window.addEventListener('nexo-state',reset);
  window.addEventListener('lifts-backup-restored',()=>{renderList();renderGraph();renderTimeline();renderLifeMap();});
  window.liftsJournal={openRecord,prepareDraft,reset};
  reset();
})();
