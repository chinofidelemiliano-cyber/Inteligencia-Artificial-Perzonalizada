# LIFTS — TRANSFORMACIÓN INTEGRAL DEL ASISTENTE INTELIGENTE

## 1. Objetivo principal

Quiero transformar Lifts en un sistema operativo personal y profesional inteligente, capaz de ayudarme en mi vida cotidiana, desarrollo intelectual, crecimiento profesional, administración financiera, productividad, aprendizaje, salud, ingeniería y toma de decisiones.

No quiero que sea simplemente una colección de herramientas independientes. Quiero que todas las funcionalidades estén correctamente organizadas, relacionadas entre sí y conectadas mediante un motor central de inteligencia artificial.

El propósito de Lifts es convertirse en mi asistente personal integral: un sistema que me ayude a aprender, organizarme, anticipar problemas, tomar mejores decisiones, desarrollar conocimientos y mejorar continuamente.

Antes de implementar cualquier modificación, analiza exhaustivamente la aplicación existente, su arquitectura, base de datos, funcionalidades, componentes, dependencias y sistemas de autenticación.

No elimines funcionalidades existentes que sean útiles. No dupliques herramientas. Si una funcionalidad ya existe, mejórala, intégrala o reorganízala.

La única eliminación explícita que solicito es la de los modelos y elementos tridimensionales decorativos.

---

# BLOQUE I. REDISEÑO COMPLETO DE LA APLICACIÓN

## 2. Nueva identidad visual

Rediseña completamente la interfaz de Lifts.

Actualmente existen demasiados elementos mezclados, herramientas dispersas y secciones que dificultan la navegación.

Quiero una interfaz:

- Elegante.
- Minimalista.
- Futurista.
- Profesional.
- Moderna.
- Intuitiva.
- Visualmente equilibrada.
- Rápida.
- Completamente adaptable a dispositivos móviles.
- Con una jerarquía visual clara.
- Sin elementos decorativos innecesarios.

Conserva la identidad de Lifts utilizando principalmente:

- Azul corporativo: #095499.
- Rojo de acento: #E01D25.
- Blanco.
- Gris neutro.
- Azul oscuro.
- Negro suave para el modo oscuro.

Utiliza el rojo principalmente para alertas, acciones críticas o detalles de identidad. No abuses de los colores saturados.

Incorpora tipografías modernas, iconografía consistente, espacios equilibrados, transiciones discretas y animaciones ligeras.

Evita interfaces sobrecargadas, exceso de tarjetas, degradados innecesarios, transparencias excesivas y elementos que dificulten la lectura.

## 3. Eliminación de modelos 3D

Elimina completamente los modelos 3D decorativos existentes, incluyendo:

- Robot tridimensional.
- Perro robot tridimensional.
- Visores de modelos.
- Animaciones tridimensionales.
- Archivos GLB y GLTF que ya no sean necesarios.
- Dependencias de renderizado 3D utilizadas exclusivamente por estos elementos.
- Procesos de carga asociados.
- Componentes y código que hayan quedado sin utilizar.

Antes de eliminar archivos o dependencias, verifica que no sean utilizados por otras funcionalidades.

Sustituye los personajes tridimensionales por una identidad visual sencilla mediante un logotipo, avatar bidimensional o icono minimalista de Lifts.

Quiero reducir los tiempos de carga, consumo de memoria y complejidad visual.

No elimines visualizaciones científicas o técnicas necesarias para el funcionamiento de otras herramientas.

## 4. Nueva arquitectura de navegación

Todas las herramientas deberán estar organizadas dentro de un menú desplegable lateral.

El menú deberá permitir:

- Expandir y contraer categorías.
- Expandir y contraer subcategorías.
- Buscar herramientas.
- Identificar la sección activa.
- Mostrar herramientas favoritas.
- Acceder a herramientas recientes.
- Ocultar categorías que no utilizo.
- Personalizar el orden de las categorías.
- Mantener el estado del menú entre sesiones.
- Contraerse para liberar espacio.
- Adaptarse a teléfonos mediante un panel lateral.

No quiero que todas las herramientas aparezcan simultáneamente en la página principal.

Utiliza la siguiente estructura como base, adaptándola a las funcionalidades existentes.

### Inicio

- Escritorio personal.
- Resumen del día.
- Atajos.
- Actividad reciente.
- Centro de notificaciones.

### Lifts AI

- Conversación con el asistente.
- Historial de conversaciones.
- Memoria inteligente.
- Análisis de documentos.
- Inteligencia proactiva.
- Automatizaciones.

### Productividad

- Tareas.
- Calendario.
- Recordatorios.
- Proyectos.
- Objetivos.
- Concentración.
- Gestión del tiempo.
- Planificación semanal.

### Mente y desarrollo personal

- Autorregulación.
- Procrastinación.
- Psicología.
- Neurociencia.
- Filosofía.
- Diario personal.
- Laboratorio de pensamientos.
- Experimentos conductuales.
- Toma de decisiones.

### Conocimiento y aprendizaje

