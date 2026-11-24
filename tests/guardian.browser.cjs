const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createServer}=require('node:http');
const {readFile}=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');

test('Guardian focuses, saves follow-ups, restores its data and clears drafts between accounts',async()=>{
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
    const page=await browser.newPage({viewport:{width:390,height:844}});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    const base='http://127.0.0.1:'+server.address().port;
    await page.route('**/cdn.jsdelivr.net/**',route=>route.fulfill({status:503,body:''}));
    await page.route('**/auth.js',route=>route.fulfill({contentType:'text/javascript',body:`
      window.nexoAccount={isReady:()=>true,save:async value=>{window.saved=structuredClone(value);return true;}};
      window.loginFixture=()=>{document.querySelector('#workspace').hidden=false;document.querySelector('#authPanel').hidden=true;
      window.dispatchEvent(new CustomEvent('nexo-state',{detail:{profile:{name:'Cuenta A'},tasks:[],messages:[],onboardingCompleted:true}}));};`}));
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto(base+'/');
    await page.evaluate(()=>{
      window.loginFixture();
      window.liftsWorkspace.getState().tasks=[{id:'fixture',title:'Preparar muestras',date:'2000-01-01',priority:1,steps:[{title:'Ubicar el sustrato'}]}];
      window.liftsWorkspace.open('home');
    });
    await page.getByRole('button',{name:'Abrir Guardian',exact:true}).click();
    await page.getByRole('button',{name:'Una cosa a la vez',exact:true}).click();
    await page.getByText('Ubicar el sustrato',{exact:true}).waitFor();
    assert.equal(await page.getByLabel('Asunto del seguimiento').isVisible(),false);
    await page.getByRole('button',{name:'Una cosa a la vez',exact:true}).click();
    await page.getByLabel('Instrucciones recibidas').fill('Entregable: Informe\nPrimer paso: Medir una muestra');
    await page.getByRole('button',{name:'No sé por dónde comenzar'}).click();
    await page.getByRole('button',{name:'Preparar en Agenda',exact:true}).click();
    assert.equal(await page.locator('#taskTitle').inputValue(),'Medir una muestra');
    assert.equal(await page.evaluate(()=>window.liftsWorkspace.getState().tasks.length),1);
    await page.evaluate(()=>window.liftsWorkspace.open('guardian'));
    await page.getByLabel('Asunto del seguimiento').fill('Recuperar catálogo');
    await page.getByLabel('Persona',{exact:true}).fill('Ana');
    await page.getByLabel('Próxima fecha de seguimiento').fill('2000-01-02');
    await page.getByRole('button',{name:'Guardar seguimiento',exact:true}).click();
    await page.getByText('Seguimiento guardado.',{exact:true}).waitFor();
    await page.getByText(/Programado para 2000-01-02/).waitFor();
    await page.getByRole('button',{name:'Preparar recordatorio',exact:true}).click();
    assert.equal(await page.locator('#reminderTitle').inputValue(),'Seguimiento: Recuperar catálogo');
    assert.equal(await page.locator('#reminderDate').inputValue(),'');
    await page.evaluate(()=>window.liftsWorkspace.open('guardian'));
    await page.getByRole('button',{name:'Preparar mensaje',exact:true}).click();
    assert.match(await page.getByLabel('Borrador del mensaje de seguimiento').inputValue(),/Hola, Ana/);
    await page.getByRole('button',{name:'Cerrar seguimiento',exact:true}).click();
    await page.getByText('Seguimiento cerrado.',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.saved.guardianFollowups[0].closed),true);
    const saved=await page.evaluate(()=>window.saved);
    await page.evaluate(()=>window.loginFixture());
    assert.equal(await page.getByLabel('Borrador del mensaje de seguimiento').inputValue(),'');
    assert.equal(await page.getByRole('heading',{name:'Recuperar catálogo'}).count(),0);
    await page.evaluate(data=>{
      window.dispatchEvent(new CustomEvent('nexo-state',{detail:data}));
      window.liftsWorkspace.open('guardian');
    },saved);
    await page.getByRole('heading',{name:'Recuperar catálogo'}).waitFor();
    assert.deepEqual(errors,[]);
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
