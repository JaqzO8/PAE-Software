# Continuación de Amelia: M3 y M4

[Orden común, Git y cierre](README.md) · [Todos los RQ/HU](TRAZABILIDAD.md) · [Plan de pruebas](PLAN_PRUEBAS.md)

Actualizado: 21 de octubre de 2026. Esta guía continúa la base f8ea677 y conserva el backlog detallado y anexos A–E de la guía adjunta, con los nombres de colaboradores corregidos donde estaban intercambiados. Los estados y códigos documentales se mantienen. Las casillas inferiores representan trabajo por verificar/completar, no una afirmación de que todo falte o esté aceptado.

## Tu punto de partida y orden de entrega

Tu rama es **Amelia_Mauricio**. Posees Evaluación (M3), Seguimiento (M4) y coordinas la composición de Aprendizaje. Juan posee Planificación y José Gamificación. Incorpora E01/E02 desde develop antes de cerrar los flujos dependientes.

| Orden | Qué implementar | Entrega / prueba de cierre |
|---|---|---|
| 1 | AME-01–04: caracterizar integridad/tiempos y conciliar modalidades/criterios | E03 / T-EXAM de abuso y carreras |
| 2 | AME-05–11: publicar/iniciar/responder/finalizar/revisar; snapshot, versiones, permisos y UI | E03 / un resultado por intento; respuestas privadas |
| 3 | AME-17–20: Outbox/publicador, contrato de resultado y revisiones; motor de desafíos/trivias para Comunidad | E03 / crash/replay, sockets, reconexión y pruebas productor-consumidor |
| 4 | AME-12–16: composición/migraciones de Aprendizaje, proyecciones y métricas; contrato interno para Juan/José | E05 / T-TRACK y reconciliación |
| 5 | AME-21: avisos de progreso/logros autorizados, coordinados con Comunidad y Gamificación | E08 / audiencia, consentimiento y eventos |
| 6 | AME-22–28: completar historias/variantes aprobadas de diagnóstico, bancos, exportación, pausas, offline y análisis | E08 / criterios específicos; RQ83 solo si se reactiva |
| 7 | AME-29–31: carga, recuperación y aceptación académica completa | E09–E10 / T-OPS y recorrido final |

**Ya disponible:** createApp de Evaluación, contrato piloto ResultadoConfirmado.v1, migrador de Aprendizaje y pruebas del consumidor de José. AME-05 está parcialmente avanzado; el productor durable, reloj autoritativo completo y Seguimiento no están entregados por esa base.

**Archivos de entrada:** [app de Evaluación](../../backend/services/exam-service/src/app.js), [controlador heredado](../../backend/services/exam-service/src/controllers/learningController.js), [esquema piloto](../../backend/contracts/events/ResultadoConfirmado.v1.schema.json), [Seguimiento de destino](../../backend/services/learning-service/src/modules/tracking/README.md), [migraciones compartidas](../../backend/services/learning-service/migrations).

**Límite de compatibilidad:** el esquema piloto admite solo resultVersion=1 y los campos mínimos de confirmación. No añadir silenciosamente nota, rúbrica o recalificación al v1 ni asumir que ya se transporta: acordar nuevo contrato/versionado, fixtures y consumidores. La nota/intento permanecen en Evaluación; Seguimiento deriva métricas y José deriva premios.

**Handoff:** José necesita el hecho confirmado durable antes de activar premios reales; Juan necesita puertos/proyecciones y numeración de migraciones antes de mover agenda. Para percentiles, definir cohorte y distribución; precisión no es percentil. RQ112 requiere contenido de Juan y transporte de Richar, con cierre coordinado por ti.

## Cómo cerrar tu rama

En cada entrega seguir fetch → merge de develop → implementación y pruebas → commit/push a `Amelia_Mauricio` → PR a develop → revisión/CI → integración. Los comandos completos están en la guía común. No incorporar cambios de otro dueño mediante acceso directo a sus tablas.

Revisar todas las filas de tus módulos en trazabilidad, los RQ complementarios asignados y los aliases del Anexo B. Cada extensión aceptada necesita criterios y pruebas adicionales. Adjuntar manual de usuario, runbook de recuperación y evidencia por criterio. Terminar con E09/E10, no al completar el backend.

## Backlog detallado conservado de la guía personal

La numeración H0–H6 identifica los hitos originales; E00–E10 de la guía central define el orden de integración actual. La separación app/servidor ya existe: completar los casos de uso pendientes de ese ticket sin reescribirla. Los anexos resumen el alcance; las tablas originales completas de aceptación están en [M3](../historias/M3.md) y [M4](../historias/M4.md).

## 2. Implementación por hitos

### H0 — Integridad del intento y criterios

