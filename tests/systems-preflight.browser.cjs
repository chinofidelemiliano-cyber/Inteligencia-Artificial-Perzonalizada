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
    await page.evaluate(()=>{
      const space=window.liftsWorkspace.getState();
      space.tasks=[{id:'daily-test',title:'Revisar rodillo de prueba',date:window.liftsWork.localDate(new Date())}];
      space.nexusContext={next:'Documentar el resultado'};
      space.privateMemories=[{id:'memory-test',title:'Manual del rebobinador',text:'Carpeta del taller'}];
    });
    await page.getByRole('button',{name:'Escritorio',exact:true}).click();
    await page.getByRole('heading',{name:'Escritorio',exact:true}).waitFor();
    await page.getByText('Revisar rodillo de prueba',{exact:true}).waitFor();
    await page.getByText('Documentar el resultado',{exact:true}).waitFor();
    await page.locator('#desktopFavorites').getByRole('button',{name:'Mapas de sistemas',exact:true}).click();
    await page.locator('#systems').waitFor();
    await page.keyboard.press('Control+k');
    await page.locator('#workspaceQuery').fill('carpeta del taller');
    await page.getByRole('button',{name:'Manual del rebobinador · Recuerdo privado',exact:true}).click();
    await page.locator('#privacy').waitFor();
    assert.equal(await page.locator('#memorySearch').inputValue(),'Manual del rebobinador');
    await page.evaluate(()=>{
      const space=window.liftsWorkspace.getState();
      space.tasks.push({id:'10000000-0000-4000-8000-000000000003',title:'Ajustar presión',date:'2000-01-01'});
      window.liftsWorkspace.open('desktop');
    });
    await page.getByText('Personalizar atajos de acción',{exact:true}).click();
    await page.getByLabel('Acción del atajo').selectOption('reminder');
    await page.getByLabel('Nombre visible (opcional)').fill('Aviso de prueba');
    await page.getByLabel('Carpeta (opcional)').fill('Personal');
    await page.getByRole('button',{name:'Agregar a mis atajos'}).click();
    await page.getByText('Atajo guardado.',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Editar atajo Aviso de prueba',exact:true}).click();
    await page.getByLabel('Nombre visible (opcional)').fill('Capturar aviso');
    await page.getByRole('button',{name:'Guardar cambios del atajo',exact:true}).click();
    await page.getByText('Atajo guardado.',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Capturar aviso',exact:true}).click();
    await page.locator('#reminders').waitFor();
    await page.evaluate(()=>window.liftsWorkspace.open('desktop'));
    await page.getByRole('button',{name:'Abrir automatizaciones',exact:true}).click();
    await page.getByLabel('Nombre de la regla').fill('Seguir presión');
    await page.getByLabel('Si coincide con (opcional)').fill('presion');
    await page.getByLabel('Entonces ofrecer').selectOption('reminder');
    await page.getByRole('button',{name:'Guardar regla',exact:true}).click();
    await page.getByText('Regla guardada.',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Editar Seguir presión',exact:true}).click();
    await page.getByLabel('Prioridad de la coincidencia').selectOption('alta');
    await page.getByRole('button',{name:'Guardar cambios de la regla',exact:true}).click();
    await page.getByText('Regla guardada.',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Revisar reglas y guardar en historial'}).click();
    await page.getByText('Revisión guardada.',{exact:true}).waitFor();
    await page.getByLabel('Frecuencia mientras el Escritorio está visible').selectOption('5');
    await page.getByRole('button',{name:'Guardar frecuencia',exact:true}).click();
    await page.getByText('Frecuencia guardada.',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.saved.workspaceAutomations.minutes),5);
    await page.getByText('Historial de revisiones',{exact:true}).click();
    await page.getByText('Ver coincidencias de esta revisión',{exact:true}).click();
    await page.locator('#automationHistory').getByText('Seguir presión · Ajustar presión',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.saved.workspaceAutomations.history[0].total),1);
    await page.getByRole('button',{name:'Preparar un recordatorio',exact:true}).click();
    assert.equal(await page.locator('#reminderTitle').inputValue(),'Ajustar presión');
    assert.equal(await page.evaluate(()=>window.liftsWorkspace.getState().tasks.length),2);
    await page.evaluate(()=>{
      const task=window.liftsWorkspace.getState().tasks.find(item=>item.title==='Ajustar presión');
      task.done=true;
      window.liftsWorkspace.open('operations');
    });
    const history=page.locator('#automationHistory');
    await history.getByText('Ver coincidencias de esta revisión',{exact:true}).click();
    await history.getByRole('button',{name:'Abrir registro de origen',exact:true}).click();
    assert.equal(await page.locator('#taskTitle').inputValue(),'Ajustar presión');

    await page.evaluate(()=>{
      const space=window.liftsWorkspace.getState();
      space.savedConversations=[{id:'query-test',title:'Apuntes de turno',messages:[{role:'user',text:'Revisar teoría del color'}]}];
      window.liftsWorkspace.open('desktop');
    });
    await page.getByText('Personalizar paneles del escritorio',{exact:true}).click();
    await page.getByLabel('Mostrar Avisos pendientes',{exact:true}).uncheck();
    await page.getByRole('button',{name:'Subir panel Próxima acción'}).click();
    await page.getByRole('button',{name:'Guardar paneles',exact:true}).click();
    await page.getByText('Paneles guardados.',{exact:true}).waitFor();
    const customized=await page.evaluate(()=>window.saved);
    await page.evaluate(data=>{
      window.dispatchEvent(new CustomEvent('nexo-state',{detail:data}));
      window.liftsWorkspace.open('desktop');
    },customized);
    assert.equal(await page.locator('[data-widget="alerts"]').isVisible(),false);
    assert.deepEqual(await page.locator('#desktopWidgets > article').evaluateAll(cards=>cards.map(card=>card.dataset.widget)),customized.desktopWidgets.order);
    await page.keyboard.press('Control+k');
    await page.locator('#workspaceQuery').fill('Encuentra mis conversaciones sobre teoría del color');
    await page.getByRole('button',{name:'Apuntes de turno · Conversación',exact:true}).click();
    await page.locator('#home').waitFor();
    assert.equal(await page.evaluate(()=>window.liftsWorkspace.getState().messages[0].text),'Revisar teoría del color');
    await page.evaluate(()=>{
      const space=window.liftsWorkspace.getState();
      space.privateMemoryEnabled=true;
      space.privateMemories=[{id:'preview-fixture',title:'Rebobinador',text:'Referencia del taller',context:'Contexto reservado'}];
      window.liftsWorkspace.render();
    });
    await page.locator('#question').fill('¿Dónde está el rebobinador?');
    await page.locator('#shareMemory').check();
    await page.getByText('Rebobinador · Referencia del taller',{exact:true}).waitFor();
    assert.doesNotMatch(await page.locator('#memoryContextPreview').innerText(),/Contexto reservado/);
    await page.locator('#shareMemory').uncheck();
    assert.equal(await page.locator('#memoryContextPreview').isVisible(),false);
    await page.evaluate(()=>window.liftsWorkspace.open('calculatorHub'));
    await page.getByText('Amortización de préstamo',{exact:true}).click();
    await page.getByLabel('Monto del préstamo').fill('1200');
    await page.getByLabel('Tasa por periodo (%)',{exact:true}).fill('0');
    await page.getByLabel('Número de pagos',{exact:true}).fill('12');
    await page.getByRole('button',{name:'Calcular amortización'}).click();
    await page.getByText(/Cuota de referencia 100/).waitFor();
    const [amortization]=await Promise.all([
      page.waitForEvent('download'),page.getByRole('button',{name:'Descargar amortización CSV'}).click()
    ]);
    assert.match(await readFile(await amortization.path(),'utf8'),/12,100.00,0.00,100.00,0.00/);
    await page.evaluate(()=>window.liftsNexus.open({id:'weighted-decision',key:''}));
    await page.getByLabel('Decisión por tomar').fill('Elegir material');
    await page.getByLabel('Criterios y pesos, uno por línea').fill('Costo | 3\nTiempo | 2');
    await page.getByLabel('Alternativas y puntuaciones en el orden de los criterios').fill('A | 8 | 5\nB | 6 | 9');
    await page.getByRole('button',{name:'Comparar alternativas'}).click();
    await page.getByText('Mayor puntuación con tus criterios. B.',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Preparar decisión en Nexus'}).click();
    assert.equal(await page.locator('#journal [name=title]').inputValue(),'Elegir material');
    assert.match(await page.locator('#journal [name=alternatives]').inputValue(),/B.*7[.,]2/);
    await page.locator('#journalEditor [name=expected]').fill('Reducir retrabajos');
    await page.locator('#journalEditor [name=actual]').fill('Se mantiene la frecuencia');
    await page.locator('#journalEditor [name=evidence]').fill('Registro de dos semanas');
    await page.locator('#journalEditor').getByRole('button',{name:'Guardar registro',exact:true}).click();
    await page.getByText('Cronología de revisión de la decisión',{exact:true}).click();
    await page.getByText('Resultado esperado: Reducir retrabajos',{exact:true}).waitFor();
    await page.getByText('Resultado observado: Se mantiene la frecuencia',{exact:true}).waitFor();
    await page.getByText('Proyección de escenarios',{exact:true}).click();
    await page.getByLabel('Decisión o proyecto a proyectar').fill('Reserva de tiempo');
    await page.getByLabel('Unidad del escenario').fill('horas');
    await page.getByLabel('Saldo inicial común').fill('100');
    await page.getByLabel('Cambio mensual adverso').fill('-25');
    await page.getByLabel('Cambio mensual base').fill('0');
    await page.getByLabel('Cambio mensual favorable').fill('50');
    await page.getByLabel('Supuestos del escenario').fill('Cambios mensuales constantes');
    await page.getByRole('button',{name:'Comparar escenarios'}).click();
    assert.deepEqual(await page.locator('#scenarioProjectionResult tbody tr').first().locator('td').allTextContents(),['25','100','250','3']);
    page.once('dialog',dialog=>dialog.accept());
    await page.getByRole('button',{name:'Preparar nota con la proyección'}).click();
    assert.match(await page.locator('#journal [name=content]').inputValue(),/3 meses: 25 \/ 100 \/ 250/);
    await page.evaluate(()=>{
      const state=window.liftsWorkspace.getState(),day=window.liftsWork.localDate(new Date());
      state.personalConsent=true;
      state.personalCheckins=[{day,sleepHours:8},{day:window.liftsWork.localDate(new Date(Date.now()-86400000)),sleepHours:6}];
      window.liftsWorkspace.open('profile');
    });
    await page.getByText('Resumen de bienestar por periodo',{exact:true}).click();
    await page.getByText('Horas de sueño · 7 de promedio, 2 registros',{exact:true}).waitFor();
    await page.getByText('Calculadoras orientativas de bienestar',{exact:true}).click();
    await page.getByLabel('Peso (kg)',{exact:true}).fill('81');
    await page.getByLabel('Estatura (cm)',{exact:true}).fill('180');
    await page.getByRole('button',{name:'Calcular IMC',exact:true}).click();
    assert.match(await page.locator('#wellbeingBmiResult').innerText(),/= 25 kg/);
    await page.evaluate(()=>window.liftsWorkspace.open('routines'));
    await page.getByText('Metas de ahorro y saldos de deuda',{exact:true}).click();
    await page.getByLabel('Nombre de la meta o deuda').fill('Fondo de prueba');
    await page.getByLabel('Monto meta (MXN)').fill('1000');
    await page.getByLabel('Ahorro actual (MXN)').fill('250');
    await page.getByRole('button',{name:'Guardar ficha financiera'}).click();
    await page.getByText('Ficha financiera guardada.',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.saved.financePlan[0].current),25000);
    await page.getByText(/Avance de la meta 25 %/).waitFor();
    await page.evaluate(()=>window.liftsWorkspace.open('calculatorHub'));
    await page.getByText('Comparar créditos y sensibilidad',{exact:true}).click();
    for(const [id,value] of Object.entries({loanAmount:'10000',loanRateA:'1',loanMonthsA:'12',loanRateB:'0',loanMonthsB:'10',loanFeeB:'50'})){
      await page.locator('#'+id).fill(value);
    }
    await page.getByRole('button',{name:'Comparar créditos',exact:true}).click();
    await page.getByRole('rowheader',{name:'A con tasa modificada'}).waitFor();
    assert.match(await page.getByRole('row').filter({has:page.getByRole('rowheader',{name:'Crédito B',exact:true})}).innerText(),/10,050/);
    await page.evaluate(()=>window.liftsNexus.open({id:'finance-academy',key:''}));
    await page.getByLabel('Lección financiera').selectOption('1');
    await page.getByLabel('Corresponder al mismo periodo.').check();
    await page.getByRole('button',{name:'Comprobar respuesta financiera'}).click();
    await page.getByText(/^Correcto. El cociente/).waitFor();
    await page.evaluate(()=>window.liftsWorkspace.open('engineering'));
    await page.getByText('Máquinas, inventario y órdenes',{exact:true}).click();
    await page.getByLabel('Nombre o código industrial',{exact:true}).fill('Prensa con medidas');
    await page.getByLabel('Componentes en orden (uno por línea)',{exact:true}).fill('Entrada\nSalida');
    await page.getByLabel('Ancho útil de banda (mm)',{exact:true}).fill('330,5');
    await page.getByLabel('Referencia o método de medición de los parámetros',{exact:true}).fill('Medición de prueba');
    await page.getByRole('button',{name:'Guardar registro industrial',exact:true}).click();
    await page.getByText('Registro industrial guardado.',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.saved.industrial.machines[0].parameters.webWidth),330.5);
    assert.deepEqual(errors,[]);
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
