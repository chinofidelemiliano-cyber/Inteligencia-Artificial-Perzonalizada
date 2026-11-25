const {test}=require('node:test');
const assert=require('node:assert/strict');

test('Academy evidence supplies the recorded level and belongs to the selected route',async()=>{
  const {criteria,validateEvidence,levelFromEvidence}=await import('../web/academy-competencies.js');
  const {goals}=await import('../web/academy-paths.js');
  assert.deepEqual(Object.keys(criteria),Object.keys(goals));
  assert.equal(levelFromEvidence(),0);
  const route=['anilox/celdas','anilox/medicion'];
  const input={description:'   Medí el volumen y comparé dos resultados observados.   ',type:'practica',level:2,lesson:'anilox/celdas'};
  assert.throws(()=>validateEvidence({...input,lesson:'color/percepcion'},route),/lección de esta ruta/);
  assert.throws(()=>validateEvidence({...input,description:'  breve  '},route),/10 y 1500/);
  assert.throws(()=>validateEvidence({...input,level:4},route),/nivel/);
  const saved=validateEvidence(input,route);
  assert.equal(saved.description,'Medí el volumen y comparé dos resultados observados.');
  assert.equal(levelFromEvidence([saved,{...saved,level:1},{...saved,level:4}]),2);
});

test('competency evidence can be filtered by role while preserving legacy records',async()=>{
  const {evidenceForRole,validateEvidence,levelFromEvidence}=await import('../web/academy-competencies.js');
  const legacy={description:'Una descripción suficiente',lesson:'',type:'practica',level:3};
  const role=validateEvidence({...legacy,level:2,role:'calidad'},[]);
  assert.equal(levelFromEvidence(evidenceForRole([legacy,role],'calidad')),2);
  assert.equal(levelFromEvidence(evidenceForRole([legacy,role])),3);
  assert.throws(()=>validateEvidence({...legacy,role:'constructor'},[]),/rol/);
});
