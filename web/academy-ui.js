'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const api=window.liftsWorkspace;
  const shell=$('academyContent');
  const status=$('academyStatus');
  const empty=()=>({done:{},favorites:[],notes:{},history:[],last:''});
  const progress=()=>api.getState().academyProgress || empty();
  let modules,loading,current='',view='catalog',generation=0,tutor;
  let filter='',level='',showFavorites=false;
  let saving=false;
  const lessonKey=(course,lesson)=>course.id+'/'+lesson.id;
  const catalogKeys=()=>modules.data.courses.flatMap(course=>course.lessons.map(lesson=>lessonKey(course,lesson)));
  const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

  function node(parent,tag,text,style) {
    const el=document.createElement(tag);
    if(text!==undefined)el.textContent=text;
    if(style)el.className=style;
    parent.append(el);
    return el;
  }
  function button(parent,label,action,style='secondary') {
    const el=node(parent,'button',label,style);
    el.type='button';el.onclick=action;return el;
  }
  function heading(parent,title){return node(parent,'h3',title);}
  function field(label,input,parent){const wrapper=node(parent,'label',label);wrapper.append(input);return input;}
  function find(key) {
    const [courseId,id]=key.split('/');
    const course=modules?.data.courses.find(item=>item.id===courseId);
    const lesson=course?.lessons.find(item=>item.id===id);
    return course&&lesson?{course,lesson}:null;
  }

  async function load() {
    if(modules)return modules;
    if(!loading)loading=Promise.all([import('./academy-curriculum.js'),import('./academy-tools.js'),import('./academy-paths.js')])
      .then(([data,tools,paths])=>modules={data,tools,paths}).catch(error=>{loading=null;throw error;});
    return loading;
  }
  let navigation=0;
  async function open(next='catalog',key='') {
    const request=++navigation;
    api.open('academy');
    if($('academy').hidden)return;
    const version=generation;
    status.textContent=modules?'':'Cargando la Academia…';
    try {
      await load();
      if(version!==generation||request!==navigation||$('academy').hidden)return;
      if(next==='lesson'&&!find(key)){
        status.textContent='No se encontró la lección guardada.';
        return;
      }
      tutor?.abort();
      view=next;current=key;
      status.textContent='';
      render();
      const ids={catalog:'academy',tools:'simulators',library:'library',paths:'study-paths',lesson:'lesson'};
      window.liftsNexus?.checkpoint(ids[next],next==='lesson'?key:'',next==='lesson'?find(key).lesson.title:'');
    } catch {
      if(version!==generation||request!==navigation)return;
      status.textContent='No se pudo cargar el contenido. Vuelve a pulsar Explorar cursos.';
    }
  }
  function matching(query) {
    const words=normalize(query.trim()).split(/\s+/).filter(Boolean);
    return modules.data.courses.flatMap(course=>course.lessons.map(lesson=>{
      const haystack=normalize([course.title,course.summary,lesson.title,lesson.theory,lesson.practice,lesson.exercise].join(' '));
      const title=normalize(course.title+' '+lesson.title);
      return {course,lesson,hit:words.every(word=>haystack.includes(word)),rank:words.filter(word=>title.includes(word)).length};
    })).filter(result=>result.hit).sort((a,b)=>b.rank-a.rank);
  }
  async function search(query) {
    await load();
    return matching(query).slice(0,7).map(({course,lesson})=>({label:lesson.title+' · '+course.title,key:lessonKey(course,lesson)}));
  }
  async function save(patch,message) {
    if(saving)return false;
    saving=true;
    const state=api.getState(),version=generation,old=state.academyProgress;
    state.academyProgress={...progress(),...patch};
    try {
      if(await api.save()===false)throw new Error();
      if(version!==generation)return false;
      status.textContent=message;
      updateProgress();
      return true;
    } catch {
      if(version===generation){
        state.academyProgress=old;
        status.textContent='No se confirmó el guardado. Puedes reintentar.';
      }
      return false;
    } finally {
      if(version===generation)saving=false;
    }
  }
  function updateProgress() {
    const data=progress();
    const all=catalogKeys();
    const completed=all.filter(key=>data.done[key]).length;
    $('academyProgress').max=all.length;
    $('academyProgress').value=completed;
    $('academyProgressText').textContent=completed+' de '+all.length+' lecciones completadas';
    $('academyContinue').hidden=!find(data.last);
  }
  function render() {
    updateProgress();
    shell.replaceChildren();
    for(const [id,name] of [['academyCatalogButton','catalog'],['academyToolsButton','tools'],['academyLibraryButton','library'],['academyPathsButton','paths']]) {
      $(id).setAttribute('aria-pressed',String(view===name));
    }
    if(view==='lesson'&&find(current))renderLesson(find(current));
    else if(view==='tools')renderTools();
    else if(view==='library')renderLibrary();
    else if(view==='paths')renderPaths();
    else renderCatalog();
  }
  function renderPaths(){
    const card=node(shell,'article',undefined,'card');
    const data=progress(),{goals,routeTo,todayKey,schedule}=modules.paths;
    const valid=new Set(catalogKeys());
    heading(card,'Ruta por objetivo');
    node(card,'p','El orden sugiere qué estudiar primero. Puedes abrir cualquier lección y comprobar lo aprendido durante el repaso.');
    const select=document.createElement('select');
    node(select,'option','Elige un objetivo').value='';
    for(const [key,goal] of Object.entries(goals))node(select,'option',goal.label).value=key;
    select.value=Object.hasOwn(goals,data.goal)?data.goal:'';
    field('Objetivo de estudio',select,card);
    button(card,'Guardar objetivo',async()=>{
      if(!Object.hasOwn(goals,select.value)){status.textContent='Elige un objetivo de estudio.';return;}
      if(await save({goal:select.value},'Objetivo guardado.')&&view==='paths')render();
    });
    const guide=node(card,'div');
    const draw=()=>{
      guide.replaceChildren();
      if(!Object.hasOwn(goals,select.value))return;
      const keys=routeTo(goals[select.value].target,valid);
      const next=keys.find(key=>!progress().done[key]);
      node(guide,'p',keys.filter(key=>progress().done[key]).length+' de '+keys.length+' lecturas completadas en esta ruta.');
      if(next)button(guide,'Continuar ruta',()=>open('lesson',next));
      else node(guide,'p','Completaste las lecturas de esta ruta. Usa el repaso para comprobar qué recuerdas.');
      const outline=node(guide,'ol');
      for(const key of keys){
        const row=node(outline,'li');
        const lesson=find(key).lesson;
        button(row,lesson.title,()=>open('lesson',key));
        node(row,'span',progress().done[key]?' · Lectura completada':' · Pendiente de lectura');
      }
    };
    select.onchange=draw;draw();
    heading(card,'Repasos programados');
    const queue=Object.entries(data.reviews||{}).filter(([key])=>valid.has(key)).sort((a,b)=>a[1].due.localeCompare(b[1].due));
    if(!queue.length)node(card,'p','Puedes añadir una lección al repaso desde el lector.');
    const day=todayKey();
    for(const [key,review] of queue){
      const {lesson}=find(key);
      const entry=node(card,'details');
      node(entry,'summary',lesson.title+' · '+(review.due<=day?'Disponible':'Programado para '+review.due));
      if(review.due>day)continue;
      const response=document.createElement('textarea');response.maxLength=3000;
      field('Explica cómo aplicarías «'+lesson.title+'» sin consultar apuntes',response,entry);
      const reference=node(entry,'div');reference.hidden=true;
      button(entry,'Mostrar referencia de la lección',()=>{
        if(!response.value.trim()){status.textContent='Escribe primero tu explicación para practicar la recuperación activa.';return;}
        reference.hidden=false;status.textContent='';
      });
      node(reference,'p',lesson.theory);
      node(reference,'p',lesson.exercise);
      node(reference,'p','Compara si tu explicación incluye la variable que medirías y cómo interpretarías el resultado.');
      for(const [rating,label] of [['again','Necesito repasarla'],['remembered','Pude explicarla']]){
        button(reference,label,async()=>{
          try{
            const next=schedule(progress().reviews?.[key],rating,todayKey());
            if(await save({reviews:{...progress().reviews,[key]:next}},'Próximo repaso: '+next.due+'.')&&view==='paths')render();
          }catch(error){status.textContent=error.message;}
        });
      }
    }
  }
  function renderCatalog() {
    const card=node(shell,'article',undefined,'card');
    heading(card,'Especialidades');
    const connections=node(card,'div',undefined,'academy-tabs');
    button(connections,'Ingeniería · Placas y distorsión',()=>api.open('engineering'));
    button(connections,'Lifts Excel',()=>api.open('excel'));
    button(connections,'Diagnóstico guiado',()=>api.open('diagnostics'));
    const bar=node(card,'div',undefined,'academy-search');
    const input=document.createElement('input');
    input.type='search';input.placeholder='Ej. anilox o metamerismo';input.value=filter;
    field('Buscar en la Academia',input,bar);
    const select=document.createElement('select');
    node(select,'option','Todos los niveles').value='';
    modules.data.levels.forEach((label,index)=>{node(select,'option',label).value=String(index);});
    select.value=level;field('Nivel',select,bar);
    const favorites=button(bar,showFavorites?'Ver todas':'Ver favoritos',()=>{
      showFavorites=!showFavorites;
      favorites.textContent=showFavorites?'Ver todas':'Ver favoritos';draw();
    });
    const results=node(card,'div',undefined,'academy-course-grid');
    const draw=()=>{
      const data=progress();
      const matches=matching(filter).filter(({course,lesson})=>(level===''||String(course.level)===level)&&
        (!showFavorites||data.favorites.includes(lessonKey(course,lesson))));
      results.replaceChildren();
      if(!matches.length)node(results,'p','No hay resultados con esos filtros.');
      for(const course of modules.data.courses){
        const lessons=matches.filter(result=>result.course===course);
        if(!lessons.length)continue;
        const tile=node(results,'article',undefined,'academy-tile');
        node(tile,'small',modules.data.levels[course.level]);
        heading(tile,course.title);node(tile,'p',course.summary);
        const count=course.lessons.filter(lesson=>data.done[lessonKey(course,lesson)]).length;
        node(tile,'p',count+' / '+course.lessons.length+' completadas','notice');
        for(const {lesson} of lessons)button(tile,lesson.title,()=>open('lesson',lessonKey(course,lesson)));
      }
    };
    input.oninput=()=>{filter=input.value;draw();};
    select.onchange=()=>{level=select.value;draw();};
    draw();
    const route=node(shell,'article',undefined,'card');
    heading(route,'Ruta recomendada');
    const data=progress();
    const next=modules.data.courses.flatMap(course=>course.lessons.map(lesson=>({course,lesson})))
      .sort((a,b)=>a.course.level-b.course.level).find(({course,lesson})=>!data.done[lessonKey(course,lesson)]);
    if(next)button(route,next.lesson.title,()=>open('lesson',lessonKey(next.course,next.lesson)));
    else node(route,'p','Completaste las lecciones del catálogo.');
    heading(route,'Historial de aprendizaje');
    const valid=data.history.flatMap(key=>find(key)?[{key,...find(key)}]:[]);
    if(!valid.length)node(route,'p','Las lecciones completadas aparecerán aquí.');
    for(const {key,lesson} of valid.slice(0,8))button(route,lesson.title,()=>open('lesson',key));
  }
  function link(parent,key) {
    const source=modules.data.references[key];
    const el=node(parent,'a',source[0]);
    el.href=source[1];el.target='_blank';el.rel='noopener noreferrer';
  }
  function pdf(title,subtitle,sections,filename) {
    const bytes=window.liftsPdf.make({title,subtitle,sections});
    const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
    const anchor=node(document.body,'a');anchor.href=url;anchor.download=filename+'.pdf';anchor.click();anchor.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  function lessonSections(lesson) {
    return [{heading:'Principios y fundamentos',body:lesson.theory},{heading:'Aplicación y diagnóstico',body:lesson.practice},
      {heading:'Ejercicio resuelto',body:lesson.exercise}];
  }
  function tutorPanel(parent,course,lesson) {
    const panel=node(parent,'details',undefined,'academy-tutor');
    node(panel,'summary','Tutor de esta lección');
    node(panel,'p','La consulta comparte tu pregunta y esta lección con Workers AI. Usa la cuota habitual.','notice');
    const form=node(panel,'form');
    const question=document.createElement('textarea');question.required=true;question.maxLength=600;
    field('Duda, fórmula o situación de producción',question,form);
    const level=document.createElement('select');
    for(const value of ['Introducción','Explicación técnica','Análisis avanzado'])node(level,'option',value);
    field('Nivel de explicación',level,form);
    const prompts=node(form,'div',undefined,'academy-tabs');
    for(const [label,request] of [
      ['Explícame por qué','Explica por qué ocurre el fenómeno principal y describe un supuesto que cambie el resultado.'],
      ['Explícalo más fácil','Explícalo desde cero, con una analogía y su límite.'],
      ['Quiero profundizar','Relaciona esta lección con otro tema y explica qué mediciones faltan para aplicar el modelo.'],
      ['Explícame la fórmula','Explica variables, unidades, operaciones y una forma de comprobar la fórmula paso a paso.']
    ])button(prompts,label,()=>{question.value=request;question.focus();});
    const send=node(form,'button','Consultar al tutor');
    const answer=node(panel,'div',undefined,'academy-answer');answer.setAttribute('role','status');
    form.onsubmit=async event=>{
      event.preventDefault();
      const query=question.value.trim();
      if(!query||send.disabled)return;
      const controller=new AbortController();tutor=controller;
      const timer=setTimeout(()=>controller.abort(),60000);
      send.disabled=true;answer.textContent='Consultando…';
      try {
        const token=await window.nexoAccount.accessToken();
        const content=['Eres tutor de formación técnica. Separa hechos, hipótesis y recomendaciones. Usa esta lección como material de referencia, y avisa si no basta. No supongas normativa, mediciones ni ajustes de máquina.',
          course.title+' · '+lesson.title,lesson.theory,lesson.practice,lesson.exercise,
          'Referencias disponibles: '+course.sources.map(key=>modules.data.references[key].join(' ')).join(' | '),
          'Nivel: '+level.value,'Pregunta: '+query].join('\n').slice(0,5000);
        const response=await fetch('/api/chat',{method:'POST',signal:controller.signal,
          headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
          body:JSON.stringify({messages:[{role:'user',content}],detail:'deep'})});
        const body=await response.json();
        if(!response.ok||!body.reply)throw new Error(body.error||'El tutor no respondió.');
        if(tutor===controller)answer.textContent=body.reply;
      } catch(error){
        if(tutor===controller)answer.textContent=controller.signal.aborted?'La consulta se canceló o agotó el tiempo.':error.message;
      } finally{
        clearTimeout(timer);if(tutor===controller){tutor=null;send.disabled=false;}
      }
    };
  }
  const quizzes={
    instrumentos:['¿Cuánto TVI tiene un parche nominal de 50 % que mide 65 %?',15,'El TVI expresa la diferencia absoluta en puntos porcentuales.'],
    fingerprint:['¿Qué valor nominal produce 60 % medido en el ejemplo? Da dos decimales.',45.45,'Interpola entre los dos valores que rodean el objetivo.'],
    celdas:['¿A cuántos cm³/m² equivalen 4 BCM aproximadamente?',6.2,'Multiplica los BCM por 1.55.'],
    spc:['¿Cuál es el Cpk del ejemplo, con dos decimales?',1.17,'Usa la menor distancia a un límite y divídela entre 3σ.'],
    flujo:['En el ejemplo, ¿cuántos milímetros hay entre etiquetas consecutivas?',10,'Resta el largo de etiqueta al paso de una repetición.'],
    corte:['En el ejemplo, ¿cuántos mm crece el error por repetición?',.2,'Calcula la diferencia entre dos errores consecutivos.']
  };
  function renderQuiz(parent,lesson) {
    const spec=quizzes[lesson.id];
    if(!spec)return;
    const details=node(parent,'details');node(details,'summary','Práctica opcional');
    const form=node(details,'form');
    const input=document.createElement('input');input.type='number';input.step='any';input.required=true;
    field(spec[0],input,form);
    node(form,'button','Comprobar respuesta');
    const reply=node(details,'p');reply.setAttribute('role','status');
    form.onsubmit=event=>{
      event.preventDefault();
      if(!input.validity.valid)return;
      reply.textContent=(Math.abs(input.valueAsNumber-spec[1])<.011?'Correcto. ':'Revisa el cálculo. ')+spec[2];
    };
  }
  function spectrumPanel(parent) {
    heading(parent,'Curvas espectrales simuladas');
    node(parent,'p','Curvas sintéticas de reflectancia. Altera el máximo azul, el ancho y el desplazamiento de la curva roja. No se trata de un espectro medido.');
    const fields=node(parent,'div',undefined,'field-grid');
    const parameters=[['Centro de la referencia (nm)',550,420,650],['Ancho de banda (nm)',42,15,100],['Desplazamiento de muestra (nm)',20,-50,50]];
    const controls=parameters.map(([label,value,min,max])=>{
      const input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.value=value;
      field(label,input,fields);return input;
    });
    const canvas=node(parent,'canvas');canvas.width=580;canvas.height=200;
    canvas.setAttribute('aria-label','Gráfica de reflectancia simulada en porcentaje por longitud de onda en nanómetros');
    const values=node(parent,'p');values.setAttribute('aria-live','polite');
    const redraw=()=>{
      const args=controls.map(input=>input.valueAsNumber);
      values.textContent='Centro '+args[0]+' nm · ancho '+args[1]+' nm · desplazamiento '+args[2]+' nm. Referencia / muestra: '+
        modules.tools.drawSpectrum(canvas,...args).map(row=>row.nm+' nm: '+row.reference+' % / '+row.sample+' %').join(' · ');
    };
    controls.forEach(input=>{input.oninput=redraw;});redraw();
  }
  function wheelPanel(parent) {
    heading(parent,'Círculo cromático de pantalla');
    const wheel=node(parent,'div',undefined,'academy-wheel');wheel.setAttribute('aria-hidden','true');
    const control=document.createElement('input');control.type='range';control.min=0;control.max=359;control.value=20;
    field('Tono HSL en grados',control,parent);
    const sample=node(parent,'div',undefined,'academy-swatch');sample.setAttribute('aria-live','polite');
    const redraw=()=>{
      const h=Number(control.value);
      sample.style.backgroundColor='hsl('+h+' 70% 45%)';
      sample.textContent=h+'° · opuesto en este círculo: '+((h+180)%360)+'°';
      wheel.style.transform='rotate('+(-h)+'deg)';
    };
    control.oninput=redraw;redraw();
    node(parent,'p','HSL organiza colores de pantalla. El tono opuesto aquí no predice una formulación de tinta.','notice');
  }
  function studioPanel(parent,course,lesson) {
    const details=node(parent,'details');node(details,'summary','Preparar presentación PowerPoint');
    node(details,'p','Las diapositivas contienen puntos breves y el desarrollo se incluye en las notas del instructor.').className='notice';
    const form=node(details,'form');
    const audience=document.createElement('select');
    for(const value of ['Personal de producción','Preprensa y montaje','Calidad y supervisión','Personas que inician'])node(audience,'option',value);
    field('Público de capacitación',audience,form);
    const minutes=document.createElement('input');minutes.type='number';minutes.min=5;minutes.max=240;minutes.value=30;minutes.required=true;
    field('Duración sugerida (minutos)',minutes,form);
    const topics=node(form,'fieldset');node(topics,'legend','Lecciones que incluirás');
    const selected=course.lessons.map(item=>{
      const input=document.createElement('input');input.type='checkbox';input.checked=item===lesson;input.style.width='auto';
      const label=node(topics,'label');label.append(input,document.createTextNode(' '+item.title));
      return input;
    });
    const submit=node(form,'button','Descargar presentación editable');
    const message=node(form,'p');message.setAttribute('role','status');
    form.onsubmit=async event=>{
      event.preventDefault();
      if(submit.disabled)return;
      const lessons=course.lessons.filter((_,index)=>selected[index].checked);
      if(!lessons.length){message.textContent='Selecciona al menos una lección.';return;}
      const account=generation,reading=current;
      submit.disabled=true;message.textContent='Preparando diapositivas…';
      try{
        const {exportCoursePresentation}=await import('./studio-pptx.js');
        if(account!==generation||reading!==current)return;
        await exportCoursePresentation(course,lessons,{
          minutes:minutes.valueAsNumber,audience:audience.value,diagrams:modules.tools.diagrams,references:modules.data.references
        });
        if(account===generation&&reading===current)message.textContent='Presentación generada.';
      }catch{
        if(account===generation&&reading===current)message.textContent='No se pudo generar el PowerPoint. Vuelve a intentarlo.';
      }finally{submit.disabled=false;}
    };
  }
  function renderLesson({course,lesson}) {
    const key=lessonKey(course,lesson);
    const layout=node(shell,'div',undefined,'academy-reader');
    const outline=node(layout,'section',undefined,'card academy-outline');
    heading(outline,'Capítulos');
    for(const chapter of course.lessons){
      node(outline,'small',chapter.module);
      const nav=button(outline,chapter.title,()=>open('lesson',lessonKey(course,chapter)));
      nav.setAttribute('aria-current',chapter===lesson?'true':'false');
    }
    const main=node(layout,'article',undefined,'card academy-lesson');
    node(main,'p',course.title+' · '+modules.data.levels[course.level],'academy-kicker');
    node(main,'h2',lesson.title);
    if(course.overview){
      const overview=node(main,'details');
      node(overview,'summary','Presentación y objetivos del curso');
      node(overview,'p','Objetivos: '+course.overview.objectives);
      node(overview,'p','Conocimientos previos: '+course.overview.prerequisites);
      node(overview,'p','Glosario: '+course.overview.glossary);
    }
    const prerequisites=modules.paths.routeTo(key,new Set(catalogKeys())).slice(0,-1);
    if(prerequisites.length){
      const details=node(main,'details');
      node(details,'summary','Prerrequisitos sugeridos');
      const outline=node(details,'ol');
      for(const prerequisite of prerequisites){
        const row=node(outline,'li');
        const label=find(prerequisite).lesson.title;
        button(row,label,()=>open('lesson',prerequisite));
        if(progress().done[prerequisite])node(row,'span',' · Lectura completada');
      }
    }
    const actions=node(main,'div',undefined,'academy-tabs');
    if(['placas','preprensa','distorsion'].includes(course.id))button(actions,'Abrir ficha y calculadora',()=>api.open('engineering'));
    if(course.id==='calidad')button(actions,'Abrir plantilla Pareto en Excel',()=>window.liftsExcel.open('pareto'));
    const bookmark=button(actions,progress().favorites.includes(key)?'Quitar favorito':'Marcar favorito',async()=>{
      const list=progress().favorites;
      const was=list.includes(key);
      if(await save({favorites:was?list.filter(item=>item!==key):[...list,key]},'Favoritos guardados.')){
        bookmark.textContent=was?'Marcar favorito':'Quitar favorito';
      }
    });
    button(actions,'Guardar para continuar',()=>save({last:key},'Punto de lectura guardado.'));
    const review=button(actions,progress().reviews?.[key]?'Ver repaso programado':'Añadir al repaso',async()=>{
      if(progress().reviews?.[key]){open('paths');return;}
      if(await save({reviews:{...progress().reviews,[key]:{due:modules.paths.todayKey(),step:0}}},'Lección añadida al repaso.')){
        review.textContent='Ver repaso programado';
      }
    });
    const finish=button(actions,progress().done[key]?'Lección completada':'Marcar lección completada',async()=>{
      if(progress().done[key])return;
      const data=progress();
      if(await save({done:{...data.done,[key]:new Date().toISOString()},last:key,
        history:[key,...data.history.filter(item=>item!==key)].slice(0,100)},'Lección completada.')){
        finish.textContent='Lección completada';certificate.hidden=!course.lessons.every(item=>progress().done[lessonKey(course,item)]);
      }
    },'');
    for(const section of lessonSections(lesson).slice(0,2)){heading(main,section.heading);node(main,'p',section.body);}
    const [caption,...steps]=modules.tools.diagrams[lesson.diagram];
    const figure=node(main,'figure',undefined,'academy-diagram');
    node(figure,'figcaption',caption);
    const sequence=node(figure,'ol');
    steps.forEach(text=>node(sequence,'li',text));
    if(['placa','anilox'].includes(lesson.diagram)){
      const art=node(figure,'canvas');art.width=560;art.height=195;
      art.setAttribute('aria-label',caption+' · '+steps.join(', ')+' · Sin escala');
      modules.tools.drawSection(art,lesson.diagram);
      node(figure,'p','Ilustración conceptual, sin escala.','notice');
    }
    const exercise=node(main,'details');
    node(exercise,'summary','Ver cálculo o ejercicio resuelto');
    node(exercise,'p',lesson.exercise);
    renderQuiz(main,lesson);
    const notes=document.createElement('textarea');notes.maxLength=2500;notes.value=progress().notes[key]||'';
    field('Notas privadas de esta lección',notes,main);
    button(main,'Guardar nota',()=>save({notes:{...progress().notes,[key]:notes.value.trim()},last:key},'Nota guardada.'));
    const certificate=button(main,'Descargar constancia interna',()=>{
      const data=progress();
      const date=course.lessons.map(item=>data.done[lessonKey(course,item)]).sort().at(-1);
      const name=String(api.getState().profile?.name||'').trim();
      const subtitle=[course.title,name,date?new Date(date).toLocaleDateString('es-MX'):''].filter(Boolean).join(' · ');
      pdf('Constancia interna de finalización',subtitle,[
        {heading:'Trayecto completado',body:course.lessons.map(item=>item.title).join('\n')},
        {heading:'Alcance',body:'Registro interno de Lifts. No es una acreditación profesional.'}
      ],'lifts-constancia-'+course.id);
    });
    certificate.hidden=!course.lessons.every(item=>progress().done[lessonKey(course,item)]);
    button(main,'Descargar curso completo en PDF',()=>{
      const sections=[];
      if(course.overview)sections.push(
        {heading:'Objetivos y conocimientos previos',body:course.overview.objectives+'\n'+course.overview.prerequisites});
      sections.push({heading:'Índice',body:course.lessons.map(item=>item.title).join('\n')});
      for(const item of course.lessons){
        sections.push({heading:item.title,body:item.theory+'\n\n'+item.practice+'\n\nEjercicio resuelto: '+item.exercise});
      }
      if(course.overview)sections.push({heading:'Glosario',body:course.overview.glossary});
      sections.push({heading:'Referencias',body:course.sources.map(ref=>modules.data.references[ref].join(' — ')).join('\n')});
      pdf(course.title,'Lifts · Academia de flexografía',sections,'lifts-curso-'+course.id);
    });
    studioPanel(main,course,lesson);
    tutorPanel(main,course,lesson);
    heading(main,'Referencias');
    for(const ref of course.sources)link(node(main,'p'),ref);
    button(main,'Descargar ficha de la lección',()=>pdf(lesson.title,course.title,[...lessonSections(lesson),
      {heading:'Referencias',body:course.sources.map(ref=>modules.data.references[ref].join(' — ')).join('\n')}],'lifts-'+lesson.id));
    if(lesson.diagram==='defectos'){drawDefectPanel(main);defectAtlas(main);}
  }
  function drawDefectPanel(parent) {
    heading(parent,'Comparar patrones de impresión');
    const pick=document.createElement('select');
    for(const [id,label] of [['ganancia','Ganancia de punto'],['perdida','Pérdida de punto'],['registro','Desregistro'],['raya','Raya longitudinal'],['bandas','Banding']])node(pick,'option',label).value=id;
    field('Defecto simulado',pick,parent);
    const canvas=node(parent,'canvas');canvas.width=600;canvas.height=160;
    const caption=node(parent,'p','Izquierda: patrón de referencia. Derecha: defecto simulado.','notice');
    const redraw=()=>{canvas.setAttribute('aria-label',caption.textContent+' '+pick.selectedOptions[0].textContent);modules.tools.drawDefect(canvas,pick.value);};
    pick.onchange=redraw;redraw();
  }
  function moirePanel(parent) {
    heading(parent,'Interferencia entre tramas');
    node(parent,'p','Superpone retículas sintéticas. Un patrón de baja frecuencia aparece cuando la orientación o el paso de las retículas son cercanos.');
    const fields=node(parent,'div',undefined,'field-grid');
    const angle=document.createElement('input');angle.type='range';angle.min=0;angle.max=45;angle.value=8;
    field('Ángulo de la segunda trama (°)',angle,fields);
    const pitch=document.createElement('input');pitch.type='range';pitch.min=-20;pitch.max=20;pitch.value=0;
    field('Cambio de paso de la segunda trama (%)',pitch,fields);
    const canvas=node(parent,'canvas');canvas.width=600;canvas.height=200;
    canvas.setAttribute('aria-label','Trama única a la izquierda y superposición de dos tramas a la derecha');
    const values=node(parent,'p');values.setAttribute('aria-live','polite');
    const redraw=()=>{
      values.textContent='Ángulo '+angle.value+'° · variación de paso '+pitch.value+' %.';
      modules.tools.drawMoire(canvas,angle.valueAsNumber,pitch.valueAsNumber);
    };
    angle.oninput=redraw;pitch.oninput=redraw;redraw();
  }
  function renderTools() {
    const grid=node(shell,'div',undefined,'academy-course-grid');
    for(const tool of modules.tools.tools){
      const card=node(grid,'article',undefined,'card');
      heading(card,tool.title);
      const fields=node(card,'div',undefined,'field-grid');
      const result=node(card,'div',undefined,'academy-results');result.setAttribute('aria-live','polite');
      const inputs=tool.fields.map(([name,value,min,max])=>{
        const input=document.createElement('input');input.type='number';input.step='any';input.min=min;input.max=max;input.value=value;input.required=true;
        field(name,input,fields);return input;
      });
      const calculate=()=>{
        result.replaceChildren();
        if(inputs.some(input=>!input.validity.valid)){node(result,'p','Revisa los valores dentro del rango indicado.');return;}
        const output=tool.evaluate(inputs.map(input=>input.valueAsNumber));
        output.lines.forEach(value=>node(result,'p',value));
        if(output.swatches){
          const row=node(result,'div',undefined,'academy-swatch-pair');
          output.swatches.forEach((sample,index)=>{
            const chip=node(row,'div',index?'Muestra':'Objetivo','academy-swatch');chip.style.backgroundColor=sample.color;
          });
        }
        if(output.bars)output.bars.forEach((value,index)=>{
          const label=node(result,'label',(index?'Medido':'Nominal')+' '+value+' %');
          const bar=node(label,'meter');bar.min=0;bar.max=100;bar.value=value;
        });
        node(result,'p',output.note,'notice');
      };
      inputs.forEach(input=>{input.oninput=calculate;});calculate();
    }
    const color=node(shell,'article',undefined,'card');wheelPanel(color);spectrumPanel(color);
    const visual=node(shell,'article',undefined,'card');moirePanel(visual);drawDefectPanel(visual);
  }
  function defectAtlas(parent) {
    heading(parent,'Atlas de diagnóstico');
    button(parent,'Registrar un caso y comparar fotos',()=>api.open('diagnostics'));
    const input=document.createElement('input');input.type='search';field('Buscar un defecto',input,parent);
    const records=node(parent,'div');
    const update=()=>{
      records.replaceChildren();
      for(const [name,symptom,test,action,mode] of modules.data.defects){
        if(!normalize([name,symptom,test].join(' ')).includes(normalize(input.value)))continue;
        const detail=node(records,'details');
        node(detail,'summary',name);
        node(detail,'p','Síntoma: '+symptom);
        node(detail,'p','Prueba y medición: '+test);
        node(detail,'p','Corrección y prevención: '+action);
        if(mode)detail.addEventListener('toggle',()=>{
          if(!detail.open||detail.querySelector('canvas'))return;
          const canvas=node(detail,'canvas');canvas.width=480;canvas.height=125;
          canvas.setAttribute('aria-label','Referencia a la izquierda; '+name+' simulado a la derecha');
          modules.tools.drawDefect(canvas,mode);
          node(detail,'p','Izquierda: referencia. Derecha: ilustración sintética.','notice');
        });
      }
      if(!records.children.length)node(records,'p','Sin coincidencias.');
    };
    input.oninput=update;update();
  }
  function renderLibrary() {
    const refs=node(shell,'article',undefined,'card');
    heading(refs,'Biblioteca técnica');
    node(refs,'p','Enlaces a organismos y proveedores. Confirma edición y estado en el catálogo oficial al aplicar una norma.');
    for(const key of Object.keys(modules.data.references))link(node(refs,'p'),key);
    button(refs,'Descargar apuntes de la Academia',()=>pdf('Apuntes de flexografía','Lifts · Academia',modules.data.courses.flatMap(course=>course.lessons.map(lesson=>({
      heading:lesson.title,body:[lesson.theory,lesson.practice,lesson.exercise].join('\n\n')
    }))),'lifts-apuntes-flexografia'));
    defectAtlas(refs);
    heading(refs,'Glosario');
    const lookup=document.createElement('input');lookup.type='search';field('Filtrar términos',lookup,refs);
    const list=node(refs,'dl');
    const update=()=>{
      list.replaceChildren();
      for(const [term,meaning] of Object.entries(modules.data.glossary)){
        if(!normalize(term+' '+meaning).includes(normalize(lookup.value)))continue;
        node(list,'dt',term);node(list,'dd',meaning);
      }
    };
    lookup.oninput=update;update();
  }
  function reset() {
    generation++;saving=false;tutor?.abort();tutor=null;
    current='';view='catalog';filter='';level='';showFavorites=false;
    status.textContent='';shell.replaceChildren();
  }
  $('academyCatalogButton').onclick=()=>open();
  $('academyToolsButton').onclick=()=>open('tools');
  $('academyLibraryButton').onclick=()=>open('library');
  $('academyPathsButton').onclick=()=>open('paths');
  $('academyContinue').onclick=()=>open('lesson',progress().last);
  window.addEventListener('nexo-state',reset);
  window.addEventListener('lifts-page',event=>{
    if(event.detail?.page!=='academy')tutor?.abort();
  });
  document.querySelector('nav [data-page="academy"]').onclick=()=>open();
  window.liftsAcademy={open,search,reset};
})();
