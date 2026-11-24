'use strict';
(function(root){
  const models=[
    ['Primeros principios','Separar hechos verificables de supuestos y reconstruir una solución.','Tienes evidencia básica y la práctica habitual impide considerar alternativas.','El tiempo es crítico y existe un procedimiento validado que debe seguirse.','Desglosa qué cuesta realmente preparar comida en casa.','Distingue volumen depositado, viscosidad y acabado en una prueba de impresión.','Enumera tres supuestos y una medición que confirme o descarte cada uno.'],
    ['Pensamiento sistémico','Examinar interacciones, retroalimentaciones y retrasos entre variables.','Una intervención local puede desplazar el problema a otra parte del sistema.','El problema está bien aislado y se resuelve con una prueba directa más simple.','Dibuja cómo el sueño afecta la energía y cómo la energía afecta la hora de dormir.','Traza el efecto de la velocidad sobre registro, secado y merma.','Marca una relación medida, una hipótesis y un posible retraso.'],
    ['Pensamiento inverso','Preguntar cómo fallaría un plan para identificar medidas preventivas.','Estás antes de un lanzamiento, prueba, viaje o decisión difícil de revertir.','Necesitas evidencia sobre un fallo que ya ocurrió.','Imagina por qué se perdería un vuelo y define dos verificaciones.','Haz un premortem de una capacitación y registra responsables.','Describe el fallo más plausible y una señal temprana para reconocerlo.'],
    ['Segundo orden','Seguir el efecto directo de una decisión hasta sus consecuencias posteriores.','Las consecuencias afectan a más personas o se acumulan con el tiempo.','La inferencia depende de demasiados eslabones sin evidencia.','Evalúa qué pasa después de aceptar otra actividad semanal.','Anticipa el retrabajo de acelerar un control de salida.','Escribe un efecto inmediato, uno posterior y una condición que los cambiaría.'],
    ['Razonamiento probabilístico','Comparar resultados inciertos con rangos y actualizar la estimación con datos.','Las alternativas tienen resultados posibles y evidencia incompleta.','Solo tienes una impresión y necesitas una tasa medida para una decisión crítica.','Compara duraciones habituales de dos trayectos.','Estima la frecuencia de un defecto por muestra y registra su tamaño.','Distingue un dato observado de una estimación y define qué la cambiaría.'],
    ['Costo de oportunidad','Identificar el beneficio de la mejor alternativa a la que renuncias.','Los mismos recursos podrían destinarse a dos opciones mutuamente excluyentes.','Los beneficios y costos de las opciones no se han definido de forma comparable.','Compara una tarde de descanso con una tarde de estudio.','Compara usar una máquina para pruebas o para un pedido.','Escribe el siguiente mejor uso de cada hora o peso.'],
    ['Círculo de competencia','Delimitar en qué asuntos puedes juzgar con experiencia contrastada.','Tienes que decidir cuánto puedes verificar por tu cuenta.','La experiencia previa no corresponde al equipo, material o entorno actual.','Separa reparaciones domésticas conocidas de las que requieren especialista.','Revisa lo que puedes medir antes de interpretar datos metrológicos.','Traza tres zonas: conozco, puedo verificar y necesito consultar.'],
    ['Margen de seguridad','Reservar capacidad frente a incertidumbre o variación.','Hay consecuencias importantes si el tiempo, costo o tolerancia se agotan.','Un colchón arbitrario ocultaría causas sin medir o consumiría recursos escasos.','Deja holgura antes de una cita con traslado incierto.','Separa capacidad nominal y capacidad comprometida después de mantenimiento.','Define la reserva y la observación que permitiría reducirla.'],
    ['Navaja de Occam','Preferir la hipótesis con menos supuestos si ambas explican la evidencia.','Vas a priorizar pruebas entre hipótesis comparables.','La hipótesis más simple no explica datos relevantes.','Comprueba la batería antes de diagnosticar un equipo apagado.','Verifica el montaje antes de suponer un fallo electrónico no observado.','Compara dos hipótesis y escribe qué dato distinguiría una de otra.'],
    ['Principio de Pareto','Medir qué categorías concentran la mayor parte de un resultado.','Puedes clasificar y contar eventos o sumar costos comparables.','Las categorías ya se solapan o no representan el periodo de decisión.','Agrupa los gastos que más explican el exceso del mes.','Ordena por costo los defectos por tipo, usando un periodo común.','Valora qué cambia al ordenar por frecuencia en lugar de costo.'],
    ['Rendimientos decrecientes','Comparar el beneficio marginal de inversiones sucesivas.','Puedes medir el beneficio de cada unidad adicional de esfuerzo.','El proceso todavía cambia de escala o no es comparable entre ensayos.','Compara cuánto recuerdas tras cada bloque adicional de estudio.','Mide cuánto baja la merma tras cada ajuste escalonado.','Identifica dónde el costo adicional supera el beneficio observado.'],
    ['Incentivos','Examinar qué comportamientos recompensa o penaliza un sistema.','Observas que la conducta repetida difiere del objetivo declarado.','No tienes evidencia sobre el incentivo real de las personas.','Revisa qué hace más fácil completar un hábito en lugar de abandonarlo.','Busca si premiar velocidad reduce inspecciones necesarias.','Propón un indicador complementario y una forma de detectar efectos indeseados.'],
    ['Sesgo de confirmación','Buscar activamente observaciones que desafíen una hipótesis.','Hay una explicación favorita o las pruebas parecen selectivas.','No conviertas un desacuerdo sin datos en prueba contra la hipótesis.','Busca ejemplos que contradigan tu impresión de que una rutina nunca funciona.','Incluye muestras buenas y malas antes de atribuir el defecto a un proveedor.','Diseña una prueba cuyo resultado podría hacerte cambiar de opinión.'],
    ['Efectos acumulativos','Evaluar el resultado de cambios pequeños que se repiten.','Una mejora o desviación se repite en múltiples periodos.','La tasa cambia mucho y extrapolar ocultaría esa variación.','Observa el efecto mensual de un gasto recurrente.','Calcula la pérdida total por desecho al arranque a lo largo de varios turnos.','Registra la tasa por periodo y compara suma observada con una proyección.'],
    ['Ventaja comparativa','Asignar esfuerzo según el costo de oportunidad relativo.','Dos personas o equipos pueden hacer las mismas tareas con costos distintos.','Existen restricciones de autorización o no puedes comparar la calidad del resultado.','Divide tareas de casa según lo que deja de hacer cada persona.','Distribuye medición y preparación considerando quién puede abandonar menos trabajo crítico.','Construye una tabla de tiempos y calcula a qué renuncia cada opción.'],
    ['Teoría de juegos','Prever cómo podrían responder otros a cada decisión.','El resultado depende de elecciones interdependientes.','No puedes observar restricciones, incentivos o decisiones de las otras partes.','Practica un acuerdo para compartir una responsabilidad.','Prevé la respuesta del proveedor a dos opciones de entrega.','Propón dos respuestas plausibles y una opción que beneficie a ambos.'],
    ['Pensamiento contrafactual','Comparar un resultado con una alternativa coherente que no se observó.','Quieres explorar causas, futuros o lecciones tras un evento.','No hay base para mantener comparables las otras variables.','Pregunta qué habría cambiado si hubieras salido antes.','Estima qué pasaría con el mismo material bajo otra configuración y luego haz una prueba.','Anota qué habría cambiado, qué quedaría fijo y qué nunca podrás observar directamente.'],
    ['Deducción','Derivar una consecuencia necesaria si las premisas son verdaderas.','Tienes una regla clara y sabes que se cumplen sus condiciones.','La regla tiene excepciones o una premisa no ha sido verificada.','Aplica una condición explícita de vencimiento de una garantía.','Interpreta una tolerancia documentada para un lote medido.','Escribe la regla, el caso y la conclusión por separado.'],
    ['Inducción y abducción','Inferir un patrón de observaciones y proponer la explicación más plausible.','Necesitas generar hipótesis comprobables a partir de mediciones.','Los datos son escasos, sesgados o no distinguen explicaciones entre sí.','Relaciona horarios con tu concentración y considera otras explicaciones.','Busca un patrón en defectos sin afirmar aún que lo causa el anilox.','Separa patrón, explicación alternativa y prueba de descarte.']
  ];
  if(typeof module==='object'){module.exports={models};return;}
  const rootNode=document.getElementById('personalModelsList');
  const query=document.getElementById('personalModelsSearch');
  function text(parent,tag,content){
    const el=document.createElement(tag);el.textContent=content;parent.append(el);return el;
  }
  const normalize=value=>value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
  function render(){
    rootNode.replaceChildren();
    const matches=models.filter(item=>normalize(item.join(' ')).includes(normalize(query.value.trim())));
    for(const [name,meaning,use,limit,life,work,exercise] of matches){
      const item=document.createElement('details');
      item.className='card';rootNode.append(item);
      text(item,'summary',name);
      const list=text(item,'dl','');
      for(const [label,value] of [['En qué consiste',meaning],['Cuándo ayuda',use],['Límite',limit],['Ejemplo personal',life],['Ejemplo de trabajo',work],['Ejercicio',exercise]]){
        text(list,'dt',label);text(list,'dd',value);
      }
      const button=text(item,'button','Preparar revisión crítica');
      button.type='button';button.className='secondary';
      button.onclick=()=>root.liftsJournal.prepareDraft('review',{title:name,tests:exercise});
    }
    if(!matches.length)text(rootNode,'p','No hay modelos que coincidan.');
  }
  query.oninput=render;
  function reset(){query.value='';render();}
  root.addEventListener('nexo-state',reset);
  root.liftsModels={reset};
  reset();
})(globalThis);
