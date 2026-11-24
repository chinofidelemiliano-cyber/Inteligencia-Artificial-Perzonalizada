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
