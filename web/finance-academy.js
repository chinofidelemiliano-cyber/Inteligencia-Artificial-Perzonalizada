'use strict';
(()=>{
  const lessons=[
    {
      name:'Presupuesto y costo de oportunidad',source:'CFPB · Your Money, Your Goals',
      url:'https://www.consumerfinance.gov/consumer-tools/educator-tools/your-money-your-goals/',
      theory:'Un presupuesto distingue el ingreso efectivamente disponible, los compromisos y los gastos variables. También importa la fecha: un mes con saldo total positivo puede tener días sin liquidez si las facturas vencen antes del cobro.',
      example:'Si cobras 8 000 el día 15 y la renta vence el día 5, apartar efectivo del mes anterior cubre el hueco. Gastarlo en otra cosa implica renunciar a ese margen.',
      question:'¿Qué conviene revisar para detectar ese hueco?',
      options:['Las fechas de cobro y vencimiento.', 'Solo el total de ingresos del año.'],answer:0,
      reason:'Un calendario de flujo de efectivo permite ver en qué día se necesita el dinero.'
    },{
      name:'Inflación y poder de compra',source:'FMI · Inflation: Prices on the Rise',
      url:'https://www.imf.org/en/Publications/fandd/issues/Series/Back-to-Basics/Inflation',
      theory:'La inflación mide cuánto aumenta el nivel general de precios. Una canasta individual puede cambiar a un ritmo distinto del índice publicado. El rendimiento real compara qué puedes comprar al inicio y al final.',
      example:'Con un rendimiento nominal de 5 % y una inflación de 4 % en el mismo periodo, el rendimiento real es 1.05 ÷ 1.04 − 1, aproximadamente 0.96 %.',
      question:'¿Qué condición deben cumplir las dos tasas antes de compararlas?',
      options:['Pertenecer a periodos distintos.', 'Corresponder al mismo periodo.'],answer:1,
      reason:'El cociente entre factores de crecimiento tiene sentido si ambos cubren el mismo periodo.'
    },{
      name:'Tasas, crédito y amortización',source:'CFPB · Recursos sobre préstamos para automóviles',
      url:'https://www.consumerfinance.gov/consumer-tools/auto-loans/',
      theory:'En un crédito amortizable, cada cuota cubre el interés del periodo y reduce el saldo. La parte de interés depende del saldo pendiente. Para comparar ofertas importan la tasa por periodo, el principal, el plazo y los cargos.',
      example:'Al comparar dos créditos por el mismo monto, un plazo más largo puede bajar la cuota y elevar el total. Una comisión inicial también cuenta aunque quede fuera de la cuota.',
      question:'¿Qué información permite comparar el costo monetario completo?',
      options:['La cuota anunciada y los cargos de apertura únicamente.', 'Todos los pagos programados y cargos aplicables.'],answer:1,
      reason:'Suma los desembolsos y verifica si las ofertas cubren el mismo monto. La tabla de Lifts explica los cargos incluidos.'
    },{
      name:'Endeudamiento y margen de seguridad',source:'CFPB · Tools and resources for debt collection',
      url:'https://www.consumerfinance.gov/consumer-tools/debt-collection/',
      theory:'Ordenar deudas por saldo, tasa, vencimiento y condiciones ayuda a ver qué obligaciones compiten por el efectivo. El margen de seguridad es el dinero que queda tras las obligaciones y los gastos esenciales.',
      example:'Si después de gastos esenciales quedan 2 000 al mes y las cuotas suman 1 850, el margen es 150. Un gasto imprevisto pequeño podría requerir ajustes.',
      question:'¿Qué cambia si aumenta el gasto mensual esencial?',
      options:['Disminuye el margen disponible para absorber imprevistos.', 'Disminuye automáticamente el saldo de las deudas.'],answer:0,
      reason:'El gasto esencial reduce el efectivo disponible. El saldo de deuda cambia con pagos, intereses y otros cargos.'
    },{
      name:'Diversificación y riesgo',source:'Investor.gov · Asset Allocation and Diversification',
      url:'https://www.investor.gov/introduction-investing/getting-started/asset-allocation',
      theory:'Diversificar distribuye la exposición entre activos. Es más eficaz frente a riesgos particulares cuando las exposiciones son diferentes. Un problema que afecta a un mercado completo todavía puede generar pérdidas.',
      example:'Tener varios títulos del mismo sector deja exposición a problemas comunes de ese sector. Contar títulos por sí solo aporta poca información sobre esa exposición.',
      question:'¿Qué dato ayuda a averiguar si hay diversificación?',
      options:['Cuántos nombres diferentes hay, exclusivamente.', 'Qué riesgos comparten los activos.'],answer:1,
      reason:'La diversificación depende de las exposiciones y de cómo se relacionan, además del número de activos.'
    },{
      name:'Contabilidad básica y resultado',source:'SEC · Beginners’ Guide to Financial Statements',
      url:'https://www.sec.gov/about/reports-publications/investorpubsbegfinstmtguide',
      theory:'El estado de resultados resume ingresos y gastos de un periodo. El balance recoge activos, pasivos y patrimonio en una fecha. El flujo de efectivo explica entradas y salidas de dinero. Son preguntas distintas y complementarias.',
      example:'Una venta a crédito puede aumentar el ingreso registrado antes de que el cliente pague. Por eso el resultado y el efectivo disponible pueden diferir.',
      question:'¿Qué documento responde de forma directa cuánto efectivo entró y salió durante el periodo?',
      options:['El estado de flujo de efectivo.', 'El balance únicamente.'],answer:0,
      reason:'El flujo de efectivo registra movimientos durante un periodo; el balance muestra saldos en una fecha.'
    }
  ];
  const $=id=>document.getElementById(id),picker=$('financeLessonPick'),host=$('financeLessonBody');
  function node(parent,tag,text=''){
    const item=document.createElement(tag);item.textContent=text;parent.append(item);return item;
  }
  for(const [index,lesson] of lessons.entries())node(picker,'option',lesson.name).value=String(index);
  function render(){
    const lesson=lessons[Number(picker.value)];
    host.replaceChildren();
    node(host,'h3',lesson.name);node(host,'p',lesson.theory);node(host,'p',lesson.example);
    const source=node(host,'a',lesson.source);source.href=lesson.url;
    const form=node(host,'form'),fieldset=node(form,'fieldset');
    node(fieldset,'legend',lesson.question);
    for(const [index,answer] of lesson.options.entries()){
      const label=node(fieldset,'label'),radio=node(label,'input');
      radio.type='radio';radio.name='financeAnswer';radio.required=true;radio.value=String(index);
      label.append(' '+answer);
    }
    node(form,'button','Comprobar respuesta financiera');
    const status=node(host,'p');status.setAttribute('role','status');
    form.onsubmit=event=>{
      event.preventDefault();
      const selected=new FormData(form).get('financeAnswer');
      if(selected===null)return;
      status.textContent=(Number(selected)===lesson.answer?'Correcto. ':'Revisa tu respuesta. ')+lesson.reason;
    };
  }
  picker.onchange=render;
  window.addEventListener('nexo-state',()=>{picker.selectedIndex=0;$('financeAcademy').open=false;render();});
  render();
})();
