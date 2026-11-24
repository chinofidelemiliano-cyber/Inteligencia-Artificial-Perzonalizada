const $=id=>document.getElementById(id);
const api=window.liftsWorkspace;
const form=$('diagnosticForm'),guide=$('diagnosticGuide'),status=$('diagnosticStatus'),history=$('diagnosticHistory');
const checks={
  register:{
    progressive:['Diferencia de paso o elongación sostenida','Mide la distancia entre dos marcas homólogas separadas por varias repeticiones para impresión y corte. Divide la diferencia entre intervalos. Registra también si afecta uno o todos los colores.','Una pendiente estable orienta a diferencia de desarrollos. Si cambia con velocidad o condición de banda, conserva la hipótesis de elongación.'],
    fixed:['Fase u orientación inicial','Mide el desplazamiento longitudinal y transversal en tres repeticiones y en ambos lados.','Una diferencia longitudinal constante indica fase. Un cambio entre lados orienta a alineación angular o deformación.'],
    variable:['Tensión dinámica, guiado o arrastre','Registra fase, velocidad y tensión indicada durante régimen estable y rampa. Conserva muestras antes y después de un empalme.','Si el error acompaña a la rampa o al empalme, revisa la estabilidad antes de corregir la compensación dimensional.']
  },
  pinhole:{
    progressive:['Acumulación de aire, residuos o cambio de tinta','Compara número de huecos por área en muestras sucesivas de la misma zona. Registra estado del circuito, lote y condición de medición.','Si aumenta tras un cambio de tinta o de lote, aísla esas condiciones por separado y verifica con una muestra testigo.'],
    fixed:['Topografía del soporte o defecto localizado de transferencia','Compara lupa y testigo sin imprimir en la misma coordenada, y registra el paso de repetición del defecto.','Una posición fija en todo el avance orienta a una condición transversal. Una posición que vuelve por vuelta orienta a la estación que repite.'],
    variable:['Aire en tinta o mojabilidad irregular','Compara muestras a igual condición de banda y documenta espuma, limpieza y lote.','Una prueba controlada permite separar la mojabilidad del aire. El aspecto del hueco por sí solo no confirma la causa.']
  },
  cut:{
    progressive:['Diferencia entre repetición impresa y corte','Mide los pasos de impresión y de corte en la misma referencia. Conserva frontal, liner y matriz.','Si el error crece por intervalo, mover la fase corregirá solo una referencia. Verifica el desarrollo efectivo de ambos sistemas.'],
    fixed:['Daño localizado, asiento o desgaste','Identifica en qué zona del ancho y de la vuelta se repite el corte. Compara muestras de liner, matriz y frontal.','Si el defecto coincide con una sola zona del filo, conserva evidencia e inspecciona conforme al procedimiento de aislamiento.'],
    variable:['Variación de soporte o retiro de matriz','Mide espesores por lote y registra el punto donde empieza la rotura y la velocidad.','Distingue un fallo de penetración de una matriz que rompe después del corte. Trabaja con una sola variable por prueba.']
  }
};
let id='',version=0,busy=false;
const photos=[];
function node(parent,tag,text){
  const el=document.createElement(tag);if(text!==undefined)el.textContent=text;parent.append(el);return el;
}
function action(parent,text,run){
  const button=node(parent,'button',text);button.type='button';button.className='secondary';button.onclick=run;return button;
}
const records=()=>api.getState().diagnosticCases||[];
const values=()=>Object.fromEntries(new FormData(form));
const traceFields={order:'Orden de producción',material:'Material o lote',ink:'Tinta o lote',anilox:'Anilox',plate:'Placa',die:'Suaje'};
const traceLines=data=>Object.entries(traceFields).filter(([key])=>data[key]?.trim())
  .map(([key,label])=>label+': '+data[key].trim());
