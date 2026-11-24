const {test}=require('node:test');
const assert=require('node:assert/strict');

test('engineering distinguishes measured repeat, modeled radios and pitch geometry',async()=>{
  const {distortion,cuttingModel}=await import('../web/engineering.js');
  const sample={unit:'mm',printed:'100.4',file:'100',target:'100',diameter:'100',repeat:'320',
    plate:'1.14',tape:'.38',shim:'0',effective:'.35',die:'319.9',turns:'10',teeth:'64',pitch:'32',gearMode:'dp'};
  const result=distortion(sample);
  assert.ok(Math.abs(result.prepared-99.6015936255)<1e-9);
  assert.equal(result.plateBaseRadius,50.38);
  assert.ok(Math.abs(result.gear.pitchDiameter-50.8)<1e-9);
  assert.ok(Math.abs(result.drift-.9)<1e-9);
  assert.ok(result.nominal!==result.values.repeat);
  assert.ok(Math.abs(distortion({unit:'in',printed:4,file:4,target:5}).prepared-127)<1e-9);
  assert.equal(distortion({unit:'mm',printed:4,file:4,target:5}).geometricFactor,null);
  assert.throws(()=>distortion({...sample,effective:1.15}),/plano neutro/);
  assert.throws(()=>distortion({...sample,teeth:2.5}),/entero/);
  assert.throws(()=>distortion({...sample,file:0}),/archivo/);
  assert.match(cuttingModel(60,20,45,50,129).status,/insuficiente/i);
  assert.match(cuttingModel(60,20,45,50,130).status,/límite/i);
  assert.match(cuttingModel(60,20,45,50,140).status,/liner/i);
  assert.match(cuttingModel(60,20,45,50,175).status,/excesivo/i);
});

test('Excel lab handles local formulas, equality, invalid references and cyclic dependencies',async()=>{
  const {calculateGrid}=await import('../web/excel-lab.js');
  const cells=Array.from({length:5},()=>Array(4).fill(''));
  cells[1]=['AZ', '3,5', '=SUMAR.SI(A2:A4;"AZ";B2:B4)', '=B2*2+B3'];
  cells[2]=['AM','10','=C4','=$B$2/0'];
  cells[3]=['az','1,5','=C3','=BUSCARX(A2;A2:A4;B2:B4)'];
  const results=calculateGrid(cells,{separator:';',decimal:','});
  assert.equal(results[1][2].value,5);
  assert.equal(results[1][3].value,17);
  assert.match(results[2][2].error,/circular/i);
  assert.match(results[2][3].error,/cero/);
  assert.match(results[3][3].error,/no está disponible/);
});

test('XLSX includes actual worksheets, formulas, related ranges, and data validation',async()=>{
  const {workbook}=await import('../web/xlsx.js');
  const {excelLessons}=await import('../web/excel-lessons.js');
  function extract(data){
    const result={};
    const buffer=Buffer.from(data);
    for(let start=0;buffer.readUInt32LE(start)===0x04034b50;){
      const namelen=buffer.readUInt16LE(start+26),size=buffer.readUInt32LE(start+18),body=start+30+namelen;
      result[buffer.toString('utf8',start+30,body)]=buffer.toString('utf8',body,body+size);
      start=body+size;
    }
    return result;
  }
  const inventory=extract(workbook(excelLessons.inventory.sheets()));
  assert.match(inventory['xl/workbook.xml'],/Inventario.*Movimientos.*Instrucciones/);
  assert.match(inventory['xl/worksheets/sheet1.xml'],/SUMIF\(Movimientos!/);
  assert.match(inventory['xl/worksheets/sheet2.xml'],/sqref="E2:E1000"/);
  assert.match(inventory['xl/worksheets/sheet2.xml'],/ref="A1:F1000"/);
  const waste=extract(workbook(excelLessons.waste.sheets()));
  assert.match(waste['xl/worksheets/sheet2.xml'],/IF\(B2=0,0,B3\/B2\)/);
  assert.match(waste['xl/worksheets/sheet2.xml'],/r="B4" s="2"/);
  const pareto=extract(workbook(excelLessons.pareto.sheets()));
  assert.match(pareto['xl/worksheets/sheet1.xml'],/SUM\(B\$2:B3\)/);
});

test('CSV analyzes duplicates without flattening quoted fields or exporting active formulas',async()=>{
  const {parseCsv,reviewCsv,exportCsv}=await import('../web/csv-review.js');
  const rows=parseCsv('\uFEFFCódigo;Nota\r\nA1;"primera; ""uno""\nsegunda"\r\nA1;"primera; ""uno""\nsegunda"\r\nB1;=2+2\r\nC1;-12,50',';');
  const review=reviewCsv(rows);
  assert.equal(review.duplicates.length,1);
  assert.equal(review.records[0][1],'primera; "uno"\nsegunda');
  const copy=exportCsv([review.header,...review.unique],';');
  assert.match(copy,/"'=2\+2"/);
  assert.match(copy,/"-12,50"/);
  assert.throws(()=>parseCsv('x,y\n"abc,def',','),/cerrar/);
});
