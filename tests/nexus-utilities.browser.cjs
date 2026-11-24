'use strict';

const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const path=require('node:path');

test('the utility view treats pasted text as text, calculates locally and clears across sessions',async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    const errors=[],requests=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('request',request=>requests.push(request.url()));
    await page.setContent('<main id="nexusUtilities"></main>');
    for(const file of ['nexus-utilities-core.js','nexus-utilities-ui.js']){
      await page.addScriptTag({path:path.join('web',file)});
    }

    await page.getByLabel('Texto anterior').fill('primera\nquitar');
    const pasted='<strong id="pasted">contenido</strong>';
    await page.getByLabel('Texto nuevo').fill('primera\n'+pasted);
    await page.getByRole('button',{name:'Calcular',exact:true}).click();
    await page.getByText('Añadida, línea nueva 2',{exact:true}).waitFor();
    assert.equal(await page.locator('pre').last().textContent(),pasted);
    assert.equal(await page.locator('#pasted').count(),0);

    await page.getByLabel('Herramienta',{exact:true}).selectOption('dates');
    await page.getByLabel('Fecha inicial').fill('2024-02-28');
    await page.getByLabel('Fecha final').fill('2024-03-01');
    await page.getByRole('button',{name:'Calcular',exact:true}).click();
    await page.getByText('Fecha final − fecha inicial: 2 días naturales.',{exact:true}).waitFor();
    await page.getByLabel('Operación de fecha').selectOption('offset');
    await page.getByLabel('Días de desplazamiento').fill('1');
    await page.getByRole('button',{name:'Calcular',exact:true}).click();
    await page.getByText('Fecha resultante: 2024-02-29',{exact:true}).waitFor();

    await page.getByLabel('Herramienta',{exact:true}).selectOption('radix');
    await page.getByLabel('Número a convertir').fill('255');
    await page.getByRole('button',{name:'Calcular',exact:true}).click();
    assert.equal(await page.getByLabel('Resultado de la conversión').inputValue(),'FF');

    await page.getByLabel('Herramienta',{exact:true}).selectOption('base64');
    await page.getByLabel('Contenido a convertir').fill('ñ');
    await page.getByRole('button',{name:'Calcular',exact:true}).click();
    const encoded=await page.getByLabel('Resultado de la conversión').inputValue();
    assert.equal(encoded,'w7E=');
    await page.getByLabel('Operación Base64').selectOption('decode');
    await page.getByLabel('Contenido a convertir').fill(encoded);
    await page.getByRole('button',{name:'Calcular',exact:true}).click();
    assert.equal(await page.getByLabel('Resultado de la conversión').inputValue(),'ñ');
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent('nexo-state',{detail:null})));
    assert.equal(await page.getByLabel('Texto anterior').inputValue(),'');
    assert.equal(await page.getByLabel('Texto nuevo').inputValue(),'');
    assert.deepEqual(requests,[]);
    assert.deepEqual(errors,[]);
  }finally{await browser.close();}
});

test('downloads resized PNG and JPEG files generated entirely in the browser',async()=>{
  const {readFile}=require('node:fs/promises');
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    const requests=[];
    page.on('request',request=>{if(/^https?:/.test(request.url()))requests.push(request.url());});
    await page.setContent('<main id="nexusUtilities"></main>');
    for(const file of ['nexus-utilities-core.js','nexus-utilities-ui.js']){
      await page.addScriptTag({path:path.join('web',file)});
    }
    const bytes=await page.evaluate(async()=>{
      const canvas=document.createElement('canvas');canvas.width=80;canvas.height=40;
      const context=canvas.getContext('2d');
      context.fillStyle='#e50025';context.fillRect(0,0,40,40);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
      return Array.from(new Uint8Array(await blob.arrayBuffer()));
    });
    await page.getByLabel('Herramienta',{exact:true}).selectOption('image');
    await page.getByLabel('Archivo de imagen',{exact:true}).setInputFiles({
      name:'descartable.png',mimeType:'image/png',buffer:Buffer.from(bytes)
    });
    await page.getByLabel('Ancho máximo en píxeles',{exact:true}).fill('40');
    await page.getByLabel('Alto máximo en píxeles',{exact:true}).fill('30');

    async function download(format,extension){
      await page.getByRole('button',{name:'Procesar imagen',exact:true}).click();
      await page.getByText(/^Resultado: 40 × 20 px/).waitFor();
      const event=page.waitForEvent('download');
      await page.getByRole('button',{name:'Descargar '+format,exact:true}).click();
      const result=await event;
      assert.equal(result.suggestedFilename(),'lifts-imagen.'+extension);
      const contents=await readFile(await result.path());
      return {contents,pixel:await page.evaluate(async({data,type})=>{
        const bitmap=await createImageBitmap(new Blob([Uint8Array.from(data)],{type}));
        const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
        const context=canvas.getContext('2d');context.drawImage(bitmap,0,0);
        return Array.from(context.getImageData(35,10,1,1).data);
      },{data:[...contents],type:format==='PNG'?'image/png':'image/jpeg'})};
    }

    const png=await download('PNG','png');
    assert.deepEqual([...png.contents.subarray(0,8)],[137,80,78,71,13,10,26,10]);
    assert.equal(png.pixel[3],0);
    await page.getByLabel('Formato de salida',{exact:true}).selectOption('image/jpeg');
    await page.getByLabel('Calidad JPEG (%)',{exact:true}).fill('60');
    const jpeg=await download('JPEG','jpg');
    assert.deepEqual([...jpeg.contents.subarray(0,2)],[255,216]);
    assert.ok(jpeg.pixel.every(component=>component>=245));

    await page.getByLabel('Archivo de imagen',{exact:true}).setInputFiles({
      name:'no-es-una-imagen.png',mimeType:'image/png',buffer:Buffer.from('archivo incorrecto')
    });
    await page.getByRole('button',{name:'Procesar imagen',exact:true}).click();
    await page.getByRole('status').getByText('Elige un archivo PNG o JPEG.').waitFor();
    assert.equal(await page.getByRole('button',{name:'Descargar JPEG'}).count(),0);
    assert.deepEqual(requests,[]);
  }finally{await browser.close();}
});

