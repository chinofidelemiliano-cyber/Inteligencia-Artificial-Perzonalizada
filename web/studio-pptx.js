let library;
function load(){
  if(window.PptxGenJS)return Promise.resolve(window.PptxGenJS);
  if(!library)library=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src='/vendor/pptxgenjs-4.0.1.bundle.js';
    script.onload=()=>window.PptxGenJS?resolve(window.PptxGenJS):reject(new Error('El generador no se pudo iniciar.'));
    script.onerror=()=>{script.remove();reject(new Error('No se pudo cargar el generador de PowerPoint.'));};
    document.head.append(script);
  }).catch(error=>{library=null;throw error;});
  return library;
}
const excerpt=text=>{
  const first=text.match(/^.+?(?:[.!?](?=\s|$)|$)/)?.[0]||text;
  if(first.length<=190)return first;
  return first.slice(0,187).replace(/\s+\S*$/,'')+'…';
};
export async function exportCoursePresentation(course,lessons,{minutes,audience,diagrams,references}){
  const PptxGenJS=await load();
  const deck=new PptxGenJS();
  deck.layout='LAYOUT_WIDE';
  deck.author='Academia Lifts';
  deck.title=course.title;
  function slide(title,subtitle){
    const s=deck.addSlide();
    s.background={color:'081421'};
    s.addShape(deck.ShapeType.rect,{x:0,y:0,w:13.34,h:.13,line:{color:'20D9F5'},fill:{color:'20D9F5'}});
    s.addText('LIFTS · ACADEMIA',{x:.6,y:.28,w:9,h:.38,fontSize:14,bold:true,color:'90D8EA'});
    s.addText(title,{x:.6,y:.85,w:12.05,h:1.1,fontSize:29,bold:true,color:'EDF5FF',fit:'shrink',margin:0});
    s.addText(subtitle,{x:.65,y:2.03,w:12,h:.45,fontSize:15,color:'A9BFD2'});
    return s;
  }
  const cover=slide(course.title,'Capacitación · '+audience+' · '+minutes+' min sugeridos');
  cover.addText(course.overview?.objectives || course.summary,{x:.7,y:2.7,w:9.4,h:2.1,fontSize:25,color:'EDF5FF',fit:'shrink'});
  cover.addImage({path:'/assets/icon-192.png',x:10.55,y:2.75,w:1.65,h:1.65});
  cover.addNotes('Objetivo de esta capacitación: '+(course.overview?.objectives||course.summary)+
    '\nTiempo total sugerido: '+minutes+' min. Curso seleccionado: '+lessons.map(item=>item.title).join(', '));
  for(const lesson of lessons){
    const s=slide(lesson.title,lesson.module);
    const excerpts=[excerpt(lesson.theory),excerpt(lesson.practice),excerpt(lesson.exercise)];
    for(const [i,text] of excerpts.entries()){
      s.addText(text,{x:.7,y:2.72+i*.86,w:11.8,h:.72,fontSize:17,color:'EDF5FF',fit:'shrink',margin:0});
    }
    const steps=diagrams[lesson.diagram].slice(1);
    s.addShape(deck.ShapeType.rect,{x:.65,y:5.48,w:12,h:1.08,line:{color:'3279B6'},fill:{color:'103349'}});
    s.addText(steps.join('  →  '),{x:.85,y:5.63,w:11.55,h:.65,color:'EDF5FF',fontSize:13,align:'center',fit:'shrink'});
    s.addNotes('Fundamentos\n'+lesson.theory+'\n\nAplicación y diagnóstico\n'+lesson.practice+
      '\n\nActividad: presenta el ejercicio y pide justificar las unidades antes de revisar la solución.\n'+lesson.exercise);
  }
  const end=slide('Validación y referencias','Discusión de cierre');
  end.addText('Explica qué medirías para distinguir una hipótesis de una causa confirmada.',{x:.7,y:2.75,w:11.8,h:1,fontSize:23,color:'EDF5FF'});
  end.addNotes(course.sources.map(key=>references[key].join(' · ')).join('\n'));
  end.addText(course.sources.map(key=>references[key][0]).join('\n'),{x:.7,y:4,w:11.8,h:2,fontSize:16,color:'EDF5FF'});
  await deck.writeFile({fileName:'lifts-capacitacion-'+course.id+'.pptx'});
}
