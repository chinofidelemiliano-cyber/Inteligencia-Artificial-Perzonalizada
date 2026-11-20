'use strict';
((root)=>{
  function monthlyReport(ledger, month, today) {
    const [year,number] = month.split('-').map(Number);
    const previous = new Date(year,number-2,1);
    const previousMonth = previous.getFullYear()+'-'+String(previous.getMonth()+1).padStart(2,'0');
    const partial = month===today.slice(0,7);
    const lastDay = partial ? Number(today.slice(8,10)) : 31;
    function totals(period) {
      let income = 0;
      let expenses = 0;
      const categories = new Map();
      for (const entry of ledger.entries) {
        if (!entry.date.startsWith(period+'-') || Number(entry.date.slice(8,10))>lastDay) continue;
        if (entry.type==='income') income+=entry.cents;
        else {
          expenses+=entry.cents;
          categories.set(entry.category,(categories.get(entry.category)||0)+entry.cents);
        }
      }
      return {income,expenses,categories};
    }

    const current = totals(month);
    const prior = totals(previousMonth);
    const categories = [...current.categories].sort((a,b)=>b[1]-a[1]).map(([name,cents])=>({
      name,cents,percent:Math.round(cents/current.expenses*100),difference:cents-(prior.categories.get(name)||0)
    }));
    const adjustable = categories.find(item=>['Alimentación','Transporte','Otros'].includes(item.name));
    const cap = ledger.budgets[month];
    return {
      month,previousMonth,partial,lastDay,income:current.income,expenses:current.expenses,
      balance:current.income-current.expenses,previousExpenses:prior.expenses,
      difference:current.expenses-prior.expenses,categories,adjustable,
      target:adjustable ? Math.floor(adjustable.cents/10) : 0,
      remaining:Number.isSafeInteger(cap)?cap-current.expenses:null
    };
  }
  const api={monthlyReport};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.liftsFinanceReport=api;
})(typeof window!=='undefined'?window:globalThis);