- Academias.
- Biblioteca.
- Segundo cerebro.
- Mapas conceptuales.
- Repetición espaciada.
- Evaluaciones.
- Simulaciones.
- Rutas de aprendizaje.

### Ingeniería y flexografía

- Preprensa.
- Placas.
- Montaje.
- Anilox.
- Tintas.
- Colorimetría.
- Sustratos.
- Suajes.
- Máquinas.
- Diagnóstico.
- Mantenimiento.
- Procesos productivos.
- Documentación técnica.

### Calidad y mejora continua

- Ishikawa.
- 5 porqués.
- 8D.
- AMEF.
- Pareto.
- Control estadístico.
- Gage R&R.
- Capacidad de proceso.
- Diseño de experimentos.
- Indicadores.
- Acciones correctivas.

### Finanzas

- Presupuesto.
- Ingresos.
- Gastos.
- Ahorro.
- Deudas.
- Patrimonio.
- Simuladores.
- Academia financiera.

### Salud y bienestar

- Descanso.
- Actividad física.
- Alimentación.
- Hidratación.
- Ergonomía.
- Seguimiento personal.

### Comunicación

- Oratoria.
- Negociación.
- Liderazgo.
- Resolución de conflictos.
- Simulador de conversaciones.
- Redacción.
- Presentaciones.

### Vida personal

- Documentos.
- Suscripciones.
- Garantías.
- Trámites.
- Inventarios personales.
- Mantenimiento.
- Viajes.
- Contactos.

### Herramientas y calculadoras

- Matemáticas.
- Física.
- Química.
- Ingeniería.
- Flexografía.
- Colorimetría.
- Estadística.
- Finanzas.
- Electricidad.
- Conversiones.
- Tiempo.

### Configuración

- Perfil.
- Apariencia.
- Personalización.
- Atajos.
- Privacidad.
- Memoria.
- Notificaciones.
- Integraciones.
- Seguridad.
- Exportación de datos.

Cada categoría deberá contener únicamente las herramientas correspondientes. Evita duplicar accesos en diferentes categorías, salvo mediante favoritos o atajos.

## 5. Escritorio personalizable

Rediseña la página principal como un escritorio personal inteligente.

Quiero que al ingresar aparezcan únicamente los elementos que realmente necesito.

Incluye:

- Fecha y hora.
- Acceso directo al asistente.
- Prioridades del día.
- Próximos eventos.
- Atajos personalizados.
- Recordatorios importantes.
- Progreso de objetivos.
- Resumen inteligente.
- Actividades recientes.

Todos los elementos deberán poder ocultarse, reorganizarse o eliminarse del escritorio sin eliminar sus funcionalidades originales.

Agrega un modo de edición que permita arrastrar y soltar los componentes, modificar su tamaño cuando corresponda y guardar la distribución.

Permite crear diferentes escritorios:

- Personal.
- Profesional.
- Estudio.
- Finanzas.
- Personalizado.

Cada escritorio deberá guardar sus propios atajos y componentes.

## 6. Sistema de atajos personalizados

Quiero poder agregar cualquier herramienta existente a mi escritorio mediante un botón denominado «Agregar a mis atajos».

Cada atajo deberá permitir:

- Seleccionar la herramienta.
- Cambiar su nombre visible.
- Elegir un icono.
- Cambiar su posición.
- Agruparlo dentro de carpetas.
- Eliminarlo del escritorio.
- Fijarlo en favoritos.
- Abrirlo directamente.
- Configurar parámetros predeterminados cuando la herramienta lo permita.

Ejemplos de atajos:

- Nueva fórmula Pantone.
- Calculadora de distorsión.
- Registrar un gasto.
- Iniciar concentración.
- Crear recordatorio.
- Diagnosticar defecto.
- Nueva acción correctiva.
- Consultar inventario.
- Registrar una idea.
- Iniciar orden de preparación.

Agrega también atajos de teclado configurables.

Incorpora una paleta de comandos accesible mediante Ctrl + K o Cmd + K, que permita buscar cualquier herramienta, ejecutar acciones, abrir documentos y navegar por la aplicación.

Evita conflictos con los atajos propios del navegador.

## 7. Buscador universal

Implementa un buscador global capaz de encontrar:

- Herramientas.
- Documentos.
- Conversaciones.
- Notas.
- Fórmulas.
- Tareas.
- Proyectos.
- Cursos.
- Registros técnicos.
- Eventos.
- Información almacenada en la memoria.

Permite buscar mediante palabras exactas y lenguaje natural.

Ejemplos:

«¿Dónde está la calculadora de distorsión?»

«Muéstrame mis registros de problemas de impresión.»

«Encuentra las notas donde estudié teoría del color.»

Los resultados deberán respetar los permisos de acceso y mostrar su fuente.

---

# BLOQUE II. MOTOR CENTRAL DE INTELIGENCIA

## 8. Memoria inteligente y contextual

Desarrolla un sistema de memoria que permita a Lifts recuperar información relevante de mis actividades.

La memoria deberá organizarse por:

