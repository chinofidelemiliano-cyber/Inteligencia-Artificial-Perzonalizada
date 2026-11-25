'use strict';
(function(root){
  const {calculate}=typeof module==='object'?require('./guardian-formulas.js'):root.liftsFormulaSearch;
  function schedule(inputs){
    const {values:[principal,rate,periods],result:payment}=calculate('loan',inputs);
    if(!(principal>0))throw new Error('El monto del préstamo debe ser positivo.');
    if(periods>480||principal>1000000000)throw new Error('Usa hasta 480 pagos y un monto de hasta 1 000 000 000.');
    let balance=principal,totalInterest=0;
    const rows=[];
    for(let number=1;number<=periods;number++){
      const interest=balance*(rate/100);
      const principalPaid=number===periods?balance:Math.max(0,Math.min(balance,payment-interest));
      balance=Math.max(0,balance-principalPaid);
      totalInterest+=interest;
      rows.push({number,payment:principalPaid+interest,interest,principalPaid,balance});
    }
    return {payment,totalInterest,totalPaid:principal+totalInterest,rows};
  }
  if(typeof module==='object'){module.exports={schedule};return;}
  const $=id=>document.getElementById(id);
  const form=$('amortizationForm'),status=$('amortizationStatus'),host=$('amortizationRows'),download=$('amortizationDownload');
  const format=new Intl.NumberFormat('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});
  const columns=['Pago','Cuota','Interés','Capital pagado','Saldo'];
  let result;
  function clear(){
    result=null;status.textContent='';host.replaceChildren();download.hidden=true;
  }
  function element(parent,tag,text=''){
    const node=document.createElement(tag);node.textContent=text;parent.append(node);return node;
  }
  form.oninput=clear;
  form.onsubmit=event=>{
    event.preventDefault();clear();
    try{
      result=schedule([...new FormData(form).values()]);
      status.textContent='Cuota de referencia '+format.format(result.payment)+' · Intereses '+format.format(result.totalInterest)+
        ' · Total '+format.format(result.totalPaid)+'. El cálculo conserva precisión interna y presenta dos decimales.';
      const table=element(host,'table');
      element(table,'caption','Primeros '+Math.min(12,result.rows.length)+' pagos de '+result.rows.length);
      const header=element(element(table,'thead'),'tr');
      for(const title of columns)element(header,'th',title).scope='col';
      const body=element(table,'tbody');
      for(const row of result.rows.slice(0,12)){
        const line=element(body,'tr');
        for(const [key,value] of Object.entries(row))element(line,'td',key==='number'?String(value):format.format(value));
      }
      download.hidden=false;
    }catch(error){status.textContent=error.message;}
  };
  download.onclick=()=>{
    if(!result)return;
    const content=[columns.join(','),...result.rows.map(row=>Object.entries(row).map(([key,value])=>key==='number'?value:value.toFixed(2)).join(','))].join('\r\n');
    const url=URL.createObjectURL(new Blob(['\ufeff',content],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='lifts-amortizacion.csv';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  root.addEventListener('nexo-state',()=>{form.reset();clear();});
})(globalThis);
