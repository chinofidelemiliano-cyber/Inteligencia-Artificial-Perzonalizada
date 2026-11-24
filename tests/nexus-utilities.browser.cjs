'use strict';

const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const path=require('node:path');

test('the utility view treats pasted text as text, calculates locally and clears across sessions',async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    const errors=[],requests=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('request',request=>requests.push(request.url()));
    await page.setContent('<main id="nexusUtilities"></main>');
    for(const file of ['nexus-utilities-core.js','nexus-utilities-ui.js']){
      await page.addScriptTag({path:path.join('web',file)});
    }

    await page.getByLabel('Texto anterior').fill('primera\nquitar');
    const pasted='<strong id="pasted">contenido</strong>';
    await page.getByLabel('Texto nuevo').fill('primera\n'+pasted);
    await page.getByRole('button',{name:'Calcular',exact:true}).click();
    await page.getByText('Añadida, línea nueva 2',{exact:true}).waitFor();
    assert.equal(await page.locator('pre').last().textContent(),pasted);
    assert.equal(await page.locator('#pasted').count(),0);

    await page.getByLabel('Herramienta',{exact:true}).selectOption('dates');
    await page.getByLabel('Fecha inicial').fill('2024-02-28');
    await page.getByLabel('Fecha final').fill('2024-03-01');
    await page.getByRole('button',{name:'Calcular',exact:true}).click();
    await page.getByText('Fecha final − fecha inicial: 2 días naturales.',{exact:true}).waitFor();
    await page.getByLabel('Operación de fecha').selectOption('offset');
    await page.getByLabel('Días de desplazamiento').fill('1');
    await page.getByRole('button',{name:'Calcular',exact:true}).click();
    await page.getByText('Fecha resultante: 2024-02-29',{exact:true}).waitFor();

    await page.getByLabel('Herramienta',{exact:true}).selectOption('radix');
    await page.getByLabel('Número a convertir').fill('255');
    await page.getByRole('button',{name:'Calcular',exact:true}).click();
    assert.equal(await page.getByLabel('Resultado de la conversión').inputValue(),'FF');

    await page.getByLabel('Herramienta',{exact:true}).selectOption('base64');
    await page.getByLabel('Contenido a convertir').fill('ñ');
    await page.getByRole('button',{name:'Calcular',exact:true}).click();
    const encoded=await page.getByLabel('Resultado de la conversión').inputValue();
    assert.equal(encoded,'w7E=');
    await page.getByLabel('Operación Base64').selectOption('decode');
    await page.getByLabel('Contenido a convertir').fill(encoded);
    await page.getByRole('button',{name:'Calcular',exact:true}).click();
    assert.equal(await page.getByLabel('Resultado de la conversión').inputValue(),'ñ');
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent('nexo-state',{detail:null})));
    assert.equal(await page.getByLabel('Texto anterior').inputValue(),'');
    assert.equal(await page.getByLabel('Texto nuevo').inputValue(),'');
    assert.deepEqual(requests,[]);
    assert.deepEqual(errors,[]);
  }finally{await browser.close();}
});
