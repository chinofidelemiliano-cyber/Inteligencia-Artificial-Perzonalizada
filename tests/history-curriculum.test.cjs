const {test}=require('node:test');
const assert=require('node:assert/strict');
test('the history curriculum spans six courses with readable lessons and sources',async()=>{
  const {eras,timeline}=await import('../web/history-curriculum.js');
  assert.equal(eras.length,6);
  assert.equal(timeline.length,29);
  assert.equal(new Set(timeline.map(item=>item.id)).size,timeline.length);
  assert.equal(timeline[0].id,'big-bang');
  assert.equal(timeline.at(-1).id,'presente');
  for(const era of eras){
    assert.ok(era.sources.length>=2);
    for(const [label,url] of era.sources)assert.ok(label&&new URL(url).protocol==='https:');
    for(const lesson of era.lessons)assert.ok(lesson.length===7&&lesson.every(text=>text.trim()));
  }
});
