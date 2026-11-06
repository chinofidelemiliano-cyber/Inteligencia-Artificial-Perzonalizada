# Lifts Asistente Virtual

App web en español con cuentas de Supabase, bienvenida opcional, tareas, conversaciones guardadas manualmente, nombre personalizable y lectura de voz del navegador. Tema oscuro cian/violeta y logos originales.

## Política actual: evitar gastos

- Se retiraron OpenAI, la revisión GPT y la búsqueda web de pago, incluyendo sus llamadas del servidor. No se usan claves de OpenAI, aunque alguna permanezca en la configuración.
- Chat, diagnóstico de inferencia y generación de imágenes remotos están bloqueados por defecto antes de contactar Supabase o invocar modelos.
- El administrador solo puede habilitarlos con `FREE_AI_CONFIRMED=true` después de verificar que el servicio está en un plan **Workers Free** con bloqueo al agotar la cuota. Esa variable es una declaración del administrador, no una comprobación automática de facturación. No usarla en un plan Paid ni con facturación unificada/prepagada de AI Gateway.
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

Pages compila automáticamente `functions` desde la raíz del repositorio. Conserva `FREE_AI_CONFIRMED` ausente o en `false` mientras no se haya verificado el plan gratuito. Si anteriormente añadiste `OPENAI_API_KEY`/`OPENAI_MODEL`, elimínalos de los ajustes y revoca la clave en OpenAI si ya no la usarás. No es necesario añadir ninguna API de pago.

Solo después de confirmar Workers Free y sus límites, puedes registrar el vínculo de Workers AI llamado `AI`, establecer `FREE_AI_CONFIRMED=true` para producción y volver a desplegar. Si usas vistas previas, mantén la misma restricción allí. Si cambias a un plan de pago, desactiva la variable antes del cambio. Si un modelo no está disponible en el plan Free, déjalo sin usar.

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

Las pruebas de IA y voz usan servicios simulados, no consumen llamadas a proveedores. La puerta de acceso al plan gratuito se prueba cerrada por defecto en ambos endpoints. No se ha verificado la facturación real de las cuentas externas.

## Comportamiento y privacidad

- Las preguntas de bienvenida son opcionales. Guardar preferencias personales requiere autorización; sin ella se usan solo durante la sesión.
- Cada cuenta elige un alias y voz en Mi perfil. El filtro de nombres bloquea términos ofensivos comunes y algunas variantes; no es infalible. El alias se envía al modelo cuando la IA remota está habilitada.
- Voz de muestra lee una frase fija con la selección actual antes de guardarla. Escuchar respuesta y Detener voz controlan la lectura del chat. No usamos micrófono. Se detiene al cerrar sesión o abandonar la página.
- Las conversaciones nuevas solo existen en memoria. Guardar tareas o perfil nunca guarda el chat temporal. Guardar conversación crea una copia privada; los cambios posteriores requieren Guardar cambios. Las no guardadas desaparecen al recargar o cerrar sesión. El historial antiguo se conserva como Historial anterior hasta que el usuario lo elimine.
- La generación remota de imágenes está sujeta a la misma puerta de plan gratuito. No guarda resultados ni descripciones en la cuenta; descarga la imagen para conservarla.
- Los modelos no buscan en internet ni ejecutan tareas. Las referencias de conversaciones anteriores pueden conservarse como historial, pero no se generan nuevas revisiones web de pago.
- Cuando la IA está habilitada, se envía la pregunta y hasta ocho mensajes recientes. El perfil se adjunta solo mediante la opción de Mi perfil; no se envían automáticamente tareas ni correo. El proveedor puede retener datos conforme a sus condiciones.
- Las respuestas pueden ser incorrectas. Las guías locales incluyen flexografía en relieve, gap de etiquetas y unidades: `P = R/n`, `g = P-L`, `R = n(L+g)`, con R como desarrollo efectivo, no radio. Para parámetros específicos se necesita documentación de la máquina. Las instrucciones no sustituyen verificación técnica.

## Identidad visual

Los originales están en `web/assets/lifts-banner.png` y `lifts-icon-original.png`. El banner se muestra sin recortes; los iconos derivados se usan en la pestaña y accesos directos. El manifest no añade funcionamiento sin conexión ni publica una app en tiendas. Se revisó el diseño en Chromium para escritorio y celular con cuenta simulada, incluyendo movimiento reducido.
