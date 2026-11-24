# Lifts AI 2.0 · Registro de desarrollo

## Línea base y auditoría

La rama local `backup/antes-lifts-2` apunta a `135bd54`. La aplicación se sirve desde `web/` mediante Cloudflare Pages. Los endpoints bajo `functions/api/` mantienen la sesión y cuota de Workers AI. Supabase contiene el espacio privado `user_spaces`, con políticas por usuario y comprobación de revisión al guardar, y las tablas de cuota y avisos Web Push.

| Área existente | Entrada y dependencias |
| --- | --- |
| Inicio, chat, voz, imágenes y atajos | `web/index.html`, `app.js`, módulos de conversación, `functions/api/` |
| Agenda, foco, acompañamiento, hábitos y gastos | `work-ui.js`, `coaching-ui.js`, `wellbeing-ui.js`, `routines-ui.js`, cuenta Supabase |
| Recordatorios y calendario | `reminders-ui.js`, `push-ui.js`, `sw.js`, `google-ui.js`, función de Supabase y Cron |
| Academia, biblioteca inicial y simuladores | `academy-ui.js`, `academy-curriculum.js`, `academy-tools.js`, carga al entrar |
| Cursos breves, metodologías, cuestionarios y reportes | `learning-ui.js`, `flexo-quiz-ui.js`, `report-pdf.js` |
| Perfil, sesión, tema y navegación | `auth.js`, `personalization.js`, `workspace-ui.js`, `academy.css` |

La línea base pasó 139 pruebas de Node y seis flujos de Chromium en la auditoría anterior. Esas pruebas usan servicios simulados donde se requiere una cuenta o el acceso de un proveedor. Esta etapa no aplica migraciones ni cambia el esquema de la cuenta. Las fichas, casos, progreso de Excel y propuesta de identidad usan campos nuevos en el espacio privado. No se accedió a registros de producción para respaldarlos. Para una futura migración, se debe respaldar y probar la restauración con un entorno de ensayo antes del cambio.

## Seguimiento de requisitos

