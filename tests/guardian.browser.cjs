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
    await page.evaluate(()=>window.liftsWorkspace.open('routines'));
    await page.getByText('Rutinas guiadas',{exact:true}).click();
    await page.getByLabel('Plantilla de rutina').selectOption('Sesión de estudio');
    await page.getByRole('button',{name:'Cargar plantilla'}).click();
    await page.getByLabel('Pasos de la rutina').fill('Elegir un objetivo | 1\nRevisar apuntes | | opcional');
    await page.getByRole('button',{name:'Guardar rutina guiada'}).click();
    await page.getByRole('button',{name:'Iniciar Sesión de estudio'}).click();
    await page.getByRole('button',{name:'Iniciar 1 min'}).click();
    await page.getByText(/Tiempo restante/).waitFor();
    const routineState=await page.evaluate(()=>window.saved);
    await page.evaluate(data=>{
      window.dispatchEvent(new CustomEvent('nexo-state',{detail:data}));
      window.liftsWorkspace.open('routines');
    },routineState);
    await page.getByText('Rutinas guiadas',{exact:true}).click();
    await page.getByText(/Tiempo restante/).waitFor();
    await page.getByRole('button',{name:'Marcar paso realizado'}).click();
    await page.getByRole('button',{name:'Omitir paso opcional'}).click();
    await page.getByText(/Rutina completada/).waitFor();
    assert.deepEqual(await page.evaluate(()=>window.saved.guidedRoutines.history[0].results.map(step=>step.status)),['done','skip']);

    await page.evaluate(()=>window.liftsWorkspace.open('privacy'));
    await page.locator('#memoryTitle').fill('Llave de repuesto');
    await page.locator('#memoryText').fill('Está en el cajón');
    await page.getByLabel('Categoría del recuerdo').selectOption('Objeto guardado');
    await page.getByLabel('Contexto del recuerdo').fill('Escritorio del taller');
    await page.getByRole('button',{name:'Guardar recuerdo'}).click();
    await page.getByText('Recuerdo guardado.',{exact:true}).waitFor();
    await page.getByLabel('Buscar en mis recuerdos').fill('taller');
    await page.getByText('Llave de repuesto',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Archivar Llave de repuesto'}).click();
    await page.getByText('No hay recuerdos que coincidan.').waitFor();
    await page.getByLabel('Mostrar recuerdos archivados').check();
    await page.getByRole('button',{name:'Recuperar Llave de repuesto'}).waitFor();
    await page.evaluate(()=>window.liftsWorkspace.open('guardian'));
    await page.getByText('Consulta rápida y lecturas',{exact:true}).click();
    await page.getByLabel('Buscar tema de lectura').fill('sesgos');
    await page.getByText('Buscar evidencia que contradiga tu idea · Sesgos cognitivos',{exact:true}).click();
    await page.getByRole('link',{name:/Confirmation Bias/}).waitFor();
    await page.locator('#guardianClipboard > summary').click();
    await page.getByLabel('Texto para analizar').fill('2 * (3 + 4)');
    await page.getByRole('button',{name:'Ver acciones de captura'}).click();
    await page.getByRole('button',{name:'Calcular expresión'}).click();
    await page.getByText('2 * (3 + 4) = 14',{exact:true}).waitFor();
    await page.getByLabel('Texto para analizar').fill('https://example.com/manual');
    await page.getByRole('button',{name:'Ver acciones de captura'}).click();
    await page.getByRole('button',{name:'Preparar referencia'}).click();
    assert.equal(await page.locator('#journal [name=source]').inputValue(),'https://example.com/manual');
    assert.deepEqual(errors,[]);
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
