const radians = degrees => degrees*Math.PI/180;
const hue = (a,b) => (Math.atan2(b,a)*180/Math.PI+360)%360;
const hypot = Math.hypot;
export function deltaE(first,second) {
  const [l1,a1,b1]=first,[l2,a2,b2]=second;
  const dL=l2-l1,dA=a2-a1,dB=b2-b1;
  const c1=hypot(a1,b1),c2=hypot(a2,b2),dC=c2-c1;
  const de76=hypot(dL,dA,dB);
  const de94=hypot(dL,dC/(1+0.045*c1),Math.sqrt(Math.max(0,dA*dA+dB*dB-dC*dC))/(1+0.015*c1));
  const cMean=(c1+c2)/2;
  const g=(1-Math.sqrt(cMean**7/(cMean**7+25**7)))/2;
  const ap1=(1+g)*a1,ap2=(1+g)*a2;
  const cp1=hypot(ap1,b1),cp2=hypot(ap2,b2),hp1=hue(ap1,b1),hp2=hue(ap2,b2);
  let dh=cp1*cp2===0?0:hp2-hp1;
  if(dh>180)dh-=360;
  if(dh<-180)dh+=360;
  const dHp=2*Math.sqrt(cp1*cp2)*Math.sin(radians(dh/2));
  const lMean=(l1+l2)/2,cpMean=(cp1+cp2)/2,hs=hp1+hp2;
  const hpMean=cp1*cp2===0?hs:Math.abs(hp1-hp2)<=180?hs/2:hs<360?(hs+360)/2:(hs-360)/2;
  const cos=n=>Math.cos(radians(n));
  const t=1-.17*cos(hpMean-30)+.24*cos(2*hpMean)+.32*cos(3*hpMean+6)-.20*cos(4*hpMean-63);
  const sl=1+.015*(lMean-50)**2/Math.sqrt(20+(lMean-50)**2);
  const sc=1+.045*cpMean,sh=1+.015*cpMean*t;
  const rt=-2*Math.sqrt(cpMean**7/(cpMean**7+25**7))*Math.sin(radians(60*Math.exp(-(((hpMean-275)/25)**2))));
  return {de76,de94,de00:Math.sqrt(Math.max(0,(dL/sl)**2+((cp2-cp1)/sc)**2+(dHp/sh)**2+rt*(cp2-cp1)/sc*dHp/sh))};
}
export function labDisplay([l,a,b]) {
  const y=(l+16)/116,x=y+a/500,z=y-b/200;
  const inverse=t=>t>6/29?t**3:3*(6/29)**2*(t-4/29);
  const X=.95047*inverse(x),Y=inverse(y),Z=1.08883*inverse(z);
  const linear=[3.2404542*X-1.5371385*Y-.4985314*Z,-.969266*X+1.8760108*Y+.041556*Z,.0556434*X-.2040259*Y+1.0572252*Z];
  const clipped=linear.some(value=>value<-.0001||value>1.0001);
  const rgb=linear.map(value=>Math.round(255*Math.min(1,Math.max(0,value<=.0031308?12.92*value:1.055*value**(1/2.4)-.055))));
  return {color:'rgb('+rgb.join(',')+')',clipped};
}

