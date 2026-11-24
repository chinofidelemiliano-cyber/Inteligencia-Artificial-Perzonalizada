'use strict';
(function (root) {
  const normalize = text => String(text).normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
  const ignored = new Set('quiero ayuda sobre donde como para tengo dime puedes necesito hacer esto cual cuales cuales desde esta este estos algun alguna sobre explica explica'.split(' '));
  const words = text => [...new Set((normalize(text).match(/[a-z0-9]+/g)||[]).filter(word=>word.length>=4&&!ignored.has(word)))];
  function relevant(query, memories) {
    const keys = words(query);
    return (Array.isArray(memories)?memories:[]).map(memory=>{
      const title = words(memory.title), body = words(memory.text);
      const score = keys.reduce((total,key)=>total+(title.includes(key)?3:body.includes(key)?1:0),0);
      return {memory,score};
    }).filter(item=>item.score>=3).sort((a,b)=>b.score-a.score).slice(0,3)
      .map(({memory})=>({title:memory.title,text:memory.text}));
  }

  function route(text) {
    const query = normalize(text);
    if (/\b(?:circunferencia|perimetro)\b/.test(query) && /\bdiametro\b/.test(query)) {
      const diameter = query.match(/\bdiametro\s*(?:de\s+|=\s*|:\s*)?([+-]?\d+(?:[.,]\d+)?)\s*(mm|cm|m|in)\b/);
      if (!diameter) return {reply:'Indica el diámetro y la unidad. Por ejemplo, «circunferencia con diámetro de 100 mm».'};
      const value = Number(diameter[1].replace(',','.'));
      const circumference = Math.PI * value;
      if (!(value>0 && Number.isFinite(circumference))) return {reply:'El diámetro debe ser positivo y el resultado debe poder representarse.'};
      const format = new Intl.NumberFormat('es-MX',{maximumSignificantDigits:9});
      return {reply:'Para un círculo, C = π × d = π × '+diameter[1]+' '+diameter[2]+' ≈ '+format.format(circumference)+' '+diameter[2]+'.'};
    }
    if (!/\b(?:abre|abrir|muestra|busca|ir|calcula|calcular|usar|descargar|necesito)\b/.test(query)) return null;
    if (/\bdistorsion(?:es)?\b/.test(query)) return {target:'engineering',reply:'En Ingeniería puedes introducir las medidas del cilindro y calcular la compensación.'};
    if (/\bbiblioteca\b/.test(query)) return {target:'library',reply:'Abrí la biblioteca técnica de la Academia.'};
    if (/\b(?:plantilla|plantillas)\b/.test(query)&&/\b(?:excel|inventario|pareto|desperdicio)\b/.test(query)) {
      const template = query.includes('pareto')?'pareto':query.includes('desperdicio')?'waste':'inventory';
      return {target:'excel',template,reply:'Abrí la plantilla de Lifts Excel para que la revises y descargues.'};
    }
    if (/\bdiagnostico\b/.test(query)) return {target:'diagnostics',reply:'Abrí Diagnóstico guiado. Puedes registrar observaciones y pruebas.'};
    return null;
  }
  const core={relevant,route};
  if(typeof module==='object')module.exports=core;
  else root.liftsEvolutionCore=core;
})(globalThis);
