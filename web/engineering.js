export const dimensions = [
  ['printed','Longitud impresa de la prueba',true],
  ['file','Longitud de la prueba en el archivo',true],
  ['target','Longitud impresa objetivo',true],
  ['diameter','Diámetro exterior real del cilindro desnudo'],
  ['repeat','Desarrollo efectivo impreso por vuelta'],
  ['plate','Espesor total de la placa'],
  ['tape','Espesor de la cinta'],
  ['shim','Espesor total de calzas'],
  ['effective','Distancia radial al plano neutro documentada'],
  ['die','Desarrollo efectivo del troquel por vuelta']
];
const positive=value=>Number.isFinite(value)&&value>0;
const optionalNumber=value=>value===''||value==null?null:Number(value);
export function distortion(input) {
  if(!['mm','in'].includes(input.unit))throw new Error('Selecciona milímetros o pulgadas.');
  const conversion=input.unit==='in'?25.4:1;
  const values={};
  for(const [key,label,required] of dimensions){
    const value=optionalNumber(input[key]);
    if((value!==null&&(!Number.isFinite(value)||value<0||(value===0 && key!=='shim'))) || (required&&!positive(value)))
      throw new Error('Revisa '+label.toLowerCase()+'.');
    values[key]=value===null?null:value*conversion;
  }
  const turns=optionalNumber(input.turns??'');
  if(turns!==null&&(!Number.isInteger(turns)||turns<1))throw new Error('Las vueltas deben ser un número entero positivo.');
  const {printed,file,target,diameter,repeat,plate,tape,shim,effective,die}=values;
  const ratio=printed/file;
  const factor=file/printed;
  const prepared=target*factor;
  const nominal=diameter===null?null:Math.PI*diameter;
  const plateBaseRadius=diameter!==null&&tape!==null&&shim!==null?diameter/2+tape+shim:null;
  const surfaceRadius=plateBaseRadius!==null&&plate!==null?plateBaseRadius+plate:null;
  const printRadius=repeat===null?null:repeat/(2*Math.PI);
  if(effective!==null&&plate!==null&&effective>plate)throw new Error('La distancia al plano neutro supera el espesor total de placa. Verifica ambos datos y la definición del fabricante.');
  if(effective!==null&&printRadius!==null&&effective>=printRadius)throw new Error('La distancia al plano neutro debe ser menor que el radio de impresión equivalente.');
  const neutralRadius=printRadius!==null&&effective!==null?printRadius-effective:null;
  const geometricFactor=neutralRadius===null?null:neutralRadius/printRadius;
  const difference=repeat!==null&&die!==null?repeat-die:null;
  const pitch=optionalNumber(input.pitch),teeth=optionalNumber(input.teeth);
  let gear=null;
  if(pitch!==null||teeth!==null){
    if(!positive(pitch)||!Number.isInteger(teeth)||teeth<1)throw new Error('Para el cálculo de engrane introduce el paso o módulo y el número entero de dientes.');
    const rule={
      circular:()=>teeth*pitch*conversion/Math.PI,
      module:()=>teeth*pitch,
      dp:()=>teeth*25.4/pitch
    }[input.gearMode];
    if(!rule)throw new Error('Selecciona el sistema del engrane.');
    const pitchDiameter=rule();
    gear={pitchDiameter,pitchCircumference:Math.PI*pitchDiameter,circularPitch:Math.PI*pitchDiameter/teeth};
  }
  const results={values,ratio,factor,prepared,distortion:(ratio-1)*100,reduction:(1-factor)*100,
    nominal,plateBaseRadius,surfaceRadius,printRadius,neutralRadius,geometricFactor,
    geometricPrepared:geometricFactor===null?null:target*geometricFactor,
    difference,drift:difference!==null&&turns!==null?difference*(turns-1):null,gear};
  const numeric=[...Object.values(values),...Object.values(results),...Object.values(gear||{})];
  if(numeric.some(value=>typeof value==='number'&&!Number.isFinite(value)))throw new Error('Los valores exceden el rango que puede calcularse.');
  return results;
}

export function cuttingModel(front,adhesive,liner,gap,edge) {
  if(!positive(front)||!positive(adhesive)||!positive(liner)||!positive(gap)||!positive(edge))
    throw new Error('Usa espesores y distancias positivas en micrómetros.');
  const face=front+adhesive,total=face+liner;
  const penetration=edge-gap;
  const status=penetration<face?'Corte insuficiente':penetration===face?'Corte al límite del frontal y adhesivo':
    penetration<total?'Penetración en el liner':'Corte total o excesivo';
  return {face,total,penetration,status};
}
