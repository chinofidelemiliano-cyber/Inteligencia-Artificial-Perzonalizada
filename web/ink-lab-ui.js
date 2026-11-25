import {dose, dilution, recipe, comparison, number, consumeAdditive} from './ink-lab.js';
import {additives, diagnoses, interactions, lessons} from './ink-lab-content.js';

const lab = document.getElementById('inkLab');
const workspace = window.liftsWorkspace;
const format = new Intl.NumberFormat('es-MX',{maximumSignificantDigits:9});
const fmt = value => format.format(value);
let saving = false;
let epoch = 0;
const status = lab.querySelector('[role="status"]');

function node(parent, tag, text) {
  const item = document.createElement(tag);
  if (text) item.textContent = text;
  parent.append(item);
  return item;
}
function panel(title, help) {
  const group = node(lab,'details');
  group.className = 'card';
  node(group,'summary',title);
  node(group,'p',help);
  return group;
}
function fields(parent, specs, action, submit) {
  const form = node(parent,'form');
  const grid = node(form,'div');
  grid.className = 'field-grid';
  for (const [name, title, kind = 'text', optional = false] of specs) {
    const box = node(grid,'div');
    const label = node(box,'label',title);
    const input = node(box, Array.isArray(kind) ? 'select' : kind === 'area' ? 'textarea' : 'input');
    input.id = 'ink-'+parent.id+'-'+name;
    label.htmlFor = input.id;
    input.name = name;
    input.required = !optional;
    if (Array.isArray(kind)) kind.forEach(([value,text])=>input.add(new Option(text,value)));
    else input.maxLength = kind === 'area' ? 3500 : 240;
    if (kind === 'decimal') input.inputMode = 'decimal';
  }
  node(form,'button',action);
  const output = node(parent,'div');
  output.setAttribute('aria-live','polite');
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    output.replaceChildren();
    try {
      await submit(Object.fromEntries(new FormData(form)),output);
    } catch (error) {
      node(output,'p',error.message);
    }
  });
  return form;
}
function dataRecord(type, data, output) {
  return store({...data,type},output);
}
async function store(data, output) {
  if (saving) throw new Error('Espera a que termine el guardado anterior.');
  const state = workspace.getState();
  const prior = state.inkLabRecords;
  const priorIndustrial = state.industrial;
  const revision = epoch;
  if(data.stock) state.industrial=consumeAdditive(priorIndustrial,data.stock,data.grams);
  state.inkLabRecords = [{...data,id:crypto.randomUUID(),at:new Date().toISOString()},...(prior??[])];
  saving = true;
  try {
    if (await workspace.save()===false) throw new Error();
    if (revision===epoch) {
      node(output,'p','Guardado en tu cuenta.');
      renderHistory();
      return true;
    }
  } catch {
    if (revision===epoch) {
      if (prior===undefined) delete state.inkLabRecords;
      else state.inkLabRecords = prior;
      if(data.stock) state.industrial=priorIndustrial;
      node(output,'p','No se confirmó el guardado. Intenta de nuevo.');
    }
  } finally {
    if (revision===epoch) saving=false;
  }
}
function lines(parent, values) {
  const list = node(parent,'dl');
  for (const [key,value] of values) {
    node(list,'dt',key);
    node(list,'dd',String(value));
  }
}
function resultLines(result) {
  const rows = [
    ['Producto por añadir',fmt(result.add)+' g · '+fmt(result.add/1000)+' kg'],
    ['Rango mínimo / habitual / máximo', [result.minG,result.nominalG,result.maxG].map(fmt).join(' / ')+' g'],
    ['Producto acumulado',fmt(result.previous)+' g · '+fmt(result.accumulated)+' % en la base seleccionada'],
    ['Margen restante antes del máximo',fmt(result.remaining)+' g']
  ];
  if (result.ml!==null) rows.push(['Volumen',fmt(result.ml)+' ml · '+fmt(result.ml/1000)+' L']);
  if (result.cost!==null) rows.push(['Costo en la moneda del precio capturado',fmt(result.cost)]);
  if (result.aboveMaximum) rows.push(['Validación','El acumulado supera el máximo de la ficha.']);
  else if (result.aboveTarget) rows.push(['Validación','El acumulado supera el objetivo elegido.']);
  return rows;
}
const sources = [['source','Fabricante, documento, revisión y página o autorización interna']];
const rec = panel('Recetario químico','Escala una fórmula propia en una sola base. Para volumen, las fracciones deben corresponder a volúmenes de formulación aditivos o a un método validado para alcanzar el volumen final.');
rec.id = 'recipes';
const recipeForm=fields(rec,[
 ['name','Nombre'],['purpose','Objetivo'],['class','Estado',[['experimental','Experimental'],['manufact','Documentada por fabricante'],['valid','Validada en producción']]],
 ...sources,['size','Cantidad de preparación (por ejemplo, 50 ml o 20 000 ml)','decimal'],
 ['unit','Base',[['g','g · porcentaje en masa'],['ml','ml · porcentaje de formulación en volumen']]],
 ['ingredients','Ingredientes en orden de incorporación. Una línea por ingrediente: nombre | porcentaje','area'],
 ['procedure','Procedimiento, compatibilidad, beneficio y límites','area'],
 ['check','Precauciones, almacenamiento, dosificación documentada y comprobación','area']
], 'Escalar fórmula',(data,output)=>{
  const calculated = recipe(data.size,data.ingredients);
  lines(output,calculated.map(row=>[row.name,fmt(row.amount)+' '+data.unit+' · '+fmt(row.fraction)+' %']));
  const button = node(output,'button','Guardar fórmula privada');
  button.onclick = async ()=>{
    button.disabled=true;
    try {if (!await dataRecord('Fórmula',data,output)) button.disabled=false;} catch(error){node(output,'p',error.message);button.disabled=false;}
  };
});