test('downloads a QR PNG with a quiet zone and loads only same-site static modules',async()=>{
  const {readFile}=require('node:fs/promises');
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    const files=['nexus-utilities-core.js','nexus-utilities-ui.js','nexus-utilities-qr.js','nexus-utilities-qr-lib.js'];
    const requests=[];
    await page.route('**/*',async route=>{
      const url=new URL(route.request().url());
      requests.push(url.href);
      if(url.origin!=='http://lifts.test')return route.abort();
      const file=url.pathname.slice(1);
      if(!file)return route.fulfill({contentType:'text/html; charset=utf-8',body:'<main id="nexusUtilities"></main>'+files.slice(0,2).map(name=>'<script defer src="'+name+'"></script>').join('')});
      if(!files.includes(file))return route.abort();
      return route.fulfill({contentType:'text/javascript; charset=utf-8',body:await readFile(path.join('web',file))});
    });
    await page.goto('http://lifts.test/');
    await page.getByLabel('Herramienta',{exact:true}).selectOption('qr');
    const payload='Prensa 7 · revisión 🧵';
    await page.getByLabel('Texto o enlace del código QR',{exact:true}).fill(payload);
    await page.getByRole('button',{name:'Generar código QR',exact:true}).click();
    await page.getByRole('img',{name:'Vista previa del código QR',exact:true}).waitFor();
    const event=page.waitForEvent('download');
    await page.getByRole('button',{name:'Descargar código QR',exact:true}).click();
    const download=await event;
    assert.equal(download.suggestedFilename(),'lifts-codigo-qr.png');
    const bytes=await readFile(await download.path());
    assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);
    const result=await page.evaluate(async({data,decode})=>{
      const image=await createImageBitmap(new Blob([Uint8Array.from(data)],{type:'image/png'}));
      const canvas=document.createElement('canvas');
      canvas.width=image.width;canvas.height=image.height;
      const context=canvas.getContext('2d');context.drawImage(image,0,0);
      return {
        width:image.width,height:image.height,
        margin:[...context.getImageData(31,31,1,1).data],
        topLeftFinder:[...context.getImageData(32,32,1,1).data],
        ...(decode?{pixels:[...context.getImageData(0,0,image.width,image.height).data]}:{})
      };
    },{data:[...bytes],decode:Boolean(process.env.QR_DECODER_MODULE)});
    assert.equal(result.width,result.height);
    assert.ok(result.width<=390);
    assert.deepEqual(result.margin,[255,255,255,255]);
    assert.deepEqual(result.topLeftFinder,[0,0,0,255]);
    if(process.env.QR_DECODER_MODULE){
      const decode=require(process.env.QR_DECODER_MODULE);
      const decoded=decode(Uint8ClampedArray.from(result.pixels),result.width,result.height);
      assert.equal(decoded?.data,payload);
    }
    assert.deepEqual(requests.sort(),['http://lifts.test/',...files.map(file=>'http://lifts.test/'+file)].sort());
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent('nexo-state',{detail:null})));
    assert.equal(await page.getByRole('img',{name:'Vista previa del código QR'}).count(),0);
  }finally{await browser.close();}
});
