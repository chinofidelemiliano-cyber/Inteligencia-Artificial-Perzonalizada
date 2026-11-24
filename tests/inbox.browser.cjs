const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {createServer}=require('node:http');
const {readFile}=require('node:fs/promises');
const path=require('node:path');

test('Agenda inbox preserves captures through conversion drafts, retries, and account switching',async()=>{
 const server=createServer(async(req,res)=>{
  try{
   const pathname=new URL(req.url,'http://localhost').pathname;
   const file=pathname==='/'?'index.html':path.basename(pathname);
   res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css'})[path.extname(file)]||'text/html');
   res.end(await readFile(path.join('web',file)));
  }catch{res.writeHead(404);res.end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/cdn.jsdelivr.net/**',route=>route.fulfill({status:503,body:''}));
  await page.route('**/auth.js',route=>route.fulfill({contentType:'application/javascript',body:`
    window.inboxFixture={profile:{},messages:[],tasks:[],onboardingCompleted:true};
    window.savedInbox=[];
    window.nexoAccount={isReady:()=>true,save:async data=>{
      if(window.rejectInboxSave){window.rejectInboxSave=false;return false;}
      window.savedInbox.push(structuredClone(data));return true;
    },accessToken:async()=>'fixture'};
    window.addEventListener('load',()=>{
      document.getElementById('workspace').hidden=false;
      document.getElementById('authPanel').hidden=true;
      window.dispatchEvent(new CustomEvent('nexo-state',{detail:structuredClone(window.inboxFixture)}));
    },{once:true});`}));
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  await page.keyboard.press('Control+k');
  await page.locator('#workspaceQuery').fill('Bandeja de entrada');
  await page.locator('#workspaceSearchResults').getByRole('button',{name:'Bandeja de entrada',exact:true}).click();
  assert.equal(await page.locator('#agendaInboxTitle').evaluate(input=>input===document.activeElement),true);
  const inbox=page.locator('#agendaInbox');
  await inbox.getByLabel('Captura rápida',{exact:true}).fill('Medir repetición de impresión');
  await inbox.getByRole('button',{name:'Guardar captura',exact:true}).click();
  await inbox.getByText('Captura guardada.',{exact:true}).waitFor();
  const saved=await page.evaluate(()=>window.savedInbox.at(-1));
  assert.equal(saved.inbox.length,1);
  assert.equal(saved.tasks.length,0);

  await inbox.getByRole('button',{name:'Preparar tarea',exact:true}).click();
  assert.equal(await page.locator('#taskTitle').inputValue(),saved.inbox[0].title);
  assert.equal(await page.evaluate(()=>window.liftsWorkspace.getState().tasks.length),0);
  await inbox.getByRole('button',{name:'Preparar aviso',exact:true}).click();
  assert.equal(await page.locator('#reminderTitle').inputValue(),saved.inbox[0].title);
  assert.equal(await page.evaluate(()=>window.liftsWorkspace.getState().inbox[0].processed),false);

  await page.evaluate(()=>window.liftsInbox.open());
  await inbox.getByRole('button',{name:'Marcar como procesada',exact:true}).click();
  await inbox.getByText('Captura procesada.',{exact:true}).waitFor();
  await inbox.getByLabel('Mostrar capturas',{exact:true}).selectOption('processed');
  await inbox.getByRole('button',{name:'Reabrir captura',exact:true}).click();
  await inbox.getByText('Captura reabierta.',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>window.savedInbox.at(-1).inbox[0].id),saved.inbox[0].id);

  await page.evaluate(()=>{window.rejectInboxSave=true;});
  await inbox.getByLabel('Captura rápida',{exact:true}).fill('Revisar el plano');
  await inbox.getByRole('button',{name:'Guardar captura',exact:true}).click();
  await inbox.getByText(/Reintenta el guardado antes de salir/).waitFor();
  const retryId=await page.evaluate(()=>window.liftsWorkspace.getState().inbox[0].id);
  await inbox.getByRole('button',{name:'Reintentar guardado de la bandeja',exact:true}).click();
  await inbox.getByText('Bandeja guardada.',{exact:true}).waitFor();
  const retried=await page.evaluate(()=>window.savedInbox.at(-1).inbox);
  assert.equal(retried.length,2);
  assert.equal(retried[0].id,retryId);

  await page.evaluate(()=>window.dispatchEvent(new CustomEvent('nexo-state',{detail:structuredClone(window.inboxFixture)})));
  await page.evaluate(()=>window.liftsInbox.open());
  await inbox.getByText('No hay capturas en esta vista.',{exact:true}).waitFor();
  assert.equal(await inbox.getByText('Medir repetición de impresión',{exact:true}).count(),0);
  assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
