# Lifts Guardian

Base revisada `9ea6979`. Rama local de recuperación `backup/antes-guardian`.

Lifts ya tiene Agenda y enfoque, recordatorios configurables, hábitos, Radar, memoria privada, continuidad Nexus, diarios, voz, Academia, Builder, utilidades PDF y visuales, y calculadoras técnicas. Guardian usa la misma autenticación y el mismo espacio por propietario. El resumen y los borradores se generan en el navegador sin enviar los registros a un modelo ni requerir dependencias nuevas.

| Bloques | Estado | Alcance |
| --- | --- | --- |
| 1, 29 | Parcial | Acceso desde Inicio y vistas de preparación, jornada y cierre. Incluye cruce de bloques, prioridades, tareas completadas y planificación de mañana. Niveles con límites por categoría. Pendientes estructura de materiales, rotación de contenidos y avisos configurables propios. |
| 2 | Parcial | Una cosa a la vez muestra el primer paso pendiente de una tarea prioritaria. La revisión de solicitudes usa etiquetas explícitas, señala datos faltantes o contradictorios, muestra los materiales registrados y prepara una primera acción en Agenda. Quedan interpretación de texto libre, dependencias y delegación. |
| 3 | Pendiente de ampliación | Se conservan hábitos, temporizador y planificación existentes. Faltan plantillas y la ejecución guiada de rutinas. |
| 4 | Implementado | Diez categorías, fechas, compromiso, prioridad, cierre y reapertura, borrador de mensaje y borrador de recordatorio. |
| 5 | Pendiente de ampliación | La memoria existente conserva la búsqueda privada y el consentimiento, falta la clasificación cotidiana solicitada. |
| 6–14 | Pendientes de ampliación | Se conservan calculadoras, Builder, Agenda, documentos locales, herramientas visuales, buscador, voz y procedimientos. Faltan las ampliaciones especializadas de cada área. |
| 15–22 | Parcial | Una idea de inicio con paráfrasis y referencia de Epicteto. Faltan los recorridos profundos de filosofía, estoicismo, sabiduría, diálogo, lógica, psicología, neurociencia y sesgos. |
| 23–28 | Pendientes de ampliación | Se conservan diario, lecciones aprendidas y utilidades locales. Faltan las nuevas funciones de reflexión, ética, aprendizaje diario, herramientas complementarias y portapapeles. |
| 30 | Pendiente | Perfiles ampliados de personalidad del asistente. |
| 31–32 | Parcial | Revisión en pantalla con razones, límites y categorías, y enlaces a Agenda, Nexus y Recordatorios. Pendientes los demás flujos de integración de la especificación. |
| 33 | En pruebas | Pruebas de regresión y casos nuevos descritos abajo. |

## Uso y alcance

Abre **Guardian** desde Inicio o Buscar. Los cruces se calculan sobre bloques pendientes ya registrados. Las prioridades usan la fecha, el horario y la prioridad de Agenda. Los seguimientos aparecen en la revisión al llegar su fecha. Cerrar un seguimiento lo conserva para poder reabrirlo. Preparar un recordatorio abre el editor existente y requiere elegir fecha y hora y guardar. Preparar un mensaje genera texto editable local.

Las preferencias y los seguimientos se guardan en `guardianPreferences` y `guardianFollowups` dentro del espacio privado existente. Los borradores y el modo de enfoque se limpian al cambiar de cuenta. La revisión funciona con la aplicación abierta. Las notificaciones programadas pertenecen al módulo Recordatorios y dependen de su configuración habitual.

Archivos principales: `web/guardian.js`, `web/index.html`, `web/app.js`, `web/nexus-core.js`. Los casos de prueba cubren cálculo de cruces, prioridades y cierres, validación de fechas y conservación de identidad del seguimiento, y el recorrido móvil de enfoque, guardado, mensajes y separación de cuentas con autenticación simulada.
