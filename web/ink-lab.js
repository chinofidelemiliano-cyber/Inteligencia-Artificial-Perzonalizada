import {deltaE} from './academy-tools.js';

export function number(value, name, min = 0, max = 1e9) {
  const raw = String(value ?? '').trim();
  const n = /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(raw) ? Number(raw.replace(',', '.')) : NaN;
  if (!Number.isFinite(n) || n < min || n > max) throw new Error('Revisa el valor de '+name+'.');
  return n;
}

export function dose(d) {
  if (!d.source?.trim() || !d.product?.trim() || !d.ink?.trim()) throw new Error('Identifica tinta, aditivo y fuente de dosificación autorizada.');
  const ink = number(d.mass,'masa inicial de tinta',0.001) * 1000;
  const previous = number(d.previous,'masa de producto ya incorporada');
  const active = d.basis === 'active' ? number(d.active,'concentración activa en masa',0.000001,100)/100 : 1;
  const min = number(d.min,'dosis mínima',0,100), nominal = number(d.nominal,'dosis habitual',0,100);
  const max = number(d.max,'dosis máxima',0,100), target = number(d.target,'dosis elegida',0,100);
  if (min > nominal || nominal > max || target < min || target > max) throw new Error('La dosis elegida debe estar dentro del rango autorizado. Revisa también el orden de mínima, habitual y máxima.');
  const product = percent => ink * percent / 100 / active;
  const add = Math.max(0, product(target) - previous);
  const capacity = product(max) - previous;
  const density = d.density ? number(d.density,'densidad del aditivo',0.000001,100) : null;
  const price = d.price ? number(d.price,'precio por kilogramo') : null;
  return {minG:product(min),nominalG:product(nominal),maxG:product(max),targetG:product(target),
    add, previous, accumulated:previous*active/ink*100, remaining:Math.max(0,capacity),
    aboveMaximum:capacity < -1e-9, aboveTarget:previous-product(target)>1e-9,
    ml:density===null?null:add/density, cost:price===null?null:add*price/1000};
}

export function dilution(d) {
  const stock = number(d.stock,'grado de origen',0.000001,100);
  const target = number(d.target,'grado objetivo',0,stock);
  const total = number(d.total,'volumen final',0.001,1e7);
  return {stockMl:total*target/stock,totalMl:total};
}

export function recipe(batch, lines) {
  const total = number(batch,'cantidad final',0.001,1e7);
  const rows = lines.trim().split(/\r?\n/).map(line => {
    const [name,amount,extra] = line.split('|');
    if (!name.trim() || extra !== undefined) throw new Error('Escribe un ingrediente y su porcentaje por línea, separados por |.');
    return {name:name.trim(), fraction:number(amount,'porcentaje de '+name,0.000001,100)};
  });
  if (Math.abs(rows.reduce((sum,row)=>sum+row.fraction,0)-100)>1e-6) throw new Error('Los porcentajes deben sumar 100 %.');
  return rows.map(row=>({...row,amount:row.fraction*total/100}));
}

export function comparison(lab, modified) {
  const read = value => {
    const parts = value.trim().split(/\s+/);
    if (parts.length!==3) throw new Error('Escribe tres valores L* a* b* separados por espacios.');
    return parts.map((part,i)=>number(part,'coordenada LAB',i===0?0:-200,i===0?100:200));
  };
  const first = read(lab), second = read(modified);
  const lch = ([l,a,b])=>[l,Math.hypot(a,b),(Math.atan2(b,a)*180/Math.PI+360)%360];
  return {first:lch(first), second:lch(second), differences:deltaE(first,second)};
}

export function consumeAdditive(industrial, id, grams) {
  const stock = industrial?.stock ?? [];
  const entry = stock.find(item=>item.id===id && item.category==='additive');
  if (!entry || !Number.isFinite(entry.quantity) || !['g','kg'].includes(entry.unit.trim().toLowerCase())) {
    throw new Error('Selecciona un aditivo con saldo registrado en g o kg.');
  }
  const factor = entry.unit.trim().toLowerCase()==='kg' ? 1000 : 1;
  const remainder = entry.quantity * factor - grams;
  if (!Number.isFinite(grams) || grams<=0 || remainder < -1e-8) throw new Error('La cantidad consumida debe ser positiva y no superar el saldo.');
  const quantity = Number((Math.max(0,remainder)/factor).toFixed(9));
  return {...industrial,stock:stock.map(item=>item.id===id?{...item,quantity}:item)};
}