- [ ] AME-01: reproducir reloj adulterado, entrega vencida, dos finalizaciones concurrentes, clave visible y edición de pregunta durante intento. Registrar comportamiento real antes de modificarlo.
- [ ] AME-02: acordar reglas de inicio, duración por dificultad, guardado, auto-cierre, pausas, reconexión y revisión manual. Un modo de práctica puede tolerar offline; un examen de tiempo estricto requiere otra política.
- [ ] AME-03: definir estados coherentes: creado/en curso/vencido/finalizado/revisión pendiente/resultado confirmado o modelo equivalente. Distinguir cierre del intento y nota final de preguntas abiertas.
- [ ] AME-04: resolver diferencias HU/RQ, en especial M3-HU07/11/12 propuestos versus requisitos aprobados; M3-HU16 tiene HU14 dentro de la tabla.
- [ ] Salida: pruebas caracterizan riesgos y reglas aprobadas sin sacrificar trazabilidad de notas.

### H1–H2 — Evaluación autoritativa y completa

- [ ] AME-05: separar app de servidor; casos PublicarExamen, IniciarIntento, RegistrarRespuesta, FinalizarIntento, RevisarRespuestaAbierta y ReportarPregunta. Inyectar reloj/repositorios/generador de orden.
- [ ] AME-06: preguntas por tema/subtema/universidad/dificultad; borrador/revisión/publicación, versión y snapshot inmutable del intento con orden y rúbrica. Docente habilitado revisa preguntas asistidas por IA.
- [ ] AME-07: validar autoría/permisos y política de feedback en todos los DTO; nunca enviar claves al cliente durante un examen que las debe ocultar.
- [ ] AME-08: finalización atómica con restricción única/control de versión/lock según diseño. Idempotency key identifica solicitud y hash de payload: reintento idéntico devuelve el mismo resultado; misma clave/datos diferentes se rechaza. Respuestas posteriores al límite no alteran lo confirmado.
- [ ] AME-09: abiertas en cola de revisión, rúbrica/versionado, auditoría y protección frente a dos revisores; definir cuándo una recalificación exige nueva versión y cómo se ajustan proyecciones/premios.
- [ ] AME-10: CRUD/búsqueda, selección randomizada reproducible por intento, filtros combinados, preguntas guardadas, feedback/solucionarios y reporte de errores con seguimiento.
- [ ] AME-11: pruebas reales con DB aislada y scripts de test; integrar UI docente y estudiante con estados explícitos, servidor como reloj y mensajes de revisión pendiente.
- [ ] Salida: un intento no genera dos notas ni se modifica por edición posterior; alumno ajeno no obtiene respuestas/resultados.

### H3 — Seguimiento y Aprendizaje

- [ ] AME-12: acordar puertos internos y composición única de Aprendizaje. Seguimiento, Planificación y Gamificación tienen ownership de tablas/submódulos y revisión de migraciones, no acceso indiscriminado a modelos internos.
- [ ] AME-13: trasladar AnalyticsSetting/LearningNotification/proyecciones acordadas a Aprendizaje; Juan mueve agenda y José logros. Puntajes originales e intentos permanecen en Evaluación.
- [ ] AME-14: construir proyección reproducible de resultados confirmados y lecciones completadas, con deduplicación, fecha de última actualización y reconciliación. No sumar otra vez al reprocesar evento.
- [ ] AME-15: métricas: precisión, tendencia, tiempos por sección, participación, promedio/cohorte y debilidades; definir denominador, empates, ausencias, incertidumbre y mínimos de muestra. Renombrar falsa métrica percentile, sin invalidar historial de notas.
- [ ] AME-16: panel propio y panel tutor/responsable de grupo con relación vigente. “Estudiante-administrador” no habilita acceso académico global; definir autorización con Richar/José.
- [ ] Salida: comparación contra fuente autoritativa coincide; una caída de Aprendizaje no invalida la nota confirmada de Evaluación.

### H4 — Eventos y tiempo real resiliente

- [ ] AME-17: transacción de resultado confirmado + Outbox; evento ResultadoConfirmado.v1 (attemptId, userId, versión, resumen y fecha mínimos). ResultadoRevisado.v1 o versión equivalente para corrección; modelar reemplazo, no sumar dos resultados.
- [ ] AME-18: consumidores idempotentes y políticas de replay/out-of-order; los premios de José se basan en versión/estado final según regla, no puntaje enviado por navegador.
- [ ] AME-19: sala y motor de desafío/trivia con autorización al conectar y en cada acción, deadline/orden del servidor, deduplicación, persistencia y recuperación. Comunidad organiza invitaciones/inscripción; Evaluación decide preguntas y resultado.
- [ ] AME-20: estado compartido/estrategia de enrutamiento entre réplicas; Redis puede ayudar a presencia/pub-sub, pero evento de nota/premio debe ser durable. Validar desconexión por sesión revocada.
- [ ] AME-21: alertas/logros al alumno/tutor: recibir hecho autorizado, aplicar frecuencia mínima, muestra suficiente y canal consentido; José concede logro y Richar coordina transporte.
- [ ] Salida: caída entre commit y publicación no pierde resultado; reconexión/replay no duplica respuestas ni efectos derivados.

