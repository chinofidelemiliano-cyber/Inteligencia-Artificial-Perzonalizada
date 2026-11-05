# Nexo · Inteligencia Artificial Personalizada

App web en español con registro, acceso y recuperación de contraseña mediante Supabase Auth. Perfil personal, tareas y consultas se guardan en Supabase con reglas de acceso por usuario. La IA y la búsqueda técnica aún no están conectadas.

## Configurar Supabase (obligatorio antes de usar)

1. En el proyecto `ubasjdaluswyxpzsnyug`, abre **SQL Editor**, crea una consulta, pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) y pulsa **Run**. Crea la tabla y aplica Row Level Security para que cada usuario solo pueda leer y modificar su propio espacio. No desactives RLS.
2. En **Authentication → URL Configuration**, configura **Site URL** con la dirección estable de producción. Para este proyecto probablemente sea `https://inteligencia-artificial-perzonalizada.pages.dev`; confirma la dirección en Cloudflare.
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

También puedes publicar el contenido de `web` mediante Direct Upload. No subas `.git`, pruebas ni SQL como archivos del sitio. El SDK de Supabase se descarga de jsDelivr en una versión fija, con verificación de integridad en el navegador. No hay paso de compilación.

## Desarrollo local

```sh
cd /workspace/Inteligencia-Artificial-Perzonalizada
python3 -m http.server 3000 --bind 127.0.0.1 --directory web
```

## Validación

```sh
node tests/auth.test.cjs
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
- La app aún no responde con IA ni consulta fuentes. No guardar manuales confidenciales hasta implementar una biblioteca con permisos y validar la seguridad completa.
