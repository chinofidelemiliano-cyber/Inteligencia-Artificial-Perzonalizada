const {test}=require('node:test');
const assert=require('node:assert/strict');
const {compare}=require('../web/weighted-decisions.js');
test('decision results respond to weights, preserve inputs and detect ties',()=>{
  const choices='A | 8 | 5\nB | 6 | 9';
  const result=compare('Costo | 3\nTiempo | 2',choices);
  assert.deepEqual(result.best,['B']);
  assert.deepEqual(result.options.map(option=>option.result),[7.2,6.8]);
  assert.deepEqual(compare('Costo | 3\nTiempo | 0',choices).best,['A']);
  assert.deepEqual(compare('Costo | 2\nTiempo | 1',choices).best,['A','B']);
});
test('decision matrix rejects ambiguous names and invalid scales',()=>{
  assert.throws(()=>compare('Costo | 0','A | 8\nB | 6'),/positivo/);
  assert.throws(()=>compare('Costo | 2','A | 11\nB | 6'),/máximo/);
  assert.throws(()=>compare('Costo | 2','Opción | 8\nOpcion | 6'),/distintos/);
  assert.throws(()=>compare('Costo | 2\nCalidad | 1','A | 8\nB | 6'),/por criterio/);
});