### H5 — Extensiones de los dos documentos

- [ ] AME-22: diagnóstico/ruta explicable y personalizada con catálogo de Juan; probar primero reglas simples revisadas pedagógicamente. Adaptación/dificultad estimada exige evaluación de calidad, no afirmar modelo inteligente validado por un ejemplo.
- [ ] AME-23: importar/exportar bancos JSON/CSV/XLSX con plantilla, preview, errores por fila, límites y confirmación; protección contra fórmulas maliciosas al exportar planillas. No cerrar la historia por soportar solo JSON.
- [ ] AME-24: pausas controladas y tiempo por ítem solo en modos aprobados; servidor registra cada pausa y transición, no suspende cronómetro por dejar la pestaña.
- [ ] AME-25: offline con cola ligada a usuario/intento, aviso pendiente, idempotencia/conflictos y validación al reconectar. Servidor no puede probar honestidad del reloj local: limitar offline en evaluaciones estrictas o definir evidencia/política explícita.
- [ ] AME-26: compartir examen PDF/enlace con alcance/expiración, permisos y política de solucionario; Juan aporta almacenamiento, José distribución. Exportar historial/revisiones con mínimo de datos.
- [ ] AME-27: comentarios docentes por pregunta, búsqueda por palabras, ejercicios locales y banco actualizado según calendario académico validado. Empezar índices/búsqueda PostgreSQL; motor externo solo tras medir necesidad.
- [ ] AME-28: gráfico de ojiva solo si se aprueba RQ40 y se define variable/distribución; no llamar ojiva a cualquier curva de progreso. Trivias/toma de decisiones bajo presión con accesibilidad y objetivos pedagógicos acordados.
- [ ] Salida: cada extensión aprobada de HUC-M3 está implementada/aceptada o declarada fuera de versión; congeladas no se reactivan indirectamente.

### H6 — Cierre académico y técnico

- [ ] AME-29: probar muchas entregas simultáneas, estado de revisión, revocación y reintentos; medir p95 y consistencia, no solo respuesta 200.
- [ ] AME-30: ensayo de migración/replay y restore con Richar; comparación de intentos, versiones, notas y proyecciones.
- [ ] AME-31: demostración diagnóstico → práctica → resultado → feedback → seguimiento → recomendación → aviso tutor autorizado.
- [ ] Salida: fórmulas/documentación reproducibles, pruebas y aceptación docente/estudiante sin porcentajes inventados.

## 3. Contratos y límites de colaboración

| Flujo | Amelia posee | Otro integrante |
| --- | --- | --- |
| Preguntas y resultados | Evaluación y autoridad de nota | Juan entrega material autorizado; Richar habilitación/sesión |
| ResultadoConfirmado/Revisado | Productor Outbox y esquema versionado | Aprendizaje consume; José recompensa según versión |
| Diagnóstico/ruta | Evaluación diagnóstica y recomendación en Seguimiento | Juan compone lecciones/agenda pertinentes |
| Progreso de lección | Proyección derivada | Juan posee hecho/versiones en Contenido |
| Desafío grupal | Motor, tiempo, respuestas y resultado | José posee comunidad/inscripción y Gamificación |
| Logro | Amelia aporta evidencia académica y avisa a tutor permitido | José decide/concede; no dos motores de logros |
| Aviso tutor | Regla y audiencia de Seguimiento | José relación de grupo; Richar identidad/transporte |

Definir APIs actuales versus propuestas; documentar códigos de error, paginación, versión y permisos. No ampliar datos de resultados porque una pantalla quiera mostrarlos sin autorización.

## 4. Clean code y modelo específico

Entidades/estados: PreguntaVersionada, ExamenPublicado, Intento, Respuesta, Resultado y Revision; puertos Reloj, RepositorioIntentos, BancoPreguntas, PoliticaDeAcceso, Outbox. Strategy solo donde haya modalidades reales de selección/calificación, con contrato común probado. No usar un controller gigante para banco, simulacro, stats, avisos y gamificación.

En Seguimiento, servicios puros calculan métricas a partir de datos tipados; repositorios/consumidores construyen proyecciones. Cada fórmula incluye definición y tests de ejemplos manuales. En React, separar runner/editor/resultados/panel; clave y regla definitiva no viven en bundles o caché del navegador.

## 5. Pruebas personales

