import {dimensions,distortion,cuttingModel} from './engineering.js';

const $=id=>document.getElementById(id);
const api=window.liftsWorkspace;
const form=$('engineeringForm'),status=$('engineeringStatus'),results=$('engineeringResult');
const history=$('engineeringHistory'),save=$('engineeringSave'),download=$('engineeringPdf');
let current=null,busy=false,version=0,reportSaved=false;
const format=value=>value===null?'Sin datos':value.toFixed(3);

function element(parent,tag,text) {
  const el=document.createElement(tag);
  if(text!==undefined)el.textContent=text;
  parent.append(el);
  return el;
}
function action(parent,label,handler) {
  const button=element(parent,'button',label);
  button.type='button';button.className='secondary';button.onclick=handler;
  return button;
}
for(const [name,label,required] of dimensions){
  const field=element(required?$('engineeringRequired'):$('engineeringOptional'),'label',label);
  const input=element(field,'input');
  input.name=name;input.type='number';input.min=name==='shim'?'0':'0.000001';input.step='any';
  input.required=Boolean(required);
}
function invalidate() {
  current=null;reportSaved=false;results.replaceChildren();status.textContent='';
  save.disabled=true;download.disabled=true;
}
function calculate(){
  invalidate();
  const data=Object.fromEntries(new FormData(form));
  if(!data.name.trim()){status.textContent='Escribe una identificación para esta ficha.';return;}
  try {
    current={data,result:distortion(data)};
    renderResult(current);
    save.disabled=busy;download.disabled=false;
  } catch(error) {status.textContent=error.message;}
}
form.onsubmit=event=>{event.preventDefault();calculate();};
form.oninput=invalidate;

