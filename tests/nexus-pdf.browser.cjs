'use strict';

const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {createServer}=require('node:http');
const {readFile}=require('node:fs/promises');
const path=require('node:path');

test('PDF tools lazily edit and download local PDFs on Chromium mobile',async()=>{
  const {PDFDocument}=await import('../web/vendor/cantoo-pdf-lib-2.11.1.js');
  const makePdf=async(name,widths)=>{
    const document=await PDFDocument.create();
    for(const width of widths)document.addPage([width,400]);
    return {name,mimeType:'application/pdf',buffer:Buffer.from(await document.save())};
  };
  const files=await Promise.all([makePdf('A.pdf',[100,200]),makePdf('B.pdf',[330])]);
  const server=createServer(async(req,res)=>{
    const file=new URL(req.url,'http://localhost').pathname;
    try{
      if(file==='/'){
        res.setHeader('Content-Type','text/html');
        res.end('<details id="nexusPdfTools"><summary>Herramientas PDF</summary><p id="nexusPdfLoading"></p><div id="nexusPdfPanel"></div></details><script src="/nexus-pdf-entry.js" defer></script>');
        return;
      }
      if(!/^\/(?:nexus-pdf-[a-z]+|vendor\/cantoo-pdf-lib-[\d.]+)\.js$/.test(file)){res.writeHead(404);res.end();return;}
      res.setHeader('Content-Type','text/javascript');
      res.end(await readFile(path.join('web',file)));
    }catch{res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    const external=[];
    const base='http://127.0.0.1:'+server.address().port;
    page.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith(base+'/'))external.push(request.url());});
    const responseFiles=async()=>{
      const [download]=await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('link',{name:'Descargar PDF generado'}).click()
      ]);
      const bytes=await readFile(await download.path());
      const document=await PDFDocument.load(bytes);
      return document.getPages().map(page=>page.getWidth());
    };
    await page.goto(base+'/');
    assert.equal(await page.getByRole('button',{name:'Generar PDF'}).count(),0);
    await page.getByText('Herramientas PDF',{exact:true}).click();
    await page.getByLabel('Archivos PDF',{exact:true}).setInputFiles(files);
    await page.getByRole('button',{name:'Subir PDF 2',exact:true}).click();
    await page.getByRole('button',{name:'Generar PDF',exact:true}).click();
    assert.deepEqual(await responseFiles(),[330,100,200]);

    await page.getByLabel('Operación de PDF',{exact:true}).selectOption('extract');
    await page.getByLabel('Archivos PDF',{exact:true}).setInputFiles(files[0]);
    const pages=page.getByLabel('Páginas que quieres extraer',{exact:true});
    await pages.fill('9');
    await page.getByRole('button',{name:'Generar PDF',exact:true}).click();
    await page.getByText('Revisa los rangos. El documento tiene 2 páginas.',{exact:true}).waitFor();
    await pages.fill('2,1');
    await page.getByRole('button',{name:'Generar PDF',exact:true}).click();
    assert.deepEqual(await responseFiles(),[200,100]);
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent('nexo-state',{detail:null})));
    assert.equal(await page.locator('#nexusPdfPanel').locator('input').count(),0);
    assert.deepEqual(external,[]);
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