| Nivel | Casos exigidos |
| --- | --- |
| Unitario | Dificultad, selección, cálculo por tipo, vencimiento, pausas, fórmulas/cohorte y recomendaciones |
| Integración | App real/DB, versiones, transacción, dos cierres/revisiones paralelos, reportes y permisos |
| Contrato | Resultado confirmado/revisado, lección, revocación y rutas/materiales con mínimos datos |
| E2E | Crear/revisar/publicar, rendir/finalizar, abierta/revisión, feedback y panel tutor |
| Tiempo real | Sala ajena, token revocado, reintento, fuera de orden, deadline y reconexión entre réplicas |
| Resiliencia | Commit sin publish, replay, caída Aprendizaje, offline y restore |
| Pedagogía/privacidad | Dataset de referencia revisado, muestra insuficiente, tutor desvinculado y explicaciones autorizadas |

Revisor habitual: **Juan** para versiones/material/rutas y **José** para eventos, salas y premios. Richar revisa revocación y despliegue.

## 6. Entregables personales

- [ ] M3/M4 implementados según alcance conciliado, con correspondencia de todas las HU de ambos documentos.
- [ ] Motor autoritativo y snapshot/versiones; notas revisables auditadas e idempotencia probada.
- [ ] Aprendizaje integrado con ownership claro y migración/reconciliación validada.
- [ ] Fórmulas, reglas pedagógicas y contratos de eventos documentados.
- [ ] Evidencia REST/WSS/offline/carga y manual de docente/estudiante.
- [ ] Runbook de revisión, reproceso, rollback y recuperación de resultados/proyecciones.

## Anexo A. Historias de la especificación a cargo de Amelia

26 entradas temáticas. El estado corresponde a la fuente, no al resultado de pruebas de este turno. La tarea y la prueba de cierre son la guía de implementación; refinarlas en tickets con criterios completos antes de comenzar. Las historias compartidas mantienen a esta persona como responsable de cierre de su módulo.

| Clave de planificación | Historia | Estado de la fuente | Implementación/resultado esperado | Prueba mínima de cierre |
| --- | --- | --- | --- | --- |
| M3-HU01 | Exámenes generados en grupos | Aprobado | Componer desde recursos autorizados y preguntas revisadas; asociar grupo y versión. | Docente ajeno no usa material privado; borrador asistido no se publica automáticamente. |
| M3-HU02 | Gestión de preguntas generadas | Aprobado | Crear, editar, revisar y retirar con autoría e historial. | Retirar/editar pregunta no altera un intento histórico. |
| M3-HU03 | Reportar preguntas mal generadas | Aprobado | Reporte de versión y contexto, cola de revisión, decisión y corrección. | No cambiar nota solo por reporte; evitar duplicados y permitir seguimiento. |
| M3-HU04 | Simulacro con temporizador | Aprobado | Servidor fija inicio/límite, guarda respuestas, cierra atómicamente y rechaza entregas tardías. | Reloj del cliente manipulado; vencimiento; doble envío concurrente; reconexión. |
| M3-HU05 | Tema y subtema | Aprobado | Taxonomía coordinada con Contenido, clasificación y filtros. | Referencias inválidas rechazadas; filtros combinados sin devolver respuestas secretas. |
| M3-HU06 | Dificultad e información del examen | Aprobado (estado conjunto) | Reglas explícitas de dificultad, universidad, selección y presentación previa. | Banco insuficiente explicado; nivel y selección coherentes con configuración. |
| M3-HU07 | Registro de resultados | Propuesto | Persistir resultado confirmado y revisión pendiente de abiertas; conciliar con RQ17 aprobado. | Un solo resultado por intento; revisión auditada y nueva versión de calificación. |
| M3-HU08 | Banco por cursos y áreas | Propuesto | Banco versionado, búsqueda, actualización académica y curación semestral acordada. | No perder historial al actualizar; retiro lógico de preguntas usadas. |
| M3-HU09 | Feedback inmediato | Propuesto | Explicar solo cuando la política del modo lo permita. | Antes del cierre no se exponen claves; explicaciones autorizadas después. |
| M3-HU10 | Simulacro de admisión automático | Propuesto | Plantillas por universidad, cuotas y dificultad; no inventar preguntas faltantes. | Muestra reproducible del intento, reglas y error por banco insuficiente. |
| M3-HU11 | Diagnóstico y ruta personalizada | Propuesto; RQ61–64 aprobados | Diagnóstico en Evaluación y ruta explicable en Aprendizaje con catálogo de Juan. | Diagnóstico insuficiente no inventa dominio; ruta versionada, revisada y actualizable. |
| M3-HU12 | Tipos de preguntas | Propuesto | Opción múltiple/abierta y demás tipos solo definidos; rúbrica y revisión docente. | Respuesta inválida; pendientes no mostrados como nota definitiva; claves privadas. |
| M3-HU13 | Simulacros colaborativos | Aprobado | Sala, participantes, preguntas, reconexión y secuencia autoritativa en servidor. | JWT revocado, sala ajena, respuesta duplicada/tardía y varias réplicas. |
| M3-HU14 | Exámenes personalizados | Propuesto | Selección por tema/dificultad, borrador, vista previa y publicación versionada. | Autor no habilitado; edición concurrente; permisos al compartir. |
| M3-HU15 | Desafíos académicos | Aprobado | Motor de desafío/trivia; Comunidad organiza y Gamificación premia hechos confirmados. | No iniciar sin condición aprobada; orden/tiempo únicos; finalización idempotente. |
| M3-HU16 | Preguntas guardadas | Propuesto; tabla original dice HU14 | Lista personal, eliminación y filtros; conservar alias defectuoso sin confundir con examen personalizado. | No leer lista ajena; guardado repetido único; referencia retirada informada. |
| M3-HU17 | Solucionarios detallados | Propuesto | Explicación por versión, enlaces autorizados y revisión editorial. | Solucionario corresponde al intento original y no revela material privado. |
| M4-HU01 | Estadísticas del estudiante | Propuesto | Historial, precisión, tendencia y cohorte con periodo, unidad y denominador. | Sin datos, empates, cohortes pequeñas y reconciliación con resultados. |
| M4-HU02 | Estadísticas de responsable/tutor | Propuesto | Resolver estudiante-administrador/docente; membresía y acceso delegado, no privilegio global. | Responsable de un grupo no obtiene notas de otro grupo. |
| M4-HU03 | Temas relacionados | Propuesto | Recomendación explicable por errores y catálogo vigente. | Tema sin material publicado; resultado aún pendiente; recursos retirados. |
| M4-HU04 | Personalización de temas | Propuesto | Reglas/versiones basadas en evidencia; medir utilidad antes de algoritmo adaptativo complejo. | Sin historial aplica alternativa clara; usuario comprende el motivo. |
| M4-HU05 | Tiempo promedio por sección | Propuesto | Definir actividad/inactividad, duración servidor y agregación reproducible. | Valores extremos, división por cero y eventos fuera de orden. |
| M4-HU06 | Detección de logros | Propuesto | Emitir evidencias de progreso; José decide y concede logro, no duplicar motor. | Eventos repetidos no generan varias evidencias; regla versionada. |
| M4-HU07 | Aviso de logros al estudiante | Propuesto | Consumir logro confirmado de José, guardar notificación y canal consentido. | Duplicados, caída del proveedor, marcado leído y opt-out. |
| M4-HU08 | Aviso de logros a tutores | Propuesto | Destinatario autorizado y relación vigente; mínimos datos. | Tutor desvinculado no recibe ni lee información histórica restringida. |
| M4-HU09 | Aviso de bajo rendimiento | Propuesto | Umbral/periodo/muestra revisados pedagógicamente, canal autorizado y frecuencia limitada. | Muestra insuficiente no alerta; falta de actividad no equivale a bajo rendimiento. |

