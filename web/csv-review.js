export function parseCsv(text,separator) {
  if(![',',';'].includes(separator))throw new Error('Selecciona coma o punto y coma.');
  text=text.replace(/^\uFEFF/,'');
  const rows=[];
  let row=[],cell='',inQuote=false,justClosed=false;
  const endCell=()=>{row.push(cell);cell='';justClosed=false;};
  const endRow=()=>{endCell();rows.push(row);row=[];};
  for(let i=0;i<text.length;i++){
    const char=text[i];
    if(inQuote){
      if(char==='"'){
        if(text[i+1]==='"'){cell+='"';i++;}
        else{inQuote=false;justClosed=true;}
      }else cell+=char;
      continue;
    }
    if(char===separator)endCell();
    else if(char==='\n'||char==='\r'){
      if(char==='\r'&&text[i+1]==='\n')i++;
      endRow();
    }else if(justClosed)throw new Error('Se encontró texto después de cerrar una celda entre comillas.');
    else if(char==='"'){
      if(cell)throw new Error('Hay una comilla dentro de una celda sin delimitar.');
      inQuote=true;
    }else cell+=char;
    if(row.length>500||rows.length>50000)throw new Error('El archivo supera el tamaño de cuadrícula de esta revisión.');
  }
  if(inQuote)throw new Error('Falta cerrar una celda entre comillas.');
  if(row.length||cell||justClosed)endRow();
  if(!rows.length)throw new Error('El archivo está vacío.');
  return rows;
}
export function reviewCsv(rows){
  const [header,...records]=rows;
  const positions=new Map(),duplicates=[],unique=[];
  let empty=0,irregular=0;
  for(const [index,row] of records.entries()){
    if(row.length!==header.length)irregular++;
    for(const cell of row)if(!cell.trim())empty++;
    const key=JSON.stringify(row);
    if(positions.has(key))duplicates.push({record:index+1,original:positions.get(key)});
    else{positions.set(key,index+1);unique.push(row);}
  }
  return {header,records,unique,duplicates,empty,irregular};
}
export function exportCsv(rows,separator){
  return '\uFEFF'+rows.map(row=>row.map(value=>{
    let safe=String(value);
    // Keep untrusted formulas as text when opened in a spreadsheet.
    if(/^[\t\r\n\s]*[=+\-@]/.test(safe)&&!/^[-+]?\d+(?:[.,]\d+)?$/.test(safe))safe="'"+safe;
    return '"'+safe.replaceAll('"','""')+'"';
  }).join(separator)).join('\r\n')+'\r\n';
}
