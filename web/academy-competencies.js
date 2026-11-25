export const levels = ['Sin evidencia registrada','Explicación del método','Aplicación con apoyo','Aplicación autónoma'];
export const evidenceTypes = {
  practica:'Práctica',
  experiencia:'Experiencia de trabajo',
  evaluacion:'Evaluación'
};

export const evidenceRoles={
  prensa:'Operación de prensa',preprensa:'Preprensa',calidad:'Calidad',
  tintas:'Tintas y color',montaje:'Montaje y acabado',mantenimiento:'Mantenimiento'
};

export function evidenceForRole(items=[],role=''){
  return role?items.filter(item=>item.role===role):items;
}

export const criteria = {
  control:'Registra una condición de impresión, la variable observada y cómo comprobaste que se mantuvo estable.',
  color:'Documenta el método de medición, el ajuste de tinta y la comparación con la muestra objetivo.',
  fingerprint:'Describe las condiciones del ensayo, la medición utilizada y cómo verificaste la curva resultante.',
  distorsion:'Incluye el desarrollo nominal y medido, tu hipótesis y la prueba usada para confirmar o descartar la deriva.',
  anilox:'Describe el anilox y la referencia de comparación, la medición y el resultado registrado.'
};

export function levelFromEvidence(evidence = []) {
  return evidence.reduce((highest,item)=>Number.isInteger(item.level)&&item.level>0&&item.level<levels.length
    ?Math.max(highest,item.level):highest,0);
}

export function validateEvidence(input,route){
  const description=input.description.trim();
  if(description.length<10||description.length>1500)throw new Error('Describe qué hiciste y qué resultado observaste, entre 10 y 1500 caracteres.');
  if(!Object.hasOwn(evidenceTypes,input.type))throw new Error('Selecciona el tipo de evidencia.');
  if(!Number.isInteger(input.level)||input.level<1||input.level>=levels.length)throw new Error('Selecciona el nivel que respalda la evidencia.');
  if(input.lesson&&!route.includes(input.lesson))throw new Error('Elige una lección de esta ruta.');
  if(input.role&&!Object.hasOwn(evidenceRoles,input.role))throw new Error('Selecciona un rol válido.');
  return {description,type:input.type,level:input.level,lesson:input.lesson,...(input.role?{role:input.role}:{})};
}
