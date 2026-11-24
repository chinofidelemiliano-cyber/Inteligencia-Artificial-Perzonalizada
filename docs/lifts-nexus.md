# Registro de Lifts Nexus

Base auditada `ca0d4c5`, conservada en la rama `backup/antes-nexus`. Los requisitos previos se conservan en [Lifts Evolution](lifts-evolution.md). Nexus reutiliza el frontend web, Cloudflare Pages, Supabase Auth y la fila privada por usuario. No requiere migraciones, nuevas dependencias ni cuota de IA.

## Auditoría diferencial

El buscador ya navegaba a secciones y lecciones y el chat ya resolvía algunas consultas mediante reglas y cálculos. Ambos mantenían listas o destinos por separado. La Academia guardaba avances, Ingeniería guardaba fichas y Excel guardaba progreso. Faltaba un punto de recuperación común. La memoria privada existente ya incorporaba búsqueda léxica optativa desde el chat. Nexus reutiliza esa búsqueda para el panel de continuidad y mantiene allí los fragmentos en el navegador.

La aplicación sincroniza un JSON por propietario con control de versiones por `updated_at`. Dos dispositivos que escriben al mismo tiempo pueden producir un conflicto explícito. Nexus registra cambios de destino y evita escribir otra vez al abrir el mismo destino. La cuenta hereda las políticas RLS existentes y la apertura de fichas consulta el espacio actualmente cargado. Los borradores temporales, archivos y resultados sin guardar tienen ciclos de vida específicos de cada herramienta.

## Etapa 1

| ID | Prioridad | Clasificación | Estado y límite |
| --- | --- | --- | --- |
| 2 | Alta | Nueva | Auditoría diferencial realizada en este registro. |
| 3 | Alta | Parcial | Panel de contexto con destino, proyecto o actividad, objetivo, información disponible o faltante, restricciones, decisiones, próxima acción y recuerdos relevantes. Campos editables; asociación manual al proyecto; sin recuperación de archivos ni análisis por IA. |
| 5 | Alta | Parcial | Registro de metadatos y adaptadores de navegación. Lo usan el chat local, el buscador y la recuperación. Una ficha existente se recupera por identificador y recalcula con la herramienta original. Falta transferencia de resultados a otros procesos. |
| 7 | Alta | Parcial | Guarda el último destino compatible por cuenta. Recupera una lección, una vista de Academia, una práctica de Excel o una ficha guardada de Ingeniería. Para Agenda, Recordatorios y diagnóstico restaura la sección. No conserva el scroll ni borradores, archivos o notas de contexto sin guardar. |
| 28 | Alta | Parcial | El buscador existente ahora consulta el registro y abre con Ctrl+K, Cmd+K o el botón. |
| 45, 47, 48, 49, 55, 57 | Alta | Parcial | La etapa usa recuperación local, adaptadores con parámetros validados, pruebas automatizadas y acceso por la sesión vigente. Quedan pendientes políticas por herramienta para futuras acciones, flujos de documentos y pruebas sobre Supabase desplegado. |

Archivos principales de la etapa: `web/nexus-core.js`, `web/nexus-ui.js`, `web/index.html`, `web/app.js`, `web/workspace-ui.js`, `web/evolution-ui.js`, `web/academy-ui.js`, `web/excel-ui.js`, `web/engineering-ui.js`. Pruebas en `tests/nexus.test.cjs` y `tests/evolution.browser.cjs`. Cambios nuevos de navegación funcionan con el proceso de sesión existente y no se envían al proveedor de IA.

## Requisitos conservados para las etapas siguientes

