# Lifts Asistente Virtual

App web en español con registro, acceso y recuperación de contraseña mediante Supabase Auth. Perfil personal, tareas y consultas se guardan en Supabase con reglas de acceso por usuario. El chat usa Cloudflare Workers AI cuando el vínculo AI y el contador de uso están configurados. La búsqueda web aún no está conectada.

## Configurar Supabase (obligatorio antes de usar)

1. En el proyecto `ubasjdaluswyxpzsnyug`, abre **SQL Editor**, crea una consulta, pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) y pulsa **Run**. Crea la tabla y aplica Row Level Security para que cada usuario solo pueda leer y modificar su propio espacio. No desactives RLS.
2. En **Authentication → URL Configuration**, configura **Site URL** con la dirección estable de producción. Para este proyecto probablemente sea `https://lifts-asistente-virtual.pages.dev`; confirma la dirección en Cloudflare.
3. En **Redirect URLs**, añade la URL exacta de producción con `/` final y, si vas a usarlo, `https://018b1416.inteligencia-artificial-perzonalizada.pages.dev/`. Para desarrollo añade `http://127.0.0.1:3000/`. Añade individualmente otros dominios que utilices.
4. En **Authentication → Providers → Email**, habilita el acceso por correo y la confirmación de correo. Para usuarios públicos configura un proveedor SMTP y los límites de envío apropiados: el correo incluido de Supabase tiene restricciones y no debe darse por suficiente para producción.
5. Abre la app, crea tu cuenta con una contraseña nueva y confirma tu correo. Abre los enlaces de confirmación y recuperación en el mismo navegador que inició el proceso (PKCE).

La URL y la clave `sb_publishable_…` en `web/auth.js` son públicas. No añadas claves `service_role`, claves secretas ni contraseñas al repositorio. La separación de datos depende de las políticas SQL, no de ocultar la clave pública. No se ha creado ninguna cuenta por adelantado.

## Cloudflare Pages

Conecta este repositorio y usa:

- Rama: `main`.
- Framework: `None`.
- Build command: vacío.
- Build output directory: `web`.
- Root directory: predeterminado.

Usa la integración con GitHub para incluir Pages Functions: Direct Upload por arrastre solo publicaría la interfaz estática y no habilita el chat. No subas `.git`, pruebas ni SQL como archivos públicos del sitio. El SDK de Supabase se descarga de jsDelivr en una versión fija, con verificación de integridad en el navegador. Deja vacío el comando de compilación; Cloudflare compila automáticamente las funciones.

## Desarrollo local

```sh
cd /workspace/Inteligencia-Artificial-Perzonalizada
python3 -m http.server 3000 --bind 127.0.0.1 --directory web
```

## Validación

```sh
node tests/auth.test.cjs
node tests/personalization.test.cjs
node tests/chat.test.cjs
node --check web/auth.js
node --check web/app.js
```

Las pruebas usan un cliente simulado: comprueban bloqueo de acceso sin sesión, carga/guardado por identificador, limpieza de pantalla al salir, error de tabla ausente, recuperación, credenciales rechazadas y protección ante datos inválidos. No verifican los correos, las políticas SQL en el servidor ni la configuración real de Supabase.

Después de aplicar el SQL, verifica registro, confirmación, acceso, recuperación y cierre de sesión en producción. Con dos cuentas distintas comprueba que tareas, perfil y consultas no se mezclan y que un usuario autenticado no puede consultar o modificar el `user_id` del otro mediante la API. Confirma también que una petición sin sesión no puede leer la tabla. Estas comprobaciones reales quedan pendientes hasta configurar el proyecto.

## Límites actuales

- El espacio se sincroniza al guardar. Si falla, el aviso lo indica: mantén la página abierta y repite la acción. No hay funcionamiento sin conexión ni resolución de ediciones simultáneas; la última escritura gana.
- Los datos del antiguo prototipo local no se importan a ninguna cuenta, para evitar atribuir información de un navegador compartido a otra persona.
- La sesión se conserva en el navegador mediante el SDK; usa Cerrar sesión en equipos compartidos.
- Borrar mis datos vacía el perfil, las tareas y las consultas; no elimina la cuenta de Supabase Auth.
- El chat genera respuestas cuando Workers AI está configurado; no consulta fuentes en internet. No guardar manuales confidenciales hasta implementar una biblioteca con permisos y validar la seguridad completa.

## Bienvenida y personalización

Las cuentas nuevas y las anteriores que aún no completaron la bienvenida reciben seis preguntas opcionales: nombre o apodo, intereses, actividad, especialidad, objetivos y estilo de respuesta. No se asigna flexografía a todos los usuarios. El usuario puede omitir preguntas o continuar sin personalización.