const encyclopedia = panel('Enciclopedia de aditivos','Las funciones descritas corresponden a familias. Para composición, dosis o compatibilidad de un producto exacto, abre su ficha.');
encyclopedia.id = 'additives';
for(const [name,body] of additives){
  const definition=node(encyclopedia,'details');
  node(definition,'summary',name);node(definition,'p',body);
}

const tray=panel('Dosificación en charola o depósito','Producto objetivo = masa inicial × porcentaje ÷ 100. En base activa, divide además entre la fracción activa del producto. Resta lo ya incorporado. Usa la masa inicial antes de añadir el aditivo, de acuerdo con la base indicada por el proveedor.');
tray.id='dose';
const doseFields=[
 ['ink','Tipo, marca y serie de tinta'],['product','Aditivo'],...sources,['mass','Masa inicial de tinta (kg)','decimal'],
 ['basis','Base documentada',[['product','Producto comercial sobre masa inicial de tinta'],['active','Ingrediente activo sobre masa inicial de tinta']]],
 ['active','Ingrediente activo (% masa, requerido solo en base activa)','decimal',true],
 ['min','Dosis mínima documentada (%)','decimal'],['nominal','Dosis habitual documentada (%)','decimal'],
 ['max','Dosis máxima documentada (%)','decimal'],['target','Dosis elegida (%)','decimal'],
 ['previous','Producto ya incorporado (g, escribe 0 si corresponde)','decimal'],
 ['density','Densidad del producto (g/ml, opcional)','decimal',true],['price','Precio por kg (opcional)','decimal',true]
];
const doseForm=fields(tray,doseFields,'Calcular dosificación',(data,output)=>lines(output,resultLines(dose(data))));