| ID | Clasificación actual | Prioridad | Dependencia y alcance pendiente |
| --- | --- | --- | --- |
| 4, 6 | Nueva | Alta | Misiones, criterios de cierre y permisos de ejecución. Primero hacen falta entidades y acciones de escritura verificables. |
| 8, 9, 10, 13, 14 | Nueva | Alta | Grafo, evidencias, competencias, resultados y preguntas abiertas. Requieren registros estructurados y referencias estables al contenido existente. |
| 11, 12 | Parcial | Alta | Ampliar rutas y generadores de Academia con prerrequisitos y materiales adaptados. |
| 15, 16, 17, 18, 19, 20 | Nueva | Media | Revisión crítica y premortem, descubrimiento con evidencia, experimentos, escenarios y registro de decisiones. Usar cálculos reproducibles y distinguir hipótesis de hechos. |
| 21, 22, 23, 26, 27 | Parcial | Media | Extender captura, registros, tiempos, agenda y exportaciones existentes para bandeja, línea de tiempo, revisión, capacidad y reuniones. |
| 24, 25, 29 | Nueva | Media | Procedimientos versionados, lecciones aprendidas y herramientas complementarias sin abandonar la actividad. |
| 30, 31, 32, 33, 34, 35, 37 | Nueva | Media | Diagramas industriales con datos verificados, cambios, interacciones, trazabilidad, costos, herramientas térmicas y conocimiento operativo. |
| 36 | Parcial | Media | Ampliar simuladores existentes mediante escenarios de trabajo. |
| 38, 39, 40, 41, 42, 43, 44 | Nueva | Media | Áreas de vida, hogar, viajes, negociación, objetivos, lectura activa y utilidades. Reutilizar agenda, finanzas, visualización y carga de documentos allí donde corresponda. |
| 46 | Parcial | Alta | El control de consumo y el guardado existentes se mantienen. Evaluar mediciones y colas cuando haya operaciones que las requieran. |
| 50, 51, 53, 54, 56, 58, 59 | Nueva | Alta | Retroalimentación, interfaz por actividad, etapas, historial y restauración de datos, estado técnico y registro de acciones. Verificar respaldos antes de ofrecer recuperación de datos. |
| 52 | Parcial | Media | Extender inicio personalizable con distribución, herramientas favoritas y preferencias por modo. |
| 60–63 | Existente como proceso | Alta | Entrega por etapas, trazabilidad permanente, pruebas y límites explícitos. Registrar resultados antes de marcar una etapa como validada. |

La disponibilidad de datos en producción, la restauración de respaldos de usuarios y los permisos de herramientas futuras deben comprobarse en la infraestructura correspondiente. El respaldo Git cubre el código.

## Evidencia de validación

- Las pruebas automatizadas cubren la lista autorizada, las claves inválidas y el contexto limitado a campos editables.
- Chromium comprueba que Ctrl+K abre el buscador, que el chat abre herramientas sin llamar al modelo y que la cuenta puede retomar una lección, una práctica de Excel y una ficha real guardada previamente. También prueba fallo y reintento de sincronización y cambio entre dos espacios simulados.
- Cloudflare Pages Functions compila con Wrangler. El despliegue público y las pruebas con dos cuentas reales requieren acceso a los servicios correspondientes.

## Continuación. Misiones, conocimiento y revisiones

La continuidad de la etapa 1 ya reabre registros de Nexus por cuenta. Esta entrega añade un diario estructurado dentro de Lifts. Se reutilizan el buscador, la autorización por propietario, la exportación JSON del espacio y el formulario de Agenda. Los cambios son locales a la cuenta y su sincronización usa la infraestructura existente. La rama `backup/antes-misiones` conserva el punto de partida en Git.

| Requisito | Estado de esta entrega | Alcance y límites |
| --- | --- | --- |
| 4, 7 | Implementado | Registrar, editar, pausar, cancelar, reanudar y recuperar misiones. Cierre condicionado a etapas realizadas y a evidencia registrada por el usuario. El texto de la evidencia requiere revisión humana. |
| 8, 9, 14 | Parcial | Enlaces explícitos, editables y navegables entre registros Nexus. Identifica relaciones sugeridas, registradas y verificadas. Incluye fuentes, evidencia, aplicabilidad, contradicciones y preguntas. Falta mapa visual y conexión directa con documentos, máquinas y cursos. |
| 15, 19, 20, 25 | Parcial | Fichas de revisión crítica y premortem, decisiones y lecciones aprendidas. El usuario registra hipótesis, sesgos, contraargumentos y evidencias. Quedan pendientes el análisis automático, las recomendaciones y la detección de casos relacionados. |
| 17, 18, 32 | Parcial | Experimentos con media y desviación muestral, comparación de tres escenarios de costo y control de cambios con verificación explícita. Quedan pendientes ANOVA, gráficas, sensibilidad multivariable y aprobación por roles. |
| 22, 23 | Parcial | Línea del tiempo por fechas registradas para misiones y otros registros Nexus, fichas de Ingeniería, diagnóstico y tareas completadas. Filtros diario, semanal, mensual y anual. Falta análisis de compromisos incumplidos y de tiempos registrados. |
| 24, 27, 37 | Parcial | Procedimientos con listas de pasos, verificaciones y resultados. Reuniones con acuerdos y una acción que abre un borrador en Agenda. Quedan pendientes el historial por ejecución, versiones, y generación de minutas desde el registro. |

