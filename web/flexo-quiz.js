'use strict';
(() => {
  const bank = [
    ['Moiré', 'Avanzado', 'Cada separación impresa sola se ve uniforme. Al sobreimprimir cian y magenta aparece un patrón diagonal periódico que también se ve en la prueba de preprensa. ¿Qué revisar primero?', 1, [
      ['Variación de tensión entre cuerpos', 'Puede afectar registro, pero el patrón ya está en la prueba de preprensa.'],
      ['Ángulos y lineaturas efectivos de las dos tramas', 'La superposición de dos redes periódicas puede generar frecuencias de batido. Comprueba los ángulos y lineaturas en los datos rasterizados.'],
      ['Excentricidad del cilindro', 'Causaría una variación relacionada con la vuelta del cilindro y no explica la prueba previa.'],
      ['Viscosidad del magenta', 'Puede cambiar densidad y transferencia, sin explicar que el patrón aparezca en la prueba.']]],
    ['Registro', 'Intermedio', 'El magenta queda desplazado 0.4 mm en avance respecto al negro en todas las repeticiones y a ambos lados. El paso de ambas separaciones es igual. ¿Qué corrección geométrica corresponde?', 2, [
      ['Registro lateral', 'Actúa transversalmente y el error medido es longitudinal.'],
      ['Cambiar el paso', 'El paso coincide. Alterarlo haría crecer o reducir el desplazamiento entre repeticiones.'],
      ['Corregir la fase longitudinal del magenta', 'El desplazamiento constante con paso idéntico es un error de fase. Verifica el sentido con las marcas de registro.'],
      ['Girar la placa respecto al eje', 'Un giro compensaría una diferencia entre lados. Ambos lados presentan el mismo error.']]],
    ['Tensión', 'Avanzado', 'Tras acelerar, un sensor calibrado registra oscilación de tensión entre dos rodillos motrices y el registro longitudinal oscila en sincronía. A velocidad estable ambos se estabilizan. ¿Qué prueba discrimina mejor la causa?', 3, [
      ['Medir una sola marca después de detener la prensa', 'Una medida estática no reproduce la oscilación durante la rampa.'],
      ['Cambiar el ángulo de trama', 'Modifica la interacción de puntos, no el control dinámico de la banda.'],
      ['Ajustar el registro lateral en régimen estable', 'El defecto es longitudinal y aparece durante una transición.'],
      ['Registrar consigna, tensión real y velocidades durante la misma rampa', 'Una serie sincronizada permite comparar la respuesta del lazo con el desajuste de velocidades antes de cambiar parámetros.']]],
    ['Anilox', 'Intermedio', 'Un anilox limpio alternativo con la misma especificación devuelve la densidad esperada usando la misma tinta, placa y sustrato. El anilox retirado tiene residuos secos visibles en celdas. ¿Qué medir antes y después de limpiarlo?', 0, [
      ['Volumen efectivo de las celdas', 'Los residuos ocupan volumen y reducen la tinta disponible. Una medición calibrada permite cuantificar la recuperación.'],
      ['Paso de la placa', 'Afecta la repetición y es común a ambas tiradas.'],
      ['Tensión de la bobina de salida', 'No mide capacidad de las celdas ni verifica el resultado de la limpieza.'],
      ['Ángulo de trama del diseño', 'Permanece constante al sustituir el anilox.']]],
    ['Placas', 'Avanzado', 'La imagen de la placa tiene el tamaño previsto en plano. Montada, la distancia entre marcas longitudinales aumenta respecto al diseño y la transversal se conserva. Se repite en todas las vueltas. ¿Qué revisar en preprensa?', 1, [
      ['Compensación transversal del diseño', 'La medición transversal ya coincide.'],
      ['Compensación longitudinal por montaje cilíndrico', 'La superficie de imagen se alarga al curvar la placa. El factor depende del sistema de placa, cinta y cilindro.'],
      ['Offset longitudinal de registro', 'Desplazar la fase mueve todas las marcas igual y conserva la distancia entre ellas.'],
      ['Desplazamiento del borde de la bobina', 'Se manifiesta principalmente como deriva transversal.']]],
    ['Montaje', 'Intermedio', 'Una burbuja visible bajo la placa coincide con un halo y ensanchamiento localizado que vuelve en la misma posición de cada vuelta. ¿Qué intervención aborda la evidencia?', 2, [
      ['Aumentar la presión de todos los cuerpos', 'Modificaría áreas sanas y no eliminaría el relieve local causado por la burbuja.'],
      ['Cambiar la formulación de tinta', 'No corrige la elevación mecánica localizada.'],
      ['Remontar la placa según el procedimiento del equipo', 'Eliminar la burbuja recupera el apoyo uniforme. Compara la nueva impresión en la misma posición.'],
      ['Corregir el avance del troquel', 'Afectaría la posición del corte, no la presión entre placa y sustrato.']]],
    ['Troquelado', 'Avanzado', 'El troquel corta el frontal y se ven marcas profundas coincidentes con el filo en el papel soporte. La posición del corte respecto al arte es correcta. ¿Qué verificar?', 3, [
      ['Fase longitudinal del troquel', 'Cambiaría la posición del corte sin corregir su profundidad.'],
      ['Volumen del anilox', 'Afecta el depósito de tinta, no la penetración del filo.'],
      ['Posición de la guía lateral', 'No explica marcas coincidentes con el filo en un corte correctamente registrado.'],
      ['Penetración del troquel y compatibilidad con el espesor del laminado', 'El corte parcial debe separar el frontal sin debilitar el soporte. Revisa la combinación troquel, yunque y material según sus especificaciones.']]],
    ['Defectos · presión', 'Intermedio', 'Al aumentar deliberadamente la impresión placa–sustrato en una prueba controlada, aparecen halos en bordes y los puntos crecen. Al volver al ajuste inicial desaparecen. ¿Qué variable quedó aislada?', 0, [
      ['Exceso de presión placa–sustrato', 'La respuesta reversible identifica esa presión como causa del cambio observado. La deformación ensancha los elementos.'],
      ['Curado insuficiente de tinta', 'Puede causar manchado o transferencia posterior, pero no fue la variable modificada.'],
      ['Desgaste del anilox', 'El desgaste no aparece y desaparece por cambiar la presión placa–sustrato.'],
      ['Ángulos de trama incompatibles', 'Causarían un patrón de interferencia, no este crecimiento reversible.']]],
    ['Defectos · rayas', 'Avanzado', 'Tras detener el equipo según su procedimiento, se observa una partícula bajo la rasqueta justo en la posición transversal de una raya continua. Al retirar la partícula, la raya desaparece. ¿Qué mecanismo concuerda?', 1, [
      ['Variación de fase del cilindro', 'Es un error de posición de imagen, sin una raya continua en un punto transversal fijo.'],
      ['Dosificación alterada localmente en el contacto rasqueta–anilox', 'La partícula perturba el contacto en un punto fijo, que se proyecta a lo largo de la banda. La desaparición tras retirarla confirma el vínculo.'],
      ['Rebote de placa en el empalme', 'Se relacionaría con una posición angular y reaparecería por vuelta.'],
      ['Interferencia entre tramas', 'Normalmente genera un patrón periódico en áreas tramadas, no una línea fija eliminada al limpiar.']]],
    ['Troquelado · repetición', 'Avanzado', 'La primera etiqueta queda centrada. La distancia desde el origen hasta cada corte siguiente crece 0.25 mm menos por repetición que la distancia a la marca impresa. El paso impreso medido es 100.00 mm y el corte avanza menos por repetición. ¿Qué paso de corte explica la deriva?', 2, [
      ['100.25 mm', 'La diferencia tiene signo contrario: el corte quedaría progresivamente más adelante en coordenadas de distancia desde el origen.'],
      ['100.00 mm', 'Pasos iguales mantienen la distancia relativa constante, sin deriva acumulada.'],
      ['99.75 mm', 'Cada corte está 0.25 mm antes de la siguiente impresión: 100.00 − 0.25 = 99.75 mm. Compara ambas series desde el mismo origen.'],
      ['99.50 mm', 'Produciría una deriva de 0.50 mm por repetición, el doble de lo observado.']]]
  ];
  function validate(questions, count) {
    const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
    if (!Array.isArray(questions) || questions.length !== count) return false;
    return questions.every(q => Array.isArray(q) && q.length === 5 && text(q[0], 70) &&
      ['Intermedio', 'Avanzado'].includes(q[1]) && text(q[2], 650) &&
      Number.isInteger(q[3]) && q[3] >= 0 && q[3] < 4 && Array.isArray(q[4]) &&
      q[4].length === 4 && q[4].every(o => Array.isArray(o) && o.length === 2 && text(o[0], 220) && text(o[1], 500)) &&
      new Set(q[4].map(o => o[0].trim().toLowerCase())).size === 4) &&
      new Set(questions.map(q => q[2].trim().toLowerCase())).size === count;
  }
  const api = {bank, validate};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.liftsFlexoQuiz = api;
})();
