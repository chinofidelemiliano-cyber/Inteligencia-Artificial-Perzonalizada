# Lifts Asistente Virtual

App web en español con cuentas de Supabase, bienvenida opcional, tareas, conversaciones guardadas manualmente, nombre personalizable y lectura de voz del navegador. Tema oscuro cian/violeta y logos originales.

## Política actual: evitar gastos

- Se retiraron OpenAI, la revisión GPT y la búsqueda web de pago, incluyendo sus llamadas del servidor. No se usan claves de OpenAI, aunque alguna permanezca en la configuración.
- El propietario confirmó que su cuenta está en Workers Free. Chat, diagnóstico de inferencia e imágenes vuelven a estar habilitados bajo esa declaración; no se ha comprobado la facturación mediante una API administrativa.
- `OWNER_CONFIRMED_FREE_PLAN=true` registra la confirmación del propietario en el código. El administrador puede pausar ambas funciones estableciendo `FREE_AI_CONFIRMED=false` y desplegando. Esta configuración es una declaración, no una detección automática de facturación: no habilitar en Workers Paid ni con facturación unificada/prepagada de AI Gateway.
- No hay modelos de otros proveedores, búsquedas pagadas ni reintentos automáticos con otro modelo. Cada error de cuota detiene la operación; no se contrata ni cambia el plan automáticamente.
- Se eliminaron los scripts de acceso ilimitado y de cuotas ampliadas. La función SQL actual limita todas las cuentas a 5 consultas/minuto y 50/día; estos contadores no equivalen a Neurons ni garantizan un presupuesto monetario.
- La voz y su muestra usan Web Speech API, sin API TTS de pago contratada por Lifts. Las voces pueden necesitar conexión según el navegador/sistema.

