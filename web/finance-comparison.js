'use strict';
(function(root){
  const {schedule}=typeof module==='object'?require('./finance-amortization.js'):root.liftsAmortization;
  function decimal(raw,pattern,label){
    const text=String(raw??'').trim();
    if(!pattern.test(text))throw new Error('Revisa '+label+'.');
    return Number(text.replace(',','.'));
  }
  function compare(raw){
    const fee=key=>decimal(raw[key],/^\d{1,9}(?:[.,]\d{1,2})?$/,'la comisión inicial');
    const rateChange=decimal(raw.rateChange,/^[+-]?\d{1,3}(?:[.,]\d{1,4})?$/,'la variación de tasa');
    const monthsChange=decimal(raw.monthsChange,/^[+-]?\d{1,3}$/,'la variación de plazo');
    const rateA=decimal(raw.rateA,/^\d{1,3}(?:[.,]\d{1,4})?$/,'la tasa mensual A');
    const monthsA=decimal(raw.monthsA,/^\d{1,3}$/,'el plazo A');
    const feeA=fee('feeA'),feeB=fee('feeB');
    const adjustedRate=Number((rateA+rateChange).toFixed(4));
    const adjustedMonths=monthsA+monthsChange;
    if(adjustedRate<0||adjustedRate>100)throw new Error('La tasa A ajustada debe quedar entre 0 % y 100 % mensual.');
    if(adjustedMonths<1||adjustedMonths>480)throw new Error('El plazo A ajustado debe quedar entre 1 y 480 meses.');
    function row(name,rate,months,initialFee){
      const result=schedule([raw.principal,rate,months]);
      return {name,rate:Number(String(rate).replace(',','.')),months:Number(months),
        payment:result.payment,interest:result.totalInterest,initialFee,total:result.totalPaid+initialFee};
    }
    const a=row('Crédito A',rateA,monthsA,feeA),b=row('Crédito B',raw.rateB,raw.monthsB,feeB);
    return [a,b,row('A con tasa modificada',adjustedRate,monthsA,feeA),row('A con plazo modificado',rateA,adjustedMonths,feeA)]
      .map(item=>({...item,delta:item.total-a.total}));
  }
  if(typeof module==='object'){module.exports={compare};return;}
  const $=id=>document.getElementById(id);
  const form=$('loanComparisonForm'),status=$('loanComparisonStatus'),host=$('loanComparisonResult');
  const money=new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'});
  const number=new Intl.NumberFormat('es-MX',{maximumFractionDigits:4});
  function node(parent,tag,text=''){
    const element=document.createElement(tag);element.textContent=text;parent.append(element);return element;
  }
  function clear(){host.replaceChildren();status.textContent='';}
  form.oninput=clear;
  form.onsubmit=event=>{
    event.preventDefault();clear();
    try{
      const rows=compare(Object.fromEntries(new FormData(form))),table=node(host,'table');
      node(table,'caption','Cuotas mensuales y costo total de cada escenario');
      const header=node(node(table,'thead'),'tr');
      for(const label of ['Escenario','Tasa mensual','Pagos','Cuota','Intereses','Comisión inicial','Total pagado','Diferencia frente a A'])node(header,'th',label).scope='col';
      const body=node(table,'tbody');
      for(const row of rows){
        const tr=node(body,'tr');node(tr,'th',row.name).scope='row';
        for(const text of [number.format(row.rate)+' %',String(row.months),...[row.payment,row.interest,row.initialFee,row.total,row.delta].map(value=>money.format(value))])node(tr,'td',text);
      }
      status.textContent='La comparación suma principal, intereses y comisión inicial. Cada variación modifica un solo supuesto frente al crédito A.';
    }catch(error){status.textContent=error.message;}
  };
  root.addEventListener('nexo-state',()=>{form.reset();clear();$('loanComparison').open=false;});
})(globalThis);