## Anexo B. Correspondencia con «Historias de usuario completo»

40 entradas asignadas. El prefijo HUC distingue la fuente alternativa. Para M6, B01…B09 es el orden de sus bloques, porque repiten EPIC/IDs; no son IDs originales nuevos. Los estados contradictorios no se resuelven automáticamente. Las extensiones señaladas forman parte del backlog futuro condicionado a aprobación.

| Alias de fuente | Título original | Estado alternativo | Correspondencia y alcance que no debe perderse |
| --- | --- | --- | --- |
| HUC-M3-HU01 | Preguntas tipo examen por materia | Propuesto | M3-HU08/05 — Banco por materia; revisar clasificación y filtros. |
| HUC-M3-HU02 | Simulacros con temporizador | Propuesto | M3-HU04 — Temporizador autoritativo y reanudación con límite real. |
| HUC-M3-HU03 | Autoevaluación inmediata tras exámenes | Propuesto | M3-HU07/09 — Corrección inmediata cuando modalidad permite. |
| HUC-M3-HU04 | Filtros de dificultas y temas | Propuesto | M3-HU05/06 — Filtros combinados. |
| HUC-M3-HU05 | Simulacro de adaptación | Propuesto | M3-HU11; M4-HU04 — Añade simulacro adaptativo; aprobar reglas/validación antes de desarrollar. |
| HUC-M3-HU06 | Historial de resultados | Propuesto | M3-HU07; M4-HU01 — Historial filtrable; no duplicar fuente de resultados. |
| HUC-M3-HU07 | Dificultad estimada de simulacros | Propuesto | M3-HU06; M4-HU04 — Añade dificultad estimada: definición/fórmula y validación pedagógica. |
| HUC-M3-HU08 | Pausas controladas en simulacros | Propuesto | M3-HU04 — Añade pausas controladas: persistencia, límites y política por modo. |
| HUC-M3-HU09 | Soporte para preguntas abiertas y opción múltiple | Propuesto | M3-HU12 — Tipos de respuesta y revisión; IA solo asistencia aprobada. |
| HUC-M3-HU10 | Eventos de simulacros en vivo | Propuesto | M3-HU13/15; M6-F08 — Añade calendario, inscripción/cancelación y asistencia; José organiza. |
| HUC-M3-HU11 | Feedback inmediato y explicativo | Propuesto | M3-HU09/17 — Feedback sujeto a política de publicación. |
| HUC-M3-HU12 | Guardar preguntas difíciles | Propuesto | M3-HU16 — Guardar preguntas personales para repaso. |
| HUC-M3-HU13 | Preguntas randomizadas | Propuesto | M3-HU04/10 — Aleatorización fijada por intento. |
| HUC-M3-HU14 | Simulacros realistas basados en universidades | Propuesto | M3-HU10/06 — Plantilla por universidad revisada académicamente. |
| HUC-M3-HU15 | Retroalimentación y solucionarios detallados | Propuesto | M3-HU17 — Solucionario y material asociado autorizado. |
| HUC-M3-HU16 | Carga de preguntas por profesores | Propuesto | M3-HU02/08 — Añade upload masivo/preview; permisos docentes y revisión. |
| HUC-M3-HU17 | Categorización por tema y subtema | Propuesto | M3-HU05 — Tema/subtema con referencias consistentes. |
| HUC-M3-HU18 | Compartir exámenes en PDF o en línea | Propuesto | M3-HU14; M2-HU01 — Añade compartir examen PDF/enlace con permiso/expiración y política de claves. |
| HUC-M3-HU19 | Simulacros en modo temporizado | Propuesto | M3-HU04 — Cierre/guardado al vencer, no reloj del cliente. |
| HUC-M3-HU20 | Historial de exámenes realizados | Propuesto | M3-HU07; M4-HU01 — Añade filtros/exportación de historial según permiso. |
| HUC-M3-HU21 | Actualización del banco de preguntas | Propuesto | M3-HU02/08 — Banco versionado e historial académico de cambios. |
| HUC-M3-HU22 | Preguntas similares a exámenes locales | Propuesto | M3-HU06/10 — Preguntas locales/nacionales con fuente y validación. |
| HUC-M3-HU23 | Trivias rápidas | Propuesto | M3-HU15; M5-HU03; M7-HU03 — Trivia; Evaluación ejecuta, Planificación organiza y José premia. |
| HUC-M3-HU24 | Simulacros de toma de decisiones bajo presión | Propuesto | M3-HU04/15 — Añade tiempo por ítem/toma de decisiones bajo presión; reglas accesibles aprobadas. |
| HUC-M3-HU25 | Buscador de preguntas por palabras clave | Propuesto | M3-HU08 — Añade búsqueda de preguntas por palabras; paginación e índices. |
| HUC-M3-HU26 | Funcionamiento sin conexión para exámenes | Propuesto | M3-HU04 — Añade offline/sincronización con estado, límites y prevención de duplicados. |
| HUC-M3-HU27 | Crear y resolver simulacros | Propuesto | M3-HU14/04 — Borradores, creación y resolución según rol/alcance aprobado. |
| HUC-M3-HU28 | Niveles de dificultad por pregunta | Propuesto | M3-HU06 — Niveles normalizados, no etiquetas arbitrarias. |
| HUC-M3-HU29 | Revisión manual de respuestas abiertas | Propuesto | M3-HU12/07 — Añade revisión manual con estados/autor/fecha y nota versionada. |
| HUC-M3-HU30 | Comentarios del profesor sobre preguntas | Propuesto | M3-HU02/17 — Añade comentarios del docente con visibilidad, autor y fecha. |
| HUC-M3-HU31 | Importar/exportar bancos de preguntas | Propuesto | M3-HU08 — Añade import/export JSON, CSV y XLSX, plantilla y preview; RQ117 es alias de este documento, no código del catálogo principal. |
| HUC-M4-HU01 | Visualización de Estadísticas, Estudiantes. | Propuesto | M8-HU01 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M4-HU02 | Visualizacion de estadisticas, Estudiante – Administrador. | Propuesto | M8-HU02 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M4-HU03 | Sugerencia de Temas Relacionados. | Propuesto | M8-HU03 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M4-HU04 | Perzonalizacion de Temas Relacionados. | Propuesto | M8-HU04 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M4-HU05 | Tiempo promedio por seccion. | Propuesto | M8-HU05 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M4-HU06 | Detección de logros significativos | Propuesto | M8-HU06 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M4-HU07 | Notificacion de obtencion de logros significativos. | Propuesto | M8-HU07 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M4-HU08 | Notificacion de obtencion de logros significativos a Tutores. | Propuesto | M8-HU08 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M4-HU09 | Notificacion de bajo rendimiento a Tutores. | Propuesto | M8-HU09 — Validación transversal con dueño de cada pantalla/dominio. |

