'use strict';
(()=>{
  const lessons=[
    ['1 · Comprender el comportamiento','Evitación a corto plazo',
      'La procrastinación es aplazar una acción prevista pese a esperar un costo por la demora. A veces posponer alivia el malestar inmediato. Si falta información, si tienes una prioridad más urgente o si necesitas descansar, aplazar puede ser parte de una buena planificación.',
      'Piensa en una tarea que pospusiste. Anota el motivo observable y la consecuencia que esperabas. Después registra si el aplazamiento resolvió una restricción real.',
      'Sirois y Pychyl · Modelo de regulación del ánimo','https://doi.org/10.1111/spc3.12011'],
    ['1 · Comprender el comportamiento','Autonomía, expectativa y valor',
      'La teoría de autodeterminación distingue actuar por interés o valor propio de actuar por presión externa. La autoeficacia es una creencia sobre lo que puedes hacer en una situación concreta. La motivación temporal es un modelo que representa cómo el valor de una tarea y su demora pueden cambiar su atractivo relativo.',
      'Elige una obligación. Separa la razón externa de un propósito que realmente compartas. Anota una tarea similar que ya pudiste iniciar.',
      'Ryan y Deci · Autodeterminación','https://doi.org/10.1037/0003-066X.55.1.68','Bandura · Autoeficacia','https://doi.org/10.1037/0033-295X.84.2.191'],
    ['2 · Comprender el cerebro','Funciones ejecutivas durante una tarea',
      'Mantener una instrucción activa, resistir una interrupción y cambiar de plan corresponden a memoria de trabajo, control inhibitorio y flexibilidad. Participan sistemas que interactúan. El rendimiento depende también del contexto y cambia con el descanso, la práctica y la carga.',
      'Antes de medir tres piezas, escribe el orden de las comprobaciones. Cuando vuelvas tras una interrupción, identifica qué paso realizaste y cuál sigue.',
      'Diamond · Revisión de funciones ejecutivas','https://doi.org/10.1146/annurev-psych-113011-143750'],
    ['2 · Comprender el cerebro','Sueño, memoria y recompensa',
      'El sueño puede contribuir a consolidar recuerdos, pero una sola noche o un solo olvido no explican tu rendimiento. La señalización dopaminérgica cumple funciones diversas, entre ellas el aprendizaje sobre diferencias entre recompensas esperadas y recibidas. Una emoción o un hábito no permiten inferir niveles individuales de un neurotransmisor.',
      'Estudia una explicación breve, intenta recuperarla al día siguiente y contrástala con tus notas. Registra observaciones sin sacar conclusiones causales de un día.',
      'Rasch y Born · Revisión de sueño y memoria','https://doi.org/10.1152/physrev.00032.2012','Schultz, Dayan y Montague · Modelo de predicción y recompensa','https://doi.org/10.1126/science.275.5306.1593'],
    ['3 · Psicología cognitiva','Pensamientos automáticos y metacognición',
      'En herramientas inspiradas en TCC, distinguir pensamiento, emoción y conducta permite examinar lo que se infiere de una experiencia. Una predicción catastrófica anticipa consecuencias graves sin evaluar alternativas. El razonamiento todo o nada elimina grados útiles, como un borrador revisable.',
      'Registra una predicción antes de entregar un borrador. Escribe qué observación contaría a favor, cuál en contra y qué interpretación alternativa admite ambas.',
      'Rozental y cols. · Revisión de intervenciones para procrastinación','https://doi.org/10.3389/fpsyg.2018.01588'],
    ['3 · Psicología cognitiva','Aceptar malestar y elegir una acción',
      'La ACT propone flexibilidad psicológica: notar experiencias internas y elegir acciones por sus valores y consecuencias. Una acción de aprendizaje puede coexistir con incertidumbre. Nombrar el pensamiento ayuda a tratarlo como una experiencia que estás teniendo.',
      'Cambia «voy a fracasar» por «estoy teniendo la predicción de que voy a fracasar». Elige una comprobación breve, razonable y reversible.',
      'Hayes y cols. · Modelo y procesos de ACT','https://doi.org/10.1016/j.brat.2005.06.006'],
    ['4 · Cambio de comportamiento','Capacidad, oportunidad, motivación',
      'COM-B plantea que una conducta requiere capacidad, oportunidad y motivación. Un retraso por falta de acceso se aborda de forma distinta a un retraso por una instrucción ambigua. La activación conductual usa actividades planificadas y observables. Aquí se toma el principio educativo de elegir una actividad pequeña y revisar su resultado.',
      'Antes de comprometerte con una actividad, anota lo que sabes hacer, los recursos a los que tienes acceso y por qué la harías. Cambia primero el obstáculo concreto.',
      'Michie y cols. · Marco COM-B','https://doi.org/10.1186/1748-5908-6-42','Uphoff y cols. · Revisión de activación conductual','https://doi.org/10.1002/14651858.CD013305.pub2'],
    ['4 · Cambio de comportamiento','Refuerzo y planes si–entonces',
      'Un refuerzo es una consecuencia que aumenta la probabilidad de una conducta. Reforzar quitando un estímulo aversivo es refuerzo negativo. El contraste mental compara un resultado deseado con un obstáculo real. Un plan si–entonces vincula ese obstáculo con una respuesta específica.',
      'Define deseo, resultado, obstáculo y plan. Por ejemplo, si abro la red social mientras estudio, cierro la pestaña y leo el siguiente párrafo. Revisa si la señal ocurre y si la respuesta resulta practicable.',
      'Gollwitzer · Intenciones de implementación','https://doi.org/10.1037/0003-066X.54.7.493','Oettingen · Contraste mental','https://doi.org/10.1080/10463283.2011.643698'],
    ['5 · Filosofía aplicada','Decisión, hábito y responsabilidad',
      'Epicteto separa los juicios y las decisiones propias de resultados externos. Aristóteles presenta la virtud como algo que se practica mediante acciones repetidas y juicio contextual. Son marcos filosóficos para reflexionar sobre fines y responsabilidad.',
      'Escribe qué controlas, qué puedes influir y qué tendrás que aceptar en una actividad pospuesta. Identifica una acción que esté en la primera categoría.',
      'Epicteto · Manual, §1','https://classics.mit.edu/Epictetus/epicench.html','Aristóteles · Ética a Nicómaco, libro II','https://classics.mit.edu/Aristotle/nicomachaen.2.ii.html']
  ];
  const host=document.getElementById('mindLessons');
  for(const [level,title,theory,practice,source,url,extra,extraUrl] of lessons){
    const detail=document.createElement('details'),caption=document.createElement('summary');
    caption.textContent=level+' · '+title;detail.append(caption);
    for(const text of [theory,'Práctica: '+practice]){
      const p=document.createElement('p');p.textContent=text;detail.append(p);
    }
    for(const [label,href] of [[source,url],[extra,extraUrl]]){
      if(!label)continue;
      const p=document.createElement('p'),a=document.createElement('a');
      a.href=href;a.textContent=label;p.append(a);detail.append(p);
    }
    host.append(detail);
  }
})();