Archivos principales: `web/nexus-journal.js`, `web/nexus-journal-ui.js`, `web/index.html`, `web/nexus-core.js`, `web/nexus-ui.js`, `web/workspace-ui.js` y `web/app.js`. Evidencia de pruebas en `tests/nexus-journal.test.cjs` y `tests/evolution.browser.cjs`.

Misiones, relaciones y registros admiten edición. Los archivos originales, adjuntos de evidencia, automatizaciones externas y la aprobación delegada quedan pendientes. Se mantienen los demás requisitos de las tablas anteriores.

## Continuación industrial. Mapa y trazabilidad

Base `88ddbca`, preservada en `backup/antes-trazabilidad`. Antes, las relaciones solo admitían registros del diario y la búsqueda de un caso abría el módulo general. La etapa conecta los historiales ya guardados y mantiene el esquema privado por cuenta.

| Requisito | Estado de esta entrega | Alcance |
| --- | --- | --- |
| 8, 9 | Parcial | Mapa navegable con un nodo central, sus relaciones entrantes y salientes, estados y evidencia. Admite registros Nexus, fichas de Ingeniería y casos de diagnóstico. Los enlaces existentes conservan sus identificadores. |
| 16, 31 | Parcial | Agrupa dos o más casos distintos con vínculos verificados y con evidencia a una misma ficha. Muestra casos, enlaces y evidencia. La agrupación describe registros y no establece causa, correlación estadística ni relación física. |
| 7, 33 | Parcial | El mapa, el buscador y la línea del tiempo abren casos guardados directamente. La recuperación de sesión funciona con el mismo registro de herramientas. Seis campos opcionales registran orden, material, tinta, anilox, placa y suaje. El historial y el buscador aceptan esos datos y los informes PDF y Word los incorporan. Al cambiar de caso se limpian fotografías temporales. |

Archivos modificados: `web/nexus-journal.js`, `web/nexus-journal-ui.js`, `web/nexus-core.js`, `web/nexus-ui.js`, `web/diagnostics-ui.js`, `web/workspace-ui.js`, `web/evolution.css`, `web/index.html`, `tests/nexus-journal.test.cjs` y `tests/evolution.browser.cjs`.

Las coincidencias se limitan al espacio abierto y a relaciones registradas por el usuario. Quedan pendientes los componentes de máquina y sus dimensiones, la representación de recorridos, las reglas de compatibilidad, la vinculación con inventarios y órdenes externas, la aprobación por roles y los historiales de cambios.

## Ingeniería. Recorridos, inventario, órdenes y reglas

Base `dbbd699`. Los casos conservan sus campos históricos. Ahora Ingeniería tiene un panel compartido con cuatro tipos de registro privados y editables.

| Requisito | Cobertura | Límite |
| --- | --- | --- |
| 30 | Representación SVG desde componentes ordenados, con selección accesible de pasos y referencia opcional. | Esquema de secuencia. La geometría, los sensores y el comportamiento físico quedan pendientes. |
| 31, 33 | Reglas configurables de incompatibilidad por pares con motivo y estado activo. La orden muestra coincidencias y categorías pendientes. | Solo evalúa pares registrados y activados. No certifica compatibilidad ni interviene en maquinaria. |
| 33 | Inventario por categoría con lote, cantidad y unidad opcionales. Órdenes asociadas a una máquina y a artículos del inventario. | No hace movimientos de existencias ni sincroniza un ERP externo. |
| 7, 33 | Una orden se puede buscar y reabrir. Diagnóstico permite copiar sus datos y guarda una referencia por identificador. La orden muestra los casos vinculados. | La copia del caso conserva la captura histórica. Para copiar una actualización se requiere otra acción explícita. |

