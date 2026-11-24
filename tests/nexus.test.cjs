const {test}=require('node:test');
const assert=require('node:assert/strict');
const {tools,location,recover,commands,context}=require('../web/nexus-core.js');

test('registry permits only known tools and safe arguments for restoration',()=>{
  assert.deepEqual(location('lesson','distorsion/compensacion'),{id:'lesson',key:'distorsion/compensacion'});
  assert.equal(location('lesson','../not-a-lesson'),null);
  assert.equal(location('constructor'),null);
  assert.equal(location('engineering-record','https://example.com'),null);
  assert.equal(recover({target:{id:'excel',key:'external'}}),null);
  assert.equal(recover({target:{id:'engineering',key:''}}).label,tools.engineering.label);
  assert.deepEqual(commands('pareto')[0].target,{id:'excel',key:'pareto'});
  assert.ok(commands('ingenieria').some(command=>command.target.id==='engineering'));
  assert.ok(!commands('').some(command=>command.target.id==='engineering-record'));
});

test('context keeps explicit editable fields with bounded plain text',()=>{
  const value=context({goal:' Impresión ',constraints:'a'.repeat(550),missing:42,privateMetadata:'never'});
  assert.equal(value.goal,'Impresión');
  assert.equal(value.constraints.length,500);
  assert.equal(value.missing,'');
  assert.equal(value.privateMetadata,undefined);
});
