const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createServer}=require('node:http');
const {readFile}=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');

test('The 2D workspace saves a systems map and downloads a preflight report',async()=>{
  const server=createServer(async(req,res)=>{
    try{
      const file=new URL(req.url,'http://localhost').pathname.replace(/^\//,'')||'index.html';
      res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.glb':'model/gltf-binary','.woff2':'font/woff2'})[path.extname(file)]||'text/html');
      res.end(await readFile(path.join('web',file)));
    }catch{res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  try{
    const page=await browser.newPage({viewport:{width:1200,height:900}});
    const errors=[],badUrls=[];
    page.on('pageerror',error=>errors.push(error.message));
    const base='http://127.0.0.1:'+server.address().port;
    page.on('request',request=>{if(request.url().startsWith('http')&&!request.url().startsWith(base+'/')&&!request.url().includes('cdn.jsdelivr.net'))badUrls.push(request.url());});
    await page.route('**/cdn.jsdelivr.net/**',route=>route.fulfill({status:503,body:''}));
    await page.route('**/auth.js',route=>route.fulfill({contentType:'text/javascript',body:`
      window.nexoAccount={isReady:()=>true,save:async value=>{window.saved=structuredClone(value);return true;}};
      window.loginFixture=()=>{document.querySelector('#workspace').hidden=false;document.querySelector('#authPanel').hidden=true;
      window.dispatchEvent(new CustomEvent('nexo-state',{detail:{profile:{name:'Cuenta A'},tasks:[],messages:[],onboardingCompleted:true}}));};`}));
    await page.goto(base+'/');
    assert.equal(await page.locator('model-viewer').count(),0);
    await page.evaluate(()=>window.loginFixture());
    await page.evaluate(()=>window.liftsWorkspace.open('systems'));
    await page.getByLabel('Título del mapa').fill('Prueba de circulación');
    for(const title of ['Flujo','Temperatura']){
      await page.getByLabel('Nombre de la variable').fill(title);
      await page.getByRole('button',{name:'Agregar variable'}).click();
    }
    const src=await page.getByLabel('Origen',{exact:true}).locator('option').filter({hasText:'Flujo'}).getAttribute('value');
    const dst=await page.getByLabel('Destino',{exact:true}).locator('option').filter({hasText:'Temperatura'}).getAttribute('value');
    for(const [from,to] of [[src,dst],[dst,src]]){
      await page.getByLabel('Origen',{exact:true}).selectOption(from);
      await page.getByLabel('Destino',{exact:true}).selectOption(to);
      await page.getByLabel('Descripción de la relación').fill('Relación bajo prueba');
      await page.getByRole('button',{name:'Agregar relación'}).click();
    }
    await page.getByText('Ciclo registrado: Flujo → Temperatura → Flujo',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Guardar mapa'}).click();
    await page.getByText('Mapa guardado.',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.saved.systemsMaps[0].edges.length),2);
    const {PDFDocument,degrees}=await import('../web/vendor/cantoo-pdf-lib-2.11.1.js');
    const fixture=await PDFDocument.create();
    const sample=fixture.addPage([320,180]);
    sample.setTrimBox(10,10,280,140);
    sample.setBleedBox(0,0,300,160);
    sample.setRotation(degrees(90));
    fixture.addPage();
    await page.evaluate(()=>window.liftsWorkspace.open('preflight'));
    await page.getByLabel('PDF para revisar').setInputFiles({
      name:'geometria.pdf',mimeType:'application/pdf',buffer:Buffer.from(await fixture.save())
    });
    await page.locator('#preflightForm [name=bleed]').fill('3');
    await page.getByRole('button',{name:'Revisar PDF'}).click();
    const rows=page.locator('#preflightResults tbody tr');
    await rows.nth(1).waitFor();
    assert.match(await rows.nth(0).innerText(),/49[.,]389.*98[.,]778/s);
    assert.match(await rows.nth(0).innerText(),/3[.,]528 mm · Correcto/);
    assert.match(await rows.nth(1).innerText(),/No verificable/);
    const [download]=await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button',{name:'Descargar reporte de revisión'}).click()
    ]);
    const report=await PDFDocument.load(await readFile(await download.path()));
    assert.ok(report.getPageCount()>0);
    assert.deepEqual(badUrls,[]);
    await page.evaluate(()=>window.liftsWorkspace.open('home'));
    await page.getByText('Atajos y navegación',{exact:true}).click();
    await page.getByLabel('Herramienta para agregar a favoritos').selectOption('systems');
    await page.getByRole('button',{name:'Agregar a favoritos',exact:true}).click();
    await page.getByText('Favorito guardado.',{exact:true}).waitFor();
    await page.getByLabel('Mostrar Vida personal y finanzas',{exact:true}).uncheck();
    await page.getByRole('button',{name:'Subir Herramientas',exact:true}).click();
    await page.getByRole('button',{name:'Guardar menú',exact:true}).click();
    await page.getByText('Menú guardado.',{exact:true}).waitFor();
    const saved=await page.evaluate(()=>window.saved);
    await page.evaluate(data=>window.dispatchEvent(new CustomEvent('nexo-state',{detail:data})),saved);
    assert.deepEqual(saved.workspaceNavigation.favorites,['systems']);
    assert.equal(await page.locator('[data-nav-group="personal"]').getAttribute('hidden'),'');
    assert.deepEqual(await page.locator('#workspaceSections > details').evaluateAll(groups=>groups.map(group=>group.dataset.navGroup)),saved.workspaceNavigation.order);
    await page.setViewportSize({width:390,height:844});
    await page.locator('#workspaceMobileMenu').click();
    assert.equal(await page.locator('#workspaceSections').isVisible(),false);
    await page.locator('#workspaceMobileMenu').click();
    assert.equal(await page.locator('#workspaceSections').isVisible(),true);
    assert.deepEqual(errors,[]);
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
