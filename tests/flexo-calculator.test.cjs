const {test} = require('node:test');
const assert = require('node:assert/strict');
const core = import('../web/flexo-calculator.js');

test('returns flexographic dimensions, material and gear calculations with known inputs', async () => {
  const {calculateFlexo} = await core;
  const values = (key, ...fields) => calculateFlexo(key, fields).map(row => row.value);
  assert.deepEqual(values('metres', '1500,5'), [1.5005]);
  assert.deepEqual(values('cylinder', 100), [100 * Math.PI]);
  assert.deepEqual(values('diameter', 100 * Math.PI), [100]);
  assert.deepEqual(values('length', 500, 250), [125]);
  assert.deepEqual(values('run', 50, 3), [150]);
  assert.deepEqual(values('labels', 10001, 4, 100, 5), [2501, 255.1]);
  assert.deepEqual(values('speed', 200, 250), [50]);
  assert.deepEqual(values('teeth', 250, 2.5), [100]);
  assert.deepEqual(values('teeth', 249, 2.5), [99.6, 100]);
  assert.deepEqual(values('module', 100, 2), [50]);
  assert.deepEqual(values('dp', 50.8, 20), [40]);
  assert.deepEqual(values('gear', 100, 2.5), [250, 250 / Math.PI]);
  assert.deepEqual(values('drift', 100.25, 100, 9), [2.25]);
  assert.deepEqual(values('area', 100, 250, 20), [25, 5]);
});

test('compensates using the existing press trial model and rejects invalid data', async () => {
  const {calculateFlexo} = await core;
  const [prepared, factor, reduction] = calculateFlexo('distortion', [250, 252, 300]);
  assert.ok(Math.abs(prepared.value - 300 * 250 / 252) < 1e-9);
  assert.equal(factor.value, 250 / 252);
  assert.ok(Math.abs(reduction.value - 0.79365079365) < 1e-9);
  assert.throws(() => calculateFlexo('labels', [100, 2.5, 100, 0]), /entero/);
  assert.throws(() => calculateFlexo('cylinder', [0]), /mayor/);
  assert.throws(() => calculateFlexo('area', [100, 200, 101]), /100/);
  assert.throws(() => calculateFlexo('gear', [100]), /todos/);
  assert.throws(() => calculateFlexo('run', ['12abc', 3]), /Revisa/);
});
