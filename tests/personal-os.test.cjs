const {test}=require('node:test');
const assert=require('node:assert/strict');
const {compile,definition,calculate,samples}=require('../web/personal-builder-core.js');
const {signals}=require('../web/personal-radar.js');
const {riskScore}=require('../web/nexus-journal.js');

test('restricted formulas honor precedence, laziness and safe failure',()=>{
  const names=new Set(['total']);
  assert.equal(compile('if(total>0, -2^2 + avg(2, 6), 1/0)',names)({total:8}),0);
  assert.equal(compile('2^3^2',names)({}),512);
  assert.equal(compile('sqrt(9)*2 + pct(1,4)',names)({}),31);
  assert.throws(()=>compile('constructor(1)',names),/no disponible/);
  assert.throws(()=>compile('total.constructor',names),/inesperado/);
  assert.throws(()=>compile('alert(123)',names),/no disponible/);
  assert.throws(()=>compile('1/0',names)({}),/indefinido/);
  assert.throws(()=>compile('if(1/0>3,4,5)',names)({}),/indefinido/);
  assert.throws(()=>compile('('.repeat(40)+'1'+')'.repeat(40),names),/niveles/);
});

test('builder validates selector, dates and filters formula fields by numeric type',()=>{
  const anilox=definition({...samples.anilox,limit:'10'});
  assert.equal(calculate(anilox,{nominal:'10',actual:'8'}).result,20);
  assert.equal(calculate(anilox,{nominal:'10',actual:'8'}).warning,true);
  assert.throws(()=>calculate(anilox,{nominal:'',actual:'8'}),/valor numérico/);
  const simple=definition({name:'Datos',fields:[{key:'fecha',label:'Fecha',type:'date'},{key:'lote',label:'Lote',type:'select',options:'A|B|A'}]});
  assert.deepEqual(simple.fields[1].options,['A','B']);
  assert.throws(()=>calculate(simple,{fecha:'2028-02-30',lote:'A'}),/Fecha/);
  assert.throws(()=>calculate(simple,{fecha:'2028-02-29',lote:'C'}),/opción/);
  assert.throws(()=>definition({...samples.inventory,formula:'articulo*2'}),/desconocido/);
});

test('radar and risk use only observed records and configured scales',()=>{
  assert.deepEqual(riskScore({scale:'5',likelihood:'2',impact:'3',detection:'4'}),{score:6,maximum:25,priorityNumber:24});
  assert.throws(()=>riskScore({scale:'5',likelihood:'0',impact:'3',detection:''}),/puntúa/);
  const state={tasks:[
    {id:'a',title:'Vencida',date:'2026-11-01'},
    {id:'b',title:'Hoy',date:'2026-11-24'},
    {id:'c',title:'Hecha',done:true,date:'2026-11-01'}
  ],nexusJournal:[{id:'r',kind:'risk',status:'open',title:'Riesgo',data:{reviewDate:'2026-12-08'}}],
  finance:{budgets:{'2026-11':100},entries:[{type:'expense',date:'2026-11-10',cents:125}]}};
  assert.deepEqual(signals(state,'2026-11-24').map(item=>item.id),['task:a:2026-11-01','budget:2026-11','record:r:2026-12-08']);
  assert.deepEqual(signals({},'2026-02-30'),[]);
  const devices={nexusJournal:[
    {id:'f',kind:'calibration',status:'active',title:'Densitómetro',data:{date:'2026-11-25'}},
    {id:'s',kind:'subscription',status:'cancelled',title:'Suscripción',data:{date:'2026-11-25'}}
  ]};
  assert.deepEqual(signals(devices,'2026-11-24').map(item=>item.title),['Densitómetro']);
});
