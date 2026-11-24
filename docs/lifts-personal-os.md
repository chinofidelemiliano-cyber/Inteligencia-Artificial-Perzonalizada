# Lifts Personal OS

Base auditada: `045cd38`. El punto de recuperación está en la rama local `backup/antes-personal-os`. El [registro Nexus](lifts-nexus.md) documenta las entregas anteriores.

## Estructura y alcance

Lifts usa pantallas HTML y módulos JavaScript en Cloudflare Pages. El registro Nexus permite abrir herramientas mediante la búsqueda global y recuperar una actividad. Supabase Auth y las políticas por propietario protegen la fila `user_spaces`; la aplicación usa ese espacio para guardar datos privados. Las pruebas de regresión ejecutan el SQL de aislamiento con dos cuentas en PostgreSQL local. Esta entrega no añade migraciones ni servicios de IA. Los archivos WOFF2 locales de Playfair Display, Manrope y JetBrains Mono provienen de Fontsource 5.3.0 y conservan sus licencias OFL junto a cada fuente. No requieren consultas externas durante la navegación.

| Bloques | Resultado en este corte | Alcance restante |
| --- | --- | --- |
| 1, 40, 41 | Auditoría, rama de respaldo y validación documentada. | Confirmación del despliegue y pruebas con servicios de producción. |
| 2, 38 | Portada renovada con robot y mascota, tipografía editorial, paleta y tres variantes de logotipo. Acceso habitual, búsqueda y navegación se conservan. | Reorganización completa de las once categorías, áreas de trabajo y concentración visual por área. |
| 3, 34 | Centro de mando con sección Hoy y paneles reordenables. Usa agenda, recordatorios, avance de lectura, misiones, objetivos, gastos, hábitos, Builder y Radar registrados. Se conserva Continuidad de trabajo. | Favoritos, documentos recientes y widgets especializados. |
| 4 | Diecinueve fichas buscables con ejemplos personales y profesionales, límites y ejercicios. Abren una revisión crítica como borrador. | Aplicación contextual directa a todos los tipos de registro y simulaciones específicas. |
| 5–6 | El mapa Nexus vigente y las fichas de revisión crítica ya existen. | Editor de sistemas con ciclos y retrasos, debate multiperspectiva y argumentación automatizada. |
| 7 | Ficha privada de riesgo con prevención, contingencia, revisión y escala configurable. Calcula un índice subjetivo y usa detectabilidad cuando se captura. | Matriz gráfica, umbrales automáticos y relación directa con AMEF. |
| 8–14 | Se conservan metas, hábitos, vida, diario y simulador de conversaciones de Nexus. Se agregan vehículos y suscripciones con vencimiento o servicio y preparación de avisos. | Innovation, Compass, Philosophy, Mind, Speech/Social y Energy como módulos ampliados. Compras, alimentación, actividad física, contactos y documentos personales especializados. |
| 15–24 | Se conservan Ingeniería, cálculos, diagnóstico, rutas académicas, simuladores y registros técnicos existentes. Se incorpora el registro de calibraciones, con patrón o certificado y próxima fecha. | Process Engineering, Audit, Fingerprint de ejecución, Preflight, Metrology, Reliability, Inspection, Supply Chain, Customer Quality y laboratorios extendidos. Las órdenes siguen fuera de esta entrega. |
| 25–27 | Continúan las utilidades estadísticas y las rutas de aprendizaje existentes. | Intelligence Center, Mentor y Life Simulator ampliados. |
| 28 | Se conservan utilidades de texto, fechas, imágenes, QR y PDF ya probadas. | Ampliar audio, informática, diseño, logística e idiomas según la especificación. |
| 29 | Builder crea formularios, calculadoras y capturas privadas. Permite editar, duplicar, archivar, reactivar, exportar/importar definiciones, abrir la versión anterior, y calcular una advertencia de límite. Tres plantillas de arranque. | Editor por arrastre, campos de archivo/imagen/relación, gráficos propios, simuladores y flujos, importación de capturas y selector de todas las versiones. |
| 30 | Se conserva el flujo disponible de Google Calendar y sus exportaciones. | Las demás integraciones requieren validar proveedor, permisos y alcance. |
| 31 | Radar revisa tareas vencidas, repasos, objetivos, mantenimientos, renovaciones, calibraciones, revisiones de riesgo y gastos que rebasan el tope registrado. Tiene prioridad, fuente, enlace y estados. | Más reglas industriales y personales, periodicidad configurable y ejecución en segundo plano. |
| 32–33 | Sigue la búsqueda global, se agregan las nuevas vistas y herramientas Builder guardadas. | Escritorio dividido, sesiones por proyecto, búsquedas sobre archivos y ranking de resultados. |
| 35–37 | Builder, Radar y modelos mentales funcionan con lógica local. Los datos se guardan en la cuenta y no se envían al modelo. | Acceso autenticado sin conexión y sincronización offline completa. |
| 39 | Las definiciones Builder se intercambian como JSON. Los registros del usuario mantienen la exportación general del espacio. | Portabilidad de capturas por herramienta y exportaciones especializadas de todos los módulos. |

## Builder

En **Buscar → Lifts Builder**, elige una plantilla o crea una herramienta. Cada campo tiene un código y un tipo. Guarda la herramienta para registrar capturas. El motor interpreta operadores aritméticos, comparaciones y funciones concretas. La condición `if` evalúa solo la rama elegida. Las expresiones no se ejecutan como JavaScript. Una entrada inválida o un cálculo indefinido muestra un error. El JSON de definición excluye capturas, permisos y datos de cuenta.

Las capturas guardadas conservan sus valores y resultado. Abrir una versión anterior la carga como borrador antes de aplicar el cambio. Archivar una definición no borra sus datos.

## Radar y riesgos

En **Buscar → Lifts Radar** se muestran avisos derivados de registros y fechas reales. El estado se guarda por cuenta; posponer oculta hasta el día siguiente. Los avisos se vuelven a calcular al abrir la vista. Para registrar un riesgo, entra en **Misiones y conocimiento → Riesgos**, elige la escala y captura la consecuencia y el plan. El índice no representa una probabilidad medida.

## Archivos y pruebas

Portada e identidad: `web/index.html`, `web/personal-os.css`, `web/robot.js`, `web/identity-ui.js`, `web/assets/identity/`. Builder, Radar y modelos: `web/personal-builder-core.js`, `web/personal-builder-ui.js`, `web/personal-radar.js`, `web/personal-models.js`. Integración: `web/app.js`, `web/evolution-ui.js`, `web/nexus-core.js`, `web/workspace-ui.js`, `web/nexus-journal.js`, `web/nexus-journal-ui.js`. Casos de prueba en `tests/personal-os.test.cjs` y `tests/personal-os.browser.cjs`, además de la regresión del espacio existente.
