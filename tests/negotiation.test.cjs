const {test}=require('node:test');
const assert=require('node:assert/strict');
const {play,scenarios,criteria}=require('../web/negotiation.js');

test('each negotiation exercise has distinct branches and terminates with a concrete debrief',()=>{
  assert.equal(Object.keys(scenarios).length,5);
  for(const id of Object.keys(scenarios)){
    const initial=play(id);
    const starts=Object.keys(initial.step.options);
    const left=play(id,[starts[0]]);
    const right=play(id,[starts[1]]);
    assert.notEqual(left.step.prompt,right.step.prompt);
    for(const start of starts){
      const middle=play(id,[start]);
      for(const follow of Object.keys(middle.step.options)){
        const closure=play(id,[start,follow]);
        for(const end of Object.keys(closure.step.options)){
          const path=[start,follow,end];
          const result=play(id,path);
          assert.equal(result.finished,true);
          assert.equal(result.step,null);
          assert.equal(result.turns.length,3);
          assert.deepEqual(Object.keys(result.marks),Object.keys(criteria));
          for(const turn of result.turns)assert.ok(turn.reaction&&turn.feedback);
          for(const score of Object.values(result.marks))assert.ok(score>=0&&score<=3);
          assert.throws(()=>play(id,[...path,end]),/diálogo actual/);
        }
      }
    }
  }
});

test('selecting a weaker opening creates a repair step and a distinguishable outcome',()=>{
  const strong=play('proposal',['learn','plan','recap']);
  const repaired=play('proposal',['promise','repair','recap']);
  assert.match(repaired.turns[1].prompt,/Ya avisé/);
  assert.equal(strong.marks.arguments,3);
  assert.equal(repaired.marks.arguments,2);
  assert.throws(()=>play('proposal',['learn','repair']),/diálogo actual/);
  assert.throws(()=>play('__proto__'),/caso de práctica/);
});
