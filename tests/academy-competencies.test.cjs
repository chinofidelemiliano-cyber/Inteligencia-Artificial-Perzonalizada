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
