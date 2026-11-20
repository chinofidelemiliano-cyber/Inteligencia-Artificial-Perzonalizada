const {test}=require('node:test');
const assert=require('node:assert/strict');
const {monthlyReport}=require('../web/finance-report.js');
const {parseExpense}=require('../web/shortcut-link.js');

test('financial report compares the same number of days and suggests a cut on an adjustable category',()=>{
  const ledger={budgets:{'2026-11':10000},entries:[
    {date:'2026-11-02',type:'expense',category:'Salud',cents:6000},
    {date:'2026-11-04',type:'expense',category:'Alimentación',cents:4500},
    {date:'2026-11-08',type:'income',category:'Trabajo',cents:12000},
    {date:'2026-10-04',type:'expense',category:'Alimentación',cents:3900},
    {date:'2026-10-25',type:'expense',category:'Otros',cents:6000}
  ]};
  const report=monthlyReport(ledger,'2026-11','2026-11-12');
  assert.equal(report.previousMonth,'2026-10');
  assert.equal(report.previousExpenses,3900);
  assert.equal(report.lastDay,12);
  assert.equal(report.difference,6600);
  assert.equal(report.balance,1500);
  assert.equal(report.remaining,-500);
  assert.equal(report.adjustable.name,'Alimentación');
  assert.equal(report.target,450);
  assert.equal(monthlyReport(ledger,'2026-10','2026-11-12').expenses,9900);
});

test('expense shortcut accepts localized amounts and clears private parameters',()=>{
  assert.deepEqual(parseExpense('https://lifts.example/#gasto&monto=80%2C25'),{
    amount:'80.25',invalid:false,cleanUrl:'https://lifts.example/'
  });
  assert.equal(parseExpense('https://lifts.example/#gasto&monto=-90').invalid,true);
  assert.equal(parseExpense('https://lifts.example/#gasto').amount,'');
  assert.equal(parseExpense('https://lifts.example/#voice=hola'),null);
});
