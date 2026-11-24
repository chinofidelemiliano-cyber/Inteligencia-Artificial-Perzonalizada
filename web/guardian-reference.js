'use strict';
(function(root){
  const readings=[
    {topic:'Estoicismo',title:'Distinguir lo que depende de ti',source:'Epicteto, Manual, §1',url:'https://www.gutenberg.org/ebooks/45109',
      idea:'Tus juicios y decisiones ofrecen un punto de partida para actuar incluso cuando el resultado depende de otras personas. Distinguir ambas cosas ayuda a preparar una acción sin dar por hecho cómo terminará.',
      practice:'Elige una reunión próxima. Anota una decisión tuya y un resultado que dependa de alguien más.'},
    {topic:'Ética',title:'Practicar una virtud',source:'Aristóteles, Ética a Nicómaco, libro II',url:'https://classics.mit.edu/Aristotle/nicomachaen.2.ii.html',
      idea:'Aristóteles relaciona la formación del carácter con la práctica repetida. Su idea del término medio depende de la situación y del juicio práctico.',
      practice:'Describe cuándo ser muy prudente podría convertirse en indecisión. Identifica una comprobación que te permitiría actuar.'},
    {topic:'Diálogo socrático',title:'Comprobar lo que dices saber',source:'Platón, Apología de Sócrates, 21b–23b',url:'https://classics.mit.edu/Plato/apology.html',
      idea:'Sócrates examina qué pueden justificar quienes aseguran saber algo. En una conversación de trabajo, pedir un ejemplo permite comprobar si dos personas entienden igual un criterio.',
      practice:'Toma una instrucción como «entregar pronto» y formula una pregunta que aclare cuándo se considera cumplida.'},
    {topic:'Lógica',title:'Reconocer una conclusión inválida',source:'Stanford Encyclopedia of Philosophy, Fallacies',url:'https://plato.stanford.edu/entries/fallacies/',
      idea:'De «si hay una falla eléctrica, se detiene la máquina» y «la máquina se detuvo» no se deduce que hubo una falla eléctrica. La detención admite otras explicaciones.',
      practice:'Propón una segunda causa y una comprobación que permita distinguirla de la primera.'},
    {topic:'Sesgos cognitivos',title:'Buscar evidencia que contradiga tu idea',source:'Raymond S. Nickerson, Confirmation Bias, 1998',url:'https://doi.org/10.1037/1089-2680.2.2.175',
      idea:'El sesgo de confirmación puede aparecer al buscar o interpretar evidencia a favor de una idea previa. La coincidencia de dos hechos deja abiertas otras explicaciones.',
      practice:'Escribe qué observación te haría abandonar tu hipótesis antes de revisar los resultados.'},
    {topic:'Aprendizaje',title:'Recuperar una explicación de memoria',source:'Roediger y Karpicke, Test-Enhanced Learning, 2006',url:'https://doi.org/10.1111/j.1467-9280.2006.01693.x',
      idea:'Intentar recordar activamente material estudiado puede ayudar a retenerlo. Comparar tu explicación con la fuente permite detectar omisiones concretas.',
      practice:'Cierra una lección y explica el concepto en tres frases. Abre la lección y corrige una de ellas.'}
  ];
  function daily(day){
    const days=Date.parse(day)/86400000;
    return readings[Number.isInteger(days)?((days%readings.length)+readings.length)%readings.length:0];
  }
  function search(query){
    const clean=text=>text.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
    const terms=clean(query).split(/\s+/).filter(Boolean);
    return readings.filter(item=>terms.every(term=>clean(Object.values(item).join(' ')).includes(term)));
  }
  if(typeof module==='object'){module.exports={daily,search};return;}
  root.liftsGuardianReference={daily,search};
})(globalThis);