Guardar las respuestas requiere marcar la autorización al finalizar. Sin autorización, las preferencias se mantienen en memoria durante la sesión y se excluyen de cada escritura a Supabase. Solo se guarda que la bienvenida fue completada, además de las tareas y consultas que la persona cree explícitamente. Los perfiles anteriores se preservan hasta que el usuario elige qué guardar; no se interpreta esa información como una nueva autorización.

Desde Mi perfil se pueden editar las preferencias, retirar la autorización y vaciar el perfil guardado sin eliminar tareas y consultas. Estas últimas pueden contener información personal escrita por el usuario; para eliminarlas también existe Borrar mis datos. El borrado depende de que la sincronización termine correctamente y no equivale a eliminar copias de seguridad del proveedor.

Las sugerencias son reglas locales basadas en intereses y objetivos: seleccionarlas prepara una consulta editable y no la envía automáticamente. El chat puede compartir el perfil con Cloudflare Workers AI solo al marcar la casilla específica; no se adjunta por defecto. La privacidad frente a otros usuarios depende de las políticas RLS en `supabase/schema.sql`; los administradores del proyecto tienen acceso administrativo a los datos. No se promete confidencialidad absoluta ni cifrado de extremo a extremo.

La personalización utiliza el campo JSON existente y no requiere ejecutar SQL adicional. Las pruebas de interfaz simulan el DOM; quedan pendientes comprobaciones visuales en navegador y de permisos en Supabase real.

## Activar el chat con Cloudflare Workers AI

1. En Supabase SQL Editor ejecuta [`supabase/ai_rate_limit.sql`](supabase/ai_rate_limit.sql). Requiere Supabase Auth y crea un contador protegido por usuario: 5 solicitudes por minuto y 50 por día UTC. Los intentos que llegan al modelo cuentan aunque este falle. Este límite no es un tope global de gasto ni sustituye la protección contra abuso del registro de cuentas.
2. En Cloudflare abre **Workers & Pages → lifts-asistente-virtual → Settings → Bindings** (en algunas versiones: **Functions → Bindings**). Añade un vínculo de tipo **Workers AI** con nombre exacto **AI**, en producción. Si pruebas despliegues de vista previa, configura el mismo vínculo para ese entorno.
3. Guarda y vuelve a desplegar desde la rama `main` para aplicar el vínculo. Mantén directorio de salida `web` y comando de compilación vacío. Pages detecta y compila la carpeta `functions` desde la raíz del repositorio automáticamente. No muevas esa carpeta dentro de `web`.
4. Usa el despliegue de Pages conectado a GitHub; una carga de archivos estáticos por arrastre no compila Pages Functions.
5. Inicia sesión y prueba una consulta. Comprueba también errores de sesión, persistencia al recargar y permisos con otra cuenta. Si no configuraste AI o el SQL, el chat muestra la acción que falta.

Modelo: `@cf/meta/llama-3.1-8b-instruct-fp8`, con 512, 2048 o 3072 tokens de salida según el nivel de detalle seleccionado. Revisa disponibilidad, límites y tarifas vigentes de Workers AI en tu cuenta antes de abrirlo al público. No hay credenciales privadas de Cloudflare en el navegador: la función usa el vínculo del entorno.

La función verifica cada token de sesión contra Supabase Auth antes de consumir cuota o consultar el modelo. El límite se aplica de forma atómica mediante una función SQL que usa `auth.uid()` y no acepta identificadores arbitrarios. No se utiliza una clave `service_role`. La función rechaza solicitudes de otro origen, roles de sistema aportados por el cliente y cuerpos mayores de 48 KB.

Cada envío comparte con Cloudflare Workers AI la pregunta y hasta ocho mensajes recientes. El perfil se adjunta únicamente si el usuario marca Compartir mi perfil en el chat, con autorización separada de guardar el perfil. La casilla se restablece al cambiar de sesión. No se envía automáticamente la lista de tareas, el correo ni el token de acceso al modelo. No se imprimen conversaciones ni tokens en registros de aplicación. El proveedor procesa el contenido conforme a sus condiciones; no se promete cifrado de extremo a extremo ni confidencialidad absoluta.

La respuesta se guarda en Supabase con la pregunta después de recibirla. Si el modelo falla, no se inventa una respuesta ni se elimina el borrador. Las respuestas antiguas del prototipo no se envían como respuestas del modelo. El historial es breve y no constituye memoria completa; el modelo no tiene herramientas, navegación web ni capacidad de crear tareas.