export const tools=[
 {id:'color',title:'Lab y diferencias de color',fields:[
  ['L* objetivo',50,0,100],['a* objetivo',20,-120,120],['b* objetivo',-10,-120,120],
  ['L* muestra',52,0,100],['a* muestra',18,-120,120],['b* muestra',-7,-120,120]
 ],evaluate:values=>{
  const a=values.slice(0,3),b=values.slice(3),result=deltaE(a,b),swatches=[labDisplay(a),labDisplay(b)];
  return {lines:['ΔE76 '+result.de76.toFixed(3),'ΔE94 artes gráficas '+result.de94.toFixed(3),'ΔE00 '+result.de00.toFixed(3),
   'Croma muestra '+hypot(b[1],b[2]).toFixed(2)+' · Tono '+hue(b[1],b[2]).toFixed(1)+'°'],
   swatches, note:'Simulación de pantalla sRGB con blanco D65. '+(swatches.some(value=>value.clipped)?'Hay colores recortados fuera de gama. ':'')+'No sustituye la muestra medida.'};
 }},
 {id:'tono',title:'Ganancia de punto y compensación',fields:[
  ['Tono nominal (%)',50,0,100],['Tono medido (%)',65,0,100],
  ['A nominal (%)',40,0,100],['A medido (%)',54,0,100],
  ['B nominal (%)',50,0,100],['B medido (%)',65,0,100],['Objetivo medido (%)',60,0,100]
 ],evaluate:([nominal,measured,a,ma,b,mb,target])=>({
  lines:['TVI = medido − nominal = '+(measured-nominal).toFixed(1)+' puntos porcentuales',
   b>a&&mb>ma&&target>=ma&&target<=mb?'Nominal interpolado para el objetivo: '+(a+(b-a)*(target-ma)/(mb-ma)).toFixed(2)+' %':'Usa dos puntos crecientes y un objetivo dentro del intervalo medido.'],
  bars:[nominal,measured],note:'Comparación didáctica. Conserva el método tonal y los datos por separación.'
 })},
 {id:'distorsion',title:'Distorsión de placa',fields:[['Longitud impresa de prueba (mm)',100.4,0.01,800],['Longitud del archivo de prueba (mm)',100,0.01,800],['Objetivo impreso (mm)',100,0.01,800]],
  evaluate:([printed,file,goal])=>({lines:['Factor medido '+(printed/file).toFixed(6),'Distorsión longitudinal '+((printed/file-1)*100).toFixed(3)+' %','Longitud de preparación '+(goal*file/printed).toFixed(3)+' mm'],note:'Compensación empírica de la condición medida. Valida con otra tirada.'})},
 {id:'registro',title:'Tensión, elongación y deriva',fields:[['Fuerza de banda (N)',20,0,800],['Ancho (mm)',250,.01,1500],['Espesor (µm)',50,.01,500],['Módulo elástico (MPa)',1000,1,15000],['Desarrollo inicial (mm)',300,1,1000],['Repeticiones',10,1,100]],
  evaluate:([force,width,thickness,modulus,repeat,count])=>{
   const stress=force/(width*thickness/1000),strain=stress/modulus,delta=repeat*strain;
   return {lines:['Esfuerzo '+stress.toFixed(3)+' MPa','Elongación relativa '+(strain*100).toFixed(3)+' %','Cambio de longitud '+delta.toFixed(3)+' mm/paso','Deriva lineal entre primera y última marca '+(delta*(Math.round(count)-1)).toFixed(3)+' mm'],note:'Modelo lineal ideal sin control compensador ni efectos térmicos. No indica una consigna de máquina.'};
  }}
];
export const diagrams={
 transferencia:['Depósito → dosificación → transferencia','Cámara o rodillo entintador','Anilox','Placa en relieve','Sustrato sobre cilindro'],
 placa:['Corte esquemático de la pila de montaje','Zona de imagen en relieve','Piso de la placa','Cinta compresible','Cilindro'],
 anilox:['Sección conceptual del anilox','Rasqueta de dosificación','Superficie cerámica','Celdas grabadas con tinta','Película transferida'],
 color:['Medición colorimétrica','Fuente de luz','Muestra y respaldo','Reflectancia por longitud de onda','XYZ → Lab'],
 registro:['Banda y control','Desbobinado','Arrastre y medición de tensión','Estaciones de registro','Rebobinado'],
 tramas:['Separación rasterizada','Separación por tinta','Ángulo y frecuencia de trama','Punto mínimo de placa','Parches impresos'],
 defectos:['Orden de diagnóstico','Identificar patrón','Medir posición y paso','Aislar estación','Validar con testigo']
};
export function drawDefect(canvas,mode) {
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  const {width,height}=canvas;
  if(mode==='moire'){drawMoire(canvas,8,0);return;}
  ctx.clearRect(0,0,width,height);
  ctx.fillStyle='#fff';
  ctx.fillRect(0,0,width,height);
  for(let panel=0;panel<2;panel++){
    ctx.save();
    const half=width/2;
    ctx.beginPath();ctx.rect(panel*half+2,2,half-4,height-4);ctx.clip();
    ctx.translate(panel*half,0);
    if(mode==='pinholes'){
      ctx.fillStyle='#095499';ctx.fillRect(0,0,half,height);
      if(panel){
        ctx.fillStyle='#fff';
        for(let mark=1;mark<18;mark++){
          ctx.beginPath();ctx.arc((mark*47)%half,(mark*77)%height,1.5+(mark%3)*.5,0,2*Math.PI);ctx.fill();
        }
      }
      ctx.restore();continue;
    }
    for(let row=0;row<10;row++)for(let column=0;column<13;column++){
      const x=7+column*(half-14)/12,y=8+row*(height-16)/9;
      if(panel&&mode==='perdida'&&(row+column)%4===0)continue;
      ctx.fillStyle='#095499';
      ctx.beginPath();
      ctx.arc(x,y,panel&&mode==='ganancia'?4.7:2.5,0,2*Math.PI);ctx.fill();
      if(panel&&mode==='registro'){
        ctx.fillStyle='#e01d25';ctx.beginPath();ctx.arc(x+5,y+2,2.5,0,2*Math.PI);ctx.fill();
      }
    }
    if(panel&&mode==='raya'){ctx.fillStyle='#152334';ctx.fillRect(half*.37,0,3,height);}
    if(panel&&mode==='bandas'){ctx.fillStyle='#09549970';for(let y=15;y<height;y+=26)ctx.fillRect(0,y,half,7);}
    ctx.restore();
  }
}