function reportSections({data,result:r}) {
  const v=r.values;
  const lines=[
    'Modelo: '+(data.model||'Sin indicar'),
    'Fuente: '+(data.source||'Sin indicar'),
    ...dimensions.filter(([key])=>v[key]!==null).map(([key,label])=>label+': '+format(v[key])+' mm')
  ];
  if(data.notes)lines.push('Observaciones: '+data.notes);
  const geometry=[];
  if(r.nominal!==null)geometry.push('Desarrollo nominal del cilindro desnudo: π × diámetro = '+format(r.nominal)+' mm.');
  if(r.plateBaseRadius!==null)geometry.push('Radio de montaje hasta la base de la placa: diámetro / 2 + cinta + calzas = '+format(r.plateBaseRadius)+' mm.');
  if(r.surfaceRadius!==null)geometry.push('Radio geométrico hasta la superficie de placa: '+format(r.surfaceRadius)+' mm.');
  if(r.printRadius!==null)geometry.push('Radio de impresión equivalente medido: desarrollo efectivo / (2π) = '+format(r.printRadius)+' mm.');
  if(r.geometricFactor!==null)geometry.push('Modelo radial: radio del plano neutro / radio de impresión = '+r.geometricFactor.toFixed(6)+
    '. Para el objetivo serían '+format(r.geometricPrepared)+' mm. La distancia al plano neutro requiere evidencia del fabricante o calibración.');
  if(r.gear)geometry.push('Engrane ('+data.teeth+' dientes): diámetro primitivo '+format(r.gear.pitchDiameter)+
    ' mm, circunferencia primitiva '+format(r.gear.pitchCircumference)+' mm y paso circular '+format(r.gear.circularPitch)+' mm.');
  if(r.difference!==null)geometry.push('Diferencia impresión menos troquel: '+format(r.difference)+' mm/vuelta.'+
    (r.drift===null?'':' Desfase acumulado entre primera y última referencia: '+format(r.drift)+' mm.'));
  return [
    {heading:'Condición registrada',body:lines.join('\n')},
    {heading:'Compensación medida',body:[
      'Distorsión = (impresa / archivo − 1) × 100 = '+format(r.distortion)+' %.',
      'Factor de compensación = archivo / impresa = '+format(v.file)+' / '+format(v.printed)+' = '+r.factor.toFixed(6)+'.',
      'Reducción = (1 − factor) × 100 = '+format(r.reduction)+' %. Un valor negativo representa ampliación.',
      'Longitud de preparación = objetivo × factor = '+format(v.target)+' × '+r.factor.toFixed(6)+' = '+format(r.prepared)+' mm.'
    ].join('\n')},
    {heading:'Geometría y registro',body:geometry.join('\n') || 'Completa los datos opcionales para estos cálculos.'},
    {heading:'Verificación',body:'Usa la compensación longitudinal con la misma condición de placa, cinta, cilindro y sustrato. Registra una segunda prueba y compara longitud impresa y objetivo. Los radios geométricos y los valores primitivos del engrane son referencias dimensionales. El desarrollo efectivo viene de la medición o documentación aplicable.'}
  ];
}
function draw(record) {
  const {result:r}=record;
  const figure=element(results,'figure');
  figure.className='academy-diagram';
  element(figure,'figcaption','Placa plana y placa sobre el cilindro · esquema sin escala');
  const canvas=element(figure,'canvas');
  canvas.width=560;canvas.height=165;
  canvas.style.maxWidth='100%';canvas.style.height='auto';
  canvas.setAttribute('aria-label','Placa plana y corte conceptual montado. Las dimensiones se indican en el reporte.');
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  ctx.fillStyle='#e8f2fa';ctx.fillRect(0,0,560,165);
  ctx.fillStyle='#095499';ctx.fillRect(27,68,Math.min(225,170*r.factor),16);
  for(const [radius,color] of [[60,'#095499'],[53,'#e01d25'],[47,'#9bb7cb']]){
    ctx.beginPath();ctx.arc(395,91,radius,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
  }
  ctx.fillStyle='#173650';ctx.font='14px system-ui';
  ctx.fillText('Longitud preparada',27,47);
  ctx.fillText(format(r.prepared)+' mm',27,110);
  ctx.fillText('Placa · cinta · cilindro',320,160);
}
function renderResult(record) {
  const sections=reportSections(record);
  element(results,'h3','Resultado de la prueba');
  for(const section of sections.slice(1)){
    element(results,'h4',section.heading);
    for(const line of section.body.split('\n'))element(results,'p',line);
  }
  draw(record);
}
async function persist(records) {
  if(busy)return false;
  busy=true;save.disabled=true;
  const state=api.getState(),prior=state.engineeringRecords,epoch=version;
  state.engineeringRecords=records;
  try{
    if(await api.save()===false)throw new Error();
    return epoch===version;
  }catch{
    if(epoch===version){
      state.engineeringRecords=prior;
      status.textContent='No se confirmó el guardado. Inténtalo de nuevo.';
    }
    return false;
  }finally{
    if(epoch===version){busy=false;save.disabled=!current||reportSaved;}
  }
}
save.onclick=async()=>{
  if(!current||busy||reportSaved)return;
  const record=current;
  const item={id:crypto.randomUUID(),at:new Date().toISOString(),data:record.data};
  if(await persist([item,...(api.getState().engineeringRecords||[])])){
    if(current===record){reportSaved=true;save.disabled=true;}
    status.textContent='Ficha guardada en tu cuenta.';
    renderHistory();
  }
};
download.onclick=()=>{
  if(!current)return;
  const bytes=window.liftsPdf.make({title:'Reporte de distorsión longitudinal',subtitle:current.data.name,
    sections:reportSections(current)});
  const file=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
  const link=document.createElement('a');link.href=file;link.download='lifts-reporte-distorsion.pdf';link.click();
  setTimeout(()=>URL.revokeObjectURL(file),30000);
};
function fill(data) {
  form.reset();
  for(const [key,value] of Object.entries(data))if(form.elements.namedItem(key))form.elements.namedItem(key).value=value;
  if(form.checkValidity())calculate();else invalidate();
}
function openSaved(id) {
  const item=(api.getState().engineeringRecords||[]).find(record=>record.id===id);
  if(!item)return false;
  if($('engineering').hidden)api.open('engineering');
  if($('engineering').hidden)return false;
  fill(item.data);
  window.liftsNexus?.checkpoint('engineering-record',item.id,item.data.name);
  $('engineeringForm').scrollIntoView({block:'start'});
  return true;
}
function renderHistory(){
  history.replaceChildren();
  const records=api.getState().engineeringRecords||[];
  if(!records.length)element(history,'p','Las fichas que guardes aparecerán aquí.');
  for(const item of records){
    const card=element(history,'article');card.className='reminder-card';
    element(card,'h4',item.data.name);
    element(card,'p',[item.data.model,new Date(item.at).toLocaleString('es-MX')].filter(Boolean).join(' · '));
    action(card,'Cargar ficha',()=>openSaved(item.id));
    action(card,'Eliminar ficha',async()=>{
      if(!confirm('¿Eliminar esta ficha de tu historial?'))return;
      if(await persist((api.getState().engineeringRecords||[]).filter(record=>record.id!==item.id))){
        status.textContent='Ficha eliminada.';renderHistory();
      }
    });
  }
}
$('engineeringExample').onclick=()=>fill({name:'Ejemplo didáctico · No corresponde a una máquina real',
  source:'Valores de práctica',unit:'mm',printed:100.4,file:100,target:100,diameter:100,repeat:320,
  plate:1.14,tape:.38,shim:0,effective:.35,die:319.9,turns:10,teeth:64,pitch:32,gearMode:'dp'});
$('engineeringLesson').onclick=()=>window.liftsAcademy.open('lesson','distorsion/compensacion');
const inputs=[
  ['Frontal (µm)',60],['Adhesivo (µm)',20],['Liner (µm)',45],['Gap desde la referencia (µm)',50],['Altura del filo desde la referencia (µm)',130]
].map(([label,value])=>{
  const wrap=element($('cutFields'),'label',label);
  const input=element(wrap,'input');input.type='number';input.min='.01';input.step='any';input.value=value;input.required=true;
  return input;
});
function renderCut() {
  const diagram=$('cutLayers'),output=$('cutOutput');
  diagram.replaceChildren();
  diagram.removeAttribute('aria-label');
  try{
    const numbers=inputs.map(input=>input.valueAsNumber);
    const [front,adhesive,liner]=numbers;
    const cut=cuttingModel(...numbers);
    for(const [name,thickness] of [['Frontal',front],['Adhesivo',adhesive],['Liner',liner]]){
      const layer=element(diagram,'div',name+' · '+thickness+' µm');
      layer.style.flexGrow=String(thickness);
    }
    const marker=element(diagram,'span');
    marker.className='cut-tip';
    marker.style.height=Math.max(0,Math.min(100,cut.penetration/cut.total*100))+'%';
    marker.setAttribute('aria-hidden','true');
    output.textContent=cut.status+' · penetración geométrica '+format(cut.penetration)+' µm · frontal y adhesivo '+format(cut.face)+' µm.';
    diagram.setAttribute('aria-label','Corte esquemático de frontal, adhesivo y liner. '+output.textContent);
  }catch(error){output.textContent=error.message;}
}
inputs.forEach(input=>{input.oninput=renderCut;});
renderCut();
function reset(){version++;busy=false;form.reset();invalidate();renderHistory();}
window.addEventListener('nexo-state',reset);
window.addEventListener('lifts-page',e=>{if(e.detail?.page==='engineering')renderHistory();});
window.liftsEngineering={reset,openSaved};
