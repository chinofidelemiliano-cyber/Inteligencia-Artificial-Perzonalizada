export const audiences = {
  beginner: {
    label:'Personas que empiezan',
    instruction:'Presenta primero el vocabulario. Pide que expliquen la variable principal con un ejemplo propio.'
  },
  production: {
    label:'Operación y producción',
    instruction:'Relaciona el tema con una observación del turno. Pide identificar qué medir, cómo registrarlo y cuándo consultarlo.'
  },
  quality: {
    label:'Calidad e ingeniería',
    instruction:'Pide que documenten supuestos, condiciones de medición y un criterio de aceptación antes de comparar resultados.'
  }
};

export const activityFields = [
  ['objective','Objetivo observable'],
  ['demo','Demostración guiada'],
  ['practice','Actividad práctica'],
  ['assessment','Comprobación de aprendizaje'],
  ['notes','Notas del instructor']
];

export function validatePlan(raw) {
  const title=String(raw.title??'').trim().slice(0,120);
  const minutes=Number(raw.minutes);
  if(!title)throw new Error('Escribe un título para la capacitación.');
  if(!Number.isInteger(minutes)||minutes<20||minutes>180)throw new Error('La capacitación debe durar entre 20 y 180 minutos enteros.');
  if(!Object.hasOwn(audiences,raw.audience))throw new Error('Selecciona el público de la capacitación.');
  const plan={title,minutes,audience:raw.audience};
  for(const [key,label] of activityFields){
    plan[key]=String(raw[key]??'').trim().slice(0,1200);
    if(key!=='notes'&&!plan[key])throw new Error('Completa el campo «'+label+'».');
  }
  return plan;
}

export function trainingAgenda(minutes) {
  const opening=Math.floor(minutes*.15);
  const demonstration=Math.floor(minutes*.30);
  const practice=Math.floor(minutes*.35);
  return [
    ['Apertura y objetivo',opening],
    ['Demostración',demonstration],
    ['Práctica',practice],
    ['Comprobación y cierre',minutes-opening-demonstration-practice]
  ];
}

export function lessonPlan(lesson) {
  return {
    title:'Capacitación · '+lesson.title,
    audience:'beginner',
    minutes:45,
    objective:'Al finalizar, cada participante podrá explicar '+lesson.title.toLocaleLowerCase('es')+' y justificar qué información necesita para aplicarla.',
    demo:'Presenta el principio. Guía la lectura del ejemplo y señala los datos, las unidades y el supuesto principal.',
    practice:'En parejas, resuelvan el ejercicio de la lección. Registren el procedimiento y comparen con la solución después de justificar su respuesta.',
    assessment:'Pide una explicación individual y un dato que permita verificarla. Registra el criterio alcanzado y la parte que necesita repaso.',
    notes:''
  };
}

export function trainingSections(plan,lesson,references) {
  return [
    {heading:'Agenda sugerida',body:trainingAgenda(plan.minutes).map(([label,minutes])=>label+' · '+minutes+' min').join('\n')},
    {heading:'Orientación para el público',body:audiences[plan.audience].instruction},
    ...activityFields.filter(([key])=>plan[key]).map(([key,heading])=>({heading,body:plan[key]})),
    {heading:'Fundamento de la lección',body:lesson.theory},
    {heading:'Aplicación de referencia',body:lesson.practice},
    {heading:'Solución de referencia para el instructor',body:lesson.exercise},
    {heading:'Fuentes de la lección',body:references.map(([title,url])=>title+' · '+url).join('\n')}
  ];
}