- Preferencias.
- Objetivos.
- Conocimientos.
- Proyectos.
- Experiencias.
- Información profesional.
- Información personal.
- Decisiones.
- Problemas recurrentes.
- Estrategias que han funcionado.

Diferencia entre memoria temporal, memoria persistente, información confirmada e inferencias.

Permite revisar, corregir, eliminar, exportar y desactivar la memoria.

No almacenes información sensible innecesariamente ni la compartas entre usuarios.

Cada dato recuperado deberá incluir su origen cuando corresponda.

## 9. Inteligencia proactiva

Quiero que Lifts sea capaz de detectar situaciones relevantes sin que tenga que preguntarle constantemente.

Implementa un motor de reglas y análisis que pueda identificar:

- Actividades próximas a vencer.
- Problemas recurrentes.
- Objetivos abandonados.
- Tareas pospuestas.
- Cambios en gastos.
- Mantenimientos próximos.
- Conocimientos pendientes de repasar.
- Desviaciones en indicadores.
- Conflictos de horarios.
- Sobrecarga de actividades.

Genera un resumen inteligente diario y semanal.

Las recomendaciones deberán estar respaldadas por información registrada, no por suposiciones inventadas.

Permite activar y desactivar cada tipo de seguimiento.

## 10. Automatizaciones personalizadas

Crea un constructor visual de automatizaciones mediante la lógica:

CUANDO ocurra un evento, SI se cumple una condición, ENTONCES ejecutar una acción.

Ejemplos:

- Cuando una tarea se posponga tres veces, ofrecer una intervención contra la procrastinación.
- Cuando un anilox alcance su fecha de inspección, generar un recordatorio.
- Cuando un gasto supere un límite establecido, enviar una alerta.
- Cuando termine una sesión de estudio, programar un repaso.
- Cuando una orden de producción finalice, actualizar los indicadores correspondientes.
- Cuando una acción correctiva esté próxima a vencer, notificar al responsable.

Incluye historial de ejecuciones, condiciones, frecuencia, permisos, manejo de errores y opciones de pausa.

Solicita confirmación antes de ejecutar acciones sensibles, irreversibles o que afecten a terceros.

## 11. Integración entre módulos

El asistente deberá poder relacionar información de diferentes módulos cuando tenga autorización.

Ejemplos:

- Relacionar problemas de producción con capacitaciones pendientes.
- Relacionar resultados de experimentos con decisiones técnicas.
- Relacionar objetivos profesionales con rutas de aprendizaje.
- Relacionar gastos con metas financieras.
- Relacionar descanso y concentración mediante análisis descriptivos.

No confundas correlación con causalidad.

Crea un registro centralizado de herramientas para que el asistente pueda invocarlas correctamente sin inventar resultados.

---

# BLOQUE III. SEGUNDO CEREBRO Y DESARROLLO INTELECTUAL

## 12. Segundo cerebro digital

Desarrolla un sistema de gestión del conocimiento personal inspirado en metodologías como PARA y Zettelkasten.

Permite guardar:

- Ideas.
- Notas.
- Aprendizajes.
- Experiencias.
- Investigaciones.
- Documentos.
- Conceptos.
- Reflexiones.
- Fórmulas.
- Soluciones técnicas.
- Preguntas pendientes.

Incorpora etiquetas, categorías, enlaces entre notas, referencias bibliográficas y búsqueda semántica.

Genera mapas de conocimiento interactivos en dos dimensiones.

Identifica relaciones entre conceptos y permite que yo confirme o rechace dichas relaciones.

Agrega una bandeja de captura rápida para registrar ideas sin interrumpir mis actividades.

## 13. Sistema avanzado de aprendizaje

Transforma las academias existentes en un sistema de aprendizaje personalizado.

Incorpora:

- Repetición espaciada.
- Recuperación activa.
- Técnica Feynman.
- Intercalado de conocimientos.
- Tarjetas de estudio.
- Ejercicios prácticos.
- Casos de aplicación.
- Evaluaciones adaptativas.
- Simulaciones.
- Mapas de conocimientos.
- Seguimiento de errores.
- Rutas de especialización.

No quiero únicamente cuestionarios. Cada tema deberá incluir explicaciones completas, fundamentos, ejemplos, aplicaciones y referencias.

Permite que yo explique un concepto con mis propias palabras y que Lifts identifique errores, omisiones o contradicciones.

Adapta los repasos según mi desempeño, sin afirmar que puede determinar con exactitud cuándo olvidaré un concepto.

## 14. Academia de pensamiento avanzado

Incorpora cursos completos sobre:

- Pensamiento crítico.
- Lógica formal e informal.
- Falacias argumentativas.
- Sesgos cognitivos.
- Pensamiento sistémico.
- Pensamiento de primeros principios.
- Modelos mentales.
- Razonamiento probabilístico.
- Teorema de Bayes.
- Teoría de juegos.
- Método científico.
- Interpretación de evidencia.
- Epistemología.
- Metacognición.
- Resolución de problemas.
- Creatividad.
- Aprendizaje autodidacta.

Cada curso deberá incluir teoría, ejercicios, ejemplos reales y aplicaciones personales y profesionales.

