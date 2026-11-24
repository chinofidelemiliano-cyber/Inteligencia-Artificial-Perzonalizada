'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const api=window.liftsWorkspace, core=window.liftsNexusJournal;
  const state=()=>api.getState();
  const records=()=>state().nexusJournal||[];
  const links=()=>state().nexusRelations||[];
  const form=$('journalEditor'), list=$('journalList'), graph=$('journalGraph'), notice=$('journalStatus');
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
  function renderEditor(item=null) {
    editing=item?.id||null;
    form.replaceChildren();
    node(form,'h3',item?'Editar '+item.title:'Nuevo registro');
    input(form,'Título del registro','title',item?.title||'','input').required=true;
    for(const [key,label] of Object.entries(core.kinds[kind].fields))input(form,label,key,item?.data[key]||'');
    if(core.statuses[kind])select(form,'Estado','status',core.statuses[kind],item?.status);
    if(['mission','playbook'].includes(kind)) {
      const checklist=node(form,'fieldset');
      node(checklist,'legend',kind==='mission'?'Etapas realizadas':'Pasos realizados');
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
    if(item?.kind==='meeting'&&item.data.next)button(form,'Preparar acuerdo como tarea',()=>{
      window.liftsWorkUI.prepareTask(item.data.next);
      const due=item.data.due;
      if(/^\d{4}-\d{2}-\d{2}$/.test(due))$('taskDate').value=due;
    });
    if(item)button(form,'Dejar de editar',()=>renderEditor());
  }
  form.onsubmit=event=>{
    event.preventDefault();
    if(pending)return;
    try{
      const values=new FormData(form);
      const old=records().find(item=>item.id===editing);
      const item=core.record(kind,{...Object.fromEntries(values),completed:values.getAll('completed')},old);
      state().nexusJournal=old?records().map(record=>record.id===old.id?item:record):[item,...records()];
      window.liftsNexus?.checkpoint('journal-record',item.id,item.title,false);
      renderList();renderGraph();renderEditor(item);renderTimeline();
      void save('Registro guardado.');
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
        node(row,'p',item.completed.length+' de '+core.steps(item.data.stages).length+(item.kind==='mission'?' etapas realizadas':' pasos realizados'));
      }
      button(row,'Abrir '+item.title,()=>{openRecord(item.id);form.elements.namedItem('title').focus();});
    }
  }
  function renderGraph() {
    graph.replaceChildren();
    const all=records();
    if(all.length<2){node(graph,'p','Guarda dos registros de Nexus para relacionarlos.');return;}
    const names=Object.fromEntries(all.map(item=>[item.id,item.title+' · '+core.kinds[item.kind].label]));
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
    for(const link of links().filter(link=>Object.hasOwn(names,link.from)&&Object.hasOwn(names,link.to))){
      const row=node(map,'li',names[link.from]+' → '+link.title+' → '+names[link.to]+' · '+core.relationStates[link.status]);
      if(link.evidence)node(row,'p',link.evidence);
      button(row,'Editar relación',()=>{
        relationId=link.id;
        for(const key of ['from','to','title','status','evidence'])relationForm.elements.namedItem(key).value=link[key]||'';
        relationSave.textContent='Guardar cambios de relación';
        relationForm.elements.namedItem('title').focus();
      });
      for(const key of ['from','to'])button(row,'Abrir '+names[link[key]],()=>openRecord(link[key]));
    }
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
  window.addEventListener('lifts-page',({detail})=>{if(detail.page==='journal'&&$('journalTimeline').open)renderTimeline();});
  const picker=$('journalKind');
  for(const [key,schema] of Object.entries(core.kinds)){const option=node(picker,'option',schema.label);option.value=key;}
  picker.onchange=()=>{kind=picker.value;renderList();renderEditor();};
  $('journalQuery').oninput=renderList;
  function reset(){
    epoch++;pending=false;retry=null;kind='mission';
    $('journalRetry').hidden=true;
    $('journalLinks').open=false;
    $('journalTimeline').open=false;
    $('journalTimelineQuery').value='';$('journalPeriod').value='day';
    picker.value=kind;$('journalQuery').value='';notice.textContent='';
    renderList();renderEditor();renderGraph();renderTimeline();
  }
  window.addEventListener('nexo-state',reset);
  window.liftsJournal={openRecord,reset};
  reset();
})();