Las pruebas simulan Supabase y el modelo. La compilación de Pages Functions se puede verificar con `npx --yes wrangler@4.50.0 pages functions build --outdir /tmp/lifts-pages-functions`. La inferencia real, el SQL y la cuota quedan pendientes de validación en la cuenta de Cloudflare y Supabase del usuario.

## Límite ampliado para la cuenta del propietario

Ejecuta de nuevo `supabase/ai_rate_limit.sql` actualizado: conserva los contadores y añade una tabla privada de excepciones. Después abre `supabase/owner_limit.sql`, sustituye `TU_CORREO_AQUI` por el correo confirmado de tu cuenta y ejecútalo en SQL Editor. Asigna 20 consultas por minuto y 500 por día al UUID existente. No concede acceso a datos de otros usuarios ni privilegios administrativos. Las demás cuentas conservan 5/minuto y 50/día. Si el correo no corresponde a una única cuenta confirmada, el script falla sin asignar la excepción.

Las excepciones no se leen ni modifican desde el navegador: solo las administra el propietario de la base de datos. Aumentar el uso puede generar costos en Cloudflare. Para revocar una excepción, el administrador puede eliminar su fila en `public.ai_quota_overrides`.

Prueba del SQL en PostgreSQL embebido temporal (sin datos ni servicios de producción):

```sh
npm install --prefix /tmp/lifts-sql-tests --no-audit --no-fund @electric-sql/pglite@0.3.14
NODE_PATH=/tmp/lifts-sql-tests/node_modules node tests/quota.test.cjs
```

Comprueba ambos niveles de cuota, reinicio de ventanas, migración repetible y rechazo de cambios por usuarios ordinarios. Ejecutar o publicar código no aplica automáticamente los cambios al proyecto Supabase real.

### Disponibilidad del modelo

Se utiliza la variante FP8, marcada como activa en el catálogo oficial. El identificador sin sufijo `@cf/meta/llama-3.1-8b-instruct` fue retirado el 30 de mayo de 2026 y no debe reutilizarse. Referencias: [aviso oficial](https://developers.cloudflare.com/changelog/2026-05-08-planned-model-deprecations/) y [modelo FP8](https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct-fp8/). La disponibilidad para una cuenta y la inferencia real deben comprobarse después del despliegue.

### Comprobar el despliegue y la inferencia

El botón **Comprobar conexión de IA** usa la sesión actual y consume una consulta de cuota. Envía únicamente una pregunta fija, sin historial ni perfil, y no guarda el resultado en las conversaciones. Muestra la revisión `lifts-ai-detail-r3`, el modelo y, si falla la inferencia, una descripción acotada del proveedor con redacción de tokens, correos y URLs. Las solicitudes de chat normales no muestran descripciones sin filtrar del proveedor.

`GET /api/chat` expone solo la revisión, el modelo y la presencia del vínculo AI, sin ejecutar inferencias ni consultar cuentas. No prueba que el proveedor esté operativo. La comprobación autenticada por POST sí llega al modelo si sesión, vínculo y cuota están disponibles.

### Respuestas detalladas

El chat usa el nivel Detallada por defecto y ofrece Breve y Profunda. Las instrucciones piden explicar fundamentos, funcionamiento y ejemplos cuando sean útiles, sin alargar saludos o preguntas simples. Se refuerza la distinción entre flexografía en relieve e impresión digital y la corrección de errores del historial. Esto orienta el modelo, pero no verifica técnicamente sus respuestas ni sustituye documentación de fabricantes o búsqueda con fuentes. El historial existente se conserva; las mejoras afectan nuevas respuestas. Las respuestas más largas consumen más tokens y pueden aumentar el costo o el tiempo de espera de Workers AI.

### Cuenta sin límite interno

Para quitar únicamente los límites de consultas de Lifts de la cuenta del propietario:

1. Ejecuta `supabase/ai_rate_limit.sql` actualizado; conserva las excepciones existentes.
2. Abre `supabase/owner_unlimited.sql`, sustituye `TU_CORREO_AQUI` por el correo confirmado de tu cuenta y ejecútalo desde SQL Editor.

La excepción se vincula al UUID de una única cuenta confirmada. La función verifica la sesión antes de permitir la excepción; las demás cuentas conservan sus límites. Solo el administrador de la base de datos puede cambiar esta configuración. No otorga acceso a datos de otros usuarios ni elimina límites de tamaño de solicitudes, seguridad, disponibilidad o consumo del proveedor. Cloudflare sigue aplicando sus cuotas y costos. Para volver a 20/minuto y 500/día, ejecuta `owner_limit.sql` con el correo correspondiente; para volver a los límites estándar elimina la fila de excepción desde SQL Editor.

El script solo se aplica al Supabase real al ejecutarlo allí; subirlo a GitHub no cambia la cuenta.
