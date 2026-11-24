'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {createServer}=require('node:http');
const {readFile}=require('node:fs/promises');
const path=require('node:path');

test('privacy recovery previews an existing export, confirms the owner merge, retries and clears on account switch',async()=>{
  const server=createServer(async(req,res)=>{
    try{
      const pathname=new URL(req.url,'http://localhost').pathname;
      const file=pathname==='/'?'index.html':pathname.slice(1);
      res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'text/html');
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
      window.backupState={profile:{},messages:[],tasks:[{id:'0b3f28fa-eb1a-4906-896a-000000000001',title:'Actual'}],
        onboardingCompleted:true,googleClientId:'original'};
      window.backupSaves=[];
      window.nexoAccount={isReady:()=>true,save:async data=>{
        if(window.rejectBackup){window.rejectBackup=false;return false;}
        window.backupSaves.push(structuredClone(data));return true;
      },accessToken:async()=>'fixture'};
      window.addEventListener('load',()=>{
        document.getElementById('workspace').hidden=false;
        document.getElementById('authPanel').hidden=true;
        window.dispatchEvent(new CustomEvent('nexo-state',{detail:structuredClone(window.backupState)}));
      },{once:true});`}));
    await page.goto('http://127.0.0.1:'+server.address().port+'/');
    await page.evaluate(()=>window.liftsWorkspace.open('privacy'));
    const [download]=await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button',{name:'Exportar datos del espacio (JSON)',exact:true}).click()
    ]);
    const data=JSON.parse(await readFile(await download.path(),'utf8'));
    data.tasks[0].title='Otra versión';
    data.tasks.push({id:'0b3f28fa-eb1a-4906-896a-000000000002',title:'Por recuperar',
      date:'2026-11-24',startAt:'2026-11-24T14:00:00.000Z',reminderAt:'2026-11-24T14:00:00.000Z'});
    data.googleClientId='No restaurar';
    const preview=page.locator('#nexusBackup');
    await preview.getByText('Recuperar datos de una copia JSON',{exact:true}).click();
    const upload=preview.getByLabel('Copia JSON de Lifts',{exact:true});
    await upload.setInputFiles({name:'invalido.json',mimeType:'application/json',buffer:Buffer.from('sin JSON')});
    await preview.getByText('El archivo no contiene JSON válido.',{exact:true}).waitFor();
    await upload.setInputFiles({name:'mi-espacio.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
    const taskRow=preview.getByRole('row',{name:/Tareas de Agenda/});
    await taskRow.waitFor();
    assert.deepEqual(await taskRow.getByRole('cell').allTextContents(),['1','1','0','0']);
    assert.equal(await page.evaluate(()=>window.backupSaves.length),0);

    const restore=preview.getByRole('button',{name:'Añadir registros a esta cuenta',exact:true});
    page.once('dialog',dialog=>dialog.dismiss());
    await restore.click();
    assert.equal(await page.evaluate(()=>window.liftsWorkspace.getState().tasks.length),1);

    await page.evaluate(()=>{window.rejectBackup=true;});
    page.once('dialog',dialog=>dialog.accept());
    await restore.click();
    await preview.getByText(/Reintenta para confirmar el guardado/).waitFor();
    await preview.getByRole('button',{name:'Reintentar guardado de la copia',exact:true}).click();
    await preview.getByText('Datos recuperados y guardados en tu cuenta.',{exact:true}).waitFor();
    const saved=await page.evaluate(()=>window.backupSaves.at(-1));
    assert.deepEqual(saved.tasks.map(task=>task.title),['Actual','Por recuperar']);
    assert.equal(saved.tasks[1].reminderAt,'');
    assert.equal(saved.tasks[1].startAt,'');
    assert.equal(saved.googleClientId,'original');

    await upload.setInputFiles({name:'mi-espacio.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
    await preview.getByText('La copia no contiene registros nuevos para recuperar.',{exact:true}).waitFor();
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent('nexo-state',{detail:structuredClone(window.backupState)})));
    await page.evaluate(()=>window.liftsWorkspace.open('privacy'));
    assert.equal(await preview.locator('details').evaluate(element=>element.open),false);
    assert.equal(await upload.inputValue(),'');
    assert.equal(await page.evaluate(()=>window.liftsWorkspace.getState().tasks.length),1);
    assert.deepEqual(errors,[]);
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