Distingue entre hechos científicos, interpretaciones, teorías y opiniones filosóficas.

## 15. Biblioteca inteligente

Permite cargar documentos en PDF, Word, Excel, imágenes y otros formatos compatibles.

Incorpora:

- Extracción de contenido.
- Clasificación.
- Resúmenes.
- Explicaciones.
- Comparación de documentos.
- Búsqueda interna.
- Generación de apuntes.
- Extracción de fórmulas.
- Creación de materiales de estudio.
- Identificación de contradicciones.
- Referencias a páginas y fuentes.

No inventes información cuando un documento sea ilegible o incompleto.

---

# BLOQUE IV. LABORATORIO DE DECISIONES

## 16. Análisis estructurado de decisiones

Desarrolla un módulo para evaluar decisiones personales y profesionales.

Permite registrar:

- Problema.
- Objetivo.
- Alternativas.
- Restricciones.
- Recursos disponibles.
- Beneficios.
- Costos.
- Riesgos.
- Consecuencias.
- Incertidumbre.
- Reversibilidad.
- Costo de oportunidad.

Integra metodologías como:

- Matriz de decisión ponderada.
- Árboles de decisión.
- Análisis costo-beneficio.
- Análisis FODA.
- Análisis premortem.
- Análisis de sensibilidad.
- Valor esperado.
- Escenarios optimista, base y pesimista.
- Pensamiento de segundo orden.
- Análisis de riesgos.

Permite modificar los pesos de cada criterio.

No presentes una puntuación subjetiva como una probabilidad real de éxito.

## 17. Simulador de escenarios futuros

Crea una herramienta que permita explorar posibles consecuencias de decisiones a corto, mediano y largo plazo.

Incluye escenarios relacionados con:

- Desarrollo profesional.
- Educación.
- Ahorro.
- Inversiones.
- Proyectos.
- Cambios laborales.
- Adquisiciones.
- Administración del tiempo.
- Desarrollo de habilidades.

Los resultados deberán depender de supuestos visibles y modificables.

No presentes simulaciones como predicciones garantizadas.

## 18. Diario de decisiones

Guarda las decisiones importantes, sus fundamentos y resultados posteriores.

Permite evaluar:

- Qué información tenía disponible.
- Qué supuestos utilicé.
- Qué riesgos consideré.
- Qué ocurrió realmente.
- Qué aprendí.
- Qué cambiaría en una situación similar.

Diferencia una buena decisión con un mal resultado de una mala decisión con un resultado favorable.

---

# BLOQUE V. SALUD Y RENDIMIENTO FÍSICO

## 19. Centro de bienestar personal

Desarrolla un módulo educativo y de seguimiento que incluya:

- Registro de sueño.
- Calidad percibida del descanso.
- Actividad física.
- Hidratación.
- Alimentación.
- Consumo de cafeína.
- Ergonomía.
- Pausas activas.
- Fatiga percibida.
- Registro voluntario de síntomas.
- Recuperación.
- Estrés percibido.

Permite establecer objetivos personalizados y desactivar cualquier seguimiento.

## 20. Calculadoras de bienestar

Incorpora calculadoras orientativas de:

- Índice de masa corporal.
- Metabolismo basal.
- Gasto energético estimado.
- Distribución de macronutrientes.
- Duración del sueño.
- Frecuencia cardiaca de entrenamiento estimada.
- Actividad física.

Explica las fórmulas, sus poblaciones de referencia y limitaciones.

No emitas diagnósticos médicos ni recomiendes tratamientos personalizados.

Protege especialmente los datos de salud y evita que sean visibles en perfiles profesionales o laborales.

---

# BLOQUE VI. INTELIGENCIA FINANCIERA

## 21. Administración financiera personal

Desarrolla un sistema que permita registrar y analizar:

- Ingresos.
- Gastos.
- Gastos fijos.
- Gastos variables.
- Suscripciones.
- Deudas.
- Ahorros.
- Activos.
- Pasivos.
- Patrimonio neto.
- Presupuestos.
- Metas financieras.
- Fondos de emergencia.

Utiliza inicialmente pesos mexicanos, permitiendo seleccionar otras monedas.

Permite importar movimientos mediante archivos compatibles, revisar registros y corregir categorías.

## 22. Calculadoras y simuladores financieros

Incorpora:

- Interés simple.
- Interés compuesto.
- Inflación.
- Valor presente.
- Valor futuro.
- Amortización de créditos.
- Comparación de préstamos.
- Rentabilidad.
- Rendimiento real.
- Punto de equilibrio.
- Capacidad de ahorro.
- Fondo de emergencia.
- Costo de oportunidad.
- Proyecciones patrimoniales.
- Escenarios de retiro.
- Equivalencia entre gastos y horas de trabajo.

Permite comparar escenarios y modificar tasas, plazos, aportaciones, comisiones e impuestos estimados.

No prometas rendimientos financieros.

## 23. Academia financiera

Desarrolla cursos sobre:

