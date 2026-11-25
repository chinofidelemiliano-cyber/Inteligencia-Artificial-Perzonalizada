# Resultados de pruebas

## Corte del 25 de noviembre de 2026

| Verificación | Resultado | Evidencia |
| --- | --- | --- |
| `NODE_PATH=/workspace/.lifts-tools/node_modules node --test tests/*.test.cjs` | 216 aprobadas | Incluye casos de búsqueda, privacidad SQL local, reglas y amortización. |
| `node --test --test-concurrency=2 tests/{systems-preflight,evolution,guardian}.browser.cjs` con Playwright y Chromium | 3 aprobadas tras corregir el orden de carga | Recorridos de Agenda y herramientas móviles, Guardian, mapas, Preflight, órdenes de paneles, archivo del chat, memoria, y edición de regla. |
| `node --test tests/systems-preflight.browser.cjs` con Playwright y Chromium, repetida después de añadir amortización | 1 aprobada | Descarga CSV con 12 pagos, cuota de 100 a tasa cero y saldo final cero. |
| `wrangler pages functions build --outdir /tmp/lifts-integral-build` | Compilación correcta | Cloudflare Worker local. |
| `git diff --cached --check` | Sin errores | Validación de espacios y marcas de conflicto. |

Entorno de navegador: `PLAYWRIGHT_MODULE=/workspace/.lifts-tools/node_modules/playwright CHROMIUM_PATH=/usr/bin/chromium`. Las pruebas de interfaz simulan la autenticación. La suite SQL usa bases locales. La verificación en Cloudflare, cuentas reales y teléfonos físicos queda pendiente según lo acordado.

Se corrigieron la carga del módulo de atajos después del registro Nexus, una coincidencia incompleta para «calculadora de distorsión» y un fallo de compatibilidad con las pruebas del formulario al registrar la vista previa de memoria.

La prueba móvil se repitió tras incorporar las preferencias de frecuencia. Aprobó el guardado de 5 minutos y la apertura del detalle de una coincidencia. El intervalo se ejecuta solo con el Escritorio y la pestaña visibles. No se verificó una ejecución en segundo plano.

## Integración de reglas, decisiones, bienestar y finanzas

- 224 pruebas automatizadas aprobadas en la suite `tests/*.test.cjs`.
- Cuatro recorridos en Chromium aprobados para Ingeniería y Preflight, Guardian, evolución y revisión personal. Se corrigió la duplicación de nombres de campos entre los formularios de simulación y los editores de Nexus.
- Se repitió el recorrido móvil tras incorporar fichas financieras. Comprobó el vínculo histórico de una tarea completada, el borrador de decisión, la cronología observada, la proyección, el promedio de sueño, el IMC y el guardado en centavos de una meta de ahorro.
- Compilación local de Cloudflare correcta durante la integración de decisiones. La comprobación del sitio publicado y de dispositivos físicos sigue pendiente.

## Comparación financiera, formación y parámetros de máquina

- 228 casos aprobados en `tests/*.test.cjs`. Casos nuevos de coste de crédito, variación independiente de tasa y plazo, fórmulas financieras y parámetros técnicos con referencia.
- Dos recorridos Chromium aprobados en `tests/{systems-preflight,evolution}.browser.cjs`. Se verificó el costo con comisión, la respuesta de inflación y el guardado de 330,5 mm con referencia de prueba.
- Los datos se probaron con cuentas simuladas. Las fichas técnicas reales quedan para carga manual y el despliegue público sigue pendiente de verificación.
