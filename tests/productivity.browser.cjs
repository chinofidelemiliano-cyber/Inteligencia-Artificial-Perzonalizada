const {test} = require('node:test');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const {readFile} = require('node:fs/promises');
const path = require('node:path');
const {bank} = require('../web/flexo-quiz.js');

test('mobile productivity flows, quiz progress, private Google requests and push status', async () => {
  const server = http.createServer(async (req,res) => {
    try {
      const file = new URL(req.url,'http://localhost').pathname;
      res.setHeader('Content-Type', file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');
      res.end(await readFile(path.join('web',file==='/'?'index.html':file)));
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  try {
    const context = await browser.newContext({viewport:{width:390,height:844},permissions:['notifications']});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/cdn.jsdelivr.net/**',r=>r.fulfill({status:503,body:''}));
    await page.route('**/auth.js',r=>r.fulfill({contentType:'text/javascript',body:`
      window.saves=[];
      window.nexoAccount={
        save:async data=>{window.saves.push(JSON.parse(JSON.stringify(data)));return true;},
        accessToken:async()=>'fixture',
        reminderPublicKey:async()=> 'a'.repeat(87),
        saveReminderDevice:async device=>{window.fixtureDevice=device;},
        reminderDeviceStatus:async()=>({registered:true,deliveries:[{status:'retry', occurrence:new Date().toISOString(),detail:'HTTP 503'}]})
      };
      window.addEventListener('load',()=>{
        window.dispatchEvent(new CustomEvent('nexo-state',{detail:{profile:{},tasks:[],messages:[],onboardingCompleted:true}}));
        document.getElementById('workspace').hidden=false;
        document.getElementById('authPanel').hidden=true;
      });
    `}));
    let chatMessages;
    await page.route('**/api/chat',r=>{
      chatMessages=r.request().postDataJSON().messages;
      const prompt=chatMessages.at(-1).content;
      const reply=prompt.startsWith('Divide la tarea')?['Identificar rodillos','Anotar volúmenes','Registrar diferencias']:bank.filter(q=>q[1]==='Intermedio');
      return r.fulfill({json:{reply:JSON.stringify(reply)}});
    });
    const sentEvents = [];
    let googleScopes = [];
    await page.route('https://accounts.google.com/gsi/client',r=>r.fulfill({contentType:'text/javascript',body:`
      window.oauthScopes=[];
      window.google={accounts:{oauth2:{
        initTokenClient(options){window.oauthScopes.push(options.scope);return{requestAccessToken(){options.callback({access_token:'google-fixture'});}};},
        hasGrantedAllScopes(){return true;}
      }}};
    `}));
    await page.route('https://www.googleapis.com/calendar/v3/**',async r=>{
      const req = r.request();
      assert.equal(req.headers().authorization,'Bearer google-fixture');
      if (req.url().endsWith('/freeBusy')) return r.fulfill({json:{calendars:{primary:{busy:[]}}}});
      if (req.url().endsWith('/calendars')) return r.fulfill({json:{id:'private-calendar'}});
      if (req.method()==='GET') return r.fulfill({json:{items:[]}});
      const event = req.postDataJSON();
      sentEvents.push(event);
      return r.fulfill({json:{id:event.id}});
    });
    await page.route('https://gmail.googleapis.com/**',r=>r.fulfill({json:r.request().url().includes('format=metadata')?
      {payload:{headers:[{name:'Subject',value:'Confirmación'},{name:'From',value:'Persona de prueba'}]}}:
      {messages:[{id:'fixture'}]}}));
    await page.goto('http://127.0.0.1:'+server.address().port+'/');
    await page.evaluate(text=>window.liftsWorkspace.ask(text),'Hazme un examen avanzado de flexografía');
    assert.equal(await page.locator('#flexoLevel').inputValue(),'Avanzado');
    await page.locator('#flexoLevel').selectOption('');
    await page.locator('#flexoStart').click();
    for (const q of bank) {
      await page.locator('#flexoForm input').nth(q[3]).check();
      await page.locator('#flexoForm button').click();
      assert.equal(await page.locator('#flexoFeedback p').count(),4);
      await page.locator('#flexoFeedback button').click();
    }
    await page.waitForFunction(()=>document.getElementById('flexoHistory').textContent.includes('10/10'));
    await page.locator('#flexoGenerate').click();
    await page.waitForFunction(()=>document.getElementById('flexoStatus').textContent.includes('Generado por IA'));
    assert.equal(await page.locator('#flexoForm input').count(),4);

    await page.evaluate(text=>window.liftsWorkspace.ask(text),'Recuérdame revisar los anilox mañana a las 09:00, cada semana, con intensidad alta');
    assert.equal(await page.locator('#reminderTitle').inputValue(),'revisar los anilox');
    assert.match(await page.locator('#reminderDate').inputValue(),/T09:00$/);
    assert.equal(await page.locator('#reminderRepeat').inputValue(),'weekly');
    assert.equal(await page.locator('#reminderIntensity').inputValue(),'1');
    await page.locator('#saveReminder').click();
    await page.getByText('Cada semana · Intensidad alta',{exact:false}).waitFor();
    await page.locator('#reminderItems').getByRole('button',{name:'Editar aviso'}).click();
    assert.equal(await page.locator('#reminderIntensity').inputValue(),'1');
    await page.locator('#cancelReminderEdit').click();
    await page.evaluate(text=>window.liftsWorkspace.ask(text),'Recuérdame tomar agua cada 10 minutos');
    assert.equal(await page.locator('#reminderRepeat').inputValue(),'minutes:10');
    await page.locator('#reminderRepeat').selectOption('custom');
    await page.locator('#reminderInterval').fill('7');
    await page.locator('#saveReminder').click();
    await page.getByText('Cada 7 min',{exact:false}).waitFor();
    const recurring = page.locator('#reminderItems article').filter({hasText:'tomar agua'});
    await recurring.getByRole('button',{name:'Pausar',exact:true}).click();
    await recurring.getByText('En pausa',{exact:false}).waitFor();
    await recurring.getByRole('button',{name:'Reanudar',exact:true}).click();
    await recurring.getByRole('button',{name:'Pausar',exact:true}).waitFor();

    await page.locator('#reminderItems article').filter({hasText:'tomar agua'}).getByRole('button',{name:'Editar aviso'}).click();
    assert.equal(await page.locator('#reminderRepeat').inputValue(),'custom');
    assert.equal(await page.locator('#reminderInterval').inputValue(),'7');
    await page.locator('#reminderRepeat').selectOption('alternate');
    assert.equal(await page.locator('#reminderInterval').isVisible(),false);
    await page.locator('#cancelReminderEdit').click();
    await page.locator('nav [data-page="tasks"]').click();
    await page.locator('#taskTitle').fill('Ordenar las fichas de medición');
    await page.locator('#suggestTaskSteps').click();
    await page.waitForFunction(()=>document.getElementById('taskSteps').value.includes('Registrar diferencias'));
    await page.locator('#taskSubmit').click();
    const saved = await page.evaluate(()=>window.saves.at(-1));
    assert.equal(saved.tasks[0].reminderRepeat,'weekly');
    assert.equal(saved.tasks[0].priority,1);
    assert.equal(saved.tasks[2].steps.length,3);
    await page.evaluate(text=>window.liftsWorkspace.ask(text),'Organiza mi jornada de mañana');
    await page.locator('#applySchedule').waitFor({state:'visible'});
    await page.locator('#applySchedule').click();
    assert.equal(await page.evaluate(()=>window.saves.at(-1).tasks[2].planned),true);
    await page.locator('#reviewDay').click();
    assert.match(await page.locator('#schedulePreview').textContent(),/Siguiente paso sugerido/);

    await page.locator('#googleClientId').fill('123-fixture.apps.googleusercontent.com');
    await page.locator('#googleCalendar').click();
    await page.waitForFunction(()=>document.getElementById('googleStatus').textContent.includes('Vuelve a pulsar'));
    await page.locator('#googleCalendar').click();
    await page.waitForFunction(()=>document.getElementById('googleStatus').textContent.includes('bloques ocupados consultados'));
    page.on('dialog',dialog=>dialog.accept());
    await page.locator('#googleAlarms').click();
    await page.waitForFunction(()=>document.getElementById('googleStatus').textContent.includes('2 bloques o avisos sincronizados'));
    assert.equal(sentEvents.length,2);
    assert.ok(sentEvents.every(event=>event.visibility==='private'));
    assert.deepEqual(sentEvents[0].recurrence,['RRULE:FREQ=WEEKLY']);
    assert.equal(sentEvents[1].extendedProperties.private.liftsBlock,saved.tasks[2].id);
    await page.locator('#googleGmail').click();
    await page.getByText('Confirmación · Persona de prueba').waitFor();
    googleScopes = await page.evaluate(()=>window.oauthScopes);
    assert.equal(new Set(googleScopes).size,3);
    assert.equal(JSON.stringify(await page.evaluate(()=>window.saves)).includes('google-fixture'),false);
    await page.evaluate(text=>window.liftsWorkspace.ask(text),'¿Cómo mejorar mi descanso?');
    assert.deepEqual(chatMessages,[{role:'user',content:'¿Cómo mejorar mi descanso?'}]);

    await page.evaluate(async()=>{
      const reg = await navigator.serviceWorker.ready;
      let subscription;
      const manager = reg.pushManager;
      const keys = {p256dh:'a'.repeat(87),auth:'b'.repeat(22)};
      Object.getPrototypeOf(manager).getSubscription = async()=>subscription;
      Object.getPrototypeOf(manager).subscribe = async()=>subscription={
        endpoint:'https://fcm.googleapis.com/fcm/send/fixture',
        toJSON(){return {endpoint:this.endpoint,keys};}
      };
    });
    await page.locator('nav [data-page="home"]').click();
    await page.locator('#installLifts').click();
    await page.locator('#installLiftsHelp').getByText('iPhone o iPad').waitFor();
    await page.locator('#installLiftsHelp').getByText('Android',{exact:true}).waitFor();
    await page.locator('#installLiftsHelp').getByRole('button',{name:'Cerrar'}).click();
    await page.locator('nav [data-page="reminders"]').click();
    await page.locator('#enablePush').click();
    await page.waitForFunction(()=>document.getElementById('pushStatus').textContent.includes('Dispositivo registrado'));
    await page.locator('#checkPush').click();
    await page.waitForFunction(()=>document.getElementById('pushStatus').textContent.includes('pendiente de reintento'));
    assert.deepEqual(errors,[]);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  } finally {
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
});
