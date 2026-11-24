'use strict';
(function(root){
  const criteria={
    clarity:'Claridad',
    arguments:'Argumentos',
    coherence:'Coherencia'
  };
  const option=(reply,reaction,next,marks,feedback)=>({reply,reaction,next,marks,feedback});
  const step=(prompt,options)=>({prompt,options});
  const clear=['clarity','arguments','coherence'];
  const scenarios={
    proposal:{
      title:'Negociar una fecha de entrega',
      role:'Coordinas un pedido de etiquetas. El cliente quiere adelantar toda la entrega dos días. Tienes capacidad confirmada para una primera parte y aún faltan pruebas de liberación.',
      steps:{
        start:step('Necesito toda la orden el miércoles. ¿Puedes garantizarla?',{
          learn:option('¿Qué cantidad necesitas para iniciar y a qué hora? Hoy puedo confirmar la capacidad de la primera parte.','Necesito 2,000 para el arranque. El saldo puede esperar.', 'scope',clear,'La cantidad y la hora permiten negociar sobre la necesidad real sin ofrecer capacidad sin confirmar.'),
          promise:option('Creo que podemos terminar todo el miércoles si ponemos la orden primero.','Entonces cambio mi programación a este miércoles. ¿Me lo confirmas?', 'repair',['clarity'],'Diferenciar una posibilidad de un compromiso evita que el cliente reorganice su operación sobre una estimación.')
        }),
        scope:step('Con esas 2,000 puedo iniciar. ¿Qué debe pasar para que salgan?',{
          plan:option('Confirma la hora y el punto de entrega. En cuanto Calidad libere la primera parte, confirmo el despacho y la fecha del saldo.','La hora límite es 14:00. Prefiero un aviso temprano si se retrasa la liberación.', 'close',clear,'El compromiso queda condicionado a una liberación real, con responsables y seguimiento.'),
          vague:option('Con 2,000 seguro encontramos cómo. Te aviso cuando estén listas.','Necesito también saber cuándo decidirás si puedo contar con ellas.', 'close',[],'Identificar el punto de decisión permite al cliente preparar una alternativa antes de que se agote el plazo.')
        }),
        repair:step('Ya avisé al equipo que toda la orden estará lista. ¿Qué les digo?',{
          repair:option('Aclaro mi estimación. La capacidad confirmada cubre una primera parte y la liberación sigue pendiente. Revisemos cuánto necesitas para el arranque.','Puedo corregir el aviso si me das un próximo punto de confirmación.', 'close',clear,'Corregir a tiempo baja el riesgo de mantener un compromiso que todavía no se puede sostener.'),
          insist:option('Déjalo así por ahora. Si hay algún problema lo vemos el miércoles.','Haré planes contando con la orden completa.', 'close',[],'Postergar la corrección amplía el impacto si la capacidad o la liberación no alcanzan.')
        }),
        close:step('¿Qué confirmación quedará para dar seguimiento?',{
          recap:option('Resumiré por escrito qué está confirmado, qué depende de Calidad y a qué hora actualizaremos la situación.','Con ese resumen puedo coordinar el arranque.',null,clear,'La recapitulación separa hechos, pendientes y el próximo contacto.'),
          pressure:option('Decidimos en cuanto termine producción. No hace falta un resumen.','Si cambia el pedido, no tendremos un acuerdo claro para revisarlo.',null,[],'Sin un acuerdo verificable es más difícil detectar una diferencia de interpretación.')
        })
      }
    },
    interview:{
      title:'Entrevista para un puesto técnico',
      role:'Buscas un puesto en calidad. Te preguntan por un defecto recurrente. En tu ejemplo recogiste muestras y ayudaste a contrastar una hipótesis; la aprobación fue de tu supervisora.',
      steps:{
        start:step('Cuéntame cómo resolviste un problema repetitivo en planta.',{
          evidence:option('En una orden con defecto recurrente registré dónde aparecía, comparé dos muestras y presenté los resultados a mi supervisora, que aprobó el cambio.','Se distingue tu contribución. ¿Qué mostraron las mediciones?', 'scope',clear,'Una respuesta precisa identifica tu papel, una acción observada y una validación responsable.'),
          big:option('Soy muy bueno resolviendo defectos. En mi equipo siempre conseguía resultados rápidos.','¿Puedes contarme una intervención específica que podamos revisar?', 'repair',[],'Una afirmación general no permite entender cuál fue tu participación o cómo se obtuvo el resultado.')
        }),
        scope:step('¿Qué resultados puedes compartir y qué limitación tuvo la prueba?',{
          bound:option('Puedo describir la tendencia y el método sin compartir datos del cliente. La prueba comparó dos muestras y se tuvo que confirmar en una orden posterior.','Gracias. Queda claro cómo respaldaste el hallazgo.', 'close',clear,'Explicar la limitación hace que la evidencia tenga el alcance adecuado y protege información de terceros.'),
          oversell:option('Las dos muestras probaron que la causa siempre es la misma.','Eso suena más amplio que el alcance de la prueba.', 'close',['clarity'],'Una muestra acotada permite orientar una decisión, pero no extrapolar automáticamente a todas las órdenes.')
        }),
        repair:step('Necesito un ejemplo con una acción que hayas realizado tú.',{
          specify:option('En una orden repetí el muestreo en dos posiciones. Presenté dónde cambiaba el defecto y propuse qué comprobar después; la supervisora autorizó la prueba.','Ahora puedo reconstruir tu participación.', 'close',clear,'Un ejemplo concreto corrige una respuesta vaga sin exagerar responsabilidad.'),
          evade:option('Hicimos cosas parecidas todo el tiempo. Es difícil elegir una.','Queda poca evidencia para evaluar tu experiencia.', 'close',[],'Elegir un solo caso acotado suele comunicar más que insistir en una afirmación amplia.')
        }),
        close:step('¿Cómo aplicarías lo aprendido en este puesto?',{
          transfer:option('Primero revisaría el proceso de registro del equipo, separaría observaciones de hipótesis y acordaría cómo validar cada prueba.','Ese enfoque me ayuda a imaginar tu trabajo en nuestro proceso.',null,clear,'Una transferencia concreta vincula el ejemplo con el puesto y reconoce que cada proceso tiene sus propios controles.'),
          broad:option('Haría exactamente lo mismo desde el primer día.','Nuestros equipos y controles pueden ser diferentes.',null,['clarity'],'La transferencia funciona mejor cuando la práctica se adapta al contexto disponible.')
        })
      }
    },
    presentation:{
      title:'Presentar un cambio de proceso',
      role:'Presentas a supervisión una propuesta para registrar condiciones de impresión de forma más consistente. Solo cuentas con datos de un turno.',
      steps:{
        start:step('Tenemos cinco minutos. ¿Qué quieres que decidamos?',{
          agenda:option('Pido autorización para un piloto en dos turnos. Voy a explicar el problema registrado, la medición y el criterio para revisar el resultado.','Entiendo la decisión. ¿Qué puedes sostener con los datos del primer turno?', 'scope',clear,'Exponer la decisión y la secuencia orienta a la audiencia en el tiempo disponible.'),
          detail:option('Traje varias gráficas y quiero revisarlas todas desde el principio.','Antes de verlas necesito saber qué debo aprobar.', 'repair',[],'Una presentación dirigida a decisión gana claridad si empieza por la petición y luego muestra la evidencia.')
        }),
        scope:step('La variación bajó en un turno. ¿Por qué extender el piloto?',{
          pilot:option('El dato orienta, pero no prueba el efecto en otros turnos. Propongo repetir con el mismo criterio de muestreo y acordar antes la comparación.','Me interesa un piloto que pueda revisarse con el mismo criterio.', 'close',clear,'La petición es proporcional al alcance de la medición y hace verificable la siguiente decisión.'),
          generalize:option('La reducción ya demuestra que funciona en cualquier turno.','Las condiciones de los otros turnos no se evaluaron.', 'close',['clarity'],'Separar la observación de una conclusión general fortalece el argumento.')
        }),
        repair:step('Dime primero la petición y el dato más relevante.',{
          recover:option('Solicito un piloto en dos turnos. Tenemos una comparación inicial de un turno y queremos repetirla bajo un criterio común.','Bien. Presenta solo el dato que respalda ese piloto.', 'close',clear,'Reducir el alcance recupera la atención y deja tiempo para decidir.'),
          persist:option('Para decidir necesitas ver cada gráfica. Empecemos con la primera.','Se nos acaba el tiempo para acordar una acción.', 'close',[],'Un dato seleccionado y relacionado con la decisión es más útil que una secuencia completa sin prioridad.')
        }),
        close:step('¿Cómo sabremos si el piloto merece continuar?',{
          follow:option('Registraremos las condiciones y el criterio acordado. En la próxima revisión veremos la comparación antes de decidir si extenderlo.','De acuerdo. Agenda esa revisión con los turnos involucrados.',null,clear,'Cerrar con medida, revisión y decisión posterior vuelve evaluable el piloto.'),
          loose:option('Lo veremos cuando haya más datos.','Sin un criterio definido será difícil revisar el resultado.',null,[],'Formular el criterio antes de medir reduce reinterpretaciones posteriores.')
        })
      }
    },
    conflict:{
      title:'Resolver un desacuerdo entre áreas',
      role:'Producción y Calidad discrepan sobre si un lote puede pasar a la siguiente etapa. La desviación está documentada y aún falta una medición prevista en el protocolo local.',
      steps:{
        start:step('Calidad siempre se tarda. El lote debería seguir ahora.',{
          hear:option('Entiendo que detenerlo afecta el programa. ¿Podemos revisar juntos la medición pendiente y acordar cuándo dar la respuesta?', 'La espera preocupa porque el siguiente equipo ya está preparado.', 'scope',clear,'Reconocer el impacto y proponer una verificación centra la conversación en el proceso.'),
          blame:option('Producción siempre quiere saltarse pasos. No hay nada que discutir.','Si me acusas, se hace más difícil reorganizar el turno.', 'repair',[],'Un juicio sobre el área desplaza el problema medible y dificulta obtener información.')
        }),
        scope:step('¿Qué hacemos mientras esperamos el dato?',{
          contain:option('Mantengamos el lote identificado según el protocolo y avisemos al siguiente equipo el plazo estimado y quién dará el resultado.','Así puedo reorganizar la carga mientras esperamos.', 'close',clear,'La contención y la coordinación avanzan sin sustituir el criterio de liberación.'),
          release:option('Dejemos pasar una parte mientras sale el resultado.','¿Quién responde si esa parte también tiene la desviación?', 'close',[],'Una salida parcial sin criterio acordado puede perder trazabilidad y mezclar material pendiente de evaluación.')
        }),
        repair:step('Necesito una salida práctica, no una acusación.',{
          reset:option('Reformulo. Tenemos una medición pendiente y un plazo de producción. Identifiquemos quién mide y qué podemos preparar en paralelo respetando el protocolo.','Puedo preparar el equipo sin mover el lote.', 'close',clear,'Volver a hechos, responsables y acciones realistas permite retomar la coordinación.'),
          point:option('Lo único importante es que se respete mi posición.','Aún falta una forma de coordinar el turno.', 'close',[],'Separar la posición personal de los criterios técnicos permite explorar acciones sin perder el control.')
        }),
        close:step('¿Qué les decimos a quienes esperan el lote?',{
          update:option('Comunicamos el estado pendiente, la medición que falta y cuándo habrá una decisión conforme al protocolo.','Ese mensaje sirve para todo el turno.',null,clear,'La comunicación reduce confusión y no se adelanta al resultado de la verificación.'),
          hide:option('Digamos que ya está resuelto para evitar más discusiones.','Podrían operar con una decisión que aún no se tomó.',null,[],'Informar un estado incorrecto crea decisiones operativas sobre datos erróneos.')
        })
      }
    },
    explanation:{
      title:'Explicar una medición a otra área',
      role:'Un compañero de compras pregunta por qué dos muestras con un color parecido obtuvieron resultados distintos de Delta E. Conoces la condición del instrumento, pero falta confirmar cómo se prepararon las muestras.',
      steps:{
        start:step('Si se ven parecidas, ¿por qué el instrumento dice que son distintas?',{
          plain:option('Delta E resume la diferencia medida. Primero confirmemos que se compararon con el mismo ajuste del instrumento y que ambas muestras se prepararon igual.','Entiendo la diferencia medida. ¿Qué condición concreta vamos a revisar?', 'scope',clear,'La explicación conecta el concepto con un paso verificable y delimita qué falta comprobar.'),
          jargon:option('Es porque el Delta E de CIELAB responde a coordenadas y condiciones instrumentales.','Eso suena técnico. Todavía no sé qué explica la diferencia ni qué revisaremos.', 'repair',['arguments'],'Los términos técnicos ayudan cuando se definen y se relacionan con una decisión práctica.')
        }),
        scope:step('¿Qué podría cambiar entre muestras que parezcan iguales?',{
          compare:option('El respaldo o la preparación pueden cambiar la lectura. Revisaré la condición registrada y pediré las dos preparaciones antes de atribuir una causa.','Entonces esperamos la comprobación para decidir.', 'close',clear,'Separar causas posibles de evidencia observada evita una conclusión prematura.'),
          conclude:option('Seguro se debe a cómo se preparó una muestra.','Aún no hemos revisado esas preparaciones.', 'close',['clarity'],'La causa sigue abierta hasta que la comprobación permita sostenerla.')
        }),
        repair:step('Si se lo cuento al proveedor, ¿cuál sería la versión breve?',{
          translate:option('El instrumento cuantificó una diferencia. Revisaremos si ambas muestras se midieron bajo la misma condición antes de decidir qué significa.', 'Esa versión sí explica el hallazgo y el paso siguiente.', 'close',clear,'Definir la diferencia sin tecnicismos y proponer una comprobación conserva la precisión.'),
          repeat:option('Dile que hay un problema en el CIELAB y que lo corrija.','No tenemos confirmada una causa para pedir esa corrección.', 'close',[],'Pedir una corrección antes de aislar la causa puede generar retrabajo sin resolver la diferencia.')
        }),
        close:step('¿Cómo compruebas que entendí lo que puedo decir?',{
          teachback:option('Dime con tus palabras qué sabemos y qué dato falta antes de acordar una corrección.','Sabemos que hubo una diferencia medida. Falta confirmar que la comparación fue equivalente.',null,clear,'Pedir una reformulación permite detectar malentendidos antes de compartir la conclusión.'),
          assume:option('Ya lo expliqué. Copia las coordenadas y envíalas.','Puedo enviar los números, pero me falta interpretar el mensaje.',null,[],'Una señal explícita de comprensión es más útil que asumirla por haber mostrado cifras.')
        })
      }
    }
  };

  function play(id,choices=[]){
    if(!Object.hasOwn(scenarios,id)||!Array.isArray(choices))throw new Error('Elige un caso de práctica.');
    const scenario=scenarios[id];
    let next='start';
    const turns=[];
    const marks=Object.fromEntries(Object.keys(criteria).map(key=>[key,0]));
    for(const choice of choices){
      const stage=scenario.steps[next];
      if(!stage||!Object.hasOwn(stage.options,choice))throw new Error('Esta respuesta no pertenece al diálogo actual.');
      const selected=stage.options[choice];
      turns.push({prompt:stage.prompt,...selected});
      for(const key of selected.marks)marks[key]++;
      next=selected.next;
    }
    return {scenario,turns,step:next?scenario.steps[next]:null,marks,finished:next===null};
  }

  const api={criteria,scenarios,play};
  if(typeof module==='object')module.exports=api;else root.liftsNegotiationCore=api;
})(globalThis);