## Anexo C. Correspondencia con las 18 historias del primer avance

La presentación resumida selecciona estas historias de las anteriores; no limita el resto del plan.

| HU normalizada | Historia(s) de origen o responsabilidad |
| --- | --- |
| HU-PAE-07 | M3-HU01/02/14 |
| HU-PAE-08 | M3-HU04 |
| HU-PAE-09 | M3-HU07/09/17 |
| HU-PAE-10 | M3-HU03 |
| HU-PAE-11 | M3-HU11; M4-HU03/04 |
| HU-PAE-12 | M4-HU01/05 |

## Anexo D. Requisitos con responsabilidad principal

39 registros asignados de los 109 del catálogo. CAT conserva posición para distinguir duplicados. Estado/prioridad se mantienen literalmente. El responsable puede necesitar a otro dominio (por ejemplo RQ12: José autoriza grupo y Juan almacena el recurso); asignación principal no autoriza modificar tablas ajenas. Vincular cada fila a HU/ticket, prueba y evidencia en H0–H1. Si un requisito no tiene HU propia, crear historia derivada para aprobación, sin fabricar un estado aprobado.

| Registro | RQ | Tipo | Estado | Prioridad | HU/tarea de enlace | Descripción de la fuente |
| --- | --- | --- | --- | --- | --- | --- |
| CAT-004 | RQ04 | Funcional | Aprobado | Alta | M3-HU01/14 | Permitir a los profesores generar exámenes con sus propios recursos. |
| CAT-005 | RQ05 | Funcional | Aprobado | Alta | M3-HU02 | Permitir a los profesores modificar las preguntas y respuestas generadas. |
| CAT-006 | RQ06 | Funcional | Aprobado | Alta | M3-HU05 | Categorizar exámenes por tema y subtema. |
| CAT-007 | RQ07 | Funcional | Aprobado | Alta | M3-HU06 | Asignar niveles de dificultad a cada examen, simulacro o desafíos. |
| CAT-008 | RQ08 | Funcional | Aprobado | Alta | M3-HU06 | Mostrar el nivel de dificultad del examen, simulacro o desafío antes de que de inicio. |
| CAT-009 | RQ09 | Funcional | Aprobado | Alta | M3-HU14 | Crear exámenes personalizados seleccionando recursos del repositorio o del estudiante. |
| CAT-016 | RQ16 | Funcional | Aprobado | Alta | M3-HU04 | Realizar simulacros de exámenes de admisión y que cuenten con un tiempo límite, basado en la dificultad escogida. |
| CAT-017 | RQ17 | Funcional | Aprobado | Alta | M3-HU07 | Registrar resultados de los estudiantes tras cada simulacro, examen o desafío. |
| CAT-018 | RQ21 | Funcional | Aprobado | Media | M3-HU07; M4-HU01 | Historial de exámenes realizados separados por examen, simulacro y desafío. |
| CAT-019 | RQ22 | Funcional | Aprobado | Alta | M4-HU02 | Permitir que el profesor a cargo de un grupo de estudio visualice las estadísticas de rendimiento de cada estudiante y de su conjunto. |
| CAT-020 | RQ34 | Funcional | Aprobado | Alta | M3-HU05/08 | Inclusión de preguntas específicas por áreas académicas en cursos separados. |
| CAT-021 | RQ35 | Funcional | Aprobado | Media | M3-HU08 | Actualización del banco de preguntas cada 2 semestres. |
| CAT-022 | RQ36 | Funcional | Aprobado | Alta | M3-HU01/10 | Generar preguntas similares a exámenes de admisión locales y nacionales, rescatados del repositorio académico. |
| CAT-023 | RQ37 | Funcional | Aprobado | Media | M3-HU08/10 | Inclusión de los cursos comunes dentro de los exámenes de admisión. |
| CAT-026 | RQ44 | Funcional | Aprobado | Alta | M3-HU05/10 | El sistema debe contener exámenes por cada subtema y tema dentro de los cursos. |
| CAT-032 | RQ52 | Funcional | Aprobado | Alta | M3-HU06 | El sistema debe tener opción de filtros para elegir la dificultad y la universidad antes de un simulacro. |
| CAT-033 | RQ53 | Funcional | Aprobado | Baja | M4-HU01 | El sistema debe mostrar las estadísticas de rendimiento de un estudiante cuando se ingresa a su perfil. |
| CAT-036 | RQ56 | Funcional | Aprobado | Baja | M3-HU03 | El sistema debe permitir retroalimentación del estudiante sobre preguntas y respuestas erróneas o ambiguas en cada evaluación. |
| CAT-038 | RQ60 | Funcional | Aprobado | Alta | M3-HU12 | El sistema debe tener soporte para preguntas abiertas, de opción múltiple y de entre otros tipos. |
| CAT-039 | RQ61 | Funcional | Aprobado | Alta | M3-HU11; M4-HU03/04 | El sistema debe ser capaz de generar una ruta de estudio basada en los resultados del examen de entrada. |
| CAT-040 | RQ62 | Funcional | Aprobado | Alta | M3-HU11 | El sistema debe de mostrar un cuestionario para recopilar datos básicos del usuario sobre su nivel académico. |
| CAT-041 | RQ63 | Funcional | Aprobado | Alta | M3-HU11 | El sistema debe de generar un examen de entrada según las respuestas del cuestionario. |
| CAT-043 | RQ67 | Funcional | Aprobado | Media | M3-HU13 | El sistema debe ofrecer evaluaciones tipo “simulacros” que involucren a más de dos estudiantes de forma simultánea. |
| CAT-044 | RQ68 | Funcional | Aprobado | Alta | M3-HU09 | El sistema debe ofrecer feedback inmediato y explicativo en respuestas incorrectas. |
| CAT-045 | RQ69 | Funcional | Aprobado | Baja | M3-HU15 | El sistema debe permitir a los profesores crear "desafíos" para los estudiantes de su grupo de estudio. |
| CAT-049 | RQ75 | Funcional | Aprobado | Alta | M3-HU04/10 | El sistema debe soportar simulacros estilo "preguntas randomizadas" para evitar memorización mecánica. |
| CAT-050 | RQ76 | Funcional | Aprobado | Media | M4-HU05 | El sistema debe mostrar el tiempo promedio que un estudiante tarda en resolver cada sección. |
| CAT-053 | RQ81 | Funcional | Aprobado | Alta | M4-HU02; M3-HU15 | El sistema debe permitir a los profesores ver estadísticas de participación en desafíos en conjunto. |
| CAT-054 | RQ84 | Funcional | Aprobado | Alta | M3-HU17 | Proporcionar retroalimentación inmediata y solucionarios detallados tras cada evaluación. |
| CAT-056 | RQ87 | Funcional | Aprobado | Alta | M4-HU01/03/04 | Implementar análisis de rendimiento y seguimiento del progreso académico. |
| CAT-080 | RQ65 | Funcional | En análisis | Media | M3-HU13/15 | La plataforma debe de incluir una sección con evaluaciones más entretenidas que involucren a más de un usuario de forma simultánea. |
| CAT-082 | RQ72 | Funcional | En análisis | Media | M3-HU16 | El sistema debe permitir "guardar para después" preguntas difíciles. |
| CAT-087 | RQ18 | Funcional | Propuesto | Alta | M4-HU01 | Mostrar análisis de resultados por competencias. |
| CAT-088 | RQ19 | Funcional | Propuesto | Media | M4-HU03/04 | Recomendar contenido de estudio basado en errores. |
| CAT-089 | RQ23 | Funcional | Propuesto | Baja | M3-HU03 | Agregar un botón de “reportar” junto a cada pregunta generada para un mayor control de calidad. |
| CAT-091 | RQ39 | Funcional | Propuesto | Alta | M3-HU10 | El sistema debe generar y resolver simulacros de exámenes de admisión. |
| CAT-092 | RQ40 | Funcional | Propuesto | Alta | M4-HU01; AME-28 | El sistema debe mostrar el progreso académico mediante un gráfico de ojiva. |
| CAT-093 | RQ41 | Funcional | Propuesto | Alta | M4-HU04 | El sistema debe recomendar contenidos basados en áreas débiles detectadas. |
| CAT-094 | RQ65 | Funcional | En análisis | Media | M3-HU13/15 (duplicado CAT-080) | La plataforma debe de incluir una sección con evaluaciones más entretenidas que involucren a más de un usuario de forma simultánea. |

