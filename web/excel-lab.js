const functionNames={SUM:'SUM',SUMA:'SUM',AVERAGE:'AVERAGE',PROMEDIO:'AVERAGE',MIN:'MIN',MAX:'MAX',
  SUMIF:'SUMIF','SUMAR.SI':'SUMIF',COUNTIF:'COUNTIF','CONTAR.SI':'COUNTIF'};
const reference=/^\$?([A-D])\$?([1-5])$/i;
function scalar(value) {
  if(Array.isArray(value))throw new Error('Usa una función para calcular con un rango.');
  if(value===''||value==null)return 0;
  if(typeof value!=='number')throw new Error('La operación necesita números.');
  return value;
}
export function calculateGrid(grid,{separator=';',decimal='.'}={}) {
  const cache=new Map(),visiting=new Set();
  function resolve(row,col){
    const key=row+':'+col;
    if(cache.has(key))return cache.get(key);
    if(visiting.has(key))throw new Error('Referencia circular.');
    visiting.add(key);
    try{
      const raw=String(grid[row]?.[col]??'').trim();
      const value=raw.startsWith('=')?evaluate(raw.slice(1)):
        new RegExp('^-?\\d+(?:'+(decimal===','?',':'\\.')+'\\d+)?$').test(raw)?Number(raw.replace(',','.')):raw;
      if(typeof value==='number'&&!Number.isFinite(value))throw new Error('Resultado fuera de rango.');
      cache.set(key,value);return value;
    }finally{visiting.delete(key);}
  }
  function locate(text){
    const match=reference.exec(text);
    if(!match)throw new Error('La referencia debe estar entre A1 y D5.');
    return [Number(match[2])-1,match[1].toUpperCase().charCodeAt(0)-65];
  }
  function evaluate(expression){
    let cursor=0;
    const skip=()=>{while(/\s/.test(expression[cursor]||''))cursor++;};
    function consume(symbol){
      skip();if(expression[cursor]!==symbol)return false;cursor++;return true;
    }
    function expressionValue(){
      let left=product();
      while(true){
        if(consume('+'))left=scalar(left)+scalar(product());
        else if(consume('-'))left=scalar(left)-scalar(product());
        else return left;
      }
    }
    function product(){
      let left=primary();
      while(true){
        if(consume('*'))left=scalar(left)*scalar(primary());
        else if(consume('/')){
          const right=scalar(primary());
          if(right===0)throw new Error('División entre cero.');
          left=scalar(left)/right;
        }else return left;
      }
    }
    function primary(){
      if(consume('-'))return -scalar(primary());
      if(consume('(')){
        const value=expressionValue();
        if(!consume(')'))throw new Error('Falta cerrar un paréntesis.');
        return value;
      }
      skip();
      const remaining=expression.slice(cursor);
      const text=remaining.match(/^"((?:[^"]|"")*)"/);
      if(text){cursor+=text[0].length;return text[1].replace(/""/g,'"');}
      const number=remaining.match(decimal===','?/^\d+(?:,\d+)?/:/^\d+(?:\.\d+)?/);
      if(number){cursor+=number[0].length;return Number(number[0].replace(',','.'));}
      const token=remaining.match(/^[$A-ZÁÉÍÓÚÑ][$A-ZÁÉÍÓÚÑ0-9.]*/i)?.[0];
      if(!token)throw new Error('Revisa la fórmula y el separador regional.');
      cursor+=token.length;
      if(consume('(')){
        const name=functionNames[token.toUpperCase()];
        if(!name)throw new Error('Esta función no está disponible en el laboratorio.');
        const args=[];
        if(!consume(')')){
          do{args.push(expressionValue());}while(consume(separator));
          if(!consume(')'))throw new Error('Falta cerrar la función o el separador no coincide.');
        }
        return run(name,args);
      }
      const first=locate(token);
      if(!consume(':'))return resolve(...first);
      skip();
      const next=expression.slice(cursor).match(/^\$?[A-D]\$?[1-5](?=$|[^0-9])/i)?.[0];
      if(!next)throw new Error('Revisa la celda final del rango.');
      cursor+=next.length;
      const last=locate(next),values=[];
      for(let r=Math.min(first[0],last[0]);r<=Math.max(first[0],last[0]);r++){
        for(let c=Math.min(first[1],last[1]);c<=Math.max(first[1],last[1]);c++)values.push(resolve(r,c));
      }
      return values;
    }
    const value=expressionValue();
    skip();
    if(cursor!==expression.length)throw new Error('Revisa la sintaxis al final de la fórmula.');
    if(Array.isArray(value))throw new Error('Usa una función para calcular con un rango.');
    return value;
  }
  function run(name,args){
    if(name==='SUMIF'||name==='COUNTIF'){
      const [criteria,value,sum]=args;
      if(args.length!==(name==='SUMIF'?3:2)||!Array.isArray(criteria)||Array.isArray(value)||
        (name==='SUMIF'&&(!Array.isArray(sum)||sum.length!==criteria.length)))throw new Error('Usa rangos de la misma longitud y un criterio individual.');
      if(typeof value==='string'&&/[~*?]|^[<>=]/.test(value))throw new Error('El laboratorio solo admite criterios de igualdad exacta.');
      return criteria.reduce((total,item,index)=>{
        const equal=typeof item==='string'&&typeof value==='string'?item.toLowerCase()===value.toLowerCase():item===value;
        return total+(equal?(name==='COUNTIF'?1:typeof sum[index]==='number'?sum[index]:0):0);
      },0);
    }
    const numeric=args.flat().filter(value=>typeof value==='number');
    if(name==='SUM')return numeric.reduce((sum,value)=>sum+value,0);
    if(!numeric.length){if(name==='MIN'||name==='MAX')return 0;throw new Error('El rango no contiene números.');}
    if(name==='MIN')return Math.min(...numeric);
    if(name==='MAX')return Math.max(...numeric);
    return numeric.reduce((sum,value)=>sum+value,0)/numeric.length;
  }
  return grid.map((row,r)=>row.map((_,c)=>{
    try{return {value:resolve(r,c)};}catch(error){return {error:error.message};}
  }));
}
