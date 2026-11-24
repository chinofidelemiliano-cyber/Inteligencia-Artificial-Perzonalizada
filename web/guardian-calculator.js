'use strict';
(function(root){
  const groups=[
    {name:'Longitud',units:{mm:0.001,cm:0.01,m:1,km:1000,in:0.0254,ft:0.3048}},
    {name:'Masa',units:{mg:0.000001,g:0.001,kg:1,lb:0.45359237}},
    {name:'Duración',units:{s:1,min:60,h:3600}},
    {name:'Presión',units:{Pa:1,kPa:1000,MPa:1000000,bar:100000}}
  ];
  const groupFor=unit=>groups.find(group=>Object.hasOwn(group.units,unit));
  function convert(value,from,to){
    const text=String(value).trim(),group=groupFor(from);
    if(!/^[+-]?\d{1,15}(?:[.,]\d{1,12})?$/.test(text))throw new Error('Escribe una cantidad decimal válida.');
    if(!group||!Object.hasOwn(group.units,to))throw new Error('Elige unidades de la misma magnitud.');
    const quantity=Number(text.replace(',','.'));
    return {quantity,fromFactor:group.units[from],toFactor:group.units[to],result:quantity*group.units[from]/group.units[to]};
  }
  if(typeof module==='object'){module.exports={convert};return;}
  const $=id=>document.getElementById(id),from=$('hubFrom'),to=$('hubTo'),value=$('hubValue'),status=$('hubResult');
  const format=new Intl.NumberFormat('es-MX',{maximumSignificantDigits:12});
  function option(parent,unit){
    const item=document.createElement('option');item.value=unit;item.textContent=unit;parent.append(item);
  }
  for(const group of groups){
    const label=document.createElement('optgroup');label.label=group.name;from.append(label);
    Object.keys(group.units).forEach(unit=>option(label,unit));
  }
  function load(){
    to.replaceChildren();
    Object.keys(groupFor(from.value).units).forEach(unit=>option(to,unit));
    status.textContent='';
  }
  from.onchange=load;
  to.onchange=value.oninput=()=>{status.textContent='';};
  $('hubConvert').onsubmit=event=>{
    event.preventDefault();
    try{
      const {quantity,fromFactor,toFactor,result}=convert(value.value,from.value,to.value);
      status.textContent='Resultado = cantidad × factor de origen ÷ factor de destino. '+
        format.format(quantity)+' × '+format.format(fromFactor)+' ÷ '+format.format(toFactor)+' = '+format.format(result)+' '+to.value+'.';
    }catch(error){status.textContent=error.message;}
  };
  root.liftsGuardianCalculator={
    supports:unit=>Boolean(groupFor(unit)),
    open(text,unit){
      root.liftsWorkspace.open('calculatorHub');from.value=unit;value.value=text;load();to.focus();
    }
  };
  root.addEventListener('nexo-state',()=>{$('hubConvert').reset();load();});
  load();
})(globalThis);
