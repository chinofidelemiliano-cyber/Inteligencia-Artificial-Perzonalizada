'use strict';
(function (root) {
  const types={text:'Texto',number:'Número',date:'Fecha',time:'Hora',money:'Moneda',percent:'Porcentaje',checkbox:'Casilla',select:'Selector'};
  const functions={
    sqrt:{args:1,run:Math.sqrt},abs:{args:1,run:Math.abs},
    sum:{run:(...a)=>a.reduce((s,x)=>s+x,0)},
    avg:{run:(...a)=>a.reduce((s,x)=>s+x,0)/a.length},
    min:{run:Math.min},max:{run:Math.max},
    pct:{args:2,run:(a,b)=>a/b*100},
    if:{args:3,run:(test,yes,no)=>test?yes:no}
  };
  const powers={'==':1,'!=':1,'<':1,'<=':1,'>':1,'>=':1,'+':2,'-':2,'*':3,'/':3,'^':5};
  const operations={
    '+':(a,b)=>a+b,'-':(a,b)=>a-b,'*':(a,b)=>a*b,'/':(a,b)=>a/b,'^':(a,b)=>a**b,
    '==':(a,b)=>+(a===b),'!=':(a,b)=>+(a!==b),'<':(a,b)=>+(a<b),
    '>':(a,b)=>+(a>b),'<=':(a,b)=>+(a<=b),'>=':(a,b)=>+(a>=b)
  };
  function finite(number){
    if(!Number.isFinite(number))throw new Error('Resultado indefinido o fuera de rango. Revisa los valores y las divisiones.');
    return number;
  }
  function compile(source, allowed) {
    if(typeof source!=='string'||source.length>300||!source.trim())throw new Error('Escribe una fórmula de hasta 300 caracteres.');
    const raw=source.match(/\s+|\d+(?:\.\d+)?|[a-z][a-z0-9_]*|<=|>=|==|!=|[()+*/^,<>-]|./gi);
    const tokens=raw.filter(token=>!/^\s+$/.test(token));
    let i=0;
    const take=expected=>{if(tokens[i++]!==expected)throw new Error('Falta «'+expected+'» en la fórmula.');};
    function expression(min,depth=0){
      if(depth>30)throw new Error('La fórmula tiene demasiados niveles.');
      const token=tokens[i++];
      if(token===undefined)throw new Error('Expresión incompleta.');
      let first;
      if(token==='-'||token==='+'){
        const value=expression(4,depth+1);
        first=vars=>finite(token==='-'?-value(vars):value(vars));
      }else if(token==='('){
        first=expression(0,depth+1);take(')');
      }else if(/^\d+(?:\.\d+)?$/.test(token)){
        first=()=>Number(token);
      }else if(/^[a-z][a-z0-9_]*$/i.test(token)){
        if(tokens[i]==='('){
          if(!Object.hasOwn(functions,token))throw new Error('Función no disponible: '+token+'.');
          const fn=functions[token],args=[];
          i++;
          if(tokens[i]!==')'){
            do{
              args.push(expression(0,depth+1));
              if(tokens[i]!==',')break;
              i++;
            }while(true);
          }
          take(')');
          if(!args.length||args.length>20||fn.args&&args.length!==fn.args)throw new Error('Número de argumentos incorrecto para '+token+'.');
          first=token==='if'?vars=>args[0](vars)?args[1](vars):args[2](vars):vars=>finite(fn.run(...args.map(arg=>arg(vars))));
        }else{
          if(!allowed.has(token))throw new Error('Campo numérico desconocido: '+token+'.');
          first=vars=>finite(vars[token]);
        }
      }else throw new Error('Expresión incompleta o carácter no permitido.');
      while(Object.hasOwn(powers,tokens[i])&&powers[tokens[i]]>=min){
        const op=tokens[i++],left=first,right=expression(powers[op]+(op==='^'?0:1),depth+1);
        first=vars=>finite(operations[op](left(vars),right(vars)));
      }
      return first;
    }
    const evaluate=expression(0);
    if(i!==tokens.length)throw new Error('Hay contenido inesperado al final de la fórmula.');
    return values=>finite(evaluate(values));
  }
  const clean=(value,max)=>typeof value==='string'?value.trim().slice(0,max):'';
  const numeric=field=>['number','money','percent','checkbox'].includes(field.type);
  const keyPattern=/^[a-z][a-z0-9_]{0,23}$/;
  function definition(raw){
    if(!raw||typeof raw!=='object'||typeof raw.formula==='string'&&raw.formula.length>300)throw new Error('La definición o fórmula supera los límites.');
    const name=clean(raw.name,80), formula=clean(raw.formula,300), unit=clean(raw.unit,30);
    const limit=clean(raw.limit,40);
    if(!name||!Array.isArray(raw.fields)||raw.fields.length<1||raw.fields.length>16)throw new Error('Escribe un nombre y configura de 1 a 16 campos.');
    const keys=new Set();
    const fields=raw.fields.map(field=>{
      if(!field||typeof field!=='object')throw new Error('Campo inválido.');
      const key=clean(field.key,24), label=clean(field.label,60), type=field.type;
      if(!keyPattern.test(key)||keys.has(key)||Object.hasOwn(functions,key)||['constructor','prototype'].includes(key)||!label||!Object.hasOwn(types,type)){
        throw new Error('Cada campo necesita un código distinto, en minúsculas, y una etiqueta.');
      }
      keys.add(key);
      const options=[...new Set(clean(field.options,300).split('|').map(value=>value.trim()).filter(Boolean))];
      if(type==='select'&&!options.length)throw new Error('Agrega opciones al selector '+label+'.');
      return {key,label,type,options:type==='select'?options:[]};
    });
    if(formula)compile(formula,new Set(fields.filter(numeric).map(field=>field.key)));
    if(limit&&(!formula||!/^[-+]?\d+(?:\.\d+)?$/.test(limit)||!Number.isFinite(Number(limit))))throw new Error('El límite requiere fórmula y un número válido con punto decimal.');
    return {name,fields,formula,unit,limit};
  }
  function calculate(tool, raw){
    const values=Object.create(null);
    for(const field of tool.fields){
      const input=raw[field.key];
      if(field.type==='checkbox'){values[field.key]=input==='on'||input===true?1:0;continue;}
      if(numeric(field)){
        if(!/^[-+]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(String(input??''))||!Number.isFinite(Number(input)))throw new Error('Escribe un valor numérico para '+field.label+'.');
        values[field.key]=Number(input);
      }else{
        const value=clean(input,240);
        if(field.type==='select'&&!field.options.includes(value))throw new Error('Selecciona una opción en '+field.label+'.');
        if(field.type==='date'&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value))throw new Error('Fecha inválida en '+field.label+'.');
        if(field.type==='time'&&!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value))throw new Error('Hora inválida en '+field.label+'.');
        values[field.key]=value;
      }
    }
    const result=tool.formula?compile(tool.formula,new Set(tool.fields.filter(numeric).map(field=>field.key)))(values):null;
    return {values,result,warning:result!==null&&tool.limit!==''&&result>Number(tool.limit)};
  }
  const samples={
    anilox:{name:'Pérdida de volumen de anilox',fields:[{key:'nominal',label:'Volumen nominal',type:'number'},{key:'actual',label:'Volumen medido',type:'number'}],formula:'pct(nominal-actual,nominal)',unit:'%',limit:''},
    yield:{name:'Rendimiento de producción',fields:[{key:'total',label:'Piezas totales',type:'number'},{key:'buenas',label:'Piezas conformes',type:'number'}],formula:'pct(buenas,total)',unit:'%',limit:''},
    inventory:{name:'Registro de materiales',fields:[{key:'articulo',label:'Artículo',type:'text'},{key:'cantidad',label:'Cantidad disponible',type:'number'},{key:'fecha',label:'Fecha de revisión',type:'date'}],formula:'',unit:'',limit:''}
  };
  const api={types,compile,definition,calculate,samples};
  if(typeof module==='object')module.exports=api;else root.liftsBuilderCore=api;
})(globalThis);
