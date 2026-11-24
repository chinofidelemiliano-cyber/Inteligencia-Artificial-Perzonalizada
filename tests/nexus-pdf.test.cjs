const {test}=require('node:test');
const assert=require('node:assert/strict');

test('PDF page ranges preserve the specified order and reject invalid selections',async()=>{
  const {pageIndices,validateFiles,pdfLimits}=await import('../web/nexus-pdf-core.js');
  assert.deepEqual(pageIndices('5, 2-4,3,1',5),[4,1,2,3,0]);
  assert.throws(()=>pageIndices('5-3',10),/Revisa/);
  assert.throws(()=>pageIndices('0',10),/números/);
  assert.throws(()=>pageIndices('7',5),/5 páginas/);
  assert.throws(()=>pageIndices('1-301',400),/300 páginas/);
  assert.throws(()=>validateFiles([{size:pdfLimits.maxBytes},{size:1}],'merge'),/20 MiB/);
  assert.throws(()=>validateFiles([{size:42}],'merge'),/entre 2/);
});

test('PDF merge and extraction create parseable files, preserve order and drop page annotations',async()=>{
  const [{editPdf},{PDFDocument,PDFName}]=await Promise.all([
    import('../web/nexus-pdf-core.js'),import('../web/vendor/cantoo-pdf-lib-2.11.1.js')
  ]);
  const make=async widths=>{
    const pdf=await PDFDocument.create();
    for(const width of widths){
      const page=pdf.addPage([width,400]);
      const pdfArray=pdf.context.obj([]);
      page.node.set(PDFName.of('Annots'),pdfArray);
      page.node.set(PDFName.of('AA'),pdf.context.obj({}));
    }
    return pdf.save();
  };
  const a=await make([100,200]), b=await make([330]);
  const merged=await editPdf([b,a],'merge');
  assert.equal(merged.pages,3);
  const output=await PDFDocument.load(merged.bytes);
  assert.deepEqual(output.getPages().map(page=>page.getWidth()),[330,100,200]);
  for(const page of output.getPages()){
    assert.equal(page.node.has(PDFName.of('Annots')),false);
    assert.equal(page.node.has(PDFName.of('AA')),false);
  }
  const extracted=await editPdf([a],'extract','2,1');
  assert.deepEqual((await PDFDocument.load(extracted.bytes)).getPages().map(page=>page.getWidth()),[200,100]);
  await assert.rejects(editPdf([Buffer.from('malformed')],'extract','1'),/abrir el PDF 1/);
});
