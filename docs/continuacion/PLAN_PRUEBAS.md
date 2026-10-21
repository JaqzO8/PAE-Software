# Pruebas para terminar la implementación

Este plan distingue evidencia existente de pruebas por construir. Los identificadores T-* son paquetes de pruebas, no comandos que ya existan. Cada fila RQ de [trazabilidad](TRAZABILIDAD.md) exige un caso `TC-RQnn`; cada criterio original de historia exige `AC-Mx-Syy-nn`. Vincular ambos cuando cubran lo mismo; no duplicar pruebas por cambiar el ID.

## Base comprobada y comandos disponibles

El [runbook](../RUNBOOK_PRUEBAS_ARQUITECTURA.md) registra 57 tests aprobados en la base: 6 factories/contrato, 2 reglas de Gamificación, 14 integraciones DB, 25 Contenido, 4 Evaluación y 6 Calidad; además 8 comprobaciones de configuración, build frontend y smoke HTTP/Chrome. Es evidencia del 19 de octubre, no cobertura total ni pruebas nuevas de todos los módulos.

Con Node 24 y dependencias instaladas por `npm ci` en raíz/frontend/servicios utilizados:

```sh
npm run check:architecture
npm run test:architecture
npm run test:learning
npm run test:docker
npm run test:exam
npm test --prefix backend/services/content-service -- --runInBand
npm test --prefix backend/services/quality-service
npm run test:config
npm run build --prefix frontend
npm run check:safety
```

`test:docker` necesita Docker y una base PostgreSQL de pruebas identificada por etiqueta; crea/elimina exclusivamente una base aleatoria propia. Seguir el runbook para `pruebas_pae`, readiness y smoke. No ejecutar limpieza destructiva ni carga sobre las bases de usuarios. El smoke usa cuentas sintéticas y deja algunas filas cerradas; no demuestra el flujo de login real.

## Paquetes funcionales por construir/ampliar

| Paquete / dueño | Escenarios y resultado esperado | Tipo y puerta |
|---|---|---|
| T-ID / Richar | Registro no permite elegir rol docente; habilitación con evidencia; credenciales incorrectas sin enumeración; rate limit; MFA pendiente no accede; OTP vencido/usado falla; reset de un solo uso y carreras; editar perfil no eleva rol; revocar una/todas las sesiones afecta REST y sockets de todos los dominios; identidad pública sin correo/tokens | Unitarias de políticas, integración auth real, contratos de middleware, E2E login/reset; E01 |
| T-UI / Richar con dueños de pantalla | Tema/fuente/preferencias restaurados; formularios y errores accesibles; panel docente/estudiante solo permite su alcance; tickets de soporte privados; consentimiento versionado; cambio de cuenta limpia datos privados; tareas completas con teclado y lector | Componentes cuando haya lógica, E2E y evaluación manual; E08/E09 |
| T-CONT / Juan | Borrador no visible; carga inválida/oversize/traversal rechazada; PDF privado inaccesible por URL directa, sin token y tras expulsión; carga fallida no publica ni deja huérfanos permanentes; favoritos únicos ante carreras; rating/búsqueda/paginación consistentes; versiones y progreso correctos; solucionario editorial no filtra examen activo; publicación/lección y Outbox atómicas | Unitarias, app real + DB/storage temporal, contratos y E2E; E02 |
| T-PLAN / Juan | Agenda propia y zona horaria explícita; límites de fecha y cambio de día; Pomodoro pausa/reanuda sin falsificar progreso; plan editado/cancelado invalida ocurrencias; dos workers reclaman una ocurrencia una sola vez; timeout/reintento de proveedor no envía duplicados; preferencias/consentimiento respetados; datos migrados equivalentes | Reloj inyectado, integración concurrente, contrato notificador, migración y E2E; E06 |
| T-EXAM / Amelia | Banco y tipos válidos; respuesta correcta oculta durante intento; snapshot inmutable; autor ajeno no edita; reloj cliente alterado no amplía plazo; finalizaciones simultáneas producen un resultado; corrección manual/rúbrica/recalificación versionadas; reporte de pregunta moderado; diagnóstico/personalizado usan recursos autorizados; caída antes/después del commit no pierde ni duplica evento | Unitarias de cálculo/tiempo, integración transaccional, contratos, sockets y E2E; E03 |
| T-TRACK / Amelia | Precisión, avance y percentil usan denominadores/cohorte declarados; cohorte vacía y pocos datos no inventan métrica; evento duplicado/desordenado no duplica ni rebaja versión; reconstrucción desde fuente reproduce proyección; docente solo ve grupos autorizados; rutas/tutorías trazables y privadas; alertas sin duplicados | Fixtures de métricas, contratos, integración/replay y E2E; E05 |
| T-COM / José | Dueño de grupo controla invitaciones/expulsión/cierre; destinatario y vencimiento; aceptación concurrente crea una membresía; replay tras salir no reingresa; nueva emisión no revive ID viejo; amistad requiere aceptación; edición/borrado solo autorizados; paginación y reintento de mensaje sin duplicados; expulsión/revocación durante socket corta acceso; recursos privados por contrato; foro público/moderación según alcance | Ampliar integración real existente, contratos, E2E y pruebas con dos clientes; E04 |
| T-GAM / José | Solo hecho confirmado confiable produce premio; eventId alterado falla; mismo resultado con distinto eventId no duplica; regla/version inmutable; fallo Outbox revierte saldo; recalificación compensa sin borrar historial; replay/reinicio/reconstrucción mantiene sumatoria; medalla única y ranking definido; encuesta opcional no bloquea resultado ni expone respuestas ajenas | Ampliar pruebas existentes de dominio/DB, contrato productor, migración y E2E; E07 |

