const assert=require('node:assert/strict');
const {test}=require('node:test');
const {readFile}=require('node:fs/promises');
const {createServer}=require('node:http');
const {join}=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');

test('rendered PDF regions accept drag and manual marking and survive download in the right locations',async()=>{
  const {PDFDocument,degrees}=await import('../web/vendor/cantoo-pdf-lib-2.11.1.js');
  const pdf=await PDFDocument.create();
  const first=pdf.addPage([400,220]);first.setCropBox(25,20,350,180);first.setRotation(degrees(90));
  pdf.addPage([300,220]);
  const source=Buffer.from(await pdf.save());
  const html='<meta charset="utf-8"><style>body{margin:8px} canvas{display:block} [hidden]{display:none}</style>'+
    '<main id="markup"></main><script type="module">import {mountPdfMarkup} from "./nexus-pdf-markup.js";'+
    'const cleanup=mountPdfMarkup(document.getElementById("markup")); window.addEventListener("nexo-state",cleanup);</script>';
  const server=createServer(async(req,res)=>{
    try{
      const file=new URL(req.url,'http://localhost').pathname;
      if(file==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);return;}
      if(!/^\/(?:nexus-pdf-(?:markup(?:-core|-worker)?|core)|vendor\/(?:pdfjs-6\.5\.438(?:-worker)?|cantoo-pdf-lib-[\d.]+))\.js$/.test(file)){
        res.writeHead(404);res.end();return;
      }
      res.setHeader('Content-Type','text/javascript; charset=utf-8');
      res.end(await readFile(join('web',file)));
    }catch{res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  try{
    const base='http://127.0.0.1:'+server.address().port;
    const page=await browser.newPage({viewport:{width:390,height:844}});
    const external=[],unexpected=[],errors=[];
    page.on('request',request=>{
      const url=request.url();
      if(/^https?:/.test(url)&&!url.startsWith(base+'/'))external.push(url);
    });
    page.on('response',response=>{if(response.status()>=400)unexpected.push(response.url());});
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base);
    const picker=page.getByLabel('PDF para resaltar',{exact:true});
    await picker.setInputFiles({name:'rotado.pdf',mimeType:'application/pdf',buffer:source});
    const status=page.getByRole('status');
    await status.getByText('Página disponible para resaltar.',{exact:true}).waitFor({timeout:15000});
    const canvas=index=>page.getByRole('img',{name:'Vista del PDF, página '+index,exact:true});
    await page.getByRole('button',{name:'Seleccionar con el puntero',exact:true}).click();
    await canvas(1).scrollIntoViewIfNeeded();
    const bounds=await canvas(1).boundingBox();
    await page.mouse.move(bounds.x+bounds.width*.22,bounds.y+bounds.height*.20);
    await page.mouse.down();
    await page.mouse.move(bounds.x+bounds.width*.60,bounds.y+bounds.height*.40,{steps:4});
    await page.mouse.up();
    await status.getByText('Resaltado añadido. 1 en el documento.',{exact:true}).waitFor();

    await page.getByRole('button',{name:'Página siguiente',exact:true}).click();
    await canvas(2).waitFor();
    await page.getByText('Seleccionar por posición y tamaño',{exact:true}).click();
    await page.getByRole('button',{name:'Añadir región',exact:true}).click();
    await status.getByText('Resaltado añadido. 2 en el documento.',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Preparar copia resaltada',exact:true}).click();
    const resultLink=page.getByRole('link',{name:'Descargar PDF resaltado',exact:true});
    await resultLink.waitFor({timeout:15000});
    const event=page.waitForEvent('download');
    await resultLink.click();
    const download=await event;
    assert.equal(download.suggestedFilename(),'lifts-pdf-resaltado.pdf');
    const output=await readFile(await download.path());
    assert.notDeepEqual(output,source);
    await picker.setInputFiles({name:'copia.pdf',mimeType:'application/pdf',buffer:output});
    await canvas(1).waitFor();
    const pixel=(index,x,y)=>canvas(index).evaluate((element,{x,y})=>
      [...element.getContext('2d').getImageData(Math.floor(element.width*x),Math.floor(element.height*y),1,1).data],{x,y});
    const firstMark=await pixel(1,.42,.3);
    assert.ok(firstMark[0]>=245&&firstMark[1]>=200&&firstMark[2]<190,JSON.stringify(firstMark));
    assert.deepEqual(await pixel(1,.8,.8),[255,255,255,255]);

    await page.getByRole('button',{name:'Página siguiente',exact:true}).click();
    await canvas(2).waitFor();
    const secondMark=await pixel(2,.32,.15);
    assert.ok(secondMark[0]>=245&&secondMark[1]>=200&&secondMark[2]<190,JSON.stringify(secondMark));
    assert.equal(await resultLink.count(),0);
    assert.deepEqual(external,[]);
    assert.deepEqual(unexpected,[]);
    assert.deepEqual(errors,[]);
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent('nexo-state',{detail:null})));
    assert.equal(await picker.count(),0);
  }finally{
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
});
