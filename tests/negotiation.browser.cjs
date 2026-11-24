const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {createServer}=require('node:http');
const {readFile}=require('node:fs/promises');

test('negotiation branches in the browser and saved rehearsals stay in the active account',async()=>{
  const server=createServer(async(req,res)=>{
    try{
      const request=new URL(req.url,'http://localhost');
      const name=request.pathname==='/'?'index.html':request.pathname.slice(1);
      res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');
      res.end(await readFile('web/'+name));
    }catch{res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  try{
    const page=await browser.newPage({viewport:{width:390,height:820}});
    const errors=[];let aiRequests=0;
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/cdn.jsdelivr.net/**',route=>route.fulfill({status:503,body:''}));
    await page.route('**/api/chat',route=>{aiRequests++;return route.abort();});
    await page.route('**/auth.js',route=>route.fulfill({contentType:'application/javascript',body:`
      window.fixture={profile:{},messages:[],tasks:[],onboardingCompleted:true};window.saves=[];
      window.nexoAccount={isReady:()=>true,accessToken:async()=>'fixture',save:async data=>{window.saves.push(structuredClone(data));return true;}};
      window.addEventListener('load',()=>{
        document.querySelector('#workspace').hidden=false;
        document.querySelector('#authPanel').hidden=true;
        window.dispatchEvent(new CustomEvent('nexo-state',{detail:structuredClone(window.fixture)}));
      },{once:true});`}));
    await page.goto('http://127.0.0.1:'+server.address().port+'/');
    await page.evaluate(()=>window.liftsWorkspace.open('negotiation'));
    const simulator=page.locator('#negotiationContent');
    await simulator.getByRole('button',{name:'Practicar: Negociar una fecha de entrega',exact:true}).click();
    await simulator.getByRole('button',{name:/Creo que podemos terminar todo/}).click();
    await simulator.getByText('Ya avisé al equipo que toda la orden estará lista. ¿Qué les digo?',{exact:true}).waitFor();
    await simulator.getByRole('button',{name:/Aclaro mi estimación/}).click();
    await simulator.getByRole('button',{name:/Resumiré por escrito/}).click();
    await simulator.getByText('Argumentos: 2 de 3 intervenciones.',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.liftsWorkspace.getState().negotiationHistory),undefined);
    await simulator.getByRole('button',{name:'Guardar práctica en mi cuenta',exact:true}).click();
    await simulator.getByText('Práctica guardada.',{exact:true}).waitFor();
    const stored=await page.evaluate(()=>window.saves.at(-1));
    assert.deepEqual(stored.negotiationHistory[0].choices,['promise','repair','recap']);
    await simulator.getByRole('button',{name:'Volver a casos',exact:true}).click();
    await simulator.getByRole('button',{name:/Revisar: Negociar una fecha/}).click();
    await simulator.getByText('Esta práctica está guardada en tu cuenta.',{exact:true}).waitFor();
    await page.evaluate(()=>{window.dispatchEvent(new CustomEvent('nexo-state',{detail:structuredClone(window.fixture)}));window.liftsWorkspace.open('negotiation');});
    await simulator.getByRole('heading',{name:'Casos de práctica',exact:true}).waitFor();
    assert.equal(await simulator.getByRole('button',{name:/Revisar: Negociar una fecha/}).count(),0);
    assert.equal(aiRequests,0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.deepEqual(errors,[]);
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
