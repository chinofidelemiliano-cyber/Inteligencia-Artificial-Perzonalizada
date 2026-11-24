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
    const results=Object.entries(tools).filter(([id,tool])=>!['lesson','engineering-record','journal-record','diagnostic-record'].includes(id)&&normalize(tool.label+' '+tool.purpose).includes(term))
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