## Anexo E. Plantilla de ticket y cierre de versión

```text
Ticket: [RIC/JOS/AME/JUA]-NN · Título orientado a resultado
Dueño / revisor:
HU de especificación / alias HUC / CAT y RQ:
Estado y decisión de alcance aprobada:
Dado… Cuando… Entonces… (positivo, negativo y concurrencia/fallo)
Permisos por recurso y datos personales:
Contrato/evento y versión / dependencia / responsable de desbloqueo:
Backend + UI + migración + rollback:
Tests y entorno aislado / reporte / demostración:
PR / fecha de aceptación / validador / riesgo o pendiente restante:
```

Checklist final personal: todas las historias del alcance aprobado aceptadas; contratos compatibles; regresión verde; datos reconciliados; manual/runbook actualizado; seguridad/accesibilidad revisadas; evidencia guardada; propuestas/congeladas y decisiones pendientes separadas. “Completar implementación futura” significa implementar las propuestas **cuando se aprueben**, no ejecutar sin definición ni reactivar congeladas.


## Procedencia

Guía adjunta: `03_Amelia_Evaluacion_Seguimiento.md`, de 5 de octubre de 2026. SHA-256 del archivo recibido: `f7059d9d31bf0688c5737aae1623f02e1ab007a5425e7d4d68691ae44478a279`. Se incorporan secciones 2–6 y anexos A–E; el marco común repetido se sustituye por la guía central actualizada. No se requieren archivos temporales de extracción para continuar.
