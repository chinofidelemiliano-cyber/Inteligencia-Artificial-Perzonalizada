# Registro de Lifts AI Evolution

## Auditoría y respaldo

El punto de partida es `3769b62`, preservado en `backup/antes-evolution`. El frontend es HTML, CSS y JavaScript. Cloudflare Pages sirve la aplicación y ejecuta sus funciones. Supabase autentica mediante PKCE y guarda cada espacio como un JSON por usuario en `public.user_spaces`. Las políticas comparan el propietario con `auth.uid()` para lectura, creación, actualización y borrado. El cliente usa control optimista por `updated_at`. Dos ediciones simultáneas pueden requerir reconciliación manual.

La IA usa el binding Workers AI. El servidor autentica al usuario, aplica su control de cuota y exige confirmar el uso gratuito. El chat de integración utiliza texto y contexto acotado. La capacidad de los modelos y la cuota de la cuenta de producción requieren comprobación con credenciales del entorno. La PWA existente incluye manifest y service worker para avisos. Las fotos del diagnóstico tienen un visor local y no constituyen una biblioteca documental privada en el servidor. No se verificaron especificaciones de máquinas ni documentos que no estaban disponibles.

## Entrega inicial

| Prioridad | Estado | Requisito | Implementación y evidencia |
| --- | --- | --- | --- |
| Alta | Validado en pruebas locales | Aislamiento del espacio y cambio de sesión | `supabase/schema.sql`, `web/auth.js`. SQL real con dos identidades de prueba y sesión anónima, además de cambio de cuenta en Chromium con un backend simulado. |
| Alta | Validado en pruebas locales | Memoria privada y exportación | `web/evolution-ui.js`, `web/evolution-core.js`, `web/app.js`, `functions/api/chat.js`. Alta, edición, eliminación, exportación JSON y selección de hasta tres recuerdos por coincidencia léxica. Para enviar los fragmentos a Cloudflare debe habilitarse la memoria y marcarse el control del chat. |
| Alta | Validado en pruebas locales | Coordinación local | Circunferencia con diámetro explícito en mm, cm, m o in. Apertura de distorsión, biblioteca, diagnóstico y plantillas existentes por reglas. Los demás pedidos conservan el flujo actual de IA. |
| Media | Validado en Chromium | Inicio y marca | `web/evolution.css`, `web/evolution-ui.js`, `web/robot.js`, `web/identity-ui.js`. Tres paneles personalizables, arte original del robot y tres conceptos reutilizados bajo sus nombres nuevos. El logo oficial permanece vigente mientras se elige una propuesta. |

La exportación cubre una copia del espacio de trabajo disponible en la sesión, excluye el borrador de chat y no incluye archivos externos, sesiones ni registros operativos independientes. El límite inicial es de 200 recuerdos para acotar el tamaño del JSON sincronizado. Las preferencias y recuerdos añadidos usan el esquema existente. No se requieren migraciones ni bibliotecas nuevas en producción. La suite SQL usa PGlite en el entorno de pruebas.

Las pruebas cubrieron cálculo con unidad, apertura de Ingeniería sin solicitudes remotas, activación voluntaria de memoria, edición, eliminación, exportación y cambio entre dos espacios de prueba, además de ocultar y mover componentes del inicio. Se probó la interfaz en Chromium con servicios simulados. Las políticas SQL se ejecutaron en PGlite con dos identidades independientes. La compilación de Cloudflare Pages Functions terminó correctamente.

## Requisitos pendientes por dominio

| Apartados | Prioridad | Estado | Alcance restante y dependencia |
| --- | --- | --- | --- |
| 1–3, 9–12, 48–50, 54–57 | Alta | En desarrollo | Pruebas con dos cuentas reales, políticas y pruebas de archivos privados, sesiones activas, solicitudes de eliminación, exportación integral, permisos explícitos para colaboración, pruebas móviles, verificación de cuotas vigentes. Requiere un Supabase de pruebas para validar Auth y Storage de extremo a extremo. |
| 4–8, 53 | Media | En desarrollo | Inicio con proyectos, actividad reciente, cursos en progreso y preferencias completas. Navegación por categorías, favoritos y comando rápido. Variantes del logo para fondos, iconos y exportaciones después de elegir una propuesta. |
| 13–16, 36, 48–49 | Alta | En desarrollo | Más consultas locales, especialistas mediante perfiles de instrucciones, recuperación documental, historial de decisiones y recomendaciones por reglas. Revisar preferencias y tratamiento de datos antes de ampliar el contexto. |
| 17–20 | Alta | Pendiente | Ampliar sin reemplazar los cursos existentes. Academias de ciencias, ingeniería, tecnología, desarrollo profesional, inglés y Excel. Repaso espaciado, metas, constancias, tutor contextual y generación de material adicional. |
| 21–27 | Alta | Pendiente | Inventarios, mantenimiento, capacidades, defectos y árboles de decisión, inspección calibrada, OCR, planos y recorridos, calculadoras, simuladores, catálogo de tintas y datos espectrales. Prioridad a datos verificables y modelos deterministas. |
| 28–32 | Media | Pendiente | Ampliar asistente y laboratorio de Excel, importación XLSX, personalización de plantillas, estadística, pronósticos, control estadístico y metodologías de calidad. Las funciones existentes de Excel, cálculos y diagnóstico tienen pruebas de regresión. |
| 33–37 | Media | Pendiente | Proyectos privados, Kanban, Gantt, dependencias, organización semanal, presupuesto, ahorro, proyecciones y análisis de decisiones. Conservar el seguimiento de gastos y su reporte mensual. |
| 38–43 | Media | Pendiente | Expandir Studio y biblioteca privada, extracción y búsqueda documental con referencias, mapas de conocimientos, investigación, edición de código y vista previa aislada. Se requieren políticas de almacenamiento antes de publicar subida de archivos. |
| 44–47 | Media | Pendiente | Ampliar opciones de voz, accesibilidad, QR con autorización, lectura sin conexión de contenidos seleccionados y validación de avisos con iOS, Android y calendarios. Evitar caché privada. |
| 51–52 | Media | Pendiente | Administración del contenido general, versiones, publicación revisada, referencias, permisos y estadísticas agregadas. Separar la gestión editorial del acceso a datos privados. |

Para comprobar la configuración de Supabase, usar un proyecto de prueba con dos cuentas independientes y verificar Auth, PostgREST y Storage. Los costos dependen de cuotas de Cloudflare y Supabase, y esta entrega no incorpora servicios de pago.