- Economía básica.
- Administración del dinero.
- Presupuestos.
- Inflación.
- Tasas de interés.
- Créditos.
- Endeudamiento.
- Inversiones.
- Diversificación.
- Riesgo financiero.
- Impuestos.
- Finanzas conductuales.
- Administración empresarial.
- Contabilidad básica.

Diferencia educación financiera de recomendaciones de inversión personalizadas.

---

# BLOQUE VII. INGENIERÍA Y FLEXOGRAFÍA AVANZADA

## 24. Centro de ingeniería flexográfica

Amplía las herramientas profesionales existentes sin duplicar las academias, calculadoras ni módulos de colorimetría.

Integra conocimientos y herramientas sobre:

- Mecánica de impresión.
- Geometría de cilindros.
- Engranajes.
- Transmisión.
- Tensión de banda.
- Presión.
- Registro.
- Distorsión.
- Repeticiones.
- Transferencia de tinta.
- Reología.
- Adhesión.
- Tratamiento corona.
- Polímeros.
- Secado y curado.
- Troquelado.
- Desgaste de componentes.
- Rendimiento productivo.

Permite configurar diferentes máquinas y guardar sus características técnicas.

Incluye la posibilidad de registrar máquinas de banda angosta como la Comco Cadet 700 mediante parámetros reales y documentación técnica.

No inventes especificaciones de equipos.

## 25. Diagnóstico inteligente de defectos

Desarrolla un sistema de diagnóstico basado en síntomas, evidencias y pruebas.

Permite cargar fotografías y registrar información como:

- Máquina.
- Material.
- Tinta.
- Anilox.
- Placa.
- Stickyback.
- Velocidad.
- Tensión.
- Presión.
- Condiciones de impresión.
- Descripción del defecto.

El sistema deberá presentar:

1. Descripción del defecto observado.
2. Posibles causas.
3. Causas prioritarias.
4. Evidencias necesarias.
5. Pruebas de confirmación.
6. Acciones de contención.
7. Acciones correctivas.
8. Métodos de prevención.
9. Verificación de resultados.

No diagnostiques una causa como definitiva únicamente mediante una fotografía.

Incluye un historial de casos técnicos para consultar soluciones anteriores.

## 26. Simulador técnico de impresión

Desarrolla un simulador educativo bidimensional que permita explorar las relaciones entre:

- Velocidad.
- Tensión.
- Presión.
- Volumen de anilox.
- Viscosidad.
- Temperatura.
- Secado.
- Ganancia de punto.
- Registro.
- Transferencia de tinta.
- Deformación de placas.

Diferencia los cálculos físicos verificables de las relaciones empíricas y aproximaciones.

No presentes una simulación educativa como una reproducción exacta de una máquina real.

## 27. Representación digital de máquinas

Crea una representación técnica bidimensional de las máquinas registradas.

Permite identificar:

- Estaciones de impresión.
- Rodillos.
- Anilox.
- Cilindros.
- Engranajes.
- Suajes.
- Yunques.
- Recorrido de banda.
- Sistemas de secado.
- Componentes de mantenimiento.

Permite cargar planos, fotografías y diagramas técnicos.

No utilices modelos 3D decorativos.

## 28. Mantenimiento y gestión de activos

Incorpora:

- Inventario de componentes.
- Historial de mantenimiento.
- Inspecciones.
- Vida útil estimada.
- Registro de desgaste.
- Horas de operación.
- Fallas recurrentes.
- Refacciones.
- Mantenimiento preventivo.
- Mantenimiento correctivo.
- Alertas.
- Evidencias fotográficas.

Incluye gestión de anilox, placas, suajes, cilindros y otros componentes.

Permite registrar volumen nominal y medido de anilox, desviaciones, golpes y condiciones de funcionamiento.

No confundas una variación de medición con desgaste confirmado sin considerar el método de medición.

## 29. Matriz de compatibilidad técnica

Desarrolla una matriz configurable para relacionar:

- Tintas.
- Sustratos.
- Adhesivos.
- Placas.
- Stickybacks.
- Anilox.
- Suajes.
- Máquinas.
- Sistemas de secado.

Clasifica combinaciones como:

- Compatibilidad confirmada.
- Compatibilidad condicionada.
- Incompatibilidad documentada.
- Sin información suficiente.

Incluye justificación, fuentes y condiciones de operación.

No inventes compatibilidades químicas o mecánicas.

---

# BLOQUE VIII. CALIDAD, ESTADÍSTICA Y MEJORA CONTINUA

## 30. Herramientas avanzadas de calidad

Amplía el módulo existente incorporando:

- AMEF de proceso.
- AMEF de diseño.
- Diseño de experimentos.
- Gage R&R.
- Capacidad de proceso.
- Cartas de control.
- Análisis de regresión.
- Histogramas.
- Diagramas de dispersión.
- Estratificación.
- Análisis de tendencias.
- Gestión de acciones correctivas y preventivas.
- Verificación de eficacia.

Integra las metodologías Ishikawa, Pareto, 5 porqués y 8D existentes en un flujo de resolución de problemas.

El objetivo es evitar que los problemas se queden únicamente en acciones de contención.

## 31. Indicadores industriales

Implementa indicadores como:

- OEE.
- Disponibilidad.
- Rendimiento.
- Calidad.
- Desperdicio.
- Retrabajos.
- Tiempo de preparación.
- Tiempo de paro.
- Tiempo de producción.
- Productividad.
- Cumplimiento de órdenes.
- Costos de no calidad.
- Tiempo medio entre fallas.
- Tiempo medio de reparación.
- Cp, Cpk, Pp y Ppk.

Cada indicador deberá explicar su fórmula, requisitos, unidades, interpretación y limitaciones.

Verifica estabilidad del proceso, suficiencia de datos y supuestos estadísticos antes de interpretar índices de capacidad.

## 32. Diseño de experimentos

Permite definir:

- Objetivo.
- Factores.
- Niveles.
- Variables de respuesta.
- Repeticiones.
- Condiciones controladas.
- Aleatorización.
- Resultados.
- Interacciones.
- Conclusiones.

Incluye diseños factoriales básicos y análisis estadístico cuando exista información suficiente.

Permite exportar resultados y generar informes.

## 33. Matriz de competencias

Desarrolla un sistema para evaluar conocimientos y habilidades por área.

Incluye:

- Competencias técnicas.
- Niveles de dominio.
- Evidencias.
- Capacitaciones.
- Brechas de conocimiento.
- Planes de desarrollo.
- Evaluaciones.
- Seguimiento.

Utiliza las evaluaciones como herramienta de desarrollo, no como mecanismo punitivo.

Protege la privacidad de los resultados individuales.

---

# BLOQUE IX. CENTRO UNIVERSAL DE CALCULADORAS

## 34. Biblioteca de calculadoras

Centraliza todas las calculadoras existentes y nuevas en una única biblioteca organizada.

### Matemáticas

- Operaciones básicas.
- Álgebra.
- Ecuaciones.
- Geometría.
- Trigonometría.
- Porcentajes.
- Proporciones.
- Regla de tres.
- Logaritmos.

### Física e ingeniería

- Velocidad.
- Aceleración.
- Fuerza.
- Torque.
- Potencia.
- Presión.
- Energía.
- Engranajes.
- Relaciones de transmisión.
- Velocidad periférica.

### Química

- Concentraciones.
- Diluciones.
- Densidad.
- Mezclas.
- Balance de masa.
- Porcentajes en peso y volumen.
- Conversión de unidades químicas.

### Flexografía

- Distorsión.
- Repeticiones.
- Desarrollo de cilindros.
- Diámetros.
- Engranajes.
- Distancias de montaje.
- Consumo de tinta.
- Rendimiento de material.
- Desperdicio.
- Folios.
- Metros lineales.
- Etiquetas por rollo.
- Velocidad de producción.

### Colorimetría

- CIELAB.
- CIELCH.
- XYZ.
- RGB.
- Diferencias de color.
- Delta E 76.
- Delta E 94.
- CIEDE2000.
- Diferencias de luminosidad, cromaticidad y tono.

Respeta las condiciones de iluminante, observador, espacio de color y perfil correspondiente.

No presentes conversiones CMYK como exactas sin perfiles de color adecuados.

### Estadística

- Media.
- Mediana.
- Moda.
- Varianza.
- Desviación estándar.
- Probabilidad.
- Correlación.
- Regresión.
- Intervalos de confianza.
- Tamaño de muestra.
- Distribuciones estadísticas.

### Electricidad

- Ley de Ohm.
- Potencia.
- Corriente.
- Voltaje.
- Resistencia.
- Consumo energético.

### Tiempo y conversiones

- Jornadas.
- Horas.
- Minutos.
- Fechas.
- Proyecciones.
- Longitudes.
- Masas.
- Volúmenes.
- Temperaturas.
- Presiones.
- Unidades industriales.

Cada calculadora deberá incluir:

- Fórmula.
- Explicación.
- Variables.
- Unidades.
- Validación de datos.
- Procedimiento.
- Resultado.
- Ejemplo práctico.
- Limitaciones.
- Historial.
- Opción de guardar.
- Opción de compartir.
- Opción de agregar a atajos.

Utiliza motores de cálculo deterministas para operaciones matemáticas. No dependas exclusivamente de respuestas generadas por inteligencia artificial.

---

# BLOQUE X. COMUNICACIÓN Y DESARROLLO PROFESIONAL

## 35. Simulador de conversaciones

Desarrolla un entorno donde pueda practicar conversaciones antes de enfrentarlas.

Incluye escenarios como:

- Entrevistas laborales.
- Negociaciones salariales.
- Reuniones.
- Atención a clientes.
- Conversaciones con proveedores.
- Resolución de conflictos.
- Presentaciones.
- Conversaciones difíciles.
- Liderazgo.
- Manejo de objeciones.
- Solicitudes profesionales.

Permite seleccionar el contexto, objetivo, dificultad y comportamiento del interlocutor simulado.

Al finalizar, genera retroalimentación sobre claridad, estructura, argumentos, escucha, alternativas y oportunidades de mejora.

No inventes evaluaciones de personalidad.

## 36. Academia de comunicación

