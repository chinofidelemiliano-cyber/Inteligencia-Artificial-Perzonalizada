'use strict';
(function (root) {
  const plainPage = (label, purpose, limitations) => ({
    label,purpose,input:'Sin parámetros de navegación',output:'Vista de trabajo',
    permission:'Sesión del propietario',dependency:'Espacio de trabajo',limitations,
    validate:key=>key==='',open:(workspace,id)=>workspace.open(id)
  });
  const academyView = (label,view,lesson=false) => ({
    label,purpose:'Consultar contenido académico',input:lesson?'Identificador de curso y lección':'Sin parámetros de navegación',
    output:'Vista académica',permission:'Sesión del propietario',dependency:'Catálogo de Academia',
    limitations:'La página requiere cargar el catálogo. El avance académico conserva su propio guardado.',
    validate:key=>lesson?/^[a-z0-9-]{1,80}\/[a-z0-9-]{1,80}$/.test(key):key==='',
    open:(_workspace,_id,key)=>root.liftsAcademy.open(view,key)
  });
  const tools = Object.freeze({
    backup:{
      label:'Recuperar respaldo de Lifts',purpose:'Revisar una exportación JSON y recuperar registros privados',
      input:'Sin parámetros',output:'Centro de privacidad',permission:'Sesión del propietario',
      dependency:'Privacidad y memoria',limitations:'La recuperación admite colecciones concretas de la exportación.',
      validate:key=>key==='',open:workspace=>{
        workspace.open('privacy');
        const details=root.document.getElementById('nexusBackup')?.querySelector('details');
        if(details&&!details.closest('[hidden]')){details.open=true;details.scrollIntoView({block:'start'});}
      }
    },
    negotiation:plainPage('Simulador de negociación','Practicar entrevistas, acuerdos y conversaciones difíciles','Ejercicios guiados en el navegador.'),
    'pdf-markup':{
      label:'Subrayar un PDF',purpose:'Marcar regiones sobre un PDF local y descargar una copia',
      input:'Sin parámetros de navegación',output:'Vista de subrayado',permission:'Sesión del propietario',
      dependency:'Utilidades locales',limitations:'Los archivos y marcas temporales se mantienen en esta sesión.',
      validate:key=>key==='',open:workspace=>{
        workspace.open('utilities');
        const panel=root.document.getElementById('nexusPdfMarkup');
        if(panel&&!panel.closest('[hidden]')){panel.open=true;panel.scrollIntoView({block:'start'});}
      }
    },
    preflight:plainPage('Lifts Preflight','Revisar dimensiones, orientación y cajas de sangrado PDF','Revisión geométrica local; otros atributos requieren comprobación manual.'),
    systems:plainPage('Lifts Systems','Dibujar dependencias y ciclos entre variables','Las relaciones se interpretan a partir de los registros del usuario.'),
    characters:plainPage('Personajes 3D','Explorar expresiones del robot y su mascota','Los modelos se cargan cuando la vista está visible.'),
    models:plainPage('Modelos mentales','Consultar ejercicios y preparar una revisión crítica','La biblioteca funciona con contenidos locales.'),
    privacy:plainPage('Privacidad y memoria','Consultar, recuperar y archivar recuerdos privados','Los recuerdos dependen del espacio autenticado.'),
    calculatorHub:plainPage('Centro de calculadoras','Convertir unidades y consultar herramientas flexográficas, fechas y presupuestos','Las conversiones se hacen en el navegador.'),
    field:plainPage('Modo de campo','Capturar mediciones y abrir diagnóstico, procedimientos y equipos','El cronómetro dura esta sesión. Las mediciones se guardan al confirmar el borrador.'),
    guardian:plainPage('Lifts Guardian','Preparar la jornada y dar seguimiento a compromisos','El resumen se calcula al abrir la vista con tus registros guardados.'),
    radar:plainPage('Lifts Radar','Revisar alertas y pendientes de tus registros','Las comprobaciones se realizan al abrir esta vista.'),
    'builder-record':{
      label:'Herramienta personal guardada',purpose:'Abrir una calculadora o un formulario propio',
      input:'Identificador de herramienta',output:'Configuración y capturas privadas',permission:'Sesión del propietario',
      dependency:'Lifts Builder',limitations:'Las definiciones y registros son privados.',
      validate:key=>/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(key),
      open:(_workspace,_id,key)=>root.liftsBuilder.openSaved(key)
    },
    builder:plainPage('Lifts Builder','Crear calculadoras, formularios y registros privados','Las fórmulas se ejecutan mediante un intérprete limitado en este navegador.'),
    utilities:plainPage('Utilidades locales','Comparar textos y hacer conversiones','Los datos introducidos permanecen en esta sesión.'),
    operations:plainPage('Estado y permisos','Consultar sincronización y controlar acciones de Nexus','La comprobación de IA se ejecuta por solicitud.'),
    inbox:{
      label:'Bandeja de entrada',purpose:'Capturar pendientes y preparar tareas o recordatorios',
      input:'Sin parámetros',output:'Captura de Agenda',permission:'Sesión del propietario',
      dependency:'Agenda',limitations:'Las conversiones quedan sujetas al guardado de cada herramienta.',
      validate:key=>key==='',open:()=>root.liftsInbox.open()
    },
    'feedback-record':{
      label:'Evaluación de respuesta guardada',purpose:'Reabrir una corrección en el espacio privado',
      input:'Identificador de evaluación',output:'Evaluación en Estado y permisos',permission:'Sesión del propietario',
      dependency:'Estado y permisos',limitations:'Comentarios registrados por el usuario.',
      validate:key=>/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(key),
      open:(_workspace,_id,key)=>root.liftsFeedback.openRecord(key)
    },
    journal:plainPage('Misiones y conocimiento','Abrir decisiones, lecciones, experimentos y revisión crítica','Los registros se sincronizan al pulsar Guardar registro.'),
    'journal-record':{
      label:'Registro de Nexus',purpose:'Retomar una misión o un registro de trabajo',
      input:'Identificador del registro',output:'Editor del registro existente',permission:'Sesión del propietario',
      dependency:'Misiones y conocimiento',limitations:'Solo recupera la última versión guardada.',
      validate:key=>/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(key),
      open:(_workspace,_id,key)=>root.liftsJournal.openRecord(key)
    },
    tasks:plainPage('Agenda','Consultar pendientes','Los cambios de tareas se guardan desde Agenda.'),
    reminders:plainPage('Recordatorios','Consultar avisos','La entrega depende de la configuración de avisos.'),
    engineering:plainPage('Ingeniería · Placas y distorsión','Calcular distorsión y guardar fichas','Las entradas sin guardar requieren volver a capturarse.'),
    'engineering-record':{
      label:'Ficha de ingeniería guardada',purpose:'Recuperar una ficha y sus entradas',
      input:'Identificador de ficha',output:'Ficha cargada en la calculadora',
      permission:'Sesión del propietario',dependency:'Historial de Ingeniería',
      limitations:'La recuperación requiere que la ficha siga presente en tu historial.',
      validate:key=>/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(key),
      open:(_workspace,_id,key)=>root.liftsEngineering.openSaved(key)
    },
    'industrial-order-record':{
      label:'Orden industrial guardada',purpose:'Abrir la orden, comprobar reglas y revisar casos vinculados',
      input:'Identificador de orden',output:'Orden interna guardada',permission:'Sesión del propietario',
      dependency:'Ingeniería',limitations:'La evaluación usa los datos y reglas vigentes en Lifts.',
      validate:key=>/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(key),
      open:(_workspace,_id,key)=>root.liftsIndustrial.openOrder(key)
    },
    diagnostics:plainPage('Diagnóstico guiado','Comparar fotografías y registrar casos','Las fotografías temporales y sus recortes requieren volver a cargarse.'),
    'diagnostic-record':{
      label:'Caso de diagnóstico guardado',purpose:'Abrir evidencia y observaciones guardadas',
      input:'Identificador del caso',output:'Caso cargado en Diagnóstico',permission:'Sesión del propietario',
      dependency:'Historial de Diagnóstico',limitations:'Las imágenes temporales requieren volver a cargarse.',
      validate:key=>/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(key),
      open:(_workspace,_id,key)=>root.liftsDiagnostics.openSaved(key)
    },
    academy:academyView('Academia de flexografía','catalog'),
    library:academyView('Biblioteca técnica','library'),
    teach:academyView('Lifts Teach · Preparar capacitación','teach'),
    competencies:academyView('Competencias y evidencias','competencies'),
    'study-paths':academyView('Rutas y repasos','paths'),
    simulators:academyView('Simuladores de flexografía','tools'),
    lesson:academyView('Lección de flexografía','lesson',true),
    excel:{
      label:'Lifts Excel',purpose:'Practicar y descargar plantillas',input:'Identificador de plantilla o práctica',
      output:'Vista Excel',permission:'Sesión del propietario',dependency:'Lifts Excel',
      limitations:'Las celdas sin guardar y los archivos CSV temporales requieren volver a cargarse.',
      validate:key=>['basics','inventory','waste','pareto','csv'].includes(key),
      open:(_workspace,_id,key)=>root.liftsExcel.open(key)
    }
  });
  const fields = ['project','goal','available','missing','constraints','decisions','next'];
  function location(id,key='') {
    if(typeof id!=='string'||typeof key!=='string'||!Object.hasOwn(tools,id)||!tools[id].validate(key))return null;
    return {id,key};
  }
  function context(value={}) {
    return Object.fromEntries(fields.map(field=>[field,typeof value?.[field]==='string'?value[field].trim().slice(0,500):'']));
  }
  function recover(value) {
    const target=location(value?.target?.id,value?.target?.key);
    return target?{target,at:typeof value.at==='string'?value.at:'',label:typeof value.label==='string'?value.label.slice(0,180):tools[target.id].label}:null;
  }
  function commands(query='') {
    const normalize=value=>value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
    const term=normalize(query.trim());
    const results=Object.entries(tools).filter(([id,tool])=>id!=='lesson'&&!id.endsWith('-record')&&normalize(tool.label+' '+tool.purpose).includes(term))
      .map(([id,tool])=>({label:tool.label,target:location(id,id==='excel'?'basics':'')}));
    const excelViews=[['Inventario de tintas · Excel','inventory'],['Desperdicio · Excel','waste'],['Pareto · Excel','pareto'],['Revisar CSV · Excel','csv']];
    if(term)for(const [label,key] of excelViews){
      if(normalize(label).includes(term))results.push({label,target:location('excel',key)});
    }
    return results;
  }
  const api={tools,fields,location,context,recover,commands};
  if(typeof module==='object')module.exports=api;
  else root.liftsNexusCore=api;
})(globalThis);
