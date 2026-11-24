import {excelLessons} from './excel-lessons.js';
import {calculateGrid} from './excel-lab.js';
import {parseCsv,reviewCsv,exportCsv} from './csv-review.js';

const $=id=>document.getElementById(id);
const api=window.liftsWorkspace;
const root=$('excelContent'),status=$('excelStatus');
let current='basics',active=false,lang='es',separator=';',decimal='.',grid,version=0;
function node(parent,tag,text) {
  const element=document.createElement(tag);
  if(text!==undefined)element.textContent=text;
  parent.append(element);return element;
}
function button(parent,text,action) {
  const element=node(parent,'button',text);element.type='button';element.className='secondary';
  element.onclick=action;return element;
}
function field(parent,label,select) {
  const wrapper=node(parent,'label',label);wrapper.append(select);return select;
}
function select(parent,label,values,current,update) {
  const input=field(parent,label,document.createElement('select'));
  for(const [value,text] of values)node(input,'option',text).value=value;
  input.value=current;
  input.onchange=()=>update(input.value);
}
function initialGrid(lesson) {
  return Array.from({length:5},(_,row)=>Array.from({length:4},(_,col)=>row===0?'':String(lesson.lab.data[row-1]?.[col]??'')));
}
function render() {
  active=true;root.replaceChildren();status.textContent='';
  const lesson=excelLessons[current];
  grid ||= initialGrid(lesson);
  node(root,'h3',lesson.title);
  node(root,'p',lesson.level+' · '+lesson.version).className='notice';
  for(const [heading,body] of [['Concepto',lesson.theory],['En planta',lesson.method],['Ejemplo resuelto',lesson.example]]){
    node(root,'h4',heading);node(root,'p',body);
  }
  const options=node(root,'div');options.className='field-grid';
  select(options,'Idioma de fórmulas',[['es','Español'],['en','Inglés']],lang,value=>{lang=value;render();});
  select(options,'Separador de argumentos',[[';','Punto y coma'],[',','Coma']],separator,value=>{
    separator=value;if(value===',')decimal='.';render();
  });
  if(separator===';')select(options,'Separador decimal',[['.','Punto'],[',','Coma']],decimal,value=>{decimal=value;render();});
  node(root,'h4','Fórmula de referencia');
  const [es,en,args]=lesson.formula;
  node(root,'code','='+ (lang==='es'?es:en)+'('+args.replaceAll('|',separator).replaceAll('SUMA(',lang==='es'?'SUMA(':'SUM(')+')');
  node(root,'p','Ubicación: '+lesson.cell);
  const progress=button(root,api.getState().excelProgress?.[current]?'Lección completada':'Marcar lección completada',async()=>{
    if(progress.disabled)return;
    progress.disabled=true;
    const state=api.getState(),old=state.excelProgress,key=current,epoch=version;
    state.excelProgress={...old,[key]:new Date().toISOString()};
    try{
      if(await api.save()===false)throw new Error();
      if(epoch===version){progress.textContent='Lección completada';status.textContent='Progreso de Excel guardado.';}
    }catch{
      if(state===api.getState())state.excelProgress=old;
      if(epoch===version)status.textContent='No se confirmó el progreso. Puedes reintentar.';
    }finally{progress.disabled=false;}
  });
  button(root,'Preparar consulta para Lifts',()=>{
    api.open('home');
    const field=$('question');
    field.value='Ayúdame con Excel. Tema: '+lesson.title+'. Uso funciones en '+(lang==='es'?'español':'inglés')+
      ', separador de argumentos '+separator+' y decimal '+decimal+
      '. Pregúntame mi versión si importa. Incluye fórmula, celda, argumentos, ejemplo y alternativa compatible. Mi duda: ';
    field.focus();
  });
  if(lesson.sheets)button(root,'Descargar plantilla XLSX',async event=>{
    const trigger=event.currentTarget,selected=current,epoch=version;
    trigger.disabled=true;status.textContent='Preparando el libro…';
    try {
      const {workbook}=await import('./xlsx.js');
      if(selected!==current||epoch!==version)return;
      const bytes=workbook(lesson.sheets());
      const url=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
      const link=document.createElement('a');link.href=url;link.download='lifts-'+current+'.xlsx';link.click();
      setTimeout(()=>URL.revokeObjectURL(url),30000);
      status.textContent='Libro generado.';
    }catch{if(selected===current&&epoch===version)status.textContent='No se pudo generar el libro. Reintenta.';}
    finally{trigger.disabled=false;}
  });
  renderPractice(lesson);
}
function renderPractice(lesson) {
  node(root,'h4','Laboratorio de práctica');
  node(root,'p','Escribe la fórmula del ejercicio en D2 y pulsa Calcular. Puedes editar las demás celdas. Se admiten +, −, × y ÷ escritos como +, -, * y /, además de SUMA, PROMEDIO, MIN, MAX, SUMAR.SI y CONTAR.SI y sus nombres en inglés.');
  node(root,'p','El evaluador usa igualdad exacta y rangos A1:D5. Los libros descargados usan funciones de Excel y solicitan el recálculo al abrirse.');
  const example=lesson.lab.target.replaceAll('SUMIF',lang==='es'?'SUMAR.SI':'SUMIF').replaceAll('SUM(',lang==='es'?'SUMA(':'SUM(').replaceAll(',',separator);
  node(root,'p','Ejercicio: reproduce el cálculo con estos datos. Resultado de referencia: '+lesson.lab.answer+'.');
  const hint=node(root,'details');
  node(hint,'summary','Ver fórmula sugerida');node(hint,'code',example);
  const wrap=node(root,'div');wrap.className='excel-grid-wrap';
  const table=node(wrap,'table');
  const head=node(node(table,'thead'),'tr');node(head,'th','Fila');
  for(const column of 'ABCD')node(head,'th',column).scope='col';
  const body=node(table,'tbody');
  grid.forEach((row,r)=>{
    const tr=node(body,'tr');node(tr,'th',String(r+1)).scope='row';
    row.forEach((value,c)=>{
      const cell=node(tr,'td');
      const input=node(cell,'input');input.type='text';input.maxLength=120;
      input.value=value;
      input.setAttribute('aria-label','Celda '+'ABCD'[c]+(r+1));
      input.oninput=()=>{grid[r][c]=input.value;summary.textContent='Pulsa Calcular para revisar el resultado actualizado.';};
    });
  });
  const summary=node(root,'p');summary.setAttribute('role','status');
  const chart=node(root,'div');
  if(current==='pareto')node(chart,'p','Calcula la hoja para ver el acumulado en orden descendente.');
  button(root,'Calcular hoja',()=>{
    const outcomes=calculateGrid(grid,{separator,decimal});
    const focus=outcomes[1][3];
    if(current==='pareto'){
      chart.replaceChildren();
      const pairs=outcomes.slice(1).map(row=>[row[0].value,row[1].value]).filter(([label,value])=>label&&typeof value==='number'&&value>=0).sort((a,b)=>b[1]-a[1]);
      const total=pairs.reduce((sum,[,value])=>sum+value,0);
      let accumulated=0;
      if(!total)node(chart,'p','Agrega pérdidas mayores a cero para graficar el Pareto.');
      for(const [label,value] of pairs){
        accumulated+=value;
        const percentage=accumulated/total*100;
        const row=node(chart,'label',label+' · '+value+' m · acumulado '+percentage.toFixed(1)+' %');
        const bar=node(row,'meter');bar.min=0;bar.max=100;bar.value=percentage;
      }
    }
    const issues=outcomes.flatMap((row,r)=>row.map((cell,c)=>cell.error?'ABCD'[c]+(r+1)+': '+cell.error:'').filter(Boolean));
    const value=typeof focus.value==='number'?focus.value.toLocaleString(lang==='es'?'es-MX':'en',{maximumFractionDigits:8}):focus.value;
    summary.textContent=(focus.error?'D2: '+focus.error:'Resultado D2: '+(value===''?'vacío':value)+'.')+
      (typeof focus.value==='number'&&Math.abs(focus.value-lesson.lab.answer)<1e-8?' Coincide con el ejercicio.':'')+
      (issues.length?' Revisa '+issues.join(' · '):'');
  });
}
function renderCsv() {
  root.replaceChildren();
  status.textContent='';
  node(root,'h3','Revisión local de un CSV');
  node(root,'p','Selecciona un CSV de hasta 2 MB con encabezado en la primera fila. El archivo se lee en este navegador. Los libros XLSX y sus fórmulas quedan fuera de esta revisión.').className='notice';
  const picker=field(root,'Archivo CSV',document.createElement('input'));
  picker.type='file';picker.accept='.csv,text/csv';
  let delimiter=',';
  const output=node(root,'div');output.setAttribute('aria-live','polite');
  select(root,'Separador del CSV',[[',','Coma'],[';','Punto y coma']],delimiter,value=>{delimiter=value;void analyze();});
  let scan=0;
  async function analyze() {
    const file=picker.files[0],request=++scan;
    const epoch=version;
    const separator=delimiter;
    output.replaceChildren();
    if(!file)return;
    if(file.size>2*1024*1024){node(output,'p','El archivo supera 2 MB.');return;}
    node(output,'p','Leyendo el archivo…');
    try{
      const text=await file.text();
      if(request!==scan||epoch!==version)return;
      const result=reviewCsv(parseCsv(text,separator));
      output.replaceChildren();
      node(output,'p',result.records.length+' registros · '+result.duplicates.length+
        ' duplicados exactos · '+result.empty+' celdas vacías · '+result.irregular+' registros con ancho distinto al encabezado.');
      node(output,'p','Encabezados: '+result.header.join(' · '));
      for(const entry of result.duplicates.slice(0,15)){
        node(output,'p','Registro '+entry.record+' coincide con el registro '+entry.original+'.');
      }
      if(result.duplicates.length){
        node(output,'p','La copia conserva el primer registro y exporta como texto las celdas que podrían ejecutarse como fórmulas.').className='notice';
        button(output,'Descargar copia sin duplicados',()=>{
          const url=URL.createObjectURL(new Blob([exportCsv([result.header,...result.unique],separator)],{type:'text/csv;charset=utf-8'}));
          const link=document.createElement('a');link.href=url;link.download='lifts-copia-sin-duplicados.csv';link.click();
          setTimeout(()=>URL.revokeObjectURL(url),30000);
        });
      }
    }catch(error){
      if(request===scan&&epoch===version){output.replaceChildren();node(output,'p',error.message);}
    }
  }
  picker.onchange=analyze;
}
const ids={basics:'excelBasics',inventory:'excelInventory',waste:'excelWaste',pareto:'excelPareto',csv:'excelCsv'};
function choose(key) {
  if(!Object.hasOwn(ids,key))return;
  version++;current=key;grid=null;
  if(key==='csv'){active=true;renderCsv();}else render();
  for(const [name,id] of Object.entries(ids))$(id).setAttribute('aria-pressed',String(name===key));
}
for(const [key,id] of Object.entries(ids))$(id).onclick=()=>choose(key);
function open(key){api.open('excel');if(!$('excel').hidden)choose(key);}
function reset(){version++;grid=null;active=false;root.replaceChildren();status.textContent='';}
window.addEventListener('nexo-state',reset);
window.addEventListener('lifts-page',event=>{if(event.detail?.page==='excel'&&!active)choose('basics');});
window.liftsExcel={open,reset};
