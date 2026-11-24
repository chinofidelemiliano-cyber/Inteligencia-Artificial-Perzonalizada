# Lifts Guardian

Base revisada `9ea6979`. Rama local de recuperación `backup/antes-guardian`.

Lifts ya tiene Agenda y enfoque, recordatorios configurables, hábitos, Radar, memoria privada, continuidad Nexus, diarios, voz, Academia, Builder, utilidades PDF y visuales, y calculadoras técnicas. Guardian usa la misma autenticación y el mismo espacio por propietario. El resumen y los borradores se generan en el navegador sin enviar los registros a un modelo ni requerir dependencias nuevas.

| Bloque | Estado | Alcance y pendiente |
| --- | --- | --- |
| 1 · Guardian | Parcial | Preparación, jornada, cierre, prioridades y límites. Faltan avisos propios, preparación de materiales integrada y descanso configurable. |
| 2 · Executive | Parcial | Interpreta etiquetas, listas numeradas y solicitudes breves con construcciones reconocidas. Propone primera acción y prepara borradores de entregable en Agenda y de seguimiento. Faltan interpretación irrestricta, dependencias y delegación. |
| 3 · Routine | Parcial | Doce plantillas, pasos editables, material previo, temporizador web, lectura compatible y últimos veinte resultados. Faltan reglas condicionales ampliadas e integración con avisos. |
| 4 · Follow-up | Implementado | Diez categorías, compromiso, fecha, hora opcional, prioridad, cierre, reapertura y borradores de mensaje y recordatorio. |
| 5 · Memory Assistant | Parcial | Categoría, contexto, fecha de alta, búsqueda local, archivo y recuperación. Consulta local mediante «Busca en mis recuerdos sobre…», por texto o dictado del chat. Falta captura dedicada por voz. |
| 6 · Calculator Hub | Parcial | Centro que enlaza Ingeniería, Builder, utilidades y presupuesto. Convierte longitudes, masas, duraciones y presión, muestra la sustitución y recibe valores de Captura rápida. Incluye doce fórmulas adicionales probadas. Falta el catálogo completo. |
| 7 · Time Intelligence | Parcial | Agenda, cruces y planificación existentes. Falta ampliar el análisis temporal solicitado. |
| 8 · Field Mode | Parcial | Cronómetro local, mediciones con unidad como borrador de experimento y accesos a equipos, procedimientos y fotos de diagnóstico. Incluye grabación local, reproducción y descarga de audio. QR para máquinas, inventario y calibraciones existentes. Falta captura de parámetros especializada. |
| 9 · Document Intelligence | Parcial | Extracción local de texto PDF, búsqueda por página y descarga TXT. Faltan OCR, otros formatos y análisis documental ampliado. |
| 10 · Visual Tools | Parcial | Diagnóstico y utilidades visuales existentes. Falta la cobertura de la especificación. |
| 11 · Control Panel | Parcial | Panel de operaciones, permisos y Radar existentes. Falta unificar los controles de Guardian. |
| 12 · Quick Reference | Parcial | Consulta rápida filtrable de ocho lecturas con fuentes. Faltan fichas científicas, técnicas y profesionales. |
| 13 · Voice | Parcial | La voz existente se complementa con lectura de pasos de rutina. Comandos para abrir Guardian y Modo de campo y buscar recuerdos. Faltan los demás comandos especializados. |
| 14 · Protocols | Parcial | Procedimientos Nexus y ejecución guiada de rutinas. Faltan plantillas y reglas de protocolos especializados. |
| 15 · Philosophy | Parcial | Curso inicial de cinco lecciones con teoría, casos, ejercicios, fuentes y avance. Faltan historia completa, otras ramas, escuelas y autores. |
| 16 · Stoic | Parcial | Lección, lectura y ejercicio para distinguir lo que depende de uno. Falta el recorrido completo. |
| 17 · Wisdom | Parcial | Una lectura diaria rotativa, referencias y borrador de reflexión. Faltan biblioteca personal de frases y tarjetas descargables. |
| 18 · Socrates | Parcial | Lección y ejercicio de aclaración socrática. Falta diálogo ramificado. |
| 19 · Logic | Parcial | Ficha y lección de premisas, validez e inferencia. Faltan herramientas de análisis y ejercicios ampliados. |
| 20 · Psychology | Parcial | Ficha y ejercicio de planes condicionales para preparar respuestas a interrupciones. Falta el desarrollo temático completo. |
| 21 · Neuroscience | Parcial | Ficha de sueño y consolidación de memoria con referencia bibliográfica y ejercicio. Faltan cursos y ejercicios del resto de temas. |
| 22 · Cognitive Biases | Parcial | Ficha de sesgo de confirmación. Faltan los demás sesgos y actividades. |
| 23 · Journal | Parcial | El diario Nexus recibe borradores de reflexión. Faltan modalidades adicionales. |
| 24 · Life Lessons | Parcial | Lecciones aprendidas Nexus con fuentes e integración desde lecturas. Faltan más conexiones. |
| 25 · Ethics | Parcial | Ficha y lección de ética de la virtud y juicio práctico. Faltan marcos y análisis de dilemas. |
| 26 · Learn Something | Parcial | Rotación diaria de ocho fichas con ejercicio. Falta personalización y seguimiento. |
| 27 · Complementarias | Parcial | Se conservan las utilidades existentes. Falta la ampliación solicitada. |
| 28 · Smart Clipboard | Parcial | Pegar texto, aritmética, fechas ISO, instrucciones, tabla, URL, nota y misión. Puede abrir la conversión con cantidades y unidades reconocidas. Faltan mediciones y clasificación avanzada. |
| 29 · Home | Parcial | Acceso a Guardian desde Inicio y resumen de jornada. Faltan más controles y distribución. |
| 30 · Personalidad | Implementado | Ocho perfiles guardados por cuenta. El servidor aplica instrucciones fijas sobre el mismo modelo y Concentración usa el detalle breve. |
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


