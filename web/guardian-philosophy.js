'use strict';
(() => {
  const lessons=[
    {
      id:'argument',title:'Razones, premisas y conclusiones',
      source:'Stanford Encyclopedia of Philosophy · Informal Logic',url:'https://plato.stanford.edu/entries/logic-informal/',
      paragraphs:[
        'Una opinión expresa una posición. Un argumento añade razones para aceptarla. Llamamos premisas a esas razones y conclusión a lo que se intenta establecer. Una conclusión puede aparecer al principio de una conversación. Busca expresiones como «porque» o «por lo tanto», pero comprueba qué afirmación se está defendiendo aunque falten esas señales.',
        'La calidad de las premisas y la fuerza de la inferencia son preguntas distintas. Un argumento deductivo es válido si sus premisas no pueden ser verdaderas al mismo tiempo que su conclusión es falsa. En una inferencia inductiva, las premisas pueden aumentar la plausibilidad de la conclusión sin garantizarla.',
        'En una planta alguien dice que hay que cambiar el anilox porque aparecieron rayas tras instalarlo. La secuencia temporal es una razón para investigar. Para justificar el cambio, haría falta mostrar que la raya corresponde al rodillo y descartar otras causas con una prueba controlada.'
      ],
      prompt:'Si la única evidencia es que las rayas aparecieron después del cambio, ¿qué puedes concluir?',
      options:['El anilox causó las rayas.','El anilox es una hipótesis que merece comprobarse.','El orden temporal demuestra que no hay relación.'],correct:1,
      why:'Un hecho posterior puede tener varias causas. La secuencia apoya una investigación, no una atribución causal definitiva.'
    },{
      id:'socrates',title:'Preguntar con Sócrates',
      source:'Platón · Apología de Sócrates',url:'https://classics.mit.edu/Plato/apology.html',
      paragraphs:[
        'En la Apología, Sócrates examina las pretensiones de conocimiento de sus interlocutores. Su humildad intelectual consiste en reconocer los límites de lo que puede justificar. Como práctica cotidiana, una pregunta socrática hace visible la idea que se está usando y permite someterla a prueba.',
        'Empieza por precisar el término que hace una diferencia. Luego pide un ejemplo y busca un caso límite. Termina reformulando lo acordado. Preguntar de este modo es útil cuando dos personas parecen estar de acuerdo, pero actuarían de manera distinta ante la misma situación.',
        'Si un supervisor dice «la hoja debe estar completa», pregunta qué campos son imprescindibles. Después plantea un caso: ¿puede liberarse la orden si la fecha figura pero el responsable está en blanco? Escribe la respuesta como un criterio observable.'
      ],
      prompt:'¿Qué pregunta aclara mejor el criterio «entregar con buena calidad»?',
      options:['¿Quién definió exactamente qué se medirá y cuándo se acepta?','¿Por qué nunca das instrucciones claras?','¿Puedo asumir que significa lo mismo que ayer?'],correct:0,
      why:'Pedir la medida y el criterio de aceptación convierte una expresión vaga en una comprobación que ambas partes pueden repetir.'
    },{
      id:'stoic',title:'Estoicismo y margen de acción',
      source:'Epicteto · Manual, §1',url:'https://classics.mit.edu/Epictetus/epicench.html',
      paragraphs:[
        'El estoicismo fue una escuela helenística. Para Epicteto es importante distinguir nuestros juicios, intenciones y decisiones de resultados externos que también dependen de otras personas o circunstancias. Esta distinción organiza la responsabilidad: identifica qué respuesta puedes elegir ahora.',
        'En una situación real conviene separar tres cosas. Puedes decidir enviar una nota clara. Puedes influir en la respuesta mediante el contexto que aportas. La decisión final de la otra persona queda fuera de tu control directo. La tercera distinción, influencia, es una herramienta práctica para aplicar la idea.',
        'Si un proveedor se retrasa, formula una acción verificable: pedir una fecha y preparar un plan alternativo. Reconocer la incertidumbre deja espacio para anticipar el riesgo y para expresar la frustración sin convertirla en una predicción.'
      ],
      prompt:'Un proveedor aún no confirma entrega. ¿Qué acción depende directamente de ti?',
      options:['Garantizar que llegue mañana.','Decidir por el proveedor.','Redactar una petición clara y preparar una alternativa.'],correct:2,
      why:'Puedes elegir qué comunicar y preparar opciones. La confirmación y la entrega dependen de otras personas y condiciones.'
    },{
      id:'ethics',title:'Ética de la virtud y juicio práctico',
      source:'Aristóteles · Ética a Nicómaco, libro II',url:'https://classics.mit.edu/Aristotle/nicomachaen.2.ii.html',
      paragraphs:[
        'La ética pregunta qué debemos hacer y qué clase de persona queremos ser. En el enfoque de Aristóteles, formar una virtud implica practicar disposiciones de carácter, examinar los motivos y aprender a reconocer lo adecuado en cada situación.',
        'El término medio no se obtiene promediando dos números. Se refiere a una respuesta proporcionada al contexto. En el caso de la valentía, soportar un riesgo innecesario puede ser temeridad. Evitar cualquier dificultad puede ser cobardía. La decisión requiere examinar el riesgo y los fines.',
        'Si aparece una desviación repetida, una respuesta responsable es describir la evidencia, comunicarla a quien corresponda y aplicar el procedimiento de contención autorizado. Ocultarla para evitar conflicto y acusar a alguien sin pruebas son dos respuestas que conviene examinar.'
      ],
      prompt:'¿Cómo se identifica una respuesta proporcionada?',
      options:['Promediando las dos opciones extremas.','Examinando los hechos, responsabilidades y consecuencias concretas.','Eligiendo siempre la opción más arriesgada.'],correct:1,
      why:'El juicio práctico depende de la situación. Una regla aritmética no determina qué acción respeta mejor los fines y las responsabilidades.'
    },{
      id:'knowledge',title:'Epistemología y calidad de la evidencia',
      source:'Stanford Encyclopedia of Philosophy · Epistemology',url:'https://plato.stanford.edu/entries/epistemology/',
      paragraphs:[
        'La epistemología estudia qué es conocer y qué justifica una creencia. Estar convencido de una afirmación describe nuestra confianza. Para evaluar si está justificada interesa saber cómo obtuvimos la información y qué alternativas podrían explicar lo observado.',
        'Un testimonio, una medición y un documento pueden aportar evidencia diferente. Pregunta qué midió cada fuente, en qué condiciones y para qué población o máquina. Si dos manuales difieren, identifica modelo, versión y fecha antes de concluir que uno contiene un error.',
        'Una lectura aislada puede sugerir que cambió una dimensión, pero también puede reflejar una resolución insuficiente o una condición de medición distinta. Repetir con el mismo método y revisar el instrumento aporta mejores razones antes de modificar el proceso.'
      ],
      prompt:'Dos registros dan valores distintos para el mismo componente. ¿Cuál es la primera comprobación razonable?',
      options:['Usar el registro que confirma tu hipótesis.','Promediarlos sin más.','Comprobar modelo, versión, medición y condiciones de ambos.'],correct:2,
      why:'La comparación requiere verificar que ambas fuentes describen el mismo objeto y magnitud en condiciones comparables.'
    }
  ];
  const $=id=>document.getElementById(id),root=$('philosophyCourse'),host=$('philosophyLesson'),picker=$('philosophyPick');
  const status=$('philosophyStatus'),workspace=window.liftsWorkspace;
  let pending=false;
  function element(parent,tag,content){
    const node=document.createElement(tag);node.textContent=content;parent.append(node);return node;
  }
  for(const lesson of lessons)element(picker,'option',lesson.title).value=lesson.id;
  function render(){
    const done=workspace.getState().guardianPhilosophy||{};
    $('philosophyProgress').textContent=lessons.filter(lesson=>done[lesson.id]).length+' de '+lessons.length+' lecciones completadas';
    const lesson=lessons.find(item=>item.id===picker.value);
    host.replaceChildren();
    element(host,'h4',lesson.title);
    for(const paragraph of lesson.paragraphs)element(host,'p',paragraph);
    element(host,'a',lesson.source).href=lesson.url;
    const form=element(host,'form',''),group=element(form,'fieldset','');
    element(group,'legend',lesson.prompt);
    lesson.options.forEach((option,index)=>{
      const label=element(group,'label',''),input=element(label,'input','');
      input.type='radio';input.name='answer';input.value=String(index);input.required=true;
      label.append(' '+option);
    });
    const submit=element(form,'button',done[lesson.id]?'Revisar respuesta':'Comprobar y guardar avance');
    submit.disabled=pending;
    form.onsubmit=async event=>{
      event.preventDefault();
      if(pending)return;
      const answer=Number(new FormData(form).get('answer'));
      const understood=answer===lesson.correct;
      status.textContent=(understood?'Correcto. ':'Revisa tu respuesta. ')+lesson.why;
      if(!understood||done[lesson.id])return;
      const state=workspace.getState(),before=state.guardianPhilosophy;
      state.guardianPhilosophy={...done,[lesson.id]:true};
      pending=true;submit.disabled=true;picker.disabled=true;
      try{
        if(!await workspace.save())throw new Error();
        if(workspace.getState()===state){
          render();
          status.textContent='Avance guardado. '+lesson.why;
        }
      }catch{
        if(workspace.getState()===state){state.guardianPhilosophy=before;status.textContent='No se pudo guardar. Puedes reintentar.';}
      }finally{
        if(workspace.getState()===state){pending=false;picker.disabled=false;host.querySelector('button').disabled=false;}
      }
    };
  }
  picker.onchange=()=>{status.textContent='';render();};
  window.addEventListener('nexo-state',()=>{
    pending=false;root.open=false;picker.disabled=false;picker.selectedIndex=0;status.textContent='';render();
  });
  render();
})();
