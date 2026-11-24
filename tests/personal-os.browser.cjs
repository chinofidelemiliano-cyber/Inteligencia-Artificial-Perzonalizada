const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {createServer}=require('node:http');
const {readFile}=require('node:fs/promises');
const path=require('node:path');

test('welcome, real dashboard, local Builder download and recovery after switching accounts',async()=>{
  const server=createServer(async(req,res)=>{
    const file=new URL(req.url,'http://localhost').pathname.replace(/^\//,'')||'index.html';
    try{
      res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'text/html');
      res.end(await readFile(path.join('web',file)));
    }catch{res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    const errors=[];page.on('pageerror',err=>errors.push(err.message));
    await page.route('**/cdn.jsdelivr.net/**',r=>r.fulfill({status:503,body:''}));
    await page.route('**/auth.js',r=>r.fulfill({contentType:'text/javascript',body:`
      window.nexoAccount={isReady:()=>true,save:async state=>{window.lastSaved=structuredClone(state);return true;}};
      window.fixture={profile:{name:'Jo'},messages:[],tasks:[{id:'a',title:'Revisar muestras',date:'2000-01-01'}],onboardingCompleted:true};
      window.loginFixture=(data)=>{document.querySelector('#workspace').hidden=false;document.querySelector('#authPanel').hidden=true;
        window.dispatchEvent(new CustomEvent('nexo-state',{detail:structuredClone(data)}));};`}));
    await page.goto('http://127.0.0.1:'+server.address().port+'/');
    await page.getByRole('heading',{name:'El conocimiento transforma.'}).waitFor();
    if(process.env.PERSONAL_OS_CAPTURE){
      await page.setViewportSize({width:1440,height:1000});
      await page.evaluate(()=>document.fonts.ready);
      await page.locator('.os-welcome').screenshot({path:process.env.PERSONAL_OS_CAPTURE,animations:'disabled'});
      await page.setViewportSize({width:390,height:844});
    }
    await page.getByRole('link',{name:'Explorar herramientas'}).click();
    await page.getByRole('heading',{name:'Herramientas de Lifts',exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.evaluate(()=>window.loginFixture(window.fixture));
    await page.getByRole('heading',{name:'Centro de mando',exact:true}).waitFor();
    await page.getByRole('button',{name:'Abrir Alertas de Radar',exact:true}).click();
    await page.getByRole('heading',{name:'Revisar muestras',exact:true}).waitFor();
    await page.getByLabel('Estado de Revisar muestras').selectOption('resolved');
    await page.getByText('No hay alertas en esta vista.',{exact:true}).waitFor();
    await page.evaluate(()=>window.liftsWorkspace.open('builder'));
    await page.getByLabel('Partir de una plantilla').selectOption('anilox');
    await page.getByLabel('Advertir si el resultado supera').fill('10');
    await page.getByRole('button',{name:'Guardar herramienta',exact:true}).click();
    await page.locator('#builderStatus').getByText('Cambios guardados.',{exact:true}).waitFor();
    const run=page.locator('#builderRun');
    await run.getByLabel('Volumen nominal').fill('10');
    await run.getByLabel('Volumen medido').fill('8');
    await run.getByRole('button',{name:'Calcular',exact:true}).click();
    await run.getByText('Resultado: 20 % · Supera el límite configurado.',{exact:true}).waitFor();
    await run.getByRole('button',{name:'Guardar captura',exact:true}).click();
    await run.getByText(/· 20 %/).last().waitFor();
    const download=page.waitForEvent('download');
    await page.getByRole('button',{name:'Exportar definición',exact:true}).click();
    const file=await download;
    const payload=JSON.parse(await readFile(await file.path(),'utf8'));
    assert.equal(payload.format,'lifts-tool-v1');
    assert.equal(payload.rows,undefined);
    const stored=await page.evaluate(()=>window.lastSaved);
    await page.evaluate(()=>window.loginFixture(window.fixture));
    await page.evaluate(()=>window.liftsWorkspace.open('builder'));
    assert.equal(await page.locator('#builderLibrary').getByRole('button',{name:'Pérdida de volumen de anilox',exact:true}).count(),0);
    await page.evaluate(data=>window.loginFixture(data),stored);
    await page.evaluate(()=>window.liftsWorkspace.open('builder'));
    await page.locator('#builderLibrary').getByRole('button',{name:'Pérdida de volumen de anilox',exact:true}).click();
    await run.getByText(/· 20 %/).waitFor();
    await page.keyboard.press('Control+k');
    await page.locator('#workspaceQuery').fill('Pérdida de volumen de anilox');
    await page.locator('#workspaceSearchResults').getByRole('button',{name:'Pérdida de volumen de anilox · Builder',exact:true}).click();
    await run.getByRole('heading',{name:'Pérdida de volumen de anilox',exact:true}).waitFor();
    await page.evaluate(()=>window.liftsWorkspace.open('models'));
    await page.getByLabel('Buscar un modelo mental').fill('Sesgo de confirmación');
    await page.getByText('Sesgo de confirmación',{exact:true}).click();
    await page.getByRole('button',{name:'Preparar revisión crítica',exact:true}).click();
    assert.equal(await page.locator('#journalEditor').getByLabel('Título del registro',{exact:true}).inputValue(),'Sesgo de confirmación');
    assert.deepEqual(errors,[]);
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
