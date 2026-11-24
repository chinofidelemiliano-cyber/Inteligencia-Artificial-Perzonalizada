const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const {createServer}=require('node:http');
const {readFile}=require('node:fs/promises');
const path=require('node:path');

test('academy saves learning, runs its tools and tutor, and works across viewport and account changes',async()=>{
  const server=createServer(async(req,res)=>{
    try{
      const url=new URL(req.url,'http://localhost');
      const file=url.pathname==='/'?'index.html':url.pathname.slice(1);
      res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');
      res.end(await readFile(path.join('web',file)));
    }catch{res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  try{
    const page=await browser.newPage({viewport:{width:1320,height:920}});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/cdn.jsdelivr.net/**',route=>route.fulfill({status:503,body:''}));
    await page.route('**/auth.js',route=>route.fulfill({contentType:'application/javascript',body:`
      window.fixture={profile:{},messages:[],tasks:[],onboardingCompleted:true}; window.saves=[];
      window.nexoAccount={accessToken:async()=>'fixture',save:async data=>{window.saves.push(structuredClone(data));return true;}};
      window.addEventListener('load',()=>{
        document.querySelector('#workspace').hidden=false;
        document.querySelector('#authPanel').hidden=true;
        window.dispatchEvent(new CustomEvent('nexo-state',{detail:structuredClone(window.fixture)}));
      },{once:true});`}));
    let tutorRequest;
    await page.route('**/api/chat',route=>{
      tutorRequest=route.request().postDataJSON();
      return route.fulfill({json:{reply:'Hecho: el TVI mide diferencia en puntos porcentuales.'}});
    });
    await page.goto('http://127.0.0.1:'+server.address().port+'/');
    await page.getByRole('button',{name:'Academia',exact:true}).click();
    await page.getByRole('heading',{name:'Especialidades'}).waitFor();
    assert.equal(await page.locator('#academy .academy-tile').count(),15);
    await page.getByLabel('Buscar en la Academia').fill('fingerprint');
    await page.getByRole('button',{name:'Fingerprint, caracterización y compensación tonal',exact:true}).click();
    await page.getByRole('heading',{name:'Fingerprint, caracterización y compensación tonal',exact:true}).waitFor();
    await page.getByRole('button',{name:'Marcar favorito',exact:true}).click();
    await page.getByRole('button',{name:'Quitar favorito',exact:true}).waitFor();
    await page.getByLabel('Notas privadas de esta lección').fill('Nota privada de prueba');
    await page.getByRole('button',{name:'Guardar nota',exact:true}).click();
    await page.getByText('Nota guardada.',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Marcar lección completada',exact:true}).click();
    await page.getByText('1 de 35 lecciones completadas',{exact:true}).waitFor();
    await page.getByText('Práctica opcional',{exact:true}).click();
    await page.getByLabel('¿Qué valor nominal produce 60 % medido en el ejemplo? Da dos decimales.').fill('45.45');
    await page.getByRole('button',{name:'Comprobar respuesta',exact:true}).click();
    await page.getByText('Correcto.',{exact:false}).waitFor();
    await page.getByText('Tutor de esta lección',{exact:true}).click();
    await page.getByLabel('Duda, fórmula o situación de producción').fill('Explica la interpolación');
    await page.getByRole('button',{name:'Consultar al tutor',exact:true}).click();
    await page.getByText('Hecho: el TVI mide diferencia en puntos porcentuales.',{exact:true}).waitFor();
    assert.match(tutorRequest.messages[0].content,/Explica la interpolación/);
    assert.doesNotMatch(tutorRequest.messages[0].content,/Nota privada de prueba/);
    await page.getByRole('button',{name:'Simuladores',exact:true}).click();
    await page.getByLabel('Tono medido (%)').fill('70');
    await page.getByText('TVI = medido − nominal = 20.0 puntos porcentuales',{exact:true}).waitFor();
    await page.getByLabel('Desplazamiento de muestra (nm)').fill('45');
    await page.getByText('desplazamiento 45 nm',{exact:false}).waitFor();
    await page.getByLabel('Ángulo de la segunda trama (°)').fill('15');
    await page.getByText('Ángulo 15° · variación de paso 0 %.',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Biblioteca',exact:true}).click();
    await page.getByLabel('Buscar un defecto').fill('desregistro');
    await page.getByText('Desregistro',{exact:true}).first().click();
    await page.locator('#academyContent canvas').first().waitFor();
    const download=page.waitForEvent('download');
    await page.getByRole('button',{name:'Descargar apuntes de la Academia',exact:true}).click();
    assert.equal((await download).suggestedFilename(),'lifts-apuntes-flexografia.pdf');
    await page.getByRole('button',{name:'Buscar',exact:true}).click();
    await page.getByLabel('Secciones, tareas o lecciones').fill('metamerismo');
    await page.locator('#workspaceSearchResults').getByRole('button').first().click();
    await page.getByRole('heading',{name:'De la curva espectral a XYZ, Lab y ΔE',exact:true}).waitFor();
    await page.getByRole('button',{name:'Buscar',exact:true}).click();
    await page.getByLabel('Secciones, tareas o lecciones').fill('La prensa como sistema de transferencia');
    await page.locator('#workspaceSearchResults').getByRole('button').first().click();
    await page.getByRole('heading',{name:'La prensa como sistema de transferencia',exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'Descargar constancia interna',exact:true}).isVisible(),false);
    await page.getByRole('button',{name:'Marcar lección completada',exact:true}).click();
    await page.getByRole('button',{name:'Lección completada',exact:true}).waitFor();
    await page.getByRole('button',{name:'Variables críticas y toma de muestras',exact:true}).click();
    await page.getByRole('button',{name:'Marcar lección completada',exact:true}).click();
    const cert=page.waitForEvent('download');
    await page.getByRole('button',{name:'Descargar constancia interna',exact:true}).click();
    assert.equal((await cert).suggestedFilename(),'lifts-constancia-fundamentos.pdf');
    await page.getByRole('button',{name:'Tema claro',exact:true}).click();
    assert.equal(await page.locator('html').getAttribute('data-lifts-theme'),'light');
    await page.getByRole('button',{name:'Plegar menú',exact:true}).click();
    assert.ok(await page.locator('html').evaluate(root=>root.classList.contains('sidebar-folded')));
    await page.getByRole('button',{name:'Notificaciones',exact:true}).click();
    await page.getByText('No tienes avisos pendientes ahora.',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Abrir Recordatorios',exact:true}).click();
    assert.equal(await page.locator('#reminders').isVisible(),true);
    await page.setViewportSize({width:390,height:844});
    await page.getByRole('button',{name:'Academia',exact:true}).click();
    await page.getByRole('heading',{name:'Especialidades'}).waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent('nexo-state',{detail:structuredClone(window.fixture)})));
    await page.getByRole('button',{name:'Academia',exact:true}).click();
    await page.getByText('0 de 35 lecciones completadas',{exact:true}).waitFor();
    assert.deepEqual(errors,[]);
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
