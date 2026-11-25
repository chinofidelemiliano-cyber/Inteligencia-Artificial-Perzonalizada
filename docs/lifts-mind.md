# Lifts Mind — Dominio personal

Base auditada `8ee5344`. Rama de recuperación `backup/antes-lifts-mind`. Se conservan Agenda, su temporizador persistente, Recordatorios, revisión personal, experimentos de Nexus y filosofía de Guardian. Mind usa el mismo espacio autenticado, sin migraciones ni modelos nuevos.

| Requisitos | Estado | Funcionalidad |
| --- | --- | --- |
| 1–2 | Parcial | Módulo educativo, estrategias por obstáculo y referencias bibliográficas. Las referencias identifican revisiones o marcos teóricos. Las propuestas de Lifts sirven como ejercicios. Falta desarrollar todos los modelos con el mismo nivel de profundidad. |
| 3–4 | Parcial | Selección de factores, revisión de hábitos y tareas pendientes con fecha pasada. No se aplica un instrumento psicométrico. Faltan evaluación inicial estructurada y detección longitudinal de aplazamientos, tiempos y motivos. |
| 5–6 | Implementado en primera versión | Acceso inmediato, diez estrategias distintas según el obstáculo, acción pequeña, guardado y revisión de resultado. Inicio de cinco minutos en Agenda. Faltan personalización longitudinal e integración del resultado con el fin del temporizador. |
| 7–8 | Parcial | Reflexión estructurada con pensamiento, emoción, evidencia, interpretación y acción. Ejercicios iniciales de funciones ejecutivas. Faltan catálogo completo de distorsiones y cuestionamiento guiado. |
| 9–10 | Parcial | Se reutiliza el temporizador persistente de Agenda. WOOP y si–entonces preparan pasos editables en Agenda. Faltan modo minimalista dedicado, sonidos y registro de interrupciones, y las demás metodologías integradas. |
| 11 | Parcial | Calculadora de motivación temporal con sustitución, validación y resultado. Faltan métricas completas de productividad. |
| 12 | Parcial | Nueve lecciones en cinco niveles con teoría, práctica, referencias y enlace a filosofía. Faltan el temario íntegro, ilustraciones educativas y seguimiento de cada lección. |
| 13–15 | Parcial | Acceso a revisión personal existente y borrador de experimento en Nexus. Entrenador local basado en reglas. Faltan diario ampliado, análisis longitudinal y entrenador conversacional con consentimiento propio. |
| 16 | Parcial | Programa de 30 sesiones por defecto, ajustable entre 4 y 60. Cuatro etapas, punto de partida, observaciones guardadas y revisión final. Sin obligación de calendario ni evaluación validada. |
| 17–18 | Parcial | Resumen de siete días con obstáculos y resultados registrados. Recordatorios mediante el editor existente. Faltan series mensual y anual, métricas de enfoque, horarios silenciosos propios y seguimiento automático. |
| 19 | Parcial | Secciones plegables, estilos compartidos, controles nativos y acceso desde cualquier pantalla autenticada mediante el encabezado. Faltan visualizaciones y expresiones específicas del robot. |
| 20–21 | Parcial | Almacenamiento con políticas de propietario, exportación JSON, borrado individual y limpieza de borradores en cambio de cuenta. Validación automatizada y navegador local con autenticación simulada. Faltan pruebas físicas y producción. |

## Datos

El campo `mind` de `user_spaces.data` contiene intervenciones, reflexiones y programa. Las políticas existentes usan `auth.uid()` para restringir las filas al propietario. Las solicitudes al chat no incluyen este campo. El equipo con acceso técnico a la base de datos puede acceder al almacenamiento. La exportación de Mind incluye esas tres colecciones y el usuario decide dónde conservar el archivo. El flujo de depuración general de cuenta también limpia el módulo local.

La tarea de concentración usa `focusSession` de Agenda y conserva el final mediante una marca temporal. Si hay una sesión activa o pausada, el inicio rápido abre Agenda sin reemplazarla. Los avisos dependen de los permisos y del sistema de Recordatorios vigente.

## Código y fuentes

La lógica está en `web/mind-core.js`, la interfaz en `web/mind-ui.js` y las lecturas y referencias en `web/mind-lessons.js`. Cada lectura cita su fuente en pantalla. Entre las fuentes se incluyen [Steel y König](https://doi.org/10.5465/amr.2006.22527462), [Sirois y Pychyl](https://doi.org/10.1111/spc3.12011), [Diamond](https://doi.org/10.1146/annurev-psych-113011-143750), [Michie y colaboradores](https://doi.org/10.1186/1748-5908-6-42) y [Rozental y colaboradores](https://doi.org/10.3389/fpsyg.2018.01588). Las explicaciones y ejercicios están redactados para Lifts.

Casos de prueba en `tests/mind.test.cjs` y `tests/guardian.browser.cjs`.
