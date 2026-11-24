const {test}=require('node:test');
const assert=require('node:assert/strict');

test('every study goal references real lessons and prerequisites are ordered without duplication',async()=>{
  const [{courses},{goals,routeTo}]=await Promise.all([import('../web/academy-curriculum.js'),import('../web/academy-paths.js')]);
  const valid=new Set(courses.flatMap(course=>course.lessons.map(lesson=>course.id+'/'+lesson.id)));
  for(const lesson of valid)assert.equal(routeTo(lesson,valid).at(-1),lesson);
  for(const {target} of Object.values(goals)){
    const route=routeTo(target,valid);
    assert.equal(route.at(-1),target);
    assert.equal(new Set(route).size,route.length);
  }
  assert.deepEqual(routeTo(goals.control.target,valid),['fundamentos/flujo','fundamentos/control']);
  const route=routeTo(goals.fingerprint.target,valid);
  assert.ok(route.indexOf('preprensa/fingerprint-plan')<route.indexOf('preprensa/fingerprint-data'));
  assert.ok(route.includes('color/instrumentos'));
  assert.throws(()=>routeTo('desconocida',valid),/referencia/);
});

test('recall intervals expand and a difficult review restarts the sequence',async()=>{
  const {schedule,todayKey}=await import('../web/academy-paths.js');
  const first=schedule(null,'remembered','2028-02-27');
  assert.deepEqual(first,{due:'2028-03-01',step:1,last:'2028-02-27',rating:'remembered'});
  assert.throws(()=>schedule(first,'again','2028-02-28'),/programado/);
  const second=schedule(first,'remembered','2028-03-01');
  assert.equal(second.due,'2028-03-08');
  assert.deepEqual(schedule(second,'again','2028-03-08'),{due:'2028-03-09',step:0,last:'2028-03-08',rating:'again'});
  assert.throws(()=>schedule(null,'again','2028-04-31'),/Fecha inválida|Fecha de repaso inválida/);
  assert.equal(todayKey(new Date(2028,2,1,23)), '2028-03-01');
});
