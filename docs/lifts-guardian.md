# Lifts Guardian

Base revisada `9ea6979`. Rama local de recuperación `backup/antes-guardian`.

Lifts ya tiene Agenda y enfoque, recordatorios configurables, hábitos, Radar, memoria privada, continuidad Nexus, diarios, voz, Academia, Builder, utilidades PDF y visuales, y calculadoras técnicas. Guardian usa la misma autenticación y el mismo espacio por propietario. El resumen y los borradores se generan en el navegador sin enviar los registros a un modelo ni requerir dependencias nuevas.

| Bloque | Estado | Alcance y pendiente |
| --- | --- | --- |
| 1 · Guardian | Parcial | Preparación, jornada, cierre, prioridades y límites. Faltan avisos propios, preparación de materiales integrada y descanso configurable. |
| 2 · Executive | Parcial | Interpreta etiquetas explícitas, propone primera acción y prepara un borrador en Agenda. Faltan texto libre, dependencias y delegación. |
| 3 · Routine | Parcial | Doce plantillas, pasos editables, material previo, temporizador web, lectura compatible y últimos veinte resultados. Faltan reglas condicionales ampliadas e integración con avisos. |
| 4 · Follow-up | Implementado | Diez categorías, compromiso, fecha, prioridad, cierre, reapertura y borradores de mensaje y recordatorio. |
| 5 · Memory Assistant | Parcial | Categoría, contexto, fecha de alta, búsqueda local, archivo y recuperación. Faltan captura dedicada por voz y respuestas naturales locales desde el chat. |
| 6 · Calculator Hub | Parcial | Builder y calculadoras existentes; captura rápida evalúa expresiones aritméticas. Falta un catálogo unificado y ampliar las calculadoras. |
| 7 · Time Intelligence | Parcial | Agenda, cruces y planificación existentes. Falta ampliar el análisis temporal solicitado. |
| 8 · Field Mode | Pendiente | Falta un flujo de campo con controles y almacenamiento adaptados. |
| 9 · Document Intelligence | Parcial | Utilidades PDF locales y biblioteca existentes. Falta ampliar extracción y análisis. |
| 10 · Visual Tools | Parcial | Diagnóstico y utilidades visuales existentes. Falta la cobertura de la especificación. |
| 11 · Control Panel | Parcial | Panel de operaciones, permisos y Radar existentes. Falta unificar los controles de Guardian. |
| 12 · Quick Reference | Parcial | Consulta rápida filtrable de seis lecturas con fuentes. Faltan fichas científicas, técnicas y profesionales. |
| 13 · Voice | Parcial | La voz existente se complementa con lectura de pasos de rutina. Faltan comandos específicos de Guardian. |
| 14 · Protocols | Parcial | Procedimientos Nexus y ejecución guiada de rutinas. Faltan plantillas y reglas de protocolos especializados. |
| 15 · Philosophy | Parcial | Lecturas introductorias de Epicteto, Aristóteles y Platón. Faltan cursos profundos, ramas, escuelas y autores. |
| 16 · Stoic | Parcial | Lectura y ejercicio para distinguir lo que depende de uno. Falta el recorrido completo. |
| 17 · Wisdom | Parcial | Una lectura diaria rotativa, referencias y borrador de reflexión. Faltan biblioteca personal de frases y tarjetas descargables. |
| 18 · Socrates | Parcial | Ejercicio de aclaración socrática. Falta diálogo ramificado. |
| 19 · Logic | Parcial | Una ficha inicial de inferencia. Faltan herramientas de análisis y ejercicios ampliados. |
| 20 · Psychology | Pendiente | Faltan contenidos y herramientas propios. |
| 21 · Neuroscience | Pendiente | Falta desarrollar el contenido y verificar sus fuentes. |
| 22 · Cognitive Biases | Parcial | Ficha de sesgo de confirmación. Faltan los demás sesgos y actividades. |
| 23 · Journal | Parcial | El diario Nexus recibe borradores de reflexión. Faltan modalidades adicionales. |
| 24 · Life Lessons | Parcial | Lecciones aprendidas Nexus con fuentes e integración desde lecturas. Faltan más conexiones. |
| 25 · Ethics | Parcial | Una ficha breve de práctica de virtud. Faltan marcos y análisis de dilemas. |
| 26 · Learn Something | Parcial | Rotación diaria de seis fichas con ejercicio. Falta personalización y seguimiento. |
| 27 · Complementarias | Parcial | Se conservan las utilidades existentes. Falta la ampliación solicitada. |
| 28 · Smart Clipboard | Parcial | Pegar texto, aritmética, fechas ISO, instrucciones, tabla, URL, nota y misión. Faltan conversiones directas, mediciones y clasificación avanzada. |
| 29 · Home | Parcial | Acceso a Guardian desde Inicio y resumen de jornada. Faltan más controles y distribución. |
| 30 · Personalidad | Pendiente | Faltan perfiles ampliados de personalidad del asistente. |
| 31 · Proactivo | Parcial | Revisiones por categoría y razones en pantalla. Faltan más reglas y avisos programados específicos. |
| 32 · Integración | Parcial | Agenda, Nexus, Recordatorios, Rutinas y Memoria conectados con controles existentes. Faltan los demás flujos del documento. |
| 33 · Validación | Parcial | Pruebas de los recorridos implementados. Pendientes validación en dispositivos físicos, servicios de producción y cobertura de los módulos pendientes. |

## Uso y alcance

Abre **Guardian** desde Inicio o Buscar. Los cruces se calculan sobre bloques pendientes ya registrados. Las prioridades usan la fecha, el horario y la prioridad de Agenda. Los seguimientos aparecen en la revisión al llegar su fecha. Cerrar un seguimiento lo conserva para poder reabrirlo. Preparar un recordatorio abre el editor existente y requiere elegir fecha y hora y guardar. Preparar un mensaje genera texto editable local.

Las preferencias y los seguimientos se guardan en `guardianPreferences` y `guardianFollowups` dentro del espacio privado existente. Los borradores y el modo de enfoque se limpian al cambiar de cuenta. La revisión funciona con la aplicación abierta. Las notificaciones programadas pertenecen al módulo Recordatorios y dependen de su configuración habitual.

Archivos principales: `web/guardian.js`, `web/index.html`, `web/app.js`, `web/nexus-core.js`. Los casos de prueba cubren cálculo de cruces, prioridades y cierres, validación de fechas y conservación de identidad del seguimiento, y el recorrido móvil de enfoque, guardado, mensajes y separación de cuentas con autenticación simulada.


## Rutinas, memoria y captura

`web/guided-routines.js` guarda definiciones y ejecuciones en `guidedRoutines` dentro del espacio de cada cuenta. Cada avance se guarda con su marca temporal. El temporizador registra la hora final, se recupera al volver y requiere que la persona confirme el paso. Funciona como contador en pantalla. La lectura de texto depende de síntesis de voz del navegador y se detiene al salir de Rutinas o cambiar de cuenta.

`web/evolution-ui.js` amplía `privateMemories` sin migrar datos históricos. Un recuerdo antiguo sin fecha conserva esa ausencia. `web/evolution-core.js` excluye los recuerdos archivados de la recuperación del chat y conserva su formato de envío habitual.

`web/guardian-reference.js` presenta explicaciones propias con referencias externas. La búsqueda y la rotación funcionan localmente. La captura reutiliza el intérprete restringido de Builder y crea borradores que requieren confirmación del usuario. Las fechas sin hora se conservan en el título del borrador.

Validación nueva en `tests/guided-routines.test.cjs` y en el recorrido móvil `tests/guardian.browser.cjs`.
