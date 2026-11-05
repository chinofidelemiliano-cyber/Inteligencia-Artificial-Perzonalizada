# Nexo · Inteligencia Artificial Personalizada

Primera interfaz web en español para un asistente personal con organización de tareas y perfil profesional. Incluye un perfil inicial de flexografía, Comco, BOPP y transfer.

## Ejecutar

Requiere Python 3; no tiene dependencias externas.

```sh
cd /workspace/Inteligencia-Artificial-Perzonalizada
python3 -m http.server 3000 --bind 127.0.0.1 --directory web
```

## Alcance actual

- Navegación adaptable a celulares y computadoras.
- Perfil local editable, tareas con fecha y estado, consultas guardadas y borrado de datos.
- Datos almacenados en localStorage, solo en el navegador actual. No guardar información confidencial.
- No hay registro, autenticación, aislamiento seguro entre personas, backend, IA, búsqueda web ni notificaciones. El chat identifica explícitamente estas limitaciones y no inventa respuestas técnicas.

## Publicar en Cloudflare Pages

El prototipo es un sitio estático y se puede alojar directamente en Cloudflare Pages, sin servidor Python ni proceso de compilación.

### Desde GitHub

1. Sube los archivos de este proyecto a tu repositorio en GitHub; estos cambios locales todavía no se han enviado.
2. En el panel de Cloudflare, abre **Workers & Pages**, crea un proyecto de **Pages** y conecta el repositorio `chinofidelemiliano-cyber/Inteligencia-Artificial-Perzonalizada`.
3. Selecciona la rama `main` y el framework **None**. Mantén la raíz del proyecto en la raíz del repositorio.
4. Deja el comando de compilación vacío y establece **Build output directory** en `web`.
5. Publica el proyecto. Cloudflare proporcionará una dirección HTTPS en `pages.dev`; puedes añadir un dominio propio después.

### Carga directa sin GitHub

Crea un proyecto de Pages mediante **Direct Upload** y sube la carpeta `web` (o un ZIP con su contenido). `index.html`, `app.js` y `_headers` deben quedar en la raíz de los archivos publicados. No subas el repositorio completo ni la carpeta `.git`.

### Verificar después de publicar

Abre la dirección que proporcione Cloudflare y comprueba que puedes navegar entre Mi espacio, Mi organización y Mi perfil; agregar y completar una tarea; guardar el perfil; recargar y recuperar los datos; y borrarlos desde Mi perfil. Comprueba también la vista en un celular.

No se necesitan claves ni variables de entorno para publicar esta versión. Publicarla no conecta una IA ni crea cuentas: los datos siguen siendo locales a cada navegador. Al cambiar del sitio local al dominio público, los datos locales anteriores no se transfieren. En equipos compartidos, los datos del prototipo no están separados por usuario.

Para la aplicación completa, Cloudflare Workers puede alojar la API, D1 los datos y R2 los documentos. Esa etapa requiere implementar autenticación y permisos por usuario antes de guardar información privada en el servidor. Las credenciales de IA deben configurarse como secretos del backend, nunca en `web/app.js`.

## Próxima etapa

Integrar autenticación y base de datos con acceso por usuario, proveedor de IA en un servidor (sin exponer claves al navegador), búsqueda técnica con citas y fechas, y biblioteca de documentos con permisos. Validar estas funciones antes de abrir el servicio al público. No utilizar este prototipo como un sistema de cuentas seguro.
