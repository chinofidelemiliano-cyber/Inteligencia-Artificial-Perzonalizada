const assert=require('node:assert/strict');
const {test}=require('node:test');

test('markup converts selections through a rotated and offset PDF viewport',async()=>{
  const {visualToPdf}=await import('../web/nexus-pdf-markup-core.js');
  const viewport={width:200,height:400,convertToPdfPoint:(x,y)=>[y+10,x+25]};
  assert.deepEqual(visualToPdf({left:.25,top:.125,width:.5,height:.25},viewport),{x:60,y:75,width:100,height:100});
  assert.throws(()=>visualToPdf({left:.75,top:.125,width:.5,height:.25},viewport),/dentro/);
  assert.throws(()=>visualToPdf({left:0,top:0,width:0,height:1},viewport),/positivos/);
});

test('markup preserves page order, crop and rotation and rejects out-of-bounds marks',async()=>{
  const {highlightPdf,checkMarkupFile}=await import('../web/nexus-pdf-markup-core.js');
  const {PDFDocument,PDFName,PDFString,degrees}=await import('../web/vendor/cantoo-pdf-lib-2.11.1.js');
  const document=await PDFDocument.create();
  const page=document.addPage([200,400]);page.setCropBox(10,20,150,300);page.setRotation(degrees(90));
  document.addPage([300,200]);
  const action=document.context.obj({S:PDFName.of('JavaScript'),JS:PDFString.of('app.alert("fixture");')});
  document.catalog.set(PDFName.of('OpenAction'),action);
  page.node.set(PDFName.of('AA'),document.context.obj({O:action}));
  page.node.set(PDFName.of('Annots'),document.context.obj([{Subtype:'Link',Rect:[10,20,35,45],A:action}]));
  const bytes=await document.save();
  const mark={page:0,x:30,y:80,width:25,height:40};
  const output=await PDFDocument.load(await highlightPdf(bytes,[mark]));
  assert.equal(output.getPageCount(),2);
  assert.deepEqual(output.getPage(0).getCropBox(),{x:10,y:20,width:150,height:300});
  assert.equal(output.getPage(0).getRotation().angle,90);
  assert.equal(output.catalog.has(PDFName.of('OpenAction')),false);
  assert.equal(output.getPage(0).node.has(PDFName.of('AA')),false);
  assert.equal(output.getPage(0).node.Annots()?.size()||0,0);
  assert.deepEqual(output.getPage(1).getSize(),{width:300,height:200});
  await assert.rejects(highlightPdf(bytes,[{...mark,x:5}]),/región visible/);
  await assert.rejects(highlightPdf(bytes,[{...mark,page:2}]),/dentro/);
  await assert.rejects(highlightPdf(bytes,[]),/Añade/);
  assert.throws(()=>checkMarkupFile(21*1024*1024),/20 MiB/);
});