Las [guías personales](README.md) incorporan además las pruebas específicas de cada historia del Anexo A. Los criterios originales completos en `docs/historias/M1.md`–`M8.md` prevalecen sobre el resumen de esta tabla. Para funcionalidades nuevas como offline, IA, importación, juegos y salas, añadir casos específicos antes de declarar su cierre; no extender resultados de la vertical base a esas funciones.

## Pruebas transversales T-OPS

| Prueba | Procedimiento y oráculo | Evidencia de salida |
|---|---|---|
| Seguridad entre usuarios | Repetir lecturas/escrituras como anónimo, propietario, ajeno, docente ajeno, expulsado y revocado; alterar IDs/payload; comprobar ausencia de datos en respuesta, logs, caché y websocket | Matriz operación/rol con denegaciones y comprobación de DB sin efectos |
| Contratos | Validar schemas y ejemplos positivos/negativos en productor y consumidor; comparar versiones; probar timeout, dependencia caída, error y paginación | Tests de compatibilidad en CI; ninguna dependencia de DB ajena |
| Outbox/inbox | Cortar proceso antes y después de commit/publicación/ack, repetir entrega, variar orden y versión, envenenar payload; reprocesar cuarentena después de corregir | Ningún hecho confirmado perdido; efectos únicos, trazabilidad y cola recuperada |
| Migraciones | Aplicar desde esquema anterior y vacío, repetir, simular interrupción; comparar datos y ensayar corte/rollback con escrituras nuevas | Informe de reconciliación: claves, conteos, sumatorias y discrepancias resueltas |
| Backup/restore | Respaldar DB y archivos con manifiesto/checksums; restaurar en entorno aislado; arrancar revisión compatible y ejecutar E2E | Restauración útil, filas/objetos íntegros, RPO/RTO medidos frente a objetivo acordado |
| Carga | Acordar usuarios concurrentes, duración, mezcla de login/lectura/examen/chat/descarga, volumen DB y equipo; subir gradualmente con usuarios distintos; medir p50/p95/p99, errores, throughput, CPU/RAM/DB/colas | Umbrales acordados antes del ensayo, resultados y cuellos corregidos; sin pérdida/duplicación ni cruce de usuarios |
| Accesibilidad | Matriz de dispositivos/navegadores acordada; teclado, foco, lectores de pantalla, zoom/reflow, contraste, errores y movimiento reducido; incluir gráficos, juegos y temporizadores | Reporte automático más revisión manual y correcciones verificadas; WCAG 2.2 AA es objetivo propuesto, no certificación actual |
| TLS/red/operación | HTTPS y WSS válidos, sin contenido mixto; DB/Redis fuera de exposición pública; readiness de dependencias; alertas al fallar worker/migración; logs sin secretos | Evidencia del entorno de entrega, monitoreo accionable y runbook ensayado |
| Dependencias y privacidad | Revisar dependencias vulnerables y fijar actualizaciones compatibles; inventario de datos, retención, auditoría, acceso y eliminación/anonimización acordada | Hallazgos corregidos o decisión de riesgo explícita; no publicar tokens/datos de prueba personales |

RQ27 congelado y HU de menos de diez segundos, RQ102 en análisis y textos de 100/500 usuarios, RQ33 propuesto y HU de backup aprobado requieren conciliación previa. Medir una línea base ahora; no inventar un umbral aprobado ni certificar rendimiento por una carga aislada. Como objetivo de ingeniería propuesto, usar cobertura ≥80% de líneas y ≥70% de ramas en código nuevo crítico; acordarlo y medirlo. El porcentaje no sustituye criterios, carreras o E2E.

## Recorrido final de aceptación E10

Usar cuentas ficticias separadas: docente autorizado, docente ajeno, estudiante A, estudiante B y operador. Ejecutar contra el gateway/UI reales y servicios persistentes, con proveedor externo de sandbox cuando corresponda.

1. Registrar/verificar, habilitar docente por flujo real, completar MFA y entrar. No usar bypass de demo ni inyectar token para validar este paso.
2. Docente crea repositorio, carga/revisa/publica material; A estudia una versión y completa lección; B sin permiso no descarga.
3. Docente crea grupo e invita a A; A acepta, conversa y recibe recurso autorizado; docente ajeno no administra.
4. A realiza diagnóstico/examen temporizado, guarda respuestas y finaliza; reintento no duplica; resultado/feedback se muestran según reglas.
5. Seguimiento refleja avance y ruta con datos comprobables; Planificación programa recordatorio; edición/cancelación no genera avisos obsoletos.
6. Gamificación concede puntos/logro una vez, actualiza ranking y permite encuesta opcional; repetir resultado no cambia saldo; recalificación aplica política acordada.
7. Ejecutar desafío/sala y foro del alcance aprobado; cortar red y reconectar sin duplicación ni autorización obsoleta.
8. Expulsar a A o revocar sesión durante uso; comprobar REST/socket/archivos. Cambiar de cuenta no revela datos anteriores.
9. Restaurar respaldo aislado, recuperar workers/eventos pendientes y repetir lectura de resultados, planificación, recursos y saldo reconciliado.
10. Validar manuales, soporte, privacidad y accesibilidad; revisar todos los AC restantes, incluidos los que no aparecen en este recorrido.

Guardar por ejecución: fecha, SHA, versiones, configuración sanitizada, fixtures, comandos, duración, resultado por caso, capturas/logs sin secretos, defectos, reejecución y revisor. Publicar evidencias ligeras revisadas en documentación o adjuntarlas al PR; no versionar dumps, tokens ni carpetas generadas completas. CI verde, revisión de otro integrante y aceptación funcional deben referirse al mismo commit de entrega.
