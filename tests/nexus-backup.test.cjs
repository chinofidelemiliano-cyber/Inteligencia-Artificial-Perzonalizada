'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseBackup,planRestore,maxBytes}=require('../web/nexus-backup.js');
const journal=require('../web/nexus-journal.js');
const id=(n)=>'0b3f28fa-eb1a-4906-896a-'+String(n).padStart(12,'0');
const when='2026-11-24T10:00:00.000Z';

test('legacy export JSON previews allowlisted additions without replacing records or importing settings',()=>{
  const records=[
    {id:id(1),title:'En la copia'},
    {id:id(2),title:'En espera',date:'2026-12-01',startAt:when,reminderAt:when,reminderRepeat:'daily'},
    {id:id(3),title:'Aviso',kind:'reminder',reminderAt:when},
    {id:id(4),title:'Fecha imposible',date:'2026-02-30'},
    {id:id(2),title:'Duplicada'},
    {id:'bad',title:'ID inventado'}
  ];
  const current={tasks:[{id:id(1).toUpperCase(),title:'Actual'}],googleClientId:'actual'};
  const parsed=parseBackup(JSON.stringify({tasks:records,googleClientId:'no',appearance:'no',assistant:{name:'no'}}),journal);
  const preview=planRestore(current,parsed);
  assert.equal(parsed.ignored,3);
  assert.deepEqual(preview.summary.tasks,{added:1,duplicate:2,invalid:3,limit:0});
  assert.deepEqual(preview.patch.tasks.map(row=>row.title),['Actual','En espera']);
  assert.equal(preview.patch.tasks[1].reminderAt,'');
  assert.equal(preview.patch.tasks[1].startAt,'');
  assert.equal(preview.patch.tasks[1].date,'2026-12-01');
  assert.equal(current.tasks.length,1);
  assert.equal(Object.hasOwn(preview.patch,'googleClientId'),false);
  assert.equal(planRestore({...current,...preview.patch},parsed).total,0);
});

test('journal validation preserves valid versions while transcript restores as plain local text',()=>{
  const parsed=parseBackup('\ufeff'+JSON.stringify({
    savedConversations:[{id:id(1),title:'Historial',savedAt:when,messages:[
      {role:'user',text:'<script>texto capturado</script>'},
      {role:'assistant',text:'Anotación',source:'ai',citations:[{url:'https://example.test'}]}
    ]}],
    nexusJournal:[
      {id:id(2),kind:'note',title:'Nota',createdAt:when,updatedAt:when,data:{content:'Mi nota',foreign:'ignorar'},
        history:[{id:id(3),at:when,title:'Antes',data:{content:'otra versión'}}]},
      {id:id(4),kind:'mission',title:'Misión falsa',createdAt:when,updatedAt:when,status:'done',data:{}},
      {id:id(5),kind:'note',title:'Nota falsa',createdAt:when,updatedAt:when,status:{toString:true},data:{}}
    ],
    inbox:[{id:id(6),title:'Idea privada',createdAt:when,processed:false}],
    privateMemories:[{id:id(7),title:'Recuerdo',text:'Descripción',source:'ai'}]
  }),journal);
  assert.deepEqual(parsed.collections.savedConversations[0].messages,[
    {role:'user',text:'<script>texto capturado</script>',source:'local'},
    {role:'assistant',text:'Anotación',source:'local'}
  ]);
  assert.equal(parsed.collections.nexusJournal[0].history[0].data.content,'otra versión');
  assert.deepEqual(parsed.collections.nexusJournal[0].data,{content:'Mi nota'});
  assert.equal(parsed.invalid.nexusJournal,2);
  assert.deepEqual(parsed.collections.privateMemories[0],{id:id(7),title:'Recuerdo',text:'Descripción'});
  assert.equal(planRestore({},parsed).total,4);
});

test('preview rejects foreign, oversized and malformed backup files',()=>{
  assert.throws(()=>parseBackup('[]'),/colecciones compatibles/);
  assert.throws(()=>parseBackup('{"__proto__":{"inbox":[]}}'),/colecciones compatibles/);
  assert.throws(()=>parseBackup('{"tasks":{}}'),/debe ser una lista/);
  assert.throws(()=>parseBackup('{invalido'),/JSON válido/);
  assert.throws(()=>parseBackup('x'.repeat(maxBytes+1)),/hasta 2 MiB/);
});

test('legacy memory entries count towards the quota and stay untouched',()=>{
  const current={privateMemories:[{title:'Recuerdo anterior a los IDs'},...Array.from({length:198},(_,index)=>({id:id(index+10),title:'Actual',text:'texto'}))]};
  const next=[{id:id(1),title:'Añadir',text:'texto'},{id:id(1).toUpperCase(),title:'Repetido',text:'texto'},
    {id:id(2),title:'Supera el límite',text:'texto'}];
  const preview=planRestore(current,parseBackup(JSON.stringify({privateMemories:next})));
  assert.deepEqual(preview.summary.privateMemories,{added:1,duplicate:1,invalid:0,limit:1});
  assert.equal(preview.patch.privateMemories.length,200);
  assert.strictEqual(preview.patch.privateMemories[0],current.privateMemories[0]);
  assert.equal(preview.patch.privateMemories.at(-1).id,id(1));
});