const normalize=value=>value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();
function search(query){
  const term=normalize(query);
  return records().filter(({data})=>normalize([data.name,data.machine,data.symptoms,data.cause,...traceLines(data)].join(' ')).includes(term));
}
function sections(data){
  const route=checks[data.problem]?.[data.pattern];
  if(!route)return [];
  const report=[
    {heading:'Condición observada',body:'Máquina u orden: '+(data.machine||'Sin indicar')+'\n'+(data.symptoms||'Sin registrar')},
    {heading:'Hipótesis inicial',body:route[0]},
    {heading:'Comprobación e interpretación',body:route[1]+'\n'+route[2]},
    {heading:'Evidencia de la operación',body:data.evidence||'Sin mediciones registradas.'},
    {heading:'Causa y validación',body:'Causa confirmada por quien registra: '+(data.cause||'Pendiente de confirmar')+'\n'+(data.validation||'Sin validación registrada.')}
  ];
  const trace=traceLines(data);
  if(trace.length)report.push({heading:'Trazabilidad',body:trace.join('\n')});
  return report;
}
function update(){
  guide.replaceChildren();
  for(const section of sections(values()).slice(1,3)){
    node(guide,'h4',section.heading);node(guide,'p',section.body);
  }
  node(guide,'p','Conserva la muestra inicial, modifica una condición a la vez y compara antes y después. Para inspección de partes móviles, aplica el procedimiento autorizado de aislamiento.');
}
form.onchange=update;
function load(record){
  form.reset();
  id=record.id;
  for(const [key,value] of Object.entries(record.data))if(form.elements.namedItem(key))form.elements.namedItem(key).value=value;
  $('diagnosticTrace').open=traceLines(record.data).length>0;
  update();status.textContent='Caso cargado. Al guardar se actualizará este registro.';
  window.liftsNexus?.checkpoint('diagnostic-record',record.id,record.data.name);
  form.scrollIntoView({block:'start'});
}
function openSaved(key){
  const record=records().find(item=>item.id===key);
  if(!record)return false;
  if($('diagnostics').hidden)api.open('diagnostics');
  if($('diagnostics').hidden)return false;
  load(record);
  return true;
}
function renderHistory(){
  history.replaceChildren();
  const matching=search($('diagnosticSearch').value);
  if(!matching.length)node(history,'p','No hay casos que coincidan.');
  for(const item of matching){
    const entry=node(history,'article');entry.className='reminder-card';
    node(entry,'h4',item.data.name);
    node(entry,'p',[item.data.machine,item.data.cause?'Causa registrada':'En análisis',new Date(item.at).toLocaleDateString('es-MX')].filter(Boolean).join(' · '));
    if(item.data.order)node(entry,'p','Orden: '+item.data.order);
    action(entry,'Cargar caso',()=>load(item));
  }
}
$('diagnosticSearch').oninput=renderHistory;
form.onsubmit=async event=>{
  event.preventDefault();
  if(busy)return;
  const data=values();
  if(!data.name.trim()||!data.symptoms.trim()){status.textContent='Escribe el nombre y los síntomas.';return;}
  if(data.cause.trim()&&!data.evidence.trim()){status.textContent='Registra la prueba antes de guardar una causa confirmada.';return;}
  busy=true;
  const account=api.getState(),epoch=version,old=account.diagnosticCases;
  const next={id:id||crypto.randomUUID(),at:new Date().toISOString(),data};
  account.diagnosticCases=[next,...records().filter(record=>record.id!==next.id)];
  try{
    if(await api.save()===false)throw new Error();
    if(epoch!==version)return;
    id=next.id;status.textContent='Caso guardado.';renderHistory();
  }catch{
    if(epoch===version){account.diagnosticCases=old;status.textContent='No se confirmó el guardado. Puedes reintentar.';}
  }finally{if(epoch===version)busy=false;}
};
$('diagnosticPdf').onclick=()=>{
  const data=values();
  if(!data.name.trim()||!data.symptoms.trim()){status.textContent='Completa el nombre y los síntomas antes de exportar.';return;}
  if(data.cause.trim()&&!data.evidence.trim()){status.textContent='Registra evidencia antes de exportar una causa confirmada.';return;}
  const bytes=window.liftsPdf.make({title:'Reporte de diagnóstico flexográfico',subtitle:data.name,sections:sections(data)});
  const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
  const link=document.createElement('a');link.href=url;link.download='lifts-diagnostico.pdf';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
};
$('diagnosticDocx').onclick=async event=>{
  const button=event.currentTarget,data=values(),epoch=version;
  if(!data.name.trim()||!data.symptoms.trim()){
    status.textContent='Completa el nombre y los síntomas antes de exportar.';return;
  }
  if(data.cause.trim()&&!data.evidence.trim()){
    status.textContent='Registra evidencia antes de exportar una causa confirmada.';return;
  }
  button.disabled=true;
  try{
    const {documentFile}=await import('./studio-docx.js');
    if(epoch!==version)return;
    const bytes=documentFile('Reporte de diagnóstico flexográfico',data.name,sections(data));
    const url=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}));
    const link=document.createElement('a');link.href=url;link.download='lifts-diagnostico.docx';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
    status.textContent='Reporte Word generado.';
  }catch{if(epoch===version)status.textContent='No se pudo generar el reporte Word.';}
  finally{button.disabled=false;}
};
for(const label of ['Referencia','Muestra']) {
  const box=node($('diagnosticPhotos'),'div');
  const labelInput=node(box,'label',label+' fotográfica');
  const input=node(labelInput,'input');input.type='file';input.accept='image/jpeg,image/png,image/webp';
  const wrapper=node(box,'div');wrapper.className='diagnostic-photo';wrapper.hidden=true;
  const marker=node(wrapper,'span');marker.className='diagnostic-point';marker.hidden=true;
  const img=node(wrapper,'img');img.alt=label+' seleccionada';img.decoding='async';
  const zoomLabel=node(box,'label','Ampliar '+label.toLowerCase());
  const zoom=node(zoomLabel,'input');zoom.type='range';zoom.min=1;zoom.max=4;zoom.step=.1;zoom.value=1;zoom.disabled=true;
  const point=node(box,'p');point.setAttribute('role','status');
  const local={url:'',input,wrapper,img,zoom,point,marker};photos.push(local);
  zoom.oninput=()=>{img.style.transform='scale('+zoom.value+')';};
  wrapper.onclick=event=>{
    const rect=img.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const x=Math.max(0,Math.min(100,Math.round((event.clientX-rect.left)/rect.width*100)));
    const y=Math.max(0,Math.min(100,Math.round((event.clientY-rect.top)/rect.height*100)));
    img.style.transformOrigin=x+'% '+y+'%';
    const frame=wrapper.getBoundingClientRect();
    marker.style.left=(event.clientX-frame.left)+'px';
    marker.style.top=(event.clientY-frame.top)+'px';
    marker.hidden=false;
    point.textContent='Punto de inspección: '+x+' % del ancho y '+y+' % del alto desde la esquina superior izquierda.';
  };
  input.onchange=()=>{
    if(local.url)URL.revokeObjectURL(local.url);
    const file=input.files[0];
    wrapper.hidden=true;zoom.disabled=true;marker.hidden=true;
    if(!file)return;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12*1024*1024){
      $('diagnosticPhotoStatus').textContent='Elige un archivo JPG, PNG o WebP de hasta 12 MB.';input.value='';return;
    }
    img.onload=()=>{
      wrapper.hidden=false;zoom.disabled=false;zoom.value=1;img.style.transform='';img.style.transformOrigin='center';
      point.textContent='';$('diagnosticPhotoStatus').textContent='';
    };
    img.onerror=()=>{$('diagnosticPhotoStatus').textContent='El archivo no se pudo abrir como imagen.';};
    local.url=URL.createObjectURL(file);img.src=local.url;
  };
}
function clearPhotos(){
  for(const photo of photos){
    if(photo.url)URL.revokeObjectURL(photo.url);
    photo.img.onload=null;photo.img.onerror=null;
    photo.url='';photo.img.removeAttribute('src');photo.input.value='';photo.wrapper.hidden=true;
    photo.zoom.disabled=true;photo.marker.hidden=true;photo.point.textContent='';
  }
  $('diagnosticPhotoStatus').textContent='';
}
form.onreset=()=>{id='';status.textContent='';$('diagnosticTrace').open=false;clearPhotos();queueMicrotask(update);};
function reset(){
  version++;busy=false;form.reset();$('diagnosticSearch').value='';
  renderHistory();
}
window.addEventListener('lifts-page',event=>{if(event.detail?.page==='diagnostics'){update();renderHistory();}});
window.addEventListener('nexo-state',reset);
window.liftsDiagnostics={reset,openSaved,search};
