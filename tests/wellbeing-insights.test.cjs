const {test}=require('node:test');
const assert=require('node:assert/strict');
const {summarize,bmi,sleep}=require('../web/wellbeing-insights.js');
test('wellbeing trends respect date boundaries and missing values',()=>{
  const data=[
    {day:'2026-11-18',sleepHours:3},{day:'2026-11-19',sleepHours:6,energy:8},
    {day:'2026-11-25',sleepHours:8,stress:0,energy:6},
    {day:'2026-11-26',sleepHours:12}
  ];
  assert.deepEqual(summarize(data,'2026-11-25',7).map(({count,mean})=>[count,mean]),[[2,7],[2,7],[1,0]]);
  assert.deepEqual(summarize([], '2026-02-30',7),[]);
});
test('adult BMI and overnight clock intervals validate their inputs',()=>{
  assert.equal(bmi(81,180),25);
  assert.throws(()=>bmi(81,0),/estatura/);
  assert.deepEqual(sleep('23:15','06:45',true),{hours:7,minutes:30});
  assert.deepEqual(sleep('13:15','14:45',false),{hours:1,minutes:30});
  assert.throws(()=>sleep('23:15','06:45',false),/orden/);
});