export function drawMoire(canvas,angle,difference) {
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  const {width,height}=canvas;
  const half=width/2;
  ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
  for(let panel=0;panel<2;panel++){
    ctx.save();
    ctx.beginPath();ctx.rect(panel*half+1,1,half-2,height-2);ctx.clip();
    ctx.translate((panel+.5)*half,height/2);
    const screen=(rotation,spacing,color)=>{
      ctx.save();ctx.rotate(radians(rotation));ctx.fillStyle=color;
      for(let x=-width;x<=width;x+=spacing)for(let y=-height*2;y<=height*2;y+=spacing){
        ctx.beginPath();ctx.arc(x,y,spacing*.33,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
    };
    screen(0,10,'#095499b0');
    if(panel)screen(angle,10*(1+difference/100),'#e01d258a');
    ctx.restore();
  }
}

export function drawSpectrum(canvas,peak,width,offset) {
  const ctx=canvas.getContext('2d');
  if(!ctx)return [];
  const {width:w,height:h}=canvas;
  const left=45,right=w-20,top=15,bottom=h-28;
  const reflectance=(nm,center)=>Math.min(.94,.08+.76*Math.exp(-(((nm-center)/width)**2)));
  const x=nm=>left+(nm-400)/300*(right-left);
  const y=value=>bottom-value*(bottom-top);
  ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
  ctx.font='12px system-ui';ctx.fillStyle='#24384a';ctx.strokeStyle='#b8c5d0';
  ctx.beginPath();ctx.moveTo(left,top);ctx.lineTo(left,bottom);ctx.lineTo(right,bottom);ctx.stroke();
  for(const level of [0,.25,.5,.75,1])ctx.fillText(Math.round(level*100)+' %',3,y(level)+4);
  for(const nm of [400,450,500,550,600,650,700])ctx.fillText(String(nm),x(nm)-12,h-7);
  for(const [center,color] of [[peak,'#095499'],[peak+offset,'#b81722']]){
    ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.beginPath();
    for(let nm=400;nm<=700;nm+=2){
      const coordinates=[x(nm),y(reflectance(nm,center))];
      if(nm===400)ctx.moveTo(...coordinates);else ctx.lineTo(...coordinates);
    }
    ctx.stroke();
  }
  return [450,550,650].map(nm=>({
    nm,reference:Math.round(reflectance(nm,peak)*100),sample:Math.round(reflectance(nm,peak+offset)*100)
  }));
}

export function drawSection(canvas,mode) {
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  const {width,height}=canvas;
  ctx.fillStyle='#f0f5f8';ctx.fillRect(0,0,width,height);
  const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  const label=(text,x,y)=>{ctx.fillStyle='#152638';ctx.font='bold 15px system-ui';ctx.fillText(text,x,y);};
  if(mode==='placa'){
    rect(25,143,width-50,40,'#8196a9');
    rect(25,116,width-50,27,'#edb85f');
    rect(25,89,width-50,27,'#89c2e9');
    for(const x of [72,212,352])rect(x,58,74,31,'#89c2e9');
    label('Relieve de imagen',30,43);
    label('Piso de la placa',30,108);
    label('Cinta',30,135);
    label('Cilindro',30,171);
  }else{
    rect(25,82,width-50,96,'#a6b6c3');
    for(const x of [65,160,255,350,445]){
      ctx.beginPath();ctx.moveTo(x,82);ctx.lineTo(x+16,134);ctx.lineTo(x+46,134);ctx.lineTo(x+62,82);
      ctx.closePath();ctx.fillStyle='#095499';ctx.fill();
    }
    ctx.beginPath();ctx.moveTo(340,33);ctx.lineTo(415,78);ctx.strokeStyle='#e01d25';ctx.lineWidth=5;ctx.stroke();
    label('Rasqueta',420,54);label('Celdas con tinta',40,64);label('Recubrimiento',30,159);
  }
}
