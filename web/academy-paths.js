const links={
  'fundamentos/control':['fundamentos/flujo'],
  'color/instrumentos':['color/percepcion'],
  'color/igualacion':['color/instrumentos','tintas/formulacion'],
  'preprensa/fingerprint':['preprensa/archivo','fundamentos/control'],
  'preprensa/fingerprint-plan':['preprensa/fingerprint'],
  'preprensa/fingerprint-data':['preprensa/fingerprint-plan','color/instrumentos'],
  'placas/placa-falla':['placas/polimero'],
  'montaje/posicion':['placas/polimero'],
  'montaje/inspeccion':['montaje/posicion'],
  'anilox/medicion':['anilox/celdas'],
  'anilox/pelicula-anilox':['anilox/medicion','tintas/formulacion'],
  'tintas/problemas-tinta':['tintas/formulacion','materiales/familias'],
  'materiales/material-diagnostico':['materiales/familias'],
  'mecanica/mecanica-falla':['mecanica/banda'],
  'suajes/engranes':['suajes/corte'],
  'calidad/mejora':['calidad/spc'],
  'normas/first-g7':['normas/iso'],
  'diagnostico/patrones':['fundamentos/control'],
  'diagnostico/pelicula':['diagnostico/patrones','anilox/celdas'],
  'distorsion/radios':['montaje/posicion'],
  'distorsion/compensacion':['distorsion/radios','fundamentos/control'],
  'distorsion/engranes-registro':['distorsion/compensacion','suajes/engranes','mecanica/banda']
};
export const goals={
  control:{label:'Estabilizar la impresión',target:'fundamentos/control'},
  color:{label:'Igualar una tinta con evidencia',target:'color/igualacion'},
  fingerprint:{label:'Validar un fingerprint',target:'preprensa/fingerprint-data'},
  distorsion:{label:'Diagnosticar distorsión y deriva',target:'distorsion/engranes-registro'},
  anilox:{label:'Evaluar transferencia del anilox',target:'anilox/pelicula-anilox'}
};
export function routeTo(target,valid){
  const ordered=[],seen=new Set(),visiting=new Set();
  function visit(key){
    if(seen.has(key))return;
    if(!valid.has(key)||visiting.has(key))throw new Error('La ruta contiene una referencia inválida.');
    visiting.add(key);
    for(const dependency of links[key]||[])visit(dependency);
    visiting.delete(key);
    seen.add(key);ordered.push(key);
  }
  visit(target);
  return ordered;
}
export function todayKey(now=new Date()){
  return [now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
}
export function schedule(previous,rating,day){
  const date=new Date(day+'T00:00:00Z');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(+date)||date.toISOString().slice(0,10)!==day)throw new Error('Fecha de repaso inválida.');
  if(previous?.due>day)throw new Error('Este repaso ya está programado para otra fecha.');
  const intervals=[3,7,14,30];
  const step=Number.isInteger(previous?.step)?Math.min(intervals.length,Math.max(0,previous.step)):0;
  if(!['again','remembered'].includes(rating))throw new Error('Resultado de repaso inválido.');
  date.setUTCDate(date.getUTCDate()+(rating==='again'?1:intervals[Math.min(step,intervals.length-1)]));
  return {due:date.toISOString().slice(0,10),step:rating==='again'?0:Math.min(step+1,intervals.length),last:day,rating};
}
