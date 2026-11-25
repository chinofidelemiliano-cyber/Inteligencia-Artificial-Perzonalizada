# Transformación integral de Lifts

Base auditada `29b026f`. Punto de recuperación `backup/antes-transformacion`. La aplicación sirve páginas HTML y JavaScript en Cloudflare Pages, con funciones para servicios externos y Supabase Auth y almacenamiento con políticas por propietario. Se conserva la instantánea JSON de cuenta y el registro de herramientas Nexus. No se modificó SQL ni se cambiaron las rutas de herramientas conservadas.

## Entrega actual

- Se retiró el estudio de personajes 3D, sus 20 GLB, el visor Model Viewer, la licencia de esa dependencia y los estilos y código exclusivos de carga. Se conservaron obras y avatares 2D, diagramas de máquinas, mapas técnicos y visualizaciones de cálculo.
- El menú contiene siete grupos plegables, resalta la ruta activa y permite plegar su vista en teléfonos. Se reorganizaron los accesos directos a las pantallas existentes.
- Atajos y navegación permite guardar favoritos, ordenar y ocultar categorías y guardar sus estados desplegables. Los recientes corresponden a la sesión actual. La búsqueda y el panel de inicio conservan sus recorridos existentes. Los favoritos usan rutas de pantalla, no identificadores de registros privados.
- La navegación y acciones principales del espacio usan azul corporativo y acento rojo para la sección activa. Se simplificaron las superficies destacadas, conservando temas claro y oscuro. El rediseño completo de todas las herramientas sigue pendiente.

## Datos y archivos

`workspaceNavigation` se guarda dentro de la fila de la cuenta con favoritos, orden, categorías ocultas y abiertas. Las cuentas que todavía no tienen esas preferencias reciben los valores iniciales. No hay migración ni dependencia adicional. Código en `web/workspace-navigation.js`, estructura en `web/index.html`, rutas en `web/app.js` y `web/nexus-core.js`, estilos en `web/personal-os.css`.

La prueba `tests/systems-preflight.browser.cjs` conserva el recorrido técnico y comprueba el menú móvil y el guardado de favoritos y orden. `tests/personal-systems.test.cjs` conserva los casos de ciclos y recorrido del mapa.

## Alcance pendiente

La auditoría, el retiro decorativo 3D, la base de navegación y los favoritos cubren parte de los apartados 1–8 y 48–53 de la especificación. Quedan pendientes los widgets adicionales del escritorio, atajos de acciones y atajos de teclado configurables, búsqueda de todas las colecciones y la ampliación de memoria y automatizaciones. Los módulos ya existentes de los apartados 9–47 permanecen disponibles. Queda por ampliar cada requisito solicitado en esos apartados, incluidos los espacios independientes, funcionamiento sin conexión, integraciones y revisión científica. No se contrataron servicios. Las integraciones futuras pueden requerir permisos y cuotas de proveedores. La publicación pública y las pruebas en teléfonos físicos están pendientes de comprobación.

## Escritorio y búsqueda de registros

**Inicio y asistente → Escritorio** abre una pantalla independiente del chat. Muestra los favoritos de la cuenta, hasta seis tareas previstas para hoy, hasta seis avisos pendientes y la próxima acción guardada en Nexus. Las listas se calculan cuando se abre el escritorio. El acceso **Configurar favoritos y navegación** abre las preferencias existentes.

El buscador también encuentra recuerdos activos por título, contenido y contexto, seguimientos y fichas del inventario industrial. Los resultados se construyen localmente con la cuenta cargada. Se reutilizan las vistas de memoria privada, Guardian e Ingeniería para abrirlos.

Archivos: `web/workspace-desktop.js`, `web/workspace-navigation.js`, `web/workspace-ui.js`, `web/index.html`, `web/app.js` y `web/nexus-core.js`. Sin migraciones. Pendientes widgets reordenables del nuevo escritorio, atajos configurables de acciones y búsqueda de las colecciones restantes.

## Atajos de acciones y reglas

Desde **Escritorio → Personalizar atajos de acción**, agrega una pantalla o un acceso a borradores de tarea, recordatorio o nota, concentración y captura de gastos. Cada atajo admite nombre, icono, carpeta, edición, orden y retiro. Se guarda en `workspaceActions` por cuenta. El guardado final de la tarea o recordatorio ocurre en el módulo correspondiente.

Desde **Escritorio → Abrir automatizaciones**, crea reglas ante tareas vencidas, calibraciones próximas, presupuestos excedidos y repasos previstos. Cada regla puede filtrar texto sin distinguir acentos, abrir el origen o preparar un aviso. Las reglas respetan los estados resuelto y pospuesto de Radar. Pueden pausarse, reactivarse o eliminarse. El Escritorio muestra coincidencias al abrirse y el botón de revisión guarda un historial de las últimas 50 revisiones. Esta versión requiere que la aplicación se abra y no envía mensajes ni ejecuta tareas externas. Quedan pendientes eventos más específicos, frecuencia programada y acciones adicionales.

Datos nuevos en `workspaceActions` y `workspaceAutomations`, en el espacio existente. Archivos en `web/workspace-actions.js`, `web/workspace-automations.js` y `web/index.html`. Los manuales y fichas técnicas quedan pendientes de carga manual. Se conservan las órdenes en su estado previo. Las pruebas incluyen el cálculo de coincidencias, el historial, la edición del atajo y la apertura de un borrador de aviso sin guardarlo automáticamente.
