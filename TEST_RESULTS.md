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