Desarrolla cursos sobre:

- Comunicación asertiva.
- Escucha activa.
- Oratoria.
- Argumentación.
- Negociación.
- Liderazgo.
- Resolución de conflictos.
- Persuasión ética.
- Comunicación interdepartamental.
- Inteligencia emocional.
- Retroalimentación constructiva.
- Presentaciones profesionales.

Incluye ejercicios y situaciones aplicables al entorno laboral.

## 37. Asistente de documentos profesionales

Integra herramientas para elaborar:

- Correos.
- Reportes.
- Procedimientos.
- Instrucciones de trabajo.
- Presentaciones.
- Informes técnicos.
- Solicitudes.
- Minutas.
- Planes de capacitación.
- Análisis de problemas.
- Propuestas de mejora.

Permite guardar plantillas reutilizables, mantener versiones y exportar documentos cuando el formato sea compatible.

---

# BLOQUE XI. GESTIÓN INTEGRAL DE VIDA

## 38. Administración personal

Desarrolla un centro de organización que permita gestionar:

- Documentos personales.
- Garantías.
- Facturas.
- Suscripciones.
- Vencimientos.
- Trámites.
- Inventarios personales.
- Mantenimiento del hogar.
- Mantenimiento de vehículos.
- Compras.
- Contactos importantes.
- Viajes.
- Proyectos personales.
- Objetivos a largo plazo.

Permite asociar documentos, fechas, costos, recordatorios y notas.

## 39. Centro de objetivos

Permite organizar objetivos por horizontes temporales:

- Diario.
- Semanal.
- Mensual.
- Trimestral.
- Anual.
- Largo plazo.

Cada objetivo deberá incluir motivo, acciones, recursos, indicadores, obstáculos y revisión periódica.

Conecta los objetivos con tareas existentes en lugar de crear sistemas paralelos.

## 40. Revisión inteligente de vida

Genera revisiones periódicas de las áreas que yo seleccione:

- Desarrollo profesional.
- Aprendizaje.
- Finanzas.
- Salud.
- Organización.
- Proyectos.
- Bienestar.
- Relaciones personales.

Presenta tendencias y preguntas de reflexión, sin asignar puntuaciones arbitrarias sobre el valor de mi vida o mi personalidad.

---

# BLOQUE XII. FUNCIONALIDADES TRANSVERSALES

## 41. Espacios de trabajo independientes

Permite crear diferentes espacios dentro de una misma cuenta:

- Personal.
- Profesional.
- Académico.
- Empresarial.
- Personalizado.

Cada espacio deberá tener sus propios documentos, herramientas visibles, atajos, configuraciones y registros.

Permite compartir información entre espacios únicamente mediante autorización explícita.

Evita que información personal, financiera o de salud aparezca accidentalmente dentro de un espacio laboral.

## 42. Centro de notificaciones

Centraliza todas las notificaciones existentes.

Clasifícalas por:

- Prioridad.
- Categoría.
- Fecha.
- Estado.
- Espacio de trabajo.
- Acción requerida.

Permite marcar como leída, archivar, posponer, desactivar o configurar cada tipo de notificación.

Implementa notificaciones reales cuando la infraestructura y los permisos lo permitan.

No simules notificaciones en segundo plano si no existe soporte técnico.

## 43. Integraciones externas

Prepara la arquitectura para integrar servicios como:

- Google Calendar.
- Calendarios compatibles.
- Correo electrónico.
- Almacenamiento de documentos.
- Servicios de notificaciones.
- Importación y exportación de datos.
- APIs externas autorizadas.

Utiliza mecanismos de autenticación seguros.

No solicites contraseñas directamente cuando exista OAuth.

No implementes integraciones ficticias ni botones sin funcionamiento.

Prioriza servicios gratuitos o con niveles gratuitos, informando sobre límites, cuotas y posibles costos.

## 44. Modo sin conexión

Implementa funcionamiento sin conexión para las herramientas que técnicamente lo permitan.

Por ejemplo:

- Calculadoras.
- Notas.
- Tareas.
- Temporizadores.
- Documentos previamente almacenados.
- Consultas de registros locales autorizados.

Sincroniza los cambios al recuperar la conexión.

Incluye resolución de conflictos y estados visibles de sincronización.

No afirmes que la inteligencia artificial remota puede funcionar sin internet.

## 45. Seguridad y privacidad

Implementa:

- Autenticación segura.
- Separación de datos por usuario.
- Control de permisos.
- Validación en servidor.
- Protección de credenciales.
- Copias de seguridad.
- Exportación de datos.
- Eliminación de información.
- Registro de acciones relevantes.
- Gestión de sesiones.
- Protección de información sensible.

No expongas claves de API ni credenciales en el frontend.

Aplica el principio de mínimo privilegio.

---

# BLOQUE XIII. CALIDAD CIENTÍFICA Y COMPORTAMIENTO DE LA IA

## 46. Rigor científico

Toda información científica, técnica, financiera o educativa deberá diferenciar entre:

- Hechos comprobados.
- Modelos teóricos.
- Hipótesis.
- Estimaciones.
- Opiniones.
- Resultados experimentales.
- Información insuficiente.

Utiliza fuentes verificables, publicaciones científicas, documentación técnica, normas aplicables y referencias bibliográficas.

No inventes estudios, fórmulas, citas, normas, especificaciones ni resultados.

No reproduzcas normas o materiales protegidos sin autorización.

## 47. Personalidad del asistente

Quiero que Lifts sea un asistente inteligente, racional, profesional y exigente.

Deberá:

- Cuestionar mis ideas cuando tengan fallos.
- Explicar por qué una propuesta puede ser incorrecta.
- Presentar contraargumentos.
- Identificar riesgos.
- Reconocer incertidumbre.
- Proponer mejores alternativas.
- Diferenciar hechos de opiniones.
- Adaptar las explicaciones a mi nivel.
- Enseñarme a comprender los problemas.
- Evitar darme la razón automáticamente.

No quiero respuestas genéricas, halagos innecesarios ni motivación vacía.

Quiero que me ayude a desarrollar criterio propio y autonomía.

---

# BLOQUE XIV. ARQUITECTURA TÉCNICA Y EJECUCIÓN

## 48. Reorganización del código

Reestructura la aplicación mediante una arquitectura modular, escalable y mantenible.

Centraliza:

- Componentes visuales.
- Sistema de diseño.
- Navegación.
- Registro de herramientas.
- Gestión de permisos.
- Autenticación.
- Notificaciones.
- Motor de cálculos.
- Memoria.
- Buscador.
- Automatizaciones.
- Gestión de errores.

Evita código duplicado y dependencias innecesarias.

Utiliza carga diferida para los módulos que no estén abiertos.

Optimiza recursos, imágenes, consultas y llamadas a la inteligencia artificial.

## 49. Registro central de herramientas

Crea un catálogo único de herramientas que contenga:

- Identificador.
- Nombre.
- Descripción.
- Categoría.
- Ruta.
- Icono.
- Permisos.
- Parámetros.
- Disponibilidad.
- Compatibilidad con atajos.
- Compatibilidad con el asistente.
- Requisitos técnicos.

El menú, buscador, escritorio, favoritos y asistente deberán utilizar este mismo catálogo.

Así, al incorporar una herramienta nueva, deberá aparecer automáticamente en la categoría correspondiente sin modificar manualmente todos los componentes.

## 50. Conservación de información existente

Antes de realizar modificaciones:

- Genera una copia de seguridad cuando sea técnicamente posible.
- Analiza las estructuras de datos.
- Identifica dependencias.
- Revisa las rutas existentes.
- Diseña migraciones compatibles.
- Conserva usuarios y configuraciones.
- Conserva historiales y registros.
- Verifica que no existan pérdidas de información.

No reinicies la base de datos para simplificar el desarrollo.

## 51. Pruebas de funcionamiento

Realiza pruebas de:

- Navegación.
- Menús desplegables.
- Búsqueda.
- Atajos.
- Favoritos.
- Escritorios.
- Autenticación.
- Permisos.
- Persistencia.
- Cálculos.
- Formularios.
- Notificaciones.
- Automatizaciones.
- Integraciones.
- Diseño móvil.
- Rendimiento.
- Accesibilidad.
- Seguridad.
- Migraciones de datos.

Verifica que todos los botones y herramientas tengan una función real.

No entregues interfaces simuladas como si estuvieran terminadas.

## 52. Orden de implementación

Ejecuta el desarrollo en el siguiente orden técnico:

1. Auditoría y respaldo.
2. Arquitectura modular.
3. Eliminación de modelos 3D decorativos.
4. Rediseño visual.
5. Menú desplegable.
6. Registro central de herramientas.
7. Escritorio y atajos.
8. Buscador universal.
9. Memoria e inteligencia central.
10. Integración de módulos existentes.
11. Implementación de nuevas herramientas.
12. Automatizaciones.
13. Optimización.
14. Pruebas.
15. Documentación final.

Quiero que trabajes todos los bloques dentro de una misma ejecución integral, sin detenerte innecesariamente para solicitar aprobación después de cada sección.

Si existen dudas indispensables, agrúpalas antes de comenzar.

Si alguna funcionalidad requiere servicios externos, infraestructura adicional o permisos que no están disponibles, documenta la limitación y no simules su funcionamiento.

## 53. Entrega final

Al finalizar, entrega un informe que indique:

- Funcionalidades existentes conservadas.
- Funcionalidades reorganizadas.
- Nuevas implementaciones.
- Componentes eliminados.
- Cambios de diseño.
- Cambios de arquitectura.
- Migraciones realizadas.
- Pruebas ejecutadas.
- Resultados de las pruebas.
- Errores corregidos.
- Limitaciones.
- Dependencias externas.
- Funcionalidades pendientes.
- Posibles costos operativos.

El resultado debe ser una aplicación coherente, organizada, inteligente, segura, científicamente fundamentada y completamente funcional.

No quiero simplemente más herramientas. Quiero que Lifts evolucione hacia un verdadero sistema operativo personal y profesional.