const alcohol=panel('Alcoholes y concentración','Calcula una dilución de un solo alcohol con grados en % v/v a la misma temperatura de referencia. El agua se especifica para completar el volumen final según el procedimiento autorizado. La mezcla hidroalcohólica puede contraerse. Etanol e isopropanol son inflamables y actúan principalmente como cosolventes. Consulta la ficha de seguridad, el grado y los desnaturalizantes.');
alcohol.id='alcohol';
fields(alcohol,[
 ['alcohol','Alcohol disponible',[['Etanol','Etanol'],['Isopropanol','Isopropanol']]],
 ['stock','Grado de origen (% v/v, por ejemplo 70, 80, 90, 91, 96, 99 o 99,9)','decimal'],
 ['target','Grado objetivo (% v/v)','decimal'],['total','Volumen final (ml)','decimal'],
 ['water','Tipo de agua',[['dest','Destilada'],['dem','Desmineralizada'],['pur','Purificada'],['tap','De la llave']]]
], 'Calcular dilución',(data,output)=>{
  const result=dilution(data);
  lines(output,[[data.alcohol+' de origen',fmt(result.stockMl)+' ml'],['Volumen final',fmt(result.totalMl)+' ml']]);
  const water={
    dest:'La destilación suele reducir sales. Comprueba la especificación y el almacenamiento.',
    dem:'La desmineralización reduce iones. Comprueba la carga orgánica y microbiana según el proceso.',
    pur:'La calidad depende del método de purificación y de su especificación.',
    tap:'La dureza, sales y tratamiento son variables. Verifica la autorización del proveedor antes de usarla.'
  };
  node(output,'p',water[data.water]+' Una mezcla de etanol e isopropanol requiere registrar ambos componentes y comprobar el vehículo con el proveedor.');
});

const diagnosis=panel('Asistente de corrección','Empieza por una hipótesis verificable. Documenta una sola variable por ensayo.');
diagnosis.id='inkDiagnosis';
fields(diagnosis,[['symptom','Síntoma',diagnoses.map(([name],i)=>[i,name])]],'Ver pruebas de descarte',(data,output)=>{
  const [,checks,followup]=diagnoses[data.symptom];
  lines(output,[['Primero comprueba',checks],['Luego evalúa',followup]]);
});
const diagnosticsButton=node(diagnosis,'button','Abrir Diagnóstico industrial');
diagnosticsButton.type='button';
diagnosticsButton.onclick=()=>workspace.open('diagnostics');

const compatible=panel('Compatibilidad química','Los resultados describen mecanismos posibles. Confírmalos con fichas específicas y ensayos.');
compatible.id='compatibility';
fields(compatible,[['pair','Par de auxiliares',interactions.map(([name],i)=>[i,name])]],'Consultar interacción',(data,output)=>{
  const [pair,classification,body]=interactions[data.pair];
  lines(output,[[pair,classification],['Qué observar',body]]);
});

const experiment=panel('Laboratorio experimental','Compara patrón y muestra con la misma temperatura de referencia, método, sustrato e instrumento. Registra el criterio de aceptación antes de evaluar.');
experiment.id='experiment';
const metrics=[['ph','pH',0,14],['viscosity','Viscosidad en la misma unidad y método',0,1e6],['dry','Tiempo de secado (s)',0,1e7]];
fields(experiment,[
 ['name','Nombre del ensayo'],['ink','Fórmula original y tamaño de las muestras'],['change','Aditivo y cantidad incorporada'],
 ['conditions','Temperatura, métodos, sustrato y condiciones de medición','area'],
 ...metrics.flatMap(([key,label])=>[[key+'0',label+' · patrón','decimal',true],[key+'1',label+' · modificada','decimal',true]]),
 ['lab0','Patrón L* a* b* separados por espacios','text',true],['lab1','Modificada L* a* b* separados por espacios','text',true],
 ['outcome','Adherencia, roce, transferencia, criterio de aceptación, foto de referencia y observaciones','area']
], 'Comparar muestras',(data,output)=>{
  const summary=[];
  const chart=[];
  for(const [key,label,min,max] of metrics) {
    if(!data[key+'0']&&!data[key+'1']) continue;
    const baseline=number(data[key+'0'],label+' patrón',min,max);
    const change=number(data[key+'1'],label+' modificada',min,max);
    summary.push([label,fmt(baseline)+' → '+fmt(change)+' · diferencia '+fmt(change-baseline)]);
    chart.push([label,baseline,change]);
  }
  if(data.lab0||data.lab1){
    const {first,second,differences}=comparison(data.lab0,data.lab1);
    summary.push(['L*C*h°',first.map(fmt).join(' / ')+' → '+second.map(fmt).join(' / ')],
      ['ΔE76 / ΔE94 / ΔE00',Object.values(differences).map(fmt).join(' / ')]);
  }
  if(!summary.length) throw new Error('Captura al menos una medición en patrón y modificada.');
  lines(output,summary);
  for(const [label,baseline,change] of chart){
    const row=node(output,'div');
    const maximum=Math.max(1,baseline,change);
    for(const [sample,value] of [['Patrón',baseline],['Modificada',change]]){
      node(row,'span',sample+' ');
      const bar=node(row,'meter');
      bar.max=maximum;bar.value=value;
      bar.setAttribute('aria-label',label+' · '+sample);
    }
  }
  const button=node(output,'button','Guardar ensayo privado');
  button.onclick=async()=>{
    button.disabled=true;
    try{if (!await dataRecord('Ensayo',{...data,summary},output)) button.disabled=false;}catch(error){node(output,'p',error.message);button.disabled=false;}
  };
});

