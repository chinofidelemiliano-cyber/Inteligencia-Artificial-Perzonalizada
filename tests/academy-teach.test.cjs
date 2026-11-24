const {test}=require('node:test');
const assert=require('node:assert/strict');

test('Teach drafts are based on the selected curriculum and the schedule uses the full duration',async()=>{
  const {trainingAgenda,lessonPlan,validatePlan,trainingSections}=await import('../web/academy-teach.js');
  const {courses,references}=await import('../web/academy-curriculum.js');
  const course=courses.find(item=>item.id==='distorsion');
  const lesson=course.lessons.find(item=>item.id==='compensacion');
  const original=lessonPlan(lesson);
  assert.match(original.title,/Compensar con una prueba medida/);
  for(const minutes of [20,45,91,180]){
    const totals=trainingAgenda(minutes);
    assert.equal(totals.length,4);
    assert.equal(totals.reduce((total,part)=>total+part[1],0),minutes);
    assert.ok(totals.every(part=>Number.isInteger(part[1])&&part[1]>0));
  }
  assert.throws(()=>validatePlan({...original,minutes:'91.5'}),/20 y 180/);
  assert.throws(()=>validatePlan({...original,audience:'technical'}),/público/);
  assert.throws(()=>validatePlan({...original,assessment:'  '}),/Comprobación de aprendizaje/);
  const plan=validatePlan({...original,title:'  Sesión de muestra  ',minutes:'65',audience:'quality',notes:'Usar ejemplos aprobados',privateNote:'Debe excluirse'});
  assert.equal(plan.title,'Sesión de muestra');
  assert.equal(plan.minutes,65);
  const sections=trainingSections(plan,lesson,course.sources.map(key=>references[key]));
  assert.ok(sections.some(section=>section.body===lesson.exercise));
  assert.ok(sections.some(section=>section.body==='Usar ejemplos aprobados'));
  assert.doesNotMatch(JSON.stringify(sections),/Debe excluirse/);
});