| Bloque / requisito | Estado | Avance, archivos y dependencias | Pendiente o condición |
| --- | --- | --- | --- |
| A y Q · auditoría, respaldo, registro y regresión | Validada | Inventario de módulos, rama de respaldo, pruebas Node, Chromium y compilación Pages | Validar servicios de producción con cuentas y dispositivos autorizados |
| B · identidad | Validada | Tres wordmarks vectoriales originales en `assets/identity/`, comparador en Perfil y selección privada en `identity-ui.js` | El logotipo activo es el actual. Falta selección definitiva, referencia visual solicitada y evaluación en materiales impresos |
| B · rediseño inmersivo y personajes | Pendiente | Esta versión conserva los temas, navegación y activos existentes y da estilo a las pantallas nuevas | Referencias visuales, diseño de inicio y animaciones opcionales |
| C y D · enseñanza técnica | En desarrollo | Siete niveles con los identificadores existentes y curso independiente de distorsión con tres lecciones, fundamentos geométricos, ejercicios, validación experimental y retorno desde la calculadora. `academy-curriculum.js`, `academy-ui.js` | Desarrollar las especialidades restantes con la profundidad y estructura de 24 apartados, revisar normas y materiales industriales |
| E · diagnóstico guiado e historial | Validada | Ramas para desregistro, huecos en sólidos y troquelado. Registro privado con hipótesis, mediciones, causa y validación. PDF. `diagnostics-ui.js` | Ampliar fichas del atlas y diagnóstico progresivo, historial de evidencias y campos de producción |
| E y L · fotografía y biblioteca visual | Validada | Comparación local JPG, PNG o WebP con zoom y punto de inspección. La carga se comprueba en Chromium | El historial guarda texto. Las fotos se mantienen en la vista local. La inferencia visual y el almacenamiento compartido requieren privacidad, permisos y evaluación de costos |
| F · simuladores | Validada | El simulador dimensional muestra el esquema de placa; el corte conceptual cambia visualmente según frontal, adhesivo, liner, gap y filo. `engineering.js`, `engineering-ui.js` | Ampliar el simulador de moiré y los modelos de tinta, anilox, secado, UV, corona y cartas de control. Los modelos actuales indican límites |
| G · ingeniería | Validada | Distorsión, factor inverso, medida objetivo, radios, engrane, diferencia de repetición y deriva. Unidades mm/pulgadas, ficha privada, historial y PDF | Planos acotados, recorridos y medidas verificadas de máquina. La opción Comco Cadet Model 700 identifica una ficha; los parámetros se introducen manualmente |
| H · color y formulación | Pendiente | Se conservan comparadores Lab, ΔE y cursos actuales | Catálogo real, datos espectrales, sesiones de prueba y calibración. Los datos del usuario son necesarios para orientar cantidades de formulación |
| I · Lifts Excel | Validada | Cuatro lecciones, progreso, configuración regional, hoja A1:D5 funcional, consulta prellenada y gráfico de Pareto en navegador. `excel-lab.js`, `excel-lessons.js`, `excel-ui.js` | Currículo completo, Power Query, VBA, Office Scripts, DAX y análisis de fórmulas de libros XLSX |
| I · plantillas y revisión de archivos | Validada | Tres XLSX editables con fórmulas reales, filtros y listas según el libro, generados por `xlsx.js`. Revisión CSV local en `csv-review.js`, conteo de vacíos y duplicados exactos y copia separada | Más plantillas, personalización, tablas y gráficos nativos. Falta prueba con Excel de escritorio y lectura de XLSX del usuario |
| J · documentos y presentaciones | Validada | PDF de curso completo y fichas. El diagnóstico exporta DOCX. Cada curso permite PPTX editable con lecciones elegidas y notas del instructor. Se reutiliza el generador PDF | Portadas y diagramas dentro de PDF, PDF en formato de diapositivas, más documentos Word y opciones avanzadas |
| K · tutor y aprendizaje | Implementada | Preguntas breves prellenadas para el tutor contextual, sujetas a la misma autenticación y cuota | Revisión editorial de contenido generado por IA, aprendizaje adaptativo, casos progresivos y validación de inferencia en producción |
| L · biblioteca inteligente | Pendiente | La biblioteca de referencias anterior sigue disponible | Implementar y probar el almacenamiento privado. Para habilitar áreas compartidas, definir sus permisos y responsables. El OCR y la cita por página requieren validación documental |
| M · productividad y notificaciones | Validada | Los flujos existentes se prueban por regresión con servicios simulados | Enlaces de tareas a proyectos y órdenes. Entrega del aviso real con la aplicación cerrada pendiente de confirmar en dispositivo autorizado |
| N · roles, administración | Bloqueada | Las funciones nuevas se guardan con las políticas existentes de cuenta individual | Definir propietario, instructor, supervisor y consulta, así como publicación y acceso. Luego diseñar y probar migración y permisos |
| O · integración y búsqueda | Validada | Entradas desde Academia y búsqueda global, acceso a ficha desde el curso y retorno a la lección, Pareto desde calidad y casos desde atlas | Búsqueda de documentos privados y recuperación por significado tras implementar el índice y sus permisos |
| P y R · técnica, costos y etapas | En pruebas | Cálculo y XLSX se ejecutan en el navegador. PowerPoint usa PptxGenJS 4.0.1 con carga al solicitar la descarga y licencias de distribución bajo `web/vendor/`. Recorridos probados con datos marcados como didácticos | Validación en Excel y Supabase de producción, pruebas en iPhone físico y confirmación de fuentes. Sin compra ni activación de servicios de pago |

## Resultados de esta etapa

Pasaron 143 pruebas de Node y 7 flujos de Chromium. El flujo nuevo cubre móvil a 390 px, comparación local de imágenes, persistencia simulada, descarga XLSX, CSV, PDF, DOCX y PPTX, y selección de una propuesta de identidad. La compilación de Pages terminó correctamente. Los libros se abrieron con `openpyxl`; se comprobaron la estructura y el contenido de DOCX y PPTX con `python-docx` y `python-pptx`.

## Validaciones y correcciones

- El cálculo de distorsión distingue el diámetro primitivo del engrane y el diámetro exterior del cilindro. Casos comprobados en mm y pulgadas, validación de unidades, datos faltantes, desgaste geométrico no inferido y deriva entre referencias.
- El evaluador de Excel comprueba precedencia, referencias absolutas, SUMAR.SI con coma decimal, división por cero, ciclos y mensajes para funciones sin soporte. XLSX conserva fórmulas de Excel almacenadas en inglés según OOXML, independientemente de la interfaz seleccionada.
- La validación con `openpyxl` comprueba estructura, fórmulas, formato de porcentaje y listas desplegables. No certifica recálculo en Excel de escritorio. El libro de movimientos amplía el filtro hasta la fila 1000 para cubrir el rango consultado por las fórmulas.
- CSV conserva separadores, comillas y saltos de línea dentro de una celda. La copia neutraliza textos que podrían interpretarse como fórmulas de hoja de cálculo.
- Un caso exige evidencia antes de guardar una causa confirmada. La interfaz no convierte la hipótesis sugerida en causa sin una decisión explícita del usuario.
- Las pruebas de navegador usan sesión simulada. Las tres propuestas guardan una preferencia y no sustituyen el icono ni el logotipo actual.