const academy=panel('Academia de química','Cuatro lecciones con ejercicios aplicados y recursos de lectura.');
for(const [title,explanation,exercise] of lessons){
  const article=node(academy,'article');
  node(article,'h3',title);node(article,'p',explanation);node(article,'p','Práctica · '+exercise);
}
for(const [label,href] of [
  ['IUPAC Gold Book · definición de pH','https://goldbook.iupac.org/terms/view/P04524'],
  ['NIOSH · Alcohol isopropílico','https://www.cdc.gov/niosh/npg/npgd0359.html'],
  ['NIOSH · Alcohol etílico','https://www.cdc.gov/niosh/npg/npgd0262.html'],
  ['Flexographic Technical Association','https://www.flexography.org/']
]){
  const item=node(node(academy,'p'),'a',label);item.href=href;
}
const fiche=panel('Fichas técnicas y hojas de seguridad','Usa el visor de PDF para consultar documentos del proveedor. Registra aquí la referencia y los datos verificados antes de utilizarlos en un cálculo.');
fiche.id='sheets';
const pdf=node(fiche,'button','Abrir extractor de texto PDF');
pdf.type='button';
pdf.onclick=()=>{
  const input=document.getElementById('guardianPdfFile');
  workspace.open(input.closest('section').id);
  const details=input.closest('details');
  if(details) details.open=true;
  input.focus();
};
fields(fiche,[
 ['name','Nombre comercial y fabricante'],['date','Fecha de revisión'],...sources,
 ['properties','Composición declarada, densidad, concentración y pH','area'],
 ['instructions','Dosificación, compatibilidad, almacenamiento, riesgos y precauciones','area']
], 'Guardar referencia de ficha',(data,output)=>dataRecord('Ficha',data,output));

