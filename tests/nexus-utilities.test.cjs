'use strict';

const assert=require('node:assert/strict');
const {test}=require('node:test');
const tools=require('../web/nexus-utilities-core.js');

test('compares inserted and deleted lines while preserving content and line positions',()=>{
  assert.deepEqual(tools.compareText('Inicio\r\nRetirar\r\nFinal','Inicio\nNuevo\nFinal\nAgregado'),{
    changes:[
      {kind:'removed',line:2,text:'Retirar'},
      {kind:'added',line:2,text:'Nuevo'},
      {kind:'added',line:4,text:'Agregado'}
    ],removed:1,added:2,unchanged:2
  });
  assert.deepEqual(tools.compareText('A\nA\nB','A\nB'),{
    changes:[{kind:'removed',line:2,text:'A'}],removed:1,added:0,unchanged:2
  });
  assert.equal(tools.compareText('A','A\n').changes[0].text,'');
  assert.equal(tools.compareText('','').changes.length,0);
  assert.throws(()=>tools.compareText('a\n'.repeat(301),''),/300 líneas/);
  assert.throws(()=>tools.compareText('a'.repeat(16001),''),/16000 caracteres/);
});

test('uses signed calendar-day arithmetic across leap days and historical year boundaries',()=>{
  assert.equal(tools.daysBetween('2024-02-28','2024-03-01'),2);
  assert.equal(tools.daysBetween('2024-03-01','2024-02-28'),-2);
  assert.equal(tools.daysBetween('2025-01-01','2025-01-01'),0);
  assert.equal(tools.addDays('0099-12-31',1),'0100-01-01');
  assert.equal(tools.addDays('2024-03-01',-1),'2024-02-29');
  assert.throws(()=>tools.addDays('1900-02-29',1),/fecha válida/);
  assert.throws(()=>tools.addDays('0001-01-01',-1),/intervalo/);
  assert.throws(()=>tools.addDays('9999-12-31',1),/intervalo/);
  assert.throws(()=>tools.addDays('2024-02-01',1.5),/entero/);
});

test('converts signed integers exactly across supported bases',()=>{
  assert.equal(tools.convertBase('-FF',16,2),'-11111111');
  assert.equal(tools.convertBase('000',8,16),'0');
  const original='9'.repeat(50);
  assert.equal(tools.convertBase(tools.convertBase(original,10,16),16,10),original);
  assert.throws(()=>tools.convertBase('12',2,16),/dígito 2/);
  assert.throws(()=>tools.convertBase('12',12,16),/bases compatibles/);
  assert.throws(()=>tools.convertBase('0xff',16,10),/dígitos/);
});

test('round-trips UTF-8, accepts pasted line breaks and rejects invalid or noncanonical Base64',()=>{
  const source='\ufeffMañana: 🧵 y café\n';
  const value=tools.encodeText(source);
  assert.equal(value,Buffer.from(source,'utf8').toString('base64'));
  assert.equal(tools.decodeText(value.slice(0,8)+'\r\n'+value.slice(8)),source);
  assert.equal(tools.decodeText(tools.encodeText('')),'');
  assert.throws(()=>tools.decodeText('____'),/Base64 estándar/);
  assert.throws(()=>tools.decodeText('Zh=='),/relleno inválidos/);
  assert.throws(()=>tools.decodeText('/w=='),/UTF-8 válido/);
});