Según la [documentación oficial de precios](https://developers.cloudflare.com/workers-ai/platform/pricing/), Workers Free ofrece una asignación diaria y las operaciones fallan al agotarse; Workers Paid puede cobrar el exceso. Los modelos de chat y de imagen existentes solo deben usarse bajo el plan gratuito confirmado. Su disponibilidad depende de ese plan; no se debe aceptar una actualización de pago para habilitarlos.

**El código no cancela suscripciones, no revoca claves ni cambia la facturación de Cloudflare o Supabase.** La página, las funciones, la base de datos, el correo SMTP y otros servicios pueden tener cargos si la cuenta está en un plan de pago. Comprueba esos planes y elimina integraciones contratadas antes de afirmar que toda la operación es gratuita. Los cambios solo entran en vigor después de desplegar la versión actual; despliegues antiguos pueden contener integraciones retiradas.

## Configuración de Supabase

1. Ejecuta `supabase/schema.sql` en SQL Editor para crear `user_spaces` y sus políticas RLS.
2. Ejecuta `supabase/ai_rate_limit.sql` actualizado para revocar el indicador ilimitado y aplicar los límites estándar, conservando datos y contadores. No hay acceso administrativo al Supabase real desde este repositorio: subir el SQL no lo ejecuta.
3. En Authentication → URL Configuration usa `https://lifts-asistente-virtual.pages.dev` como Site URL y añade `https://lifts-asistente-virtual.pages.dev/` a Redirect URLs.
4. Confirma que el proveedor Email está habilitado. La confirmación y recuperación dependen de los límites de correo de Supabase. No contrates un SMTP de pago como parte de este flujo.
5. Usa una contraseña nueva y confirma el correo. Los enlaces PKCE deben abrirse en el mismo navegador que inició el proceso.

La URL y la clave pública `sb_publishable_…` del código no son secretos. No guardes contraseñas ni claves privadas en GitHub. La privacidad depende de las políticas RLS. Los administradores del proyecto pueden acceder a la base de datos; no se promete cifrado de extremo a extremo.

## Publicar

En Cloudflare Pages conecta GitHub y configura:

- Rama `main`.
- Framework `None`.
- Comando de compilación vacío.
- Directorio de salida `web`.

Pages compila automáticamente `functions` desde la raíz del repositorio. La confirmación del propietario habilita IA con la variable ausente. Si la cuenta deja de ser Workers Free o hay dudas, configura `FREE_AI_CONFIRMED=false` y despliega para pausar antes de continuar. Si anteriormente añadiste `OPENAI_API_KEY`/`OPENAI_MODEL`, elimínalos de los ajustes y revoca la clave en OpenAI si ya no la usarás. No es necesario añadir ninguna API de pago.

El vínculo de Workers AI llamado `AI` ya utilizado por el proyecto debe estar presente. La confirmación del propietario permite usarlo sin añadir nuevas variables. Si anteriormente se configuró `FREE_AI_CONFIRMED=false`, esa pausa prevalece; cámbiala solo después de revisar el plan. Si usas vistas previas, mantén la misma restricción allí. Si cambias a un plan de pago, desactiva la variable antes del cambio. Si un modelo no está disponible en el plan Free, déjalo sin usar.

## Desarrollo y pruebas

```sh
python3 -m http.server 3000 --bind 127.0.0.1 --directory web
node tests/auth.test.cjs
node tests/assistant-name.test.cjs
node tests/voice.test.cjs
node tests/personalization.test.cjs
node tests/chat.test.cjs
node tests/stream.test.cjs
node tests/image.test.cjs
node tests/images-ui.test.cjs
```

El servidor Python solo sirve la interfaz, no ejecuta Pages Functions. Para compilar estas últimas:

```sh
npx --offline --yes wrangler@4.50.0 pages functions build --outdir /tmp/lifts-pages-functions
```

Prueba de SQL en PostgreSQL temporal, si la dependencia ya está disponible:

```sh
NODE_PATH=/tmp/lifts-sql-tests/node_modules node tests/quota.test.cjs
```

Las pruebas de IA y voz usan servicios simulados, no consumen llamadas a proveedores. Se prueba que la confirmación registrada habilita ambos endpoints y que una pausa explícita bloquea las llamadas antes de contactar cualquier servicio. No se ha verificado la facturación real de las cuentas externas.

## Comportamiento y privacidad

- Las preguntas de bienvenida son opcionales. Guardar preferencias personales requiere autorización; sin ella se usan solo durante la sesión.
- Cada cuenta elige un alias y voz en Mi perfil. El filtro de nombres bloquea términos ofensivos comunes y algunas variantes; no es infalible. El alias se envía al modelo cuando la IA remota está habilitada.
- Voz de muestra lee una frase fija con la selección actual antes de guardarla. Escuchar respuesta y Detener voz controlan la lectura del chat. No usamos micrófono. Se detiene al cerrar sesión o abandonar la página.
- Las conversaciones nuevas solo existen en memoria. Guardar tareas o perfil nunca guarda el chat temporal. Guardar conversación crea una copia privada; los cambios posteriores requieren Guardar cambios. Las no guardadas desaparecen al recargar o cerrar sesión. El historial antiguo se conserva como Historial anterior hasta que el usuario lo elimine.
- La generación remota de imágenes está sujeta a la misma puerta de plan gratuito. No guarda resultados ni descripciones en la cuenta; descarga la imagen para conservarla.
- El chat no navega en internet ni ejecuta tareas por sí mismo. Trabajo permite consultar una referencia general en Wikipedia mediante una búsqueda explícita gratuita. No se generan nuevas revisiones web de pago.
- Cuando la IA está habilitada, se envía la pregunta y hasta ocho mensajes recientes. El perfil se adjunta solo mediante la opción de Mi perfil; no se envían automáticamente tareas ni correo. El proveedor puede retener datos conforme a sus condiciones.
- Las respuestas pueden ser incorrectas. Las guías locales incluyen flexografía en relieve, gap de etiquetas y unidades: `P = R/n`, `g = P-L`, `R = n(L+g)`, con R como desarrollo efectivo, no radio. Para parámetros específicos se necesita documentación de la máquina. Las instrucciones no sustituyen verificación técnica.

## Identidad visual

Los originales están en `web/assets/lifts-banner.png` y `lifts-icon-original.png`. El banner se muestra sin recortes; los iconos derivados se usan en la pestaña y accesos directos. El manifest no añade funcionamiento sin conexión ni publica una app en tiendas. Se revisó el diseño en Chromium para escritorio y celular con cuenta simulada, incluyendo movimiento reducido.

## Tono de las respuestas

El asistente tiene instrucciones para ser cercano, paciente y directo; responder a lo preguntado; reconocer emociones expresadas sin suponerlas; y evitar frases repetitivas, condescendencia, halagos automáticos y explicaciones defensivas de identidad. Mantiene la precisión y la corrección de errores. No se cambia de proveedor ni se añaden llamadas de pago. La temperatura del modelo se mantiene igual.

Las pruebas verifican que las instrucciones de tono y precisión llegan al modelo. No garantizan que todas las respuestas generadas las sigan: debe comprobarse el trato real después del despliegue. El historial guardado no se reescribe.

## Comprensión de preguntas y comentarios

`lib/conversation.js` orienta la respuesta según la última intervención: saludos, afecto, impresión sobre la interacción, identidad, correcciones, emociones, procedimientos, preguntas y comentarios. Las reglas locales son pistas conservadoras, no un clasificador semántico infalible. Las frases mixtas siguen pasando al modelo para interpretar el mensaje completo.

Se retiraron los ejemplos de respuestas sociales del prompt global. Las guías de cálculo se añaden a procedimientos; el contenido técnico se limita al contexto pertinente y se excluye de los intercambios sociales. En esos intercambios se conserva solo el contexto inmediato y se limita la extensión. El historial del asistente no se considera una fuente de verdad. Esto reduce contaminación por ejemplos anteriores y carga innecesaria, sin añadir llamadas a modelos ni servicios de pago.

Las pruebas incluyen la secuencia de identidad, afecto y “cómo te caigo”, variantes sin acentos, correcciones y preguntas mixtas. Comprueban la clasificación local y el contexto enviado, no la corrección garantizada de cada respuesta generada. La comprensión y el trato deben revisarse con el modelo real después de desplegar.

```sh
node tests/conversation.test.cjs
```

## Espacio de trabajo y acompañamiento

La app conserva el chat general y añade estas capacidades:

- **Agenda:** tareas editables, prioridad, duración, fecha objetivo, bloque de tiempo y recordatorio. La interfaz rechaza cruces con bloques existentes. Puedes filtrar pendientes, tareas de hoy/vencidas o completadas.
- **Propuesta de jornada:** planificación local de tareas sin horario, según prioridad, fechas y duración, respetando bloques existentes. Es una propuesta que se revisa antes de aplicar. No es una estimación profesional de producción ni incorpora pausas automáticamente; reserva tus pausas como bloques. Revalida la agenda al aplicar si algo cambió.
- **Enfoque:** temporizador persistido de 1 a 120 minutos, con pausa y reanudación. Usa una hora objetivo, no la precisión de los intervalos del navegador. Si el navegador se suspende, se actualiza cuando vuelve a ejecutarse.
- **Trabajo:** preguntas opcionales sobre actividad, tareas recurrentes, horario, obstáculos, herramientas y objetivo semanal. Guardar el contexto y compartirlo con la IA son autorizaciones separadas; el permiso para compartir se desactiva al iniciar sesión. Sin guardar, las respuestas se excluyen de otras escrituras a la cuenta.
- **Contexto de IA:** únicamente al habilitarlo se adjuntan el perfil laboral y hasta 12 tareas pendientes. El servidor limita campos y longitudes; no se envían datos de otras cuentas. El asistente explica qué le falta y dónde buscarlo, y no afirma haber creado tareas o notificaciones desde el chat.
- **Convertir en tarea:** cada mensaje del usuario puede prepararse como título de una tarea; el usuario revisa y pulsa Agregar tarea.
- **Referencias generales:** búsqueda manual gratuita en Wikipedia en español a través de `/api/research`, con sesión, límite de solicitudes y puerta del plan gratuito. Solo se envía el tema, no el perfil ni las tareas. Los resultados son referencias secundarias, no manuales de fabricantes. Si no hay una referencia útil o el proveedor falla, se ofrece una búsqueda externa de manuales y fichas, que el usuario abre voluntariamente. Preparar consulta copia una referencia visible al borrador del chat; no la envía automáticamente ni la presenta como verificación técnica.

Los campos nuevos usan el JSON existente de `user_spaces`; no requieren SQL adicional. La instancia real de Supabase sigue necesitando las políticas y la función de cuota ya documentadas.

## Recordatorios: alcance real

**Activar notificaciones** solicita permiso mediante una acción del usuario y registra `web/sw.js`. **Probar aviso** permite comprobar la entrega al sistema. Los avisos de tareas se revisan mientras la página está abierta y puede ejecutarse, aproximadamente cada 30 segundos y al volver a primer plano. El navegador o el sistema pueden retrasarlos o bloquearlos; no son adecuados para avisos críticos de seguridad. Un permiso concedido no garantiza que se muestre una notificación.

El service worker no tiene servidor push, suscripciones, cron, caché de cuentas ni tareas programadas. **No se envían notificaciones con Lifts cerrado.** En algunos teléfonos la capacidad depende de añadir la app a la pantalla de inicio. No se añade un servicio externo de notificaciones de pago.

Para avisos fuera de Lifts, **Exportar al calendario** descarga un archivo ICS con bloques y alarmas. Debe importarse en un calendario privado y probar sus alertas: distintos calendarios pueden ignorar las alarmas importadas o requerir configurarlas. El archivo contiene títulos de trabajo. Los avisos de Lifts ocultan títulos por defecto; mostrarlos requiere marcar una opción que se restablece al cambiar de sesión.

Los recordatorios pueden marcarse Hecho, posponerse 10 minutos o reconocerse como vistos. Se registran por cuenta las marcas de entrega y reconocimiento. No se garantiza deduplicación absoluta entre varias pestañas o dispositivos ni exactitud de notificaciones en segundo plano.

## Personaje y teléfono

Un personaje interactivo acompaña la jornada con el nombre elegido, mensajes basados en pendientes y accesos a agenda, contexto laboral y pausa. La presentación femenina/masculina/neutra es una elección explícita de Mi perfil: no se infiere género de nombres ni se presenta al asistente como humano. El motor recibe esa preferencia gramatical, sujeta a sus limitaciones de generación. La voz sigue dependiendo del sistema.

En celular, navegación inferior fija de cinco secciones, cabecera compacta y controles adaptados al tacto. Se mantienen foco de teclado y preferencia de movimiento reducido. El personaje no rastrea actividad fuera del sitio, ubicación, empleados ni acciones en otras aplicaciones.

## Validación del espacio de trabajo

```sh
node tests/work.test.cjs
node tests/research.test.cjs
```

Las pruebas verifican planificación y turnos nocturnos, cruces, exportación ICS con texto escapado, recordatorios y exclusión del contexto laboral sin autorización. Las pruebas de chat comprueban presentación y contexto acotado. En Chromium se recorrieron creación/edición de tareas, rechazo de conflictos, aplicación de propuesta, enfoque, exportación, búsqueda, contexto de IA y limpieza al cambiar de cuenta. Se usaron cuenta, IA, referencias y sistema de notificaciones simulados. La compilación de Pages Functions se verifica con Wrangler; el acceso real a Wikipedia, la notificación del sistema y la inferencia deben comprobarse en producción.

## iPhone 16 Pro: Hablar con Lifts

`/iphone.html` contiene una guía pública, adaptable al teléfono y enlazada desde Mi perfil. El usuario crea en Atajos un atajo llamado **Hablar con Lifts** con cuatro acciones: Dictar texto → Codificar URL → Texto → Abrir URLs. La acción Texto concatena la dirección de producción `https://lifts-asistente-virtual.pages.dev/#voice=` con la variable codificada. La guía calcula la dirección del sitio actual, incluye Copiar dirección y un enlace de prueba. No se ofrece un archivo `.shortcut` firmado ni se instala nada automáticamente en el teléfono.

El usuario puede invocarlo mediante Siri o asignarlo en Ajustes → Botón de acción → Atajo. iOS puede pedir desbloqueo y puede abrir Safari en lugar de la app web instalada; es necesario iniciar sesión en la ventana correspondiente. El reconocimiento de voz lo gestiona iOS, no una API contratada por Lifts. No hay escucha permanente ni activación mediante una palabra propia fuera del sitio.

`web/shortcut-link.js` acepta el fragmento `#voice=...`, elimina caracteres de control, limita el texto a 5000 caracteres y prepara una URL limpia. `web/shortcut.js` retira el dictado de la barra con `replaceState`, lo mantiene en memoria mientras se inicia sesión y permite revisarlo en el chat o preparar una tarea. No envía a la IA, guarda conversaciones, crea tareas ni concede permisos automáticamente. Cada nuevo dictado reemplaza el borrador anterior no enviado y detiene una respuesta en curso. No se borran conversaciones guardadas ni mensajes ya enviados. Si aún falta la bienvenida, el dictado espera a completarla o continuar sin personalizar. Salir de la cuenta descarta el dictado pendiente y los borradores del chat.

Los fragmentos no se envían en peticiones HTTP. Esto reduce exposición en registros del servidor, pero no garantiza que Apple, el navegador o el dictado no mantengan sus propios datos. No uses el atajo para claves ni contraseñas. Recargar o abandonar la página antes de usar el dictado lo descarta. Si el registro exige abrir un enlace de confirmación en otra ventana, debe terminarse primero y ejecutarse después el atajo.

Preparar tarea copia un título de hasta 240 caracteres y cancela cualquier edición anterior; el usuario revisa fecha y recordatorio antes de agregarla. No se interpretan fechas habladas automáticamente ni se crean recordatorios en la app Recordatorios de Apple. Para avisos nativos fuera de Lifts se puede usar Siri con las acciones de Apple o la exportación ICS ya existente; no hay sincronización automática con esas apps.

```sh
node tests/shortcut-link.test.cjs
```

Se probaron fragmentos con acentos y caracteres especiales, retirada del texto de la URL y límites. En Chromium se verificó la espera de sesión, que el dictado no viaja por HTTP, la ausencia de envíos y guardados automáticos, reemplazo de borradores por nuevos dictados, creación explícita de tareas, envío manual y limpieza al cerrar sesión. Las pruebas usan una cuenta y una IA simuladas. El atajo, Siri, el botón de acción y la apertura de la app web deben probarse en un iPhone real; no se han configurado remotamente en el dispositivo del usuario.

## Conversación hablada con el personaje

**Conversar cara a cara** activa un modo de sesión con un personaje grande, estados de escucha/pensamiento/habla, respuesta leída automáticamente y acceso al texto. No usa cámara ni simula una persona real. La boca se anima cuando el motor de voz emite `onstart` y deja de animarse al terminar o cancelar; no es sincronización fonética ni garantía de calidad de voz.

**Hablar** inicia una sola escucha con `SpeechRecognition`/`webkitSpeechRecognition`, cuando el navegador lo ofrece y el usuario permite el micrófono. Al finalizar, la transcripción se envía como una consulta ordinaria de IA y la respuesta se lee. Es una acción explícita con consumo de la cuota de IA, sin un proveedor STT/TTS de pago añadido por Lifts. El navegador/sistema puede procesar audio en sus servicios y requerir conexión. No se vuelve a escuchar automáticamente al terminar de hablar, no hay activación por palabra clave y no funciona en segundo plano.

**Interrumpir** cancela escucha, lectura y espera de respuesta en el cliente. El proveedor puede continuar una inferencia ya iniciada. Al cambiar de pantalla, cerrar sesión o abandonar la página se detiene el modo; al ocultar la página se cancela la escucha y la espera, y se requiere otra acción al volver. Si el reconocimiento no está disponible, se muestra la alternativa de dictar con el teclado del iPhone desde **Ver conversación escrita**. Si falla la reproducción, se ofrece lectura visible y el botón **Escuchar otra vez**, que también permite un nuevo gesto de reproducción requerido por algunos navegadores.

El modelo recibe `conversationMode` para respuestas de diálogo más cortas y orientadas a un siguiente paso, sin respuestas enciclopédicas por defecto. Una petición explícita de explicación profunda conserva su extensión y pasos. No se añaden llamadas de revisión ni otras APIs de pago.

## Apertura desde iOS y nuevos dictados

La acción **Abrir URLs** de Atajos puede abrir Safari. El sitio no registra un esquema nativo ni puede obligar a iOS a abrir el web clip instalado. Para la interfaz sin barra de Safari se usa el icono de pantalla de inicio. Si Lifts aparece en la acción **Abrir app** de Atajos, se puede probar esa opción para abrirlo, pero no se da por disponible ni por compatible con el envío del dictado. La guía `/iphone.html` explica esta limitación y no promete una apertura directa que no hemos podido verificar.

Los dictados entrantes ahora reemplazan el borrador no enviado, incluyendo el dictado anterior, y limpian una tarea preparada a partir de ese dictado si aún no se había guardado ni editado. Se detienen respuestas en curso antes de colocar el nuevo texto. Las conversaciones guardadas y los mensajes enviados se conservan. El dictado de Siri no se envía automáticamente por activar el modo de conversación: se muestra para revisar en la conversación escrita.

Las pruebas automáticas comprueban señales de voz y guía de diálogo. La voz, el reconocimiento y la apertura de Safari/PWA en iPhone real requieren comprobación en el dispositivo; las pruebas de navegador usan motores y cuentas simulados.
