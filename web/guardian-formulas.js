'use strict';
(function(root){
  const field=(label,example,min=0,max=Infinity,integer=false)=>({label,example,min,max,integer});
  const exact=(label,value)=>field(label,value,-Infinity);
  const definitions={
    percent:{name:'Porcentaje de una cantidad',use:'Calcula una fracción expresada en base 100.',formula:'N × p ÷ 100',fields:[exact('Cantidad N',250),exact('Porcentaje p (%)',12)],run:(n,p)=>n*p/100},
    direct:{name:'Regla de tres directa',use:'Aplica si Y/X se mantiene constante. Usa la misma unidad para X₁ y X₂.',formula:'Y₁ × X₂ ÷ X₁',fields:[field('X₁',4,Number.MIN_VALUE),field('Y₁',30),field('X₂',10)],run:(a,b,c)=>b*c/a},
    inverse:{name:'Regla de tres inversa',use:'Aplica cuando el producto X × Y es constante.',formula:'X₁ × Y₁ ÷ X₂',fields:[field('X₁',4),field('Y₁',30),field('X₂',10,Number.MIN_VALUE)],run:(a,b,c)=>a*b/c},
    discount:{name:'Descuentos sucesivos',use:'Cada descuento se aplica sobre el precio restante.',formula:'P × (1 − d₁/100) × (1 − d₂/100)',fields:[field('Precio inicial P',1000),field('Primer descuento d₁ (%)',20,0,100),field('Segundo descuento d₂ (%)',10,0,100)],run:(p,a,b)=>p*(1-a/100)*(1-b/100)},
    compound:{name:'Interés compuesto',use:'Tasa constante por periodo. El cálculo omite impuestos, comisiones y aportaciones.',formula:'P × (1 + r/100)ⁿ',fields:[field('Capital P',1000),field('Tasa por periodo r (%)',5,-100),field('Número de periodos n',3,0,1200,true)],run:(p,r,n)=>p*(1+r/100)**n},
    loan:{name:'Cuota fija de préstamo',use:'Pagos al final de cada periodo y tasa constante. Excluye comisiones y seguros.',formula:'P × i ÷ [1 − (1 + i)⁻ⁿ], con i = r/100. Si i = 0, P ÷ n.',fields:[field('Principal P',10000),field('Tasa por periodo r (%)',1,0,100),field('Número de pagos n',12,1,1200,true)],run:(p,r,n)=>r===0?p/n:p*(r/100)/-Math.expm1(-n*Math.log1p(r/100))},
    circle:{name:'Área de un círculo',use:'Área geométrica ideal a partir del radio.',formula:'π × r²',fields:[field('Radio r (mm)',10)],unit:'mm²',run:r=>Math.PI*r*r},
    linear:{name:'Interpolación lineal',use:'Estima entre dos mediciones. Requiere que x esté dentro del intervalo.',formula:'y₁ + (y₂ − y₁) × (x − x₁) ÷ (x₂ − x₁)',fields:[exact('x₁',0),exact('y₁',4),exact('x₂',10),exact('y₂',24),exact('x',6)],run:(a,b,c,d,x)=>{
      if(a===c||x<Math.min(a,c)||x>Math.max(a,c))throw new Error('Usa dos abscisas distintas y un punto dentro del intervalo.');
      return b+(d-b)*(x-a)/(c-a);
    }},
    labels:{name:'Separación longitudinal entre etiquetas',use:'Solo para repeticiones uniformes de una vuelta. Usa la longitud en el sentido de avance.',formula:'R ÷ n − L',fields:[field('Desarrollo R (mm)',330,Number.MIN_VALUE),field('Repeticiones por vuelta n',3,1,Infinity,true),field('Largo de etiqueta L (mm)',100,Number.MIN_VALUE)],unit:'mm',run:(r,n,l)=>{
      const gap=r/n-l;
      if(gap<0)throw new Error('Las etiquetas no caben en el desarrollo indicado.');
      return gap;
    }},
    bcm:{name:'Pérdida de volumen del anilox',use:'Compara volúmenes medidos en la misma unidad y bajo un método comparable.',formula:'100 × (V₀ − V₁) ÷ V₀',fields:[field('Volumen de referencia V₀ (BCM)',5,Number.MIN_VALUE),field('Volumen medido V₁ (BCM)',4)],unit:'%',run:(a,b)=>100*(a-b)/a},
    ohm:{name:'Ley de Ohm · Tensión',use:'Modelo de un elemento óhmico con resistencia conocida.',formula:'I × R',fields:[exact('Corriente I (A)',2),field('Resistencia R (Ω)',12)],unit:'V',run:(a,b)=>a*b},
    density:{name:'Densidad',use:'Masa por volumen de una misma muestra. Registra la temperatura cuando influya.',formula:'m ÷ V',fields:[field('Masa m (g)',250),field('Volumen V (mL)',200,Number.MIN_VALUE)],unit:'g/mL',run:(a,b)=>a/b}
  };
  function calculate(id,inputs){
    if(!Object.hasOwn(definitions,id))throw new Error('Selecciona una calculadora.');
    const definition=definitions[id];
    const values=definition.fields.map((item,index)=>{
      const raw=String(inputs[index]??'').trim();
      const value=Number(raw.replace(',','.'));
      if(!/^[+-]?\d{1,15}(?:[.,]\d{1,12})?$/.test(raw)||value<item.min||value>item.max||(item.integer&&!Number.isInteger(value))){
        throw new Error('Revisa '+item.label+'. Introduce un valor dentro del rango indicado.');
      }
      return value;
    });
    const result=definition.run(...values);
    if(!Number.isFinite(result))throw new Error('El resultado excede el intervalo numérico disponible.');
    return {values,result};
  }
  if(typeof module==='object'){module.exports={calculate};return;}
  const $=id=>document.getElementById(id),picker=$('formulaPick'),form=$('formulaInputs'),status=$('formulaResult');
  const number=new Intl.NumberFormat('es-MX',{maximumSignificantDigits:10,useGrouping:false});
  for(const [id,definition] of Object.entries(definitions)){
    const option=document.createElement('option');option.value=id;option.textContent=definition.name;picker.append(option);
  }
  function render(){
    const definition=definitions[picker.value];
    $('formulaUse').textContent=definition.use;
    $('formulaExpression').textContent=definition.formula;
    status.textContent='';form.replaceChildren();
    for(const [index,field] of definition.fields.entries()){
      const label=document.createElement('label'),input=document.createElement('input');
      const limits=[Number.isFinite(field.min)?'mínimo '+(field.min===Number.MIN_VALUE?'mayor que cero':field.min):'',Number.isFinite(field.max)?'máximo '+field.max:'',field.integer?'entero':''].filter(Boolean);
      label.htmlFor=input.id='formulaInput'+index;
      label.textContent=field.label+(limits.length?' · '+limits.join(', '):'');
      input.inputMode='decimal';input.value=String(field.example);input.required=true;input.maxLength=30;
      input.oninput=()=>{status.textContent='';};
      form.append(label,input);
    }
  }
  $('formulaForm').onsubmit=event=>{
    event.preventDefault();
    try{
      const definition=definitions[picker.value];
      const {values,result}=calculate(picker.value,[...form.querySelectorAll('input')].map(input=>input.value));
      status.textContent='Sustitución: '+definition.fields.map((field,index)=>field.label+' = '+number.format(values[index])).join(' · ')+
        '. Resultado: '+number.format(result)+(definition.unit?' '+definition.unit:'')+'.';
    }catch(error){status.textContent=error.message;}
  };
  picker.onchange=render;
  root.addEventListener('nexo-state',()=>{picker.selectedIndex=0;render();});
  render();
})(globalThis);