Archivos principales: `web/industrial-core.js`, `web/industrial-ui.js`, `web/index.html`, `web/diagnostics-ui.js`, `web/nexus-core.js`, `web/workspace-ui.js`, `web/evolution.css` y `web/app.js`. Validación en `tests/industrial.test.cjs` y `tests/evolution.browser.cjs`. El aislamiento reutiliza el espacio privado existente y no se añade una migración SQL.

## Academia. Rutas y repaso activo

Se difiere la sincronización externa de órdenes e inventario. Se mantienen disponibles las órdenes internas, con su trazabilidad y reglas. Se creó la rama de respaldo `backup/antes-rutas` desde `82a1a30`.

| Requisito | Estado | Alcance |
| --- | --- | --- |
| 11 | Parcial | Cinco rutas por objetivo con prerrequisitos sugeridos, navegación por lecciones reales y continuación desde la primera lectura pendiente. Los prerrequisitos aparecen también en el lector. |
| 11, 13 | Parcial | Recuperación activa con explicación en palabras propias, referencia de la lección y decisión de repaso por el usuario. Intervalos de 1 día tras dificultad y de 3, 7, 14 y 30 días tras aciertos sucesivos. Se guarda el resultado y la fecha, sin guardar el texto del ejercicio. |
| 7 | Implementado para esta vista | Rutas y repasos usa el registro común de herramientas y el progreso por cuenta existente. |

Cambios en `web/academy-paths.js`, `web/academy-ui.js`, `web/nexus-core.js` y `web/index.html`. Pruebas en `tests/academy-paths.test.cjs` y `tests/academy.browser.cjs`. La autoevaluación programa el repaso, mientras que la matriz de competencias, los proyectos de práctica y la evaluación de evidencias quedan pendientes. El repaso se consulta dentro de la aplicación y no programa avisos externos.

## Entrega paralela. Aprendizaje, productividad, utilidades y permisos

Base `58f58b1`, respaldada en `backup/antes-bloques-paralelos`. La sincronización externa de órdenes continúa diferida.

| Requisitos | Cobertura de esta entrega | Límites |
| --- | --- | --- |
| 11, 13 | Matriz de las cinco competencias ligadas a las rutas. Guarda meta y evidencias de práctica, trabajo o evaluación, con resultados y lección opcional. | La evidencia está registrada por quien usa la cuenta. No acredita competencia profesional externamente. |
| 26 | Agenda muestra el resto de la jornada, compromisos sin doble conteo, hueco más largo, estimación de carga y advertencia por exceso o fragmentación. | Usa duraciones registradas o las estimaciones indicadas por el planificador. |
| 44 | Comparación por líneas, fechas naturales, conversión exacta de bases y Base64 de texto se ejecutan en el navegador. | La vista requiere que la aplicación ya esté cargada. No se incorporaron QR ni manipulación de archivos. |
| 6, 55, 58 | Modos consulta, borrador y ejecución autorizada para una acción específica de Nexus. La ejecución parte de la próxima acción guardada, se dispara con el botón, crea una tarea sin fecha o aviso y anota identificador y hora. | Esta autorización no se extiende a otras herramientas. No ejecuta el modelo, ni acciones externas, ni cambios de agenda en segundo plano. |
| 56 | Estado de sincronización de la cuenta y resultado de la comprobación real de IA de la sesión. Usa el botón existente para solicitar una prueba. | No incluye medición de almacenamiento ni monitorización externa. |

Archivos por bloque: `web/academy-competencies.js`, `web/academy-ui.js`, `web/academy.css`; `web/work.js` y `web/work-ui.js`; `web/nexus-utilities-core.js` y `web/nexus-utilities-ui.js`; `web/nexus-operations-ui.js`. Integración en `web/index.html`, `web/app.js` y `web/nexus-core.js`.

Las pruebas incluyen rutas ligadas a evidencias, carga y solapamientos, resultados locales sin solicitudes, permiso por defecto, borrador sin guardar, ejecución explícita, reintento sin duplicado y cambio de cuenta. Quedan pendientes los demás requisitos indicados en las tablas anteriores, entre ellos la bandeja universal, los permisos por herramienta, el historial de versiones y las utilidades de archivos.