## Campo, perfiles y conversiones

Modo de campo reutiliza los registros de experimento y diagnóstico. El cronómetro se pausa al salir de la pantalla y se limpia al cambiar de cuenta. Introduce lecturas de una misma unidad, separadas por espacios. Agrega condiciones o una referencia de evidencia y confirma el borrador en Nexus. Archivos en `web/guardian-field.js` y `web/index.html`.

El perfil de respuesta se guarda en `guardianAssistantMode`. El envío al chat identifica el modo seleccionado, sin adjuntar otros campos privados para activarlo. `functions/api/chat.js` solo admite perfiles predefinidos y conserva el control de cuota, permisos y selección de modelo. La búsqueda explícita de recuerdos funciona en el navegador y omite los archivados. La selección de modos no cambia los cálculos deterministas.

`web/guardian-calculator.js` usa factores SI y exactos para pulgada, pie y libra de masa. Admite cantidades decimales y rechaza conversiones entre magnitudes distintas. Las pruebas incluyen recorrido móvil, entrada decimal, reinicio de cronómetro, borrador de medición, conversiones e instrucciones permitidas de los perfiles del chat.


## De una solicitud a Agenda y Recordatorios

En Guardian, pega una instrucción como «Ana me pidió entregar el informe para el 2026-12-09 a las 09:30» y agrega los pasos. Guardian reconoce construcciones breves y fechas explícitas en formato AAAA-MM-DD. Las fechas relativas quedan pendientes de confirmar. Si dos líneas indican fechas distintas, Guardian pide resolver la contradicción antes de preparar el entregable. Agenda recibe título, fecha y pasos. Seguimiento recibe los datos reconocidos y permite editarlos antes de guardar. Con fecha y hora vigentes, el seguimiento puede rellenar un borrador de Recordatorios con esa hora local. Programar el aviso requiere confirmar en el editor existente.

El flujo se ejecuta localmente. Las pruebas incluyen fechas contradictorias, fechas inválidas, pasos, borradores sin guardado automático y el recorrido móvil completo hasta la hora del aviso.


Modo de campo permite grabar observaciones de hasta un minuto con el micrófono en navegadores compatibles. Solicita permiso al pulsar Grabar, permite escuchar y descargar en el formato nativo del navegador y libera el micrófono al detener o salir. El clip temporal se elimina al cambiar de vista o de cuenta. El archivo descargado permanece en el dispositivo. El recorrido de Chromium usa un micrófono simulado y descarga un WebM real.


## Filosofía y calculadoras

Abre **Guardian → Curso de filosofía práctica**, o busca el curso por nombre. Incluye cinco lecciones con teoría, aplicación, fuentes y práctica con retroalimentación. El progreso se guarda en `guardianPhilosophy` al acertar y se recupera con la cuenta. Las fuentes son referencias de consulta y los textos de las lecciones son explicaciones propias.

**Guardian → Calculadoras → Cálculos con fórmula** presenta doce operaciones con valores de ejemplo, fórmula, supuestos y resultado. La lógica en `web/guardian-formulas.js` valida magnitudes, denominadores, rangos e intervalos y funciona sin IA. Los datos de ejemplo son didácticos. `tests/guardian-formulas.test.cjs` verifica resultados y errores. El recorrido móvil comprueba la separación entre etiquetas, la retroalimentación de filosofía y la recuperación del progreso.


## QR de campo y texto de PDF

Desde una máquina, un artículo industrial o una calibración guardada, **Preparar QR privado** abre el generador existente. El QR contiene la dirección de Lifts, el tipo de ficha y el identificador en un fragmento de URL. El registro solo se busca en el espacio autenticado que cargó Lifts. Un identificador de otra cuenta muestra un mensaje genérico. Para escanear, se usa la cámara del teléfono. Las órdenes de producción quedan fuera de este flujo.

En **Utilidades locales → Extraer y buscar texto en PDF**, se procesan hasta 30 páginas, 15 MiB y 150 000 caracteres. El texto se busca por página o se descarga en TXT. PDF.js se carga bajo demanda. La herramienta usa texto seleccionable, no OCR, y la extracción puede diferir de la distribución visual del original.
