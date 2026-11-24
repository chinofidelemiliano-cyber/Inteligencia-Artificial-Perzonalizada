const {test}=require('node:test');
const assert=require('node:assert/strict');

test('academy spans the seven levels with complete, uniquely identified lessons and attributed sources',async()=>{
  const {courses,levels,references,defects}=await import('../web/academy-curriculum.js');
  assert.equal(courses.length,15);
  assert.equal(levels.length,7);
  assert.equal(new Set(courses.map(course=>course.level)).size,7);
  assert.equal(defects.length,19);
  const keys=courses.flatMap(course=>course.lessons.map(lesson=>course.id+'/'+lesson.id));
  assert.equal(keys.length,new Set(keys).size);
  for(const course of courses){
    assert.ok(course.lessons.length>=2);
    for(const key of course.sources)assert.equal(new URL(references[key][1]).protocol,'https:');
    for(const lesson of course.lessons){
      assert.ok(lesson.theory.length>160 && lesson.practice.length>140 && lesson.exercise.length>75);
    }
  }
});

test('color and mechanical calculations reproduce published and analytical cases',async()=>{
  const {deltaE,tools,labDisplay}=await import('../web/academy-tools.js');
  for(const [first,second,target] of [
    [[50,2.6772,-79.7751],[50,0,-82.7485],2.0425],
    [[50,3.1571,-77.2803],[50,0,-82.7485],2.8615],
    [[50,0,0],[50,-1,2],2.3669]
  ]){
    assert.ok(Math.abs(deltaE(first,second).de00-target)<0.0001);
    assert.ok(Math.abs(deltaE(second,first).de00-target)<0.0001);
  }
  assert.equal(deltaE([50,20,-10],[50,20,-10]).de76,0);
  assert.equal(labDisplay([0,0,0]).color,'rgb(0,0,0)');
  assert.match(tools.find(tool=>tool.id==='distorsion').evaluate([100.4,100,100]).lines[2],/99.602 mm/);
  assert.match(tools.find(tool=>tool.id==='registro').evaluate([20,250,50,1000,300,10]).lines[3],/4.320 mm/);
});