const history=panel('Historial y estadísticas','Guarda ajustes efectuados y sus resultados. Registra la cantidad real, incluso si fue distinta al cálculo.');
history.id='inkHistory';
const adjustmentForm=fields(history,[
 ['name','Problema y máquina'],['trace','Tinta, sustrato, anilox y orden de referencia (texto opcional)','text',true],
 ['product','Aditivo'],['stock','Descontar del inventario al guardar',[['','Sin descuento de inventario']],true],['grams','Producto realmente utilizado (g)','decimal'],
 ['cost','Costo del ajuste (opcional, moneda de trabajo)','decimal',true],...sources,
 ['conclusion','Resultado observado y condiciones','area']
], 'Guardar ajuste realizado',(data,output)=>{
  data.grams=number(data.grams,'cantidad realizada');
  data.cost=data.cost?number(data.cost,'costo'):null;
  if(data.stock && !window.confirm('¿Guardar el ajuste y descontar el consumo del inventario?')) return;
  return dataRecord('Ajuste',data,output);
});
const exportButton=node(history,'button','Exportar historial en JSON');
exportButton.type='button';
exportButton.onclick=()=>{
  const url=URL.createObjectURL(new Blob([JSON.stringify(workspace.getState().inkLabRecords??[],null,2)],{type:'application/json'}));
  const link=document.createElement('a');
  link.href=url;link.download='lifts-laboratorio-quimico.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
};
const saved=node(history,'div');
function renderHistory(){
  saved.replaceChildren();
  const state=workspace.getState();
  const records=state.inkLabRecords??[];
  const stock=adjustmentForm.elements.stock;
  const selection=stock.value;
  stock.replaceChildren(new Option('Sin descuento de inventario',''));
  for(const item of (state.industrial?.stock??[])){
    if(item.category==='additive' && Number.isFinite(item.quantity) && ['g','kg'].includes(item.unit.trim().toLowerCase())) {
      stock.add(new Option(item.name+' · '+fmt(item.quantity)+' '+item.unit,item.id));
    }
  }
  if([...stock.options].some(option=>option.value===selection)) stock.value=selection;
  exportButton.disabled=!records.length;
  const adjustments=records.filter(item=>item.type==='Ajuste');
  node(saved,'p',records.length+' registros · '+adjustments.length+' ajustes efectuados');
  if(adjustments.length) node(saved,'p','Consumo capturado · '+fmt(adjustments.reduce((sum,item)=>sum+item.grams,0))+' g');
  for(const item of records){
    const entry=node(saved,'details');
    node(entry,'summary',[item.type,item.name??item.ink,new Date(item.at).toLocaleDateString('es-MX')].join(' · '));
    const body=node(entry,'pre',JSON.stringify(Object.fromEntries(Object.entries(item).filter(([key])=>key!=='id')),null,2));
    body.style.whiteSpace='pre-wrap';
    body.style.overflowWrap='anywhere';
    if(item.type==='Fórmula'){
      const reuse=node(entry,'button','Reabrir en el recetario');
      reuse.type='button';
      reuse.onclick=()=>{
        rec.open=true;
        for(const control of recipeForm.elements) {
          if (control.name && Object.hasOwn(item,control.name)) control.value=item[control.name];
        }
        recipeForm.nextElementSibling.replaceChildren();
        recipeForm.elements.name.focus();
      };
    }
    if(item.type==='Ficha'){
      const reference=node(entry,'button','Usar referencia en dosificación');
      reference.type='button';
      reference.onclick=()=>{
        tray.open=true;
        doseForm.elements.product.value=item.name;
        doseForm.elements.source.value=item.source;
        doseForm.nextElementSibling.replaceChildren();
        doseForm.elements.ink.focus();
      };
    }
    if(item.stock){
      node(entry,'p','Este ajuste descontó inventario. Se conserva su registro para la trazabilidad.');
      continue;
    }
    const remove=node(entry,'button','Eliminar registro');
    remove.type='button';
    remove.onclick=async()=>{
      if(saving || !window.confirm('¿Eliminar este registro privado?')) return;
      const state=workspace.getState();
      const prior=state.inkLabRecords;
      const revision=epoch;
      saving=true;
      state.inkLabRecords=prior.filter(record=>record.id!==item.id);
      try{
        if(await workspace.save()===false) throw new Error();
        if(revision===epoch) renderHistory();
      }catch{
        if(revision===epoch){
          state.inkLabRecords=prior;
          node(entry,'p','No se confirmó la eliminación.');
        }
      }finally{
        if(revision===epoch) saving=false;
      }
    };
  }
}
window.addEventListener('nexo-state',()=>{
  epoch++;saving=false;
  for(const form of lab.querySelectorAll('form')){
    form.reset();form.nextElementSibling.replaceChildren();
  }
  status.textContent='';
  renderHistory();
});
window.addEventListener('lifts-page',event=>{if(event.detail?.page==='inkLab')renderHistory();});
