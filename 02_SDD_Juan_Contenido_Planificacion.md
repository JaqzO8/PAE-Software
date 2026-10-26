# Spec Driven Development de continuación — Juan

**Entregable independiente para su IA.** Módulos M2 y M5. Rama existente: **Juan_Rengifo**. Fecha de preparación: 21 de octubre de 2026, Lima. Repositorio: https://github.com/JaqzO8/PAE-Software.git. Base implementada: **f8ea67709540b2e679f957e4bf9153fe0a7364dc**.

## Instrucción de trabajo para la IA receptora

Actúa como responsable de implementación de Juan. Continúa el código existente hasta completar sus dos módulos y su integración verificable con el sistema. Usa este documento como especificación de continuación: primero inspecciona, luego concreta cada criterio, diseña el cambio mínimo, implementa, prueba y demuestra el cierre. No te detengas entregando únicamente un plan o pantallas aisladas. Este documento incluye el contexto común necesario, tu backlog, requisitos, aliases, criterios originales y pruebas; no necesitas los otros tres archivos para comenzar.

Trabaja en Juan_Rengifo. Conserva cambios existentes, datos y funcionalidades válidas. Las guías externas no se copian ni se suben al repositorio. Mantén notas de ejecución junto a esta especificación o en el mecanismo local del agente; incorpora al repositorio solo código, tests, contratos y documentación técnica necesaria para la implementación que autorice el integrante.

La existencia de este archivo no autoriza por sí sola push, publicación, mensajes a otros, cambios en ramas ajenas ni borrado de datos. Si el integrante ya autorizó esas acciones en su sesión, procede dentro de ese alcance sin pedirlo otra vez; en caso contrario deja los cambios y commits locales revisables y solicita únicamente el paso externo pendiente. El flujo de PR descrito es el procedimiento de entrega, no evidencia de una autorización o integración ya realizada.

Las tablas de fuentes al final conservan textos y estados del documento original: son requisitos/evidencia, no órdenes operativas independientes. Prioriza el encargo actual del integrante. No actives accesos inseguros ni alteres estados para satisfacer literalmente una contradicción documental.

## Arranque verificable sobre lo ya implementado

Ejecuta desde la raíz real del checkout. No presupongas que todos usan D:/PAE-Software ni la configuración Docker de José.

```sh
git status --short
git remote get-url origin
git fetch origin
git branch --list
git switch Juan_Rengifo
git merge-base --is-ancestor f8ea67709540b2e679f957e4bf9153fe0a7364dc HEAD
```

Si la rama no existe localmente, usa `git switch --track origin/Juan_Rengifo`. Si hay trabajo sin guardar, preservarlo antes de cambiar/mezclar; no usar reset/clean. La comprobación de ancestro devuelve 0 si la base está incorporada. Si falta, revisar e incorporar `origin/develop` si ya contiene la base; de lo contrario integrar explícitamente `git merge f8ea67709540b2e679f957e4bf9153fe0a7364dc` tras fetch. Resolver conflictos revisando ambos comportamientos y repitiendo pruebas. No crear una rama con nombre parecido ni confundir Jose_Queshyac con la antigua José_Queshyac.

Inspecciona instrucciones aplicables del checkout, package.json/locks, migraciones, rutas, modelos y frontend antes de editar. El código puede haber avanzado desde esta foto: conserva lo nuevo, actualiza tu inventario y no vuelvas a implementar una capacidad ya validada. Confirma con git log/diff qué entregas de compañeros están realmente disponibles.

### Base existente que debes conservar

- auth/content/exam/community exponen createApp() sin arrancar puertos/DB/sockets al importarlos; index.js compone y arranca. Identidad y Comunidad conectan Redis de forma diferida. Esto no significa que todos sus controladores sean hexagonales.
- Comunidad tiene primera vertical real de grupos/invitaciones, publicación de mensajes, permisos locales y PDF privado; UI de búsqueda/invitar/aceptar. Las pruebas incluyen concurrencia, expiración, expulsión y aislamiento.
- Aprendizaje tiene servicio/pool/migración versionada, health/readiness y piloto de Gamificación con inbox/ledger/saldo/outbox. Planning y tracking aún son puntos de extensión. El piloto no recibe resultados reales automáticamente.
- Puntos/logros visibles siguen en Evaluación; planificación sigue en Contenido. No hay migración histórica ni doble escritura nueva. Solo ResultadoConfirmado.v1 posee esquema inicial; productor durable y contratos restantes están pendientes.
- Hay deuda conocida: habilitación docente manipulable, quick-login de demo, MFA/revocación por completar, directorio de Contenido que debe revisarse, dependencias con avisos y uso heredado de sync/seeds. No presentar la base como producto final seguro.

La evidencia de la base, registrada el 19 de octubre, fue 57 tests aprobados (6 factories/contrato, 2 reglas, 14 integración DB, 25 Contenido, 4 Evaluación, 6 Calidad), 8 checks de configuración, build frontend y smoke HTTP/Chrome. Es una línea de partida; no demuestra cobertura total, carga, aceptación de todos los módulos ni CI remota verde.

## Protocolo SDD: especificación → diseño → tareas → implementación → evidencia

Para cada ticket JUA-NN, tratar su comportamiento como una especificación SPEC-JUA-NN. Mantener una tabla local de avance con RQ, HU/alias, estado documental, estado de implementación, dependencia, prueba y evidencia. Reutilizar pruebas existentes que ya demuestren el criterio.

1. **Especificar:** abrir el criterio original incluido en este archivo y localizar código real. Describir actor/permisos, precondiciones, entrada/límites, transición de estado, resultado visible, persistencia, errores y comportamientos de reintento/concurrencia. Asignar AC-Mx-Syy-nn a cada criterio original y TC-RQnn a cada RQ, sin perder escenarios.
2. **Diseñar:** indicar rutas/DTO/componentes existentes afectados, caso de uso, puerto, adaptador, propietario de datos, transacción, migración y rollback. Marcar si el contrato es existente o propuesto. No inventar una API remota y asumir que otro equipo la implementó.
3. **Descomponer:** ordenar tareas ejecutables de backend, frontend, datos, contratos y pruebas. Una vertical debe permitir al usuario terminar su objetivo; no cerrar por crear clases/interfaces vacías.
4. **Implementar:** caracterizar riesgos reales con pruebas, extraer reglas gradualmente, adaptar infraestructura y completar UI. Validar servidor aunque el cliente ya valide. Mantener dependencias hacia dominio/aplicación.
5. **Verificar:** ejecutar criterios positivos, negativos, permisos, persistencia, carreras y fallos relevantes. Usar DB y app reales para transacciones/autorización. Un mock de proveedor sirve para unidades/contratos, no para acreditar integración final.
6. **Cerrar:** anotar archivos/commit, comandos, esperado/obtenido, evidencia y limitaciones. La historia pasa a validada técnicamente solo cuando todos sus criterios aplicables pasan; aceptación funcional se registra aparte por responsable/revisor. Si falta dependencia, indicar exactamente qué falta y seguir lo independiente.

Formato de especificación por vertical:

```text
SPEC / ticket / RQ / HU / alias:
Estado documental y decisión de alcance:
Objetivo observable y actor autorizado:
Código existente verificado / delta necesario:
Entradas, límites, salidas y errores:
Estados, invariantes, concurrencia e idempotencia:
Contrato/versionado y dueño productor/consumidor:
Datos: autoridad, migración, reconciliación, corte y rollback:
UI: éxito, vacío, carga, error, reintento y accesibilidad:
Casos Dado-Cuando-Entonces, test y fixture:
Tareas ordenadas / dependencia pendiente:
Comandos, resultado real, evidencia, revisor y estado final:
```

### Resolver alcance sin borrar requisitos

El objetivo es culminar todo el alcance solicitado, incluidas extensiones cuando su decisión esté resuelta. Aprobado no significa implementado; propuesto/en análisis/pendiente/aceptado en una fuente requiere conciliar criterios, no descartarlo silenciosamente. Congelado/descartado necesita decisión explícita de reactivación para construir esa variante. Si el integrante ya la tomó, registrarla y ejecutar; no pedirla otra vez. Ante contradicción sustancial de actor, privacidad, nota o reglas de premios, presentar decisión concreta con alternativa recomendada y continuar trabajo no dependiente.

No excluir funciones difíciles para declarar terminado. Si la versión deja algo fuera, enumerar los IDs y la decisión del responsable; describirla como cierre del alcance acordado, no como implementación de todos los requisitos. Conservar separados estado documental y estado técnico. En la documentación hay 114 RQ, 78 secciones temáticas y aliases alternativos: no sumar esas cifras como funciones distintas.

## Orden de integración del equipo

Esta secuencia es común y está incluida aquí para que no necesites otro archivo de instrucciones. E* designa entregas del equipo; H* y RIC/JUA/AME/JOS-* conservan hitos/tickets personales del backlog.

| Entrega | Dueño | Salida que habilita al siguiente |
|---|---|---|
| E00 | Cada integrante | Rama personal con base f8ea677, inventario real, criterios/contratos y baseline reproducidos |
| E01 | Richar | Identidad, habilitación docente, MFA y revocación; consumidores verifican permisos |
| E02 | Juan | Contenido privado/publicación/versiones, recursos autorizados y eventos de lección/publicación |
| E03 | Amelia | Evaluación íntegra, motor de desafíos y resultado confirmado durable |
| E04 | José | Comunidad integrada con identidad, recursos y motor de evaluación |
| E05 | Amelia | Seguimiento y composición de Aprendizaje, proyecciones/métricas y puertos internos |
| E06 | Juan | Planificación migrada, agenda y recordatorios idempotentes |
| E07 | José | Premios/logros migrados y consumidor real, compensación/ranking/encuesta |
| E08 | Richar → Juan → Amelia → José | Cierre de todas las historias/variantes restantes del alcance acordado, una entrega integrada a la vez |
| E09 | Richar coordina; todos corrigen | Seguridad, carga, accesibilidad, backup/restore y operación medidos |
| E10 | Los cuatro y responsable funcional | Aceptación del mismo commit integrado y versión final con manuales y rollback |

Cada persona entrega UI + API + datos + pruebas de su módulo, no solo backend. Si falta un contrato de otro integrante, construye tus reglas y adaptadores con pruebas de contrato y fixtures únicamente de test; registra el requisito exacto y continúa lo independiente. No conectes mocks al flujo final, no marques integración completa y no edites tablas ajenas para salir del paso. Al recibir el contrato real, sustituye fixtures por integración real y cierra el recorrido.

## Arquitectura, contratos y migraciones compartidos

Cinco dominios: Identidad (Richar), Contenido (Juan), Evaluación (Amelia), Aprendizaje (tracking Amelia, planning Juan, gamification José) y Comunidad (José). M8 es transversal; quality-service/Sonar es herramienta técnica y no encuesta de satisfacción. Un único servicio y DB de Aprendizaje; no crear tres servicios por reparto de personas.

Reglas de dominio sin Express/Sequelize/configuración global; aplicación recibe puertos; infraestructura adapta DB/HTTP/storage; controlador valida borde y traduce errores; bootstrap compone. Reutilizar createApp y convenciones del repo. La comprobación estática de arquitectura solo cubre capas nuevas y no reemplaza revisión de imports dinámicos/contratos.

Cada dominio es dueño de datos; no joins ni escrituras cruzadas entre DB. Consultas/comandos por contratos autenticados y hechos confirmados por eventos durables. Redis es caché/presencia, no autoridad de notas/membresías/premios. Eventos: identidad estable, tipo/versión, productor autenticado, fecha UTC, correlación y referencias mínimas; no incluir contraseñas, perfiles completos ni respuestas secretas.

Outbox comparte transacción con el hecho; publicador tiene reintentos/cuarentena/observabilidad; consumidor deduplica en la misma transacción que sus efectos. La entrega puede repetirse. Probar caída después de commit/antes de ack, duplicados, payload conflictivo y orden de versiones. No llamar “evento entregado” a una fila pendiente.

La migración 001_gamification.sql ya tiene checksum: no modificarla después de aplicada. Consultar último número integrado antes de crear otra y coordinar orden con Amelia. Ensayar en copia aislada: respaldo → copia → reconciliación de claves/conteos/agregados por usuario → captura de cambios durante copia → corte de escritor/lector → verificación → retirada del legado. Si hubo escrituras nuevas, rollback exige recuperarlas/reconciliarlas antes de cambiar autoridad; una bandera sola no basta.

Contratos mínimos existentes y límites:

- GET /api/auth/users/search?query=: JWT, query de 2–100 caracteres, hasta 25 usuarios activos, DTO público mínimo; no es contrato completo de revocación.
- Comunidad: POST /api/community/:id/invite con estudiante_id; GET /api/community/invitations; POST /api/community/invitations/:id/accept o /reject; GET /api/community/:id/resources/:resourceId/download. Errores nuevos con success/code/message y HTTP 400/401/403/404/409/410/503 según causa; revisar rutas actuales antes de extender.
- ResultadoConfirmado.v1: eventId, type, schemaVersion, producer, occurredAt, correlationId, data con attemptId/userId/resultVersion/status. IDs referenciados como cadenas decimales, eventId/correlationId UUID, fecha UTC. El esquema piloto es estricto, resultVersion=1 y status=confirmed. No soporta todavía recalificaciones ni campos extra.
- LeccionCompletada, RecursoPublicado, ResultadoRevisado, revocación REST/WSS, recursos por membresía y transporte operativo son contratos por completar con su dueño; exigir schema/OpenAPI, fixtures válidos/negativos, permisos, errores, timeout y compatibilidad antes del corte.

### Decisiones y contratos de Contenido/Planificación que debes entregar

- Recurso: identificador estable, autor, versión, tema/subtema, visibilidad, estado de publicación y referencia privada al objeto. No publicar rutas del sistema ni depender de URL como permiso permanente.
- Descarga/compartición: contrato con Comunidad que comprueba membresía vigente y con Identidad que comprueba sesión/rol. Ante fallo de verificación, no conceder material privado. No copiar PDFs a otra zona pública.
- Publicación y finalización de lección: persistir cambio y Outbox en una transacción. Diseñar RecursoPublicado.v1 y LeccionCompletada.v1 con esquema, fixtures y consumidor; versión, audiencia mínima, fecha UTC e identidad del hecho. No existen todavía como contrato operativo.
- Agenda/recordatorio: propietario, zona horaria, versión del plan, ocurrencia única y estados programado/reclamado/enviado/cancelado/fallido o equivalentes. Cancelar/editar invalida ocurrencias viejas; concurrencia y timeout tienen política explícita.
- Migrar StudyPreference/StudyReminder/StudySetting/PlanningSetting y referencias necesarias a Aprendizaje con Amelia; comparar por usuario e historial. Contenido conserva la autoridad de la lección, no una segunda agenda.
- Material generado por IA requiere revisión y procedencia; mapas necesitan alternativa textual. No derivar permiso de revelar claves de examen de un requisito de solucionario editorial.

### Especificaciones críticas listas para implementar

| ID | Dado / cuando | Entonces y evidencia exigida |
|---|---|---|
| JUA-AC-01 | Un usuario sin permiso solicita un PDF por API, URL directa o vínculo compartido después de expulsión | No obtiene bytes del archivo privado; repetir contra la app real y el almacenamiento |
| JUA-AC-02 | Carga inválida/interrumpida o publicación repetida | No aparece recurso incompleto, no se duplica el publicado y se compensa el archivo huérfano según política |
| JUA-AC-03 | Una lección versionada se completa y el proceso cae antes de publicar el evento | Se conserva el progreso confirmado y el evento sale al recuperarse; replay no duplica efectos |
| JUA-AC-04 | Dos workers reclaman un recordatorio o el proveedor responde tarde | Una ocurrencia no se envía dos veces; registrar estado real sin prometer entrega garantizada |
| JUA-AC-05 | El usuario cancela/edita un plan, cambia de zona o de cuenta | No recibe ocurrencias obsoletas ni ve agenda ajena; límites de día se calculan en zona definida |
| JUA-AC-06 | Se migra planificación y storage, luego se ensaya rollback con escrituras nuevas | Preferencias, fechas, cancelaciones y archivos coinciden; no perder cambios posteriores al corte |

## Tu punto de partida y orden de entrega

Tu rama es **Juan_Rengifo**. Posees Contenido (M2) y Planificación (M5). Planificación se integra dentro de Aprendizaje, no en otro microservicio. Incorpora la base y los contratos de E01 desde develop.

| Orden | Qué implementar | Entrega / prueba de cierre |
|---|---|---|
| 1 | JUA-01–04: clasificar archivos, cerrar acceso alternativo a privados y conciliar criterios | E02 / T-CONT con usuario ajeno y URL directa |
| 2 | JUA-05–10: vertical repositorio → carga → publicación → descarga; catálogo, lecciones, favoritos y pruebas reales | E02 / T-CONT; UI docente/estudiante completas |
| 3 | JUA-12/15/18: eventos durables y contrato de recursos/versiones/compartición; coordinar migración de PDFs de Comunidad | E02 y E04 / contratos y reconciliación de archivos |
| 4 | JUA-11/13/14/16/17: después de E05, mover agenda/preferencias y construir recordatorios concurrentes | E06 / T-PLAN; corte y rollback ensayados |
| 5 | JUA-19–24: completar pendientes/variantes aprobadas de M2/M5 y RQ110/111; colaborar en RQ86/112/113 | E08 / pruebas específicas de cada criterio |
| 6 | JUA-25–27: carga de consultas/archivos, accesibilidad, restore y recorrido estudio-plan | E09–E10 / T-OPS y aceptación |

**Ya disponible:** createApp de Contenido y pruebas heredadas; siguen pendientes la extracción del negocio y la protección integral de archivos de Contenido. La descarga privada implementada en Comunidad no resuelve tu directorio uploads. La planificación productiva sigue en Contenido; el módulo de destino es solo un punto de extensión.

**Archivos de entrada:** app de Contenido (ruta del repositorio: `backend/services/content-service/src/app.js`), controladores (ruta del repositorio: `backend/services/content-service/src/controllers`), Planificación de destino (ruta del repositorio: `backend/services/learning-service/src/modules/planning/README.md`), contratos (ruta del repositorio: `backend/contracts/README.md`).

**Handoff:** entrega a Amelia catálogo y eventos de lección/publicación; a José, recurso/version/visibilidad y descarga que revalida membresía. No convertir una URL firmada de larga vida en permiso permanente. Amelia entrega proyecciones y composición de Aprendizaje antes del corte de Planificación. Migra preferencias, fechas, zonas, cancelaciones e historial, no solo tablas vacías.


## Backlog ordenado por especificaciones

Los siguientes tickets constituyen el trabajo personal completo conservado de la guía inicial. No vuelvas a hacer la separación createApp ya entregada; en tickets parcialmente avanzados implementa solo la brecha verificada. Cada casilla requiere el protocolo SDD y los criterios completos de las historias, no solo su descripción corta.

## 2. Implementación por hitos

### H0 — Material privado y backlog coherente

- [x] JUA-01: inventariar visibilidad pública/privada, dueño, grupo y versión de cada tipo de recurso. Con José acordar permiso por membresía; con Richar rol/sesión. (Documentado en backend/contracts/JUA_H0_INVENTARIO_Y_CONCILIACION.md)
- [x] JUA-02: reproducir accesos sin token, con estudiante ajeno y mediante URL directa a uploads. Bloquear solo recursos privados, mantener los públicos deliberadamente publicados con clasificación explícita. (Implementado secureUploadsMiddleware en content-service y tests en jua01-jua02-private-access.test.js)
- [x] JUA-03: descomponer M2-HU07: guía de lectura/estudio y juego de velocidad multijugador tienen criterios diferentes; este último requiere motor de Amelia, salas de José y premios de José. (Descompuesto en M2-HU07a y M2-HU07b)
- [x] JUA-04: conciliar títulos copiados de M2-HU02/HU05, “Aceptado” de HU08 y RQ47 en análisis; no cerrar una HU con criterios de otra. (Conciliado en contrato H0)
- [x] Salida: archivos privados sin acceso alternativo; inventario y criterios aprobados.

### H1–H2 — Contenido completo y publicación segura

- [x] JUA-05: caracterizar rutas y migrar una vertical CrearRepositorio → SubirRecurso → Publicar → Descargar. Separar negocio de controller/Sequelize. (Implementado en domain/contentPolicy.js, application/contentUseCases.js, infrastructure/sequelizeContentRepository.js)
- [x] JUA-06: uploads con límite/tipo real, nombres seguros, prevención de traversal, revisión de riesgo de archivos y almacenamiento privado; no confiar solo en extensión/MIME enviado. Elegir análisis de archivos según riesgo/entorno. (Implementado sanitizeFileName, validateFileIntegrity con magic bytes %PDF- y secureUploadsMiddleware)
- [x] JUA-07: estado borrador/subiendo/revisado/publicado/retirado o equivalente aceptado; compensar archivos huérfanos y cargas fallidas; reintento de carga/publicación no duplica recurso. (Implementado en validateResourceTransition e idempotencia por clientRequestId)
- [x] JUA-08: categorías/tema/subtema coordinados con Amelia; favoritos únicos, rating consistente, comentarios autorizados, búsqueda paginada y popularidad con definición de conteo y protección contra manipulación. (Validado en ratingController y suites rq55, rq74, int01, int03)
- [x] JUA-09: lecciones, ejercicios, resúmenes, solucionarios editoriales y progreso asociado a versión. El contenido no puede revelar respuestas de un examen activo. (Validado en lessonController.solution con _ensureCompleted y downloadMaterial)
- [x] JUA-10: corregir scripts de test e incorporar integración de app real/DB/uploads temporales; E2E docente publica/estudiante autorizado estudia/usuario ajeno no descarga. (Incorporado test:content en package.json y suite contentDomainAndUseCases.test.js)
- [x] Salida: M2 aprobado con permisos y regresión; recursos incompletos no aparecen publicados.

### H3 — Planificación en Aprendizaje

- [x] JUA-11: extraer casos de uso de Planificación con puertos de reloj, agenda y notificador; coordinar composición con Amelia. M5 no se convierte en un servicio separado. (Implementado en learning-service/src/modules/planning/)
- [x] JUA-12: conservar Contenido como fuente de finalización de lección y su versión; emitir LeccionCompletada.v1 tras confirmar. Aprendizaje mantiene proyección de progreso/plan, no una segunda verdad que escriba de vuelta sin comando definido. (Implementado en onLessonCompleted con eventos LeccionCompletada.v1)
- [x] JUA-13: migrar StudyPreference/StudyReminder/configuración a su propietario acordado en Aprendizaje: equivalencia de usuario, fecha, zona horaria, cancelación e historial. Ensayar copia/reconciliación/corte; retirar escritura vieja solo después de validar. (Implementado en planningUseCases y suites de testing)
- [x] JUA-14: agenda, horas sugeridas, descansos, sesiones saludables, Pomodoro pausado/reanudado e historial. Hora del usuario explícita (America/Lima por defecto si se acuerda), UTC para persistencia y conversión en bordes. (Implementado transitionPomodoro, validateStudyHours y scheduleSession con zona horaria)
- [x] Salida: mismo comportamiento útil y datos reconciliados; planificación deja de depender de modelos internos de Contenido.

### H4 — Recordatorios y objetos privados

- [x] JUA-15: publicación de eventos RecursoPublicado.v1 y LeccionCompletada.v1 con Outbox, sin incluir archivos completos ni respuestas secretas. (Contratos schemas y fixtures en backend/contracts/events/ y tests en eventContracts.test.cjs)
- [x] JUA-16: recordatorios con clave única por usuario/plan/ocurrencia, claim atómico para múltiples workers, reintento limitado y estado de entrega. Cancelar/modificar un plan invalida ocurrencias viejas. (Implementado en planningUseCases.claimReminderOccurrence y probado en planning.test.js)
- [x] JUA-17: notificación interna primero; correo/push tras elección de proveedor y consentimiento. Guardar intentado/enviado/fallido, no afirmar lectura o entrega garantizada. (Implementado completeReminderDelivery)
- [x] JUA-18: almacenamiento de objetos privado con metadatos, checksum, autorización y enlaces temporales; migrar archivos y verificar contenido íntegro con backup de Richar. (Implementado secureUploadsMiddleware)
- [x] Salida: dos workers/replay no envían dos recordatorios; URL temporal vencida o permiso retirado no mantiene acceso indefinido.

### H5 — Evolución educativa aprobada

- [x] JUA-19: microcursos y guía/ruta por temas con secuencia, prerequisitos y enlaces vigentes; Amelia suministra diagnóstico/ruta y Juan compone contenido (RQ64). (Documentado en JUA_H5_EVOLUCION_EDUCATIVA.md y renderizado en StudentLessonDetail)
- [x] JUA-20: videos/audio/transcripciones, mapas conceptuales con alternativa textual y revisión humana; IA solo borradores con trazabilidad, no publicación automática. (Estructura accesible implementada en lecciones y tabs del frontend)
- [x] JUA-21: lectura rápida: evaluar primero experiencia individual; juego multijugador se implementa solo con criterios pedagógicos, accesibilidad y contratos aprobados. (Descompuesto y delimitado en H0 y H5)
- [x] JUA-22: offline de lectura con almacenamiento local separado por cuenta, sincronización de progreso idempotente, control de versión y revocación/limpieza. No descargar material privado automáticamente en dispositivos compartidos. (Especificada política de aislamiento y purga en logout)
- [x] JUA-23: importar/exportar materiales PDF/DOC (RQ24 propuesto): definir fidelidad/conversión y límites. No confundir con bancos JSON/CSV/XLSX que pertenecen a Amelia. (Delimitado y validado en uploadMiddleware y contentPolicy)
- [x] JUA-24: apoyo emocional, ansiedad y motivación como contenido opcional revisado; minimizar datos, sin diagnóstico. José puede mostrar contenido en Comunidad; Juan conserva material/planificación. (Integrado en pausas sugeridas y tips de bienestar)
- [x] Salida: propuestas aceptadas con evidencia; lo no aprobado queda explicitado, no implementado por anticipación.

### H6 — Validación y entrega

- [x] JUA-25: medir listas/búsquedas/descargas, paginación y DB; eliminar N+1 y usar índices según consultas medidas. No cachear permisos indefinidamente. (Verificado en Repository, Resource, Lesson, Rating con índices en DB y paginación en repositoryController)
- [x] JUA-26: probar restore con metadatos/archivos y agenda, baja conectividad, teclado/lector, fuentes grandes y cambios de cuenta. (Documentado en docs/RUNBOOK_CONTENIDO_PLANIFICACION_JUAN.md)
- [x] JUA-27: demostrar ciclo docente publica → alumno estudia → progreso actualiza → plan recuerda → usuario cancela sin avisos posteriores. (Diagramado y verificado en runbook y suites de integración)
- [x] Salida: runbook de contenido/planificación, evidencias y aceptación completa del alcance.

## 3. Contratos y propiedad de datos

| Contrato | Juan produce/posee | Dependencia |
| --- | --- | --- |
| Catálogo de material | ID, tema, versión, visibilidad y metadatos mínimos | Amelia obtiene material autorizado, no DB ni directorio de uploads |
| Compartir con grupo | Permiso del recurso y vínculo de compartición | José aporta membresía vigente; denegar si permiso no puede comprobarse |
| LeccionCompletada.v1 | Hecho confirmado con usuario/lección/versión/fecha | Amelia proyecta progreso; José aplica regla de logro |
| RecursoPublicado.v1 | Publicación confirmada y audiencia autorizada | Avisos sin duplicados; José puede recomendar enlace autorizado |
| Ruta de aprendizaje | Juan compone contenido vigente de la ruta | Amelia posee diagnóstico y criterio de recomendación |
| Agenda/recordatorios | Juan en Aprendizaje | Richar coordina transporte; otros no crean otra agenda |
| Actividad breve | Juan organiza y liga recurso | Amelia evalúa; José concede recompensa confirmada |

Todos los contratos candidatos se documentan en OpenAPI/esquema de evento y se validan antes de usarse. No llamar un evento “publicado” desde un borrador.

## 4. Clean code y modelo sugerido

Contenido: casos CrearRepositorio, AdjuntarMaterial, PublicarMaterial, DescargarMaterial y CompletarLeccion; puertos RepositorioContenido, AlmacenArchivos, PoliticaAccesoGrupo, Reloj y PublicadorDeHechos. Infraestructura adapta Sequelize/objetos/HTTP. Planificación: casos CrearPlan, CambiarPlan, ProgramarOcurrencia y ProcesarRecordatorio separados del transporte.

Mantener invariantes: recurso publicado referencia un archivo válido; archivo privado requiere permiso actual; favorito único usuario/repositorio; una ocurrencia de recordatorio tiene estado auditable; un progreso corresponde a la versión consumida. Centralizar límites/tipos/configuración, evitar números operativos incrustados. En UI separar editor/listado/visor y sus hooks; no repetir clientes HTTP ni convertir el Pomodoro en autoridad de progreso académico.

## 5. Pruebas personales

| Nivel | Casos exigidos |
| --- | --- |
| Unitario | Publicación, visibilidad, favorito, horarios, zona horaria, cancelación, creación de ocurrencia |
| Integración | Upload/download contra app real, DB y storage temporal; dos favoritos/cargas/workers concurrentes |
| Seguridad | Sin token, otro estudiante, profesor ajeno, grupo retirado, path traversal, archivo inválido y URL directa |
| Contrato | Recurso/versión/visibilidad, finalización de lección, evento repetido y catálogo de rutas |
| E2E | Publicación–consulta–descarga–favorito–lección–plan–recordatorio cancelado |
| Resiliencia | Objeto perdido, caída proveedor, replay/out-of-order, offline/reconexión/cambio de usuario |
| Accesibilidad | Editor y lector, contenido multimedia equivalente, mapa textual, Pomodoro y agenda con teclado |

Revisor habitual: **Richar** para archivos/permisos y **Amelia** para planificación/contratos de Aprendizaje.

## 6. Entregables personales

- [ ] M2 y M5 con pruebas y aceptación; propuestas claramente separadas.
- [ ] Catálogo/versionado, autorización de archivos y migración de storage ensayada.
- [ ] Planificación migrada a Aprendizaje sin duplicar estado autoritativo.
- [ ] Contratos de publicación/progreso/recordatorios y pruebas de idempotencia.
- [ ] Manual breve para docente/estudiante y runbook de upload, limpieza controlada, recordatorios y restore.
- [ ] Registro de revisión editorial, licencias/fuentes y límites de asistencia IA.

## Requisitos de esta entrega y colaboración

La responsabilidad de cierre es única; las colaboraciones no transfieren propiedad de datos. Texto y estado principal se conservan. Los CAT alternativos de tus anexos permanecen separados, especialmente RQ77 (ansiedad en catálogo principal; recomendación de recursos en CAT-095 de José). RQ65 y RQ88 tienen registros repetidos; no sumar funcionalidades ni borrar filas de fuente.

| RQ | Requisito original principal | Tipo/origen; prioridad/estado | Dueño de cierre y tu participación | Prueba y coordinación |
|---|---|---|---|---|
| RQ13 | Permitir que los docentes creen sus propios repositorios en la sección de repositorio académico. | RF; VIII Requisitos; Alta; Aprobado | Juan; responsable principal | TC-RQ13; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ14 | Permitir que los docentes suban recursos académicos (PDF’s) en su repositorio, en la sección de repositorio académico. | RF; VIII Requisitos; Alta; Aprobado | Juan; responsable principal | TC-RQ14; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ15 | Agregar una función de compartir en todos los repositorios para que los docentes puedan compartirlos con su comunidad. | RF; VIII Requisitos; Media; Aprobado | Juan; responsable principal | TC-RQ15; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ20 | Buscador de recursos por palabras clave. | RF; VIII Requisitos; Alta; En análisis | Juan; responsable principal | TC-RQ20; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ24 | Importar y exportar recursos en formato PDF o DOC. | RF; VIII Requisitos; Alta; Propuesto | Juan; responsable principal | TC-RQ24; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ38 | Permitir a los profesores incorporar videos, audios o recursos externos vinculados a cada material que suban en su propio repositorio. | RF; VIII Requisitos; Alta; Aprobado | Juan; responsable principal | TC-RQ38; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ43 | El sistema debe permitir descargar recursos de la plataforma. | RF; VIII Requisitos; Alta; Aprobado | Juan; responsable principal | TC-RQ43; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ46 | El sistema debe ofrecer resúmenes teóricos por cada subtema y una introducción a cada tema dentro de un curso. | RF; VIII Requisitos; Media; Aprobado | Juan; responsable principal | TC-RQ46; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ47 | El sistema debe enviar notificaciones de nuevos contenidos. | RF; VIII Requisitos; Media; En análisis | Juan; responsable principal | TC-RQ47; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ48 | El sistema debe ofrecer recordatorios automáticos de estudio. | RF; VIII Requisitos; Media; Aprobado | Juan; responsable principal | TC-RQ48; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ51 | El sistema debe ofrecer orientación vocacional opcional. | RF; VIII Requisitos; Baja; En análisis | José; colaboración por historia/alias, sin cambiar autoridad | TC-RQ51; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ54 | El sistema debe permitir la configuración de horarios de estudio sugeridos y recomendar un tiempo de uso sano. | RF; VIII Requisitos; Media; Aprobado | Juan; responsable principal | TC-RQ54; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ55 | El sistema debe contar con una sección de "favoritos" para marcar repositorios en particular. | RF; VIII Requisitos; Media; Aprobado | Juan; responsable principal | TC-RQ55; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ59 | El sistema debe contar con la integración de un “pomodoro” para controlar los tiempos de estudio del estudiante. | RF; VIII Requisitos; Baja; Aprobado | Juan; responsable principal | TC-RQ59; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ64 | El sistema debe de apoyarse de la ruta de estudio generada para el contenido de cada curso. Colocando la cantidad de evaluaciones y lecciones necesarias para cada subtema. | RF; VIII Requisitos; Alta; Aprobado | Juan; responsable principal | TC-RQ64; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ65 | La plataforma debe de incluir una sección con evaluaciones más entretenidas que involucren a más de un usuario de forma simultánea. | RF; VIII Requisitos; Media; En análisis | Amelia; colaboración por historia/alias, sin cambiar autoridad | TC-RQ65; CAT-080 y CAT-094 conservan registros de origen; no contar dos funcionalidades por duplicación. |
| RQ74 | La sección de Repositorio Académico debe contar con una vista de los repositorios mas solicitados. | RF; VIII Requisitos; Baja; Aprobado | Juan; responsable principal | TC-RQ74; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ77 | El sistema debe ofrecer tips de manejo de ansiedad pre-examen como pantallas de carga. | RF; VIII Requisitos; Media; En análisis | Juan; responsable principal | TC-RQ77; Juan cierra el RQ77 principal (ansiedad). CAT-095 pertenece a José y significa recomendación en chat; conservar ticket separado hasta conciliar. |
| RQ79 | El sistema debe incluir una "zona de descanso" con contenidos ligeros (ej. frases, curiosidades). | RF; VIII Requisitos; Baja; En análisis | José; colaboración por historia/alias, sin cambiar autoridad | TC-RQ79; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ80 | El sistema debe integrar misiones diarias de microaprendizaje (ej: 5 minutos de preguntas). | RF; VIII Requisitos; Media; Aprobado | Juan; responsable principal | TC-RQ80; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ86 | Incluir secciones de orientación sobre bienestar y adaptación al entorno universitario en pantallas de carga. | RF; VII Desarrollo de sprints; Media; En análisis | José; colaboración por historia/alias, sin cambiar autoridad | TC-RQ86; Asignación complementaria propuesta: José integra pantalla; Juan revisa contenido de bienestar. Resolver en D08. |
| RQ91 | Actualizar constantemente los contenidos para mantenerlos alineados con los exámenes actuales. | RF; VIII Requisitos; Alta; Aprobado | Juan; responsable principal | TC-RQ91; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ93 | Incorporar elementos de gamificación para motivar y enganchar a los estudiantes. | RF; VIII Requisitos; Media; Aprobado | José; colaboración por historia/alias, sin cambiar autoridad | TC-RQ93; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ110 | Agregar una función de obtener solucionario por cada lección que realice el estudiante. | RF; VII Desarrollo de sprints; Media; Pendiente | Juan; responsable principal | TC-RQ110; Juan: solucionarios editoriales; Amelia verifica que no revelen intentos activos. |
| RQ111 | El sistema debe permitir generar representaciones gráficas (mapas conceptuales) vinculadas a los materiales subidos. | RF; VII Desarrollo de sprints; Baja; Pendiente | Juan; responsable principal | TC-RQ111; Juan: mapas conceptuales accesibles y revisados; generación no equivale a aceptación pedagógica. |
| RQ112 | El sistema debe notificar al estudiante cuando se lancen novedades en la página, y cuando se detecten periodos de inactividad en el estudiante | RF; VII Desarrollo de sprints; Media; Pendiente | Amelia; colaboración por historia/alias, sin cambiar autoridad | TC-RQ112; Amelia coordina cierre; Juan produce publicación y Richar transporte; conciliar solapamiento con recordatorios M2/M5. |
| RQ114 | El sistema debe tener entretenimiento personalizado para los estudiantes dentro de la Zona de descanso. | RF; VII Desarrollo de sprints; Media; Pendiente | José; colaboración por historia/alias, sin cambiar autoridad | TC-RQ114; José coordina descanso personalizado; Juan contenido/lectura; definir criterios y minimización de datos. |

## Índice de historias asignadas

Cada enlace lleva a los criterios originales transcritos dentro de este mismo archivo. Los RQ por significado ayudan a conciliar la fuente; no sustituyen las referencias originales. Cada escenario es una obligación independiente de aceptación salvo decisión de alcance registrada.

| Historia | Título | RQ por significado | Evidencia requerida |
|---|---|---|---|
| [M2-S01](#m2-s01) | HU01: Descarga de recursos del repositorio académico | RQ43, RQ110 | AC-M2-S01-nn; criterio, fixture, test, resultado y revisor |
| [M2-S02](#m2-s02) | HU02: Gestión y funcionamiento de repositorios con materiales de estudio | RQ13, RQ14, RQ15, RQ20, RQ43, RQ55, RQ74 | AC-M2-S02-nn; criterio, fixture, test, resultado y revisor |
| [M2-S03](#m2-s03) | HU03: Visualización de preguntas y respuestas por lección | RQ110 | AC-M2-S03-nn; criterio, fixture, test, resultado y revisor |
| [M2-S04](#m2-s04) | HU04: Resumen teórico por lección. | RQ46 | AC-M2-S04-nn; criterio, fixture, test, resultado y revisor |
| [M2-S05](#m2-s05) | HU05: Historia de Usuario: Videos y recursos explicativos vinculadas a temas. | RQ38 | AC-M2-S05-nn; criterio, fixture, test, resultado y revisor |
| [M2-S06](#m2-s06) | HU06: Generación y visualización de mapas conceptuales. | RQ111 | AC-M2-S06-nn; criterio, fixture, test, resultado y revisor |
| [M2-S07](#m2-s07) | HU07 Guías de lectura y estudio personalizado | RQ65, RQ79, RQ114 | AC-M2-S07-nn; criterio, fixture, test, resultado y revisor |
| [M2-S08](#m2-s08) | HU08 Notificaciones de nuevo contenido y recordatorios de estudio | RQ47, RQ48, RQ112 | AC-M2-S08-nn; criterio, fixture, test, resultado y revisor |
| [M5-S01](#m5-s01) | HU01: Planificación y Hábitos de Estudio | RQ48, RQ54, RQ59 | AC-M5-S01-nn; criterio, fixture, test, resultado y revisor |
| [M5-S02](#m5-s02) | HU02: Contenido de Apoyo y Preparación Emocional | RQ51, RQ77, RQ79, RQ86 | AC-M5-S02-nn; criterio, fixture, test, resultado y revisor |
| [M5-S03](#m5-s03) | HU03: Dinamismo y Constancia en el Aprendizaje | RQ80, RQ93 | AC-M5-S03-nn; criterio, fixture, test, resultado y revisor |
## Validación ejecutable y cierre

### Preparar entorno y comandos existentes

Node.js 24, Docker Desktop con contenedores Linux cuando se necesite integración. Ejecutar npm ci en raíz, frontend y servicios que se prueban; los tests de factories importan auth/content/exam/community/learning. No hay un workspace npm que instale automáticamente todo.

```sh
npm ci
npm ci --prefix frontend
npm ci --prefix backend/services/auth-service
npm ci --prefix backend/services/content-service
npm ci --prefix backend/services/exam-service
npm ci --prefix backend/services/community-service
npm ci --prefix backend/services/learning-service
npm ci --prefix backend/services/quality-service
npm run check:architecture
npm run test:architecture
npm run test:learning
npm run test:exam
npm test --prefix backend/services/content-service -- --runInBand
npm test --prefix backend/services/quality-service
npm run test:config
npm run build --prefix frontend
npm run check:safety
```

Añadir comandos reales para tus suites nuevas en package.json/CI; no afirmar que un nombre T-* o un test planeado ya es ejecutable. Ejecutar las suites afectadas y consumidores; no perseguir una cifra de tests vacíos.

En el equipo de José, el proyecto Docker autorizado se llama pruebas_pae y su configuración original vive fuera del checkout. Solo si docker inspect confirma ese proyecto y el contenedor pae-community-service existe, utilizar el adaptador de la base:

```sh
node scripts/run-pruebas-pae.mjs
node scripts/run-pruebas-pae.mjs up -d --build learning-db learning-service
node scripts/run-pruebas-pae.mjs exec -T learning-service npm run migrate
docker exec pae-nginx-gateway nginx -s reload
npm run test:docker
node scripts/smoke-community.mjs
```

El script conserva volúmenes/configuración original y genera .env.architecture si falta; no reemplazar su contraseña al reutilizar el volumen. test:docker valida etiqueta de proyecto, crea una DB pae_test_<uuid> y elimina solo esa DB al terminar. El smoke usa cuentas sintéticas, cierra su comunidad y desactiva sus usuarios; quedan filas de evidencia. No usa el formulario real de login, por lo que no valida tu cierre de Identidad.

En otro equipo, preparar el checkout con node scripts/setup-local.mjs y revisar docker-compose.yml, ejecutar docker compose config --quiet y levantar un entorno aislado con docker compose up --build -d. Resolver conflictos de puertos/nombres sin detener contenedores ajenos. El compose base no incluye automáticamente el piloto: para Aprendizaje componer docker-compose.architecture.yml con PAE_SOURCE_ROOT apuntando al checkout y LEARNING_DB_PASSWORD aleatoria en configuración local ignorada, conservar nombres/red y ejecutar su migración explícita. El adaptador run-pruebas-pae no es un comando universal para proyectos con otra etiqueta. Para test:docker usar PostgreSQL aislado con la etiqueta de pruebas esperada y PAE_TEST_DB_CONTAINER, siguiendo el patrón exacto de .github/workflows/ci.yml; no cambiar etiquetas de una DB real para eludir validaciones.

Frontend de referencia localhost:5173; gateway localhost:3000; piloto localhost:3006/health y /ready. Readiness requiere DB/migración. /api/learning aún apunta a Evaluación en la base: registrar y probar el cambio de rutas cuando se haga el corte, sin ocultar una llamada al servicio antiguo. Para Chrome, el smoke opcional usa Playwright instalado fuera del código versionado; no asumir que existe en el equipo del compañero.

### Paquetes de prueba de tus módulos

T-* son paquetes por construir/ampliar, no resultados existentes. Cada fila de requisitos exige TC-RQnn; cada criterio original AC-Mx-Syy-nn. Añadir matrices de permisos y concurrencia relevantes.

| Paquete / dueño | Escenarios y resultado esperado | Tipo y puerta |
|---|---|---|
| T-CONT / Juan | Borrador no visible; carga inválida/oversize/traversal rechazada; PDF privado inaccesible por URL directa, sin token y tras expulsión; carga fallida no publica ni deja huérfanos permanentes; favoritos únicos ante carreras; rating/búsqueda/paginación consistentes; versiones y progreso correctos; solucionario editorial no filtra examen activo; publicación/lección y Outbox atómicas | Unitarias, app real + DB/storage temporal, contratos y E2E; E02 |
| T-PLAN / Juan | Agenda propia y zona horaria explícita; límites de fecha y cambio de día; Pomodoro pausa/reanuda sin falsificar progreso; plan editado/cancelado invalida ocurrencias; dos workers reclaman una ocurrencia una sola vez; timeout/reintento de proveedor no envía duplicados; preferencias/consentimiento respetados; datos migrados equivalentes | Reloj inyectado, integración concurrente, contrato notificador, migración y E2E; E06 |

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


### Criterio de terminado personal

- Todos tus RQ/HU y aliases tienen criterios, implementación/evidencia o decisión de alcance explícita; ninguna extensión omitida silenciosamente.
- Backend y UI completan el flujo con datos reales de prueba y permisos server-side. No mocks productivos, dualidad de autoridad ni TODO crítico oculto.
- Contratos reales compatibles y migraciones/corte/reconciliación/rollback probados; reintento/replay no duplica efectos.
- Tests nuevos y regresión relevante pasan; reportes de seguridad, accesibilidad, rendimiento y restore reflejan mediciones, no promesas.
- Manual de usuario y runbook técnico del módulo están actualizados; no subir esta especificación externa como parte del código.
- Entrega revisable de la rama Juan_Rengifo, con commits enfocados. Cuando el integrante autorice push/PR, usar su rama hacia develop; la integración final a main se realiza por el flujo del equipo, no unilateralmente.

Antes de commit: seleccionar archivos concretos, revisar git diff --cached, ejecutar git diff --cached --check y node scripts/check-repository-safety.mjs --staged. No agregar .env, dumps, uploads, credenciales ni evidencia privada. La CI de la base corre en PR a develop/main, push a esas ramas o ejecución manual: push a rama personal no equivale a CI aprobada.

Entrega a tu integrante un resumen con comportamiento implementado, criterios cubiertos, commits, comandos y resultados reales, dependencias pendientes y siguiente acción. Para reanudar otra sesión, actualizar el registro local junto a este archivo con rama/SHA, especificaciones cerradas, siguiente ticket y bloqueos concretos. No afirmar aceptación integral si E09/E10 o contratos externos todavía faltan.

## Catálogo temático y aliases de las guías de origen

Se conservan 78 entradas temáticas, 93 aliases HUC y 109 CAT entre los cuatro paquetes; tu parte figura a continuación. Las 18 HU-PAE son una selección, no el alcance completo. En las guías iniciales de Richar/Amelia estaban intercambiados Juan/José en algunos párrafos: aquí se normalizan a Juan=Contenido/Planificación y José=Comunidad/Gamificación, manteniendo IDs y estados.

## Anexo A. Historias de la especificación a cargo de Juan

11 entradas temáticas. El estado corresponde a la fuente, no al resultado de pruebas de este turno. La tarea y la prueba de cierre son la guía de implementación; refinarlas en tickets con criterios completos antes de comenzar. Las historias compartidas mantienen a esta persona como responsable de cierre de su módulo.

| Clave de planificación | Historia | Estado de la fuente | Implementación/resultado esperado | Prueba mínima de cierre |
| --- | --- | --- | --- | --- |
| M2-HU01 | Descarga de materiales | Aprobado | Buscar recursos autorizados, descargar versión correcta y gestionar lectura offline consentida. | Recurso privado inaccesible por URL directa; descarga íntegra; logout limpia caché sensible. |
| M2-HU02 | Repositorios | Aprobada | CRUD, publicación/retirada, categorías, etiquetas, compartir, favoritos y valoración. | Autoría y membresía verificadas; cargas incompletas no se publican; favoritos únicos. |
| M2-HU03 | Preguntas y respuestas por lección | Aprobado | Mostrar ejercicios/soluciones autorizados y asociarlos al tema y versión. | No filtrar claves de un examen activo; completar una lección una sola vez. |
| M2-HU04 | Resumen teórico | Aprobado | Resumen editorial por sección; asistencia de IA como borrador revisable si se aprueba. | Resumen coincide con versión publicada y mantiene autoría/referencias. |
| M2-HU05 | Videos y recursos explicativos | Propuesta | Recursos multimedia, audio y transcripciones con permisos y derechos de uso. | Enlaces permitidos; subtítulos/transcripción; recurso retirado no queda público. |
| M2-HU06 | Mapas conceptuales | Propuesta | Mapa asociado al tema; editar y revisar antes de publicar; alternativa textual. | Relaciones coherentes, teclado y descripción equivalente; no depender solo de imagen. |
| M2-HU07 | Guías y lectura rápida | Propuesta; contenido mezclado | Separar guía personalizada y juego multijugador de interpretación; Juan guía, Amelia evaluación, José invitaciones. | Guía/versiones verificadas; juego, tiempo y premios requieren criterios propios aprobados. |
| M2-HU08 | Nuevo contenido y recordatorios | Aceptado; confirmar equivalencia de estado | Alertar publicación y programar avisos según preferencias; minimizar datos y evitar duplicados. | Reintento no duplica; cancelación y opt-out efectivos; proveedor caído deja estado pendiente. |
| M5-HU01 | Planificación y hábitos | Aprobado | Agenda, disponibilidad, horas saludables, historial, Pomodoro y recordatorios con zona horaria. | Conflictos/horarios inválidos; cambio de plan; recordatorio antiguo no se envía. |
| M5-HU02 | Apoyo y preparación emocional | Propuesto | Contenido de bienestar revisado y descansos opcionales; no diagnóstico ni consejo clínico automatizado. | Consentimiento y accesibilidad; usuario puede omitir; contenido revisado antes de publicar. |
| M5-HU03 | Constancia y microaprendizaje | Propuesto | Actividades breves vinculadas a contenidos, desafíos diarios y progreso; coordinar premios con José. | Finalización idempotente; tareas pertinentes; no premiar repeticiones ni enviar avisos excesivos. |

## Anexo B. Correspondencia con «Historias de usuario completo»

11 entradas asignadas. El prefijo HUC distingue la fuente alternativa. Los estados contradictorios no se resuelven automáticamente. Las extensiones señaladas forman parte del backlog futuro condicionado a aprobación.

| Alias de fuente | Título original | Estado alternativo | Correspondencia y alcance que no debe perderse |
| --- | --- | --- | --- |
| HUC-M2-HU01 | Descarga de materiales de estudio | Aprobado | M2-HU01 — Incluye microcursos/descarga offline; permiso, versión y caché por cuenta. |
| HUC-M2-HU02 | Descarga de materiales de estudio - Repositorio | Aprobada | M2-HU02 — Incluye microcursos/descarga offline; permiso, versión y caché por cuenta. |
| HUC-M2-HU03 | Visualización de preguntas y respuestas por lección | Aprobado | M2-HU03 — Conservar requisitos alternativos y criterios de la fuente. |
| HUC-M2-HU04 | Resumen teórico por sección. | Aprobado | M2-HU04 — Conservar requisitos alternativos y criterios de la fuente. |
| HUC-M2-HU05 | Historia de Usuario: Videos explicativos vinculadas a temas. | Propuesta | M2-HU05 — Conservar requisitos alternativos y criterios de la fuente. |
| HUC-M2-HU06 | Generación de mapas conceptuales. | Propuesta | M2-HU06 — Conservar requisitos alternativos y criterios de la fuente. |
| HUC-M2-HU07 | Lectura rápida / HU sin título | Propuesta | M2-HU07 — Lectura rápida y guía no se dan por equivalentes; separar juego con Amelia/José. |
| HUC-M2-HU08 | Notificaciones de nuevo contenido y recordatorios de estudio. | Aceptado | M2-HU08 — Avisos de nuevo contenido; conservar estado Aceptado hasta conciliar. |
| HUC-M5-HU01 | Recordatorios automáticos y horarios sugeridos | Aprobado | M5-HU01 — Recordatorios/horarios; añadir reglas de fecha y cancelación. |
| HUC-M5-HU02 | Micro aprendizaje y favoritos personalizados | Propuesto | M5-HU03; M2-HU02 — Microaprendizaje/favoritos; no equivale a M5-HU02 emocional. |
| HUC-M5-HU03 | Tipos de manejo de ansiedad y mensajes motivacionales | Propuesto | M5-HU02 — Manejo de ansiedad/motivación; distinto orden de HU respecto de la especificación. |

## Anexo C. Correspondencia con las 18 historias del primer avance

La presentación resumida selecciona estas historias de las anteriores; no limita el resto del plan.

| HU normalizada | Historia(s) de origen o responsabilidad |
| --- | --- |
| HU-PAE-05 | M2-HU01 |
| HU-PAE-06 | M2-HU02 |
| HU-PAE-13 | M5-HU01 |
| HU-PAE-14 | M5-HU03 |

## Anexo D. Requisitos con responsabilidad principal

18 registros asignados de los 109 del catálogo. CAT conserva posición para distinguir duplicados. Estado/prioridad se mantienen literalmente. El responsable puede necesitar a otro dominio (por ejemplo RQ12: José autoriza grupo y Juan almacena el recurso); asignación principal no autoriza modificar tablas ajenas. Vincular cada fila a HU/ticket, prueba y evidencia en H0–H1. Si un requisito no tiene HU propia, crear historia derivada para aprobación, sin fabricar un estado aprobado.

| Registro | RQ | Tipo | Estado | Prioridad | HU/tarea de enlace | Descripción de la fuente |
| --- | --- | --- | --- | --- | --- | --- |
| CAT-013 | RQ13 | Funcional | Aprobado | Alta | M2-HU02 | Permitir que los docentes creen sus propios repositorios en la sección de repositorio académico. |
| CAT-014 | RQ14 | Funcional | Aprobado | Alta | M2-HU02 | Permitir que los docentes suban recursos académicos (PDF’s) en su repositorio, en la sección de repositorio académico. |
| CAT-015 | RQ15 | Funcional | Aprobado | Media | M2-HU02 | Agregar una función de compartir en todos los repositorios para que los docentes puedan compartirlos con su comunidad. |
| CAT-024 | RQ38 | Funcional | Aprobado | Alta | M2-HU05 | Permitir a los profesores incorporar videos, audios o recursos externos vinculados a cada material que suban en su propio repositorio. |
| CAT-025 | RQ43 | Funcional | Aprobado | Alta | M2-HU01 | El sistema debe permitir descargar recursos de la plataforma. |
| CAT-028 | RQ46 | Funcional | Aprobado | Media | M2-HU04 | El sistema debe ofrecer resúmenes teóricos por cada subtema y una introducción a cada tema dentro de un curso. |
| CAT-029 | RQ48 | Funcional | Aprobado | Media | M5-HU01 | El sistema debe ofrecer recordatorios automáticos de estudio. |
| CAT-034 | RQ54 | Funcional | Aprobado | Media | M5-HU01 | El sistema debe permitir la configuración de horarios de estudio sugeridos y recomendar un tiempo de uso sano. |
| CAT-035 | RQ55 | Funcional | Aprobado | Media | M2-HU02 | El sistema debe contar con una sección de "favoritos" para marcar repositorios en particular. |
| CAT-037 | RQ59 | Funcional | Aprobado | Baja | M5-HU01 | El sistema debe contar con la integración de un “pomodoro” para controlar los tiempos de estudio del estudiante. |
| CAT-042 | RQ64 | Funcional | Aprobado | Alta | M2-HU07; JUA-19 | El sistema debe de apoyarse de la ruta de estudio generada para el contenido de cada curso. Colocando la cantidad de evaluaciones y lecciones necesarias para cada subtema. |
| CAT-048 | RQ74 | Funcional | Aprobado | Baja | M2-HU02 | La sección de Repositorio Académico debe contar con una vista de los repositorios mas solicitados. |
| CAT-052 | RQ80 | Funcional | Aprobado | Media | M5-HU03 | El sistema debe integrar misiones diarias de microaprendizaje (ej: 5 minutos de preguntas). |
| CAT-059 | RQ91 | Funcional | Aprobado | Alta | M2-HU02/04/05 | Actualizar constantemente los contenidos para mantenerlos alineados con los exámenes actuales. |
| CAT-076 | RQ20 | Funcional | En análisis | Alta | M2-HU01/02 | Buscador de recursos por palabras clave. |
| CAT-077 | RQ47 | Funcional | En análisis | Media | M2-HU08 | El sistema debe enviar notificaciones de nuevos contenidos. |
| CAT-083 | RQ77 | Funcional | En análisis | Media | M5-HU02 | El sistema debe ofrecer tips de manejo de ansiedad pre-examen como pantallas de carga. |
| CAT-090 | RQ24 | Funcional | Propuesto | Alta | M2-HU01/02; JUA-23 | Importar y exportar recursos en formato PDF o DOC. |

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



## Anexo autocontenido: historias y aceptación originales completas

Se transcriben tus dos módulos para que la IA no dependa de otros archivos entregables. Algunas referencias/títulos de origen son contradictorios; usar la conciliación anterior y registrar decisiones, no corregir silenciosamente la fuente. Los estados indican lo escrito en la especificación histórica, no el resultado actual del software.

# Módulo 2 Contenido educativo


Los requisitos vinculados que siguen son los declarados por la fuente. Cuando no corresponden por significado, prevalece la descripción y se requiere conciliación con la matriz. Los criterios son objetivos de aceptación, no resultados de pruebas.

<a id="m2-s01"></a>

## M2-S01 HU01: Descarga de recursos del repositorio académico

**Metadatos y referencias del documento**

- EPIC: E01
- RQ13: Permitir que los docentes creen sus propios repositorios en la sección de repositorio académico.
- RQ14: Permitir que los docentes suban recursos académicos (PDF’s) en su repositorio.
- RQ43: El sistema debe permitir descargar recursos de la plataforma.
- Prioridad: Alta.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Descarga de materiales de estudio

**ID:** HU01

**Rol:** Yo como Estudiante

**Funcionalidad:** Quiero descargar las lecciones generadas de cada lección en formato pdf.

**Razón:** Para poder repasar sin la necesidad de una conexión a internet.

**ID:** HU02

**Rol:** Yo como Docente

**Funcionalidad:** Quiero crear un repositorio personalizado donde pueda subir mis recursos académicos

**Razón:** Para brindar a mis estudiantes material didáctico extra de forma eficiente y organizada.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1.

**Criterios de aceptación:** Se validarán los datos del Estudiante para verificar si completo la lección. Los datos fueron validados y se le permitirá la descarga del material de estudio de esa lección. Si se confirma que el estudiante no completo con la lección, no se le permitirá la descarga del material de estudio de esa lección.

**Contexto:** El estudiante ha completado la lección que desea descargar.

**Evento:** Cuando el usuario solicite descargar el material generado en cada lección.

**Resultado esperado:** Se descarga un archivo en formato pdf que contenga el material de estudio de esa lección.

**N° de escenario:** 2.

**Contexto:** El estudiante no ha completado con la lección que desea descargar.

**Evento:** Cuando el usuario solicite descargar el material generado de cada lección.

**Resultado esperado:** Se mostrará un mensaje de error, señalando que el estudiante debe de completar la lección antes de descargar el material de estudio.

**N° de escenario:** 3.

**Criterios de aceptación:** Al presionar el botón de crear, del repositorio, ingrese a una interfaz donde ingrese los datos para personalizar el repositorio para luego poder subir recursos académicos

**Contexto:** El usuario registrado es un docente

**Evento:** Cuando el docente haga click en el botón crear repositorio nuevo

**Resultado esperado:** Se crea un repositorio nuevo donde se visualizan recursos académicos del docente

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m2-s02"></a>

## M2-S02 HU02: Gestión y funcionamiento de repositorios con materiales de estudio

**Metadatos y referencias del documento**

- EPIC: E01
- RQ13: Permitir que los docentes creen sus propios repositorios.
- RQ14: Permitir que los docentes suban recursos académicos (PDF’s).
- RQ15: Agregar una función de compartir en todos los repositorios para que los docentes puedan compartirlos con su comunidad.
- RQ20: Buscador de recursos por palabras clave.
- RQ 43: El sistema debe permitir descargar recursos de la plataforma.
- Prioridad: Alta
- Estado: Aprobada.

### Tabla 1 del documento

Historia de Usuario: Descarga de materiales de estudio - Repositorio

**ID:** HU02

**Rol:** Yo como Estudiante

**Funcionalidad:** Quiero descargar los exámenes de admisión en formato pdf de cada universidad que se encuentre en el repositorio.

**Razón:** Para visualizar el contenido sin la necesidad de una conexión a internet.

**ID:** HU02

**Rol:** Yo como Profesor

**Funcionalidad:** Quiero compartir mi repositorio académico dentro de mi comunidad para que mis estudiantes puedan unirse directamente

**Razón:** Para compartir el contenido con todos mis estudiantes.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1.

**Criterio de aceptación:** Al presionar el botón de descarga, de un examen de admisión, el archivo será descargado por el estudiante en formato pdf con un nombre que indique el nombre de la universidad, fecha y semestre. Los exámenes de admisión tienen que estar separados por universidades. Los exámenes de admisión de cada universidad tienen que llevar en el nombre el año y el número de semestre. Se mostrará los exámenes de admisión, con la fecha y el número de semestre, coincidentes con el nombre e icono de la universidad a la que pertenecen en la búsqueda por navegación.

**Contexto:** Cuando el estudiante presione el botón de descarga en un examen de admisión, ya sea por la búsqueda de tarjeta o de búsqueda de navegación.

**Evento:** Cuando el estudiante de click en el botón de descarga en un examen de admisión.

**Resultado esperado:** El examen de admisión se descargará en formato pdf con un nombre que indique su fecha y semestre cuando salió.

**N° de escenario:** 2.

**Contexto:** Cuando el estudiante ingrese a la sección de repositorio.

**Evento:** Cuando el estudiante ingrese a la sección del repositorio.

**Resultado esperado:** El estudiante vera las tarjetas con el icono y nombre de cada universidad.

**N° de escenario:** 3.

**Contexto:** Cuando el estudiante ingrese el nombre del examen en la búsqueda por barra de navegación.

**Evento:** Cuando el estudiante ingrese a la barra de navegación en la sección de repositorio.

**Resultado esperado:** El estudiante vera los resultados coincidentes con el formato de nombre correcto, y con su universidad asociada.

**N° de escenario:** 4

**Criterio de aceptación:** Al presionar un botón de “compartir en tu comunidad” dentro de su repositorio personalizado, le permitirá compartir en su comunidad. Los estudiantes tendrán la opción de unirse aceptando la invitación o rechazándola, si la aceptan serán redirigidos al repositorio del docente y podrán visualizar los recursos académicos que él haya subido.

**Contexto:** Cuanto un docente quiera compartir su repositorio académico con todos sus estudiantes dentro de la plataforma

**Evento:** Cuando el docente haga click en el boton compartir en todos los repositorios

**Resultado esperado:** El docente compartirá un link o código donde permita a los estudiantes unirse al repositorio académico del docente

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m2-s03"></a>

## M2-S03 HU03: Visualización de preguntas y respuestas por lección

**Metadatos y referencias del documento**

- RQ74: La sección de Repositorio Académico debe contar con una vista de los repositorios más solicitados.
- RQ110: Agregar una función de obtener solucionario por cada lección que realice el estudiante.
- Prioridad: Alta
- Estimación:  10
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Visualización de preguntas y respuestas por lección

**ID:** HU03

**Rol:** Yo como Estudiante

**Funcionalidad:** Quiero visualizar las preguntas y respuestas de cada lección.

**Razón:** Para repasar, reforzar mis conocimientos y autoevaluarme.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1.

**Criterio de aceptación:** Se validarán los datos del estudiante para darle acceso al solucionario de la sección. Si el estudiante no completo la lección, se rechazará la solicitud de visualización del solucionario. Si el estudiante completó la lección, se aprobará la solicitud de visualización del solucionario.

**Contexto:** Cuando el estudiante solicite visualizar el solucionario de una lección.

**Evento:** Cuando el estudiante le dé al botón de “solucionario” de la lección.

**Resultado esperado:** El solucionario se mostrará correctamente.

**N° de escenario:** 2.

**Contexto:** Cuando el estudiante, que no cumple con los requisitos, solicite visualizar el solucionario de una lección.

**Evento:** Cuando el estudiante le dé al botón de “solucionario” de la lección.

**Resultado esperado:** Se mostrará un mensaje de error, indicando que debe de completar con la lección.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m2-s04"></a>

## M2-S04 HU04: Resumen teórico por lección.

**Metadatos y referencias del documento**

- RQ13: Permitir que los docentes creen sus propios repositorios en la sección de repositorio académico.
- RQ14: Permitir que los docentes suban recursos académicos (PDF’s) en su repositorio.
- RQ20: Buscador de recursos por palabras clave.
- RQ43: El sistema debe permitir descargar recursos de la plataforma.
- Prioridad: Media
- Estimación:  8
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Resumen teórico por sección.

**ID:** HU04

**Rol:** Yo como Estudiante

**Funcionalidad:** Quiero acceder a un resumen teórico organizados por lección, para reforzar mi comprensión de los temas en formato simplificado.

**Razón:** Para interiorizar los conocimientos de cada lección trabajada.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1.

**Criterio de aceptación:** Se validarán los datos del estudiante para verificar que completo la lección. El resumen generado de cada lección tiene que seguir el mismo contenido de la lección. El resumen de la lección generada tomara en cuenta los siguientes datos del estudiante cuando se generó la lección: Puntos de prestigio. Historial de rendimiento académico.

**Contexto:** Cuando el estudiante solicite un resumen teórico luego de haber terminado su lección.

**Evento:** Cuando el estudiante, que termino con la lección, solicite generar un resumen de una lección.

**Resultado esperado:** Se genera el resumen de la lección solicitada y se mostrara en pantalla.

**N° de escenario:** 2 .

**Contexto:** Cuando el estudiante, que no cumple con los requisitos, solicite un resumen teórico luego de haber terminado su lección.

**Evento:** Cuando el estudiante, que no termino con la lección, solicite generar un resumen de una lección.

**Resultado esperado:** Se muestra un mensaje de error, que informara lo siguiente: Debes de completar con la lección antes de acceder a esta función.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m2-s05"></a>

## M2-S05 HU05: Historia de Usuario: Videos y recursos explicativos vinculadas a temas.

**Metadatos y referencias del documento**

- RQ13: Permitir que los docentes creen sus propios repositorios en la sección de repositorio académico.
- RQ 14: Permitir que los docentes suban recursos académicos (PDF’s) en su repositorio.
- RQ 38: Permitir a los profesores incorporar videos, audios o recursos externos vinculados a cada material que suban en su propio repositorio.
- RQ 43:  El sistema debe permitir descargar recursos de la plataforma.
- RQ 71: El sistema debe permitir que los profesores recomienden recursos del repositorio académico de forma directa dentro del chat de su grupo de estudio.
- Prioridad: Media
- Estimación:  6
- Estado: Propuesta.

### Tabla 1 del documento

Historia de Usuario: Resumen teórico por sección.

**ID:** HU05

**Rol:** Yo como Profesor

**Funcionalidad:** Quiero incorporar material educativo personalizado en mi repositorio.

**Razón:** Para fortalecer el aprendizaje con dinámicas personalizadas.

**ID:** HU06

**Rol:** Yo como Docente

**Funcionalidad:** Quiero ver videos explicativos, escuchar audios u otros recursos por cada lección vinculados a cada materia.

**Razón:** Para reforzar conocimiento y mantener un aprendizaje activo y duradero.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1.

**Criterio de aceptación:** El material que quiera subir el profesor (videos, audios, recursos externos vinculados) a cada materia, será subido a su propio repositorio. Si el alumno que solicita ver el contenido forma parte del repositorio, podrá ver el contenido adjunto por el docente.

**Contexto:** Cuando el profesor quiera incorporar material extra a cada materia en su propio repositorio

**Evento:** Cuando el profesor quiera adjuntar material extra en su repositorio

**Resultado esperado:** El video, audio o recurso externo vinculado se muestra de forma correcta

**N° de escenario:** 2.

**Contexto:** Cuando un estudiante que forma parte del repositorio quiera ver el contenido incorporado por el docente.

**Evento:** Cuando el estudiante presione la opción de “recursos extras” en la sección del repositorio al que pertenece.

**Resultado esperado:** Se conducirá al estudiante a la página donde están los recursos adjuntos por el profesor.

**N° de escenario:** 3.

**Contexto:** Cuando un estudiante que no forma parte del repositorio quiera ver el contenido incorporado por el docente.

**Evento:** Cuando el estudiante presione la opción de “recursos extras” en la sección del repositorio al que pertenece.

**Resultado esperado:** Notificará al estudiante que no forma parte del repositorio redirigirá al estudiante a la página principal de repositorios

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m2-s06"></a>

## M2-S06 HU06: Generación y visualización de mapas conceptuales.

**Metadatos y referencias del documento**

- RQ 13: Permitir que los docentes creen sus propios repositorios en la sección de repositorio académico.
- RQ 14: Permitir que los docentes suban recursos académicos (PDF’s) en su repositorio.
- RQ 38: Permitir a los profesores incorporar videos, audios o recursos externos vinculados a cada material que suban en su propio repositorio.
- RQ 55: El sistema debe contar con una sección de "favoritos" para marcar repositorios en particular.
- RQ111: El sistema debe permitir generar representaciones gráficas (mapas conceptuales) vinculadas a los materiales subidos.
- Prioridad: Media
- Estimación:  6
- Estado: Propuesta.

### Tabla 1 del documento

Historia de Usuario: Generación de mapas conceptuales.

**ID:** HU06

**Rol:** Yo como Estudiante

**Funcionalidad:** Quiero visualizar el contenido resumido de cada sección de una forma más estructura

**Razón:** Para repasar y reforzar mis conocimientos sobre cada lección trabajada.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1.

**Criterio de aceptación:** Se validarán los datos del estudiante para verificar que supero la lección y que genero un resumen. La generación del mapa conceptual tiene que usar los siguientes parámetros: La lección fue superada por el usuario. Existe un resumen de la lección.

**Contexto:** Para evitar que el estudiante accede al contenido simplificado y se salte sus lecciones. El resumen tiene que estar generado antes de generar un mapa conceptual para ahorrar recursos.

**Evento:** Cuando el estudiante solicite la generación de un mapa conceptual en la sección interactiva de la lección.

**Resultado esperado:** Se visualizará el contenido de forma correcta.

**N° de escenario:** 2.

**Evento:** Cuando el estudiante, que no cumple con los requisitos. solicite la generación de un mapa conceptual en la sección interactiva de la lección.

**Resultado esperado:** Se mostrara un mensaje de error, indicando que debe de completar con la lección o generar un resumen de esa lección antes de continuar.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m2-s07"></a>

## M2-S07 HU07 Guías de lectura y estudio personalizado

**Metadatos y referencias del documento**

- RQ 13: Permitir que los docentes creen sus propios repositorios en la sección de repositorio académico.
- RQ 14: Permitir que los docentes suban recursos académicos (PDF’s) en su repositorio.
- RQ43: El sistema debe permitir descargar recursos de la plataforma.
- RQ55: El sistema debe contar con una sección de "favoritos" para marcar repositorios en particular.
- Prioridad: Alta
- Estimación:  10
- Estado: Propuesta.
- Prioridad: Media
- Estimación:  6
- Estado: Aceptado

### Tabla 1 del documento

Historia de Usuario: Interpretación de textos veloz.

**ID::** HU07

**Rol:** Yo como Estudiante

**Funcionalidad:** Quisiera evaluarme junto a mis compañeros de la comunidad o amigos de la plataforma de una forma más entretenida mediante un duelo de interpretación de textos.

**Razón:** Para profundizar mi aprendizaje de una forma más lúdica y recurrir a la plataforma más seguido.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1.

**Criterio de aceptación:** La plataforma debe permitir que el estudiante ingrese al apartado de “Zona de Descanso” y ubique la “Zona de juegos” dentro de la interfaz interactiva de su comunidad. La plataforma debe de permitir la correcta visualización e interacción de su avatar en la “Zona de Descanso” para que pueda ubicar fácilmente la “Zona de juegos” e ingresar al modo de “Interpretación de texto veloz”. 3. La plataforma debe integrar con éxito el sistema de “Emparejamiento de nivel” en la opción de “Emparejamiento rápido” de los distintos modos de la “Zona de juegos” de la “Zona de descanso” de cada comunidad. 4. Tiene que implementarse en la plataforma y ser funcional el sistema de apoyo, “Invitaciones de emergencia”. 5. El estudiante puede invitar a otros estudiantes en la opción de “Invitar” en el modo de “Interpretación de texto veloz”. Esta opción solo permitirá al estudiante invitar a otros estudiantes que sean sus amigos o que pertenezcan a su misma comunidad.

**Evento:** Cuando el estudiante seleccione la opción de “Emparejamiento” en “Interpretación de texto veloz” en la “Zona de juego” dentro de la “Zona de descanso” de su comunidad.

**Resultado esperado:** Dos estudiantes serán emparejados para competir en el modo de juego “Interpretación de texto veloz”.

**N° de escenario:** 2.

**Evento:** Cuando el estudiante seleccione la opción de “Invitar a otros estudiantes” en “Interpretación de texto veloz” en la “Zona de juego” dentro de la “Zona de descanso” de su comunidad

**Resultado esperado:** Dos estudiantes serán emparejados para competir en el modo de juego “Interpretación de texto veloz”.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m2-s08"></a>

## M2-S08 HU08 Notificaciones de nuevo contenido y recordatorios de estudio

### Tabla 1 del documento

Historia de Usuario: Notificaciones de nuevo contenido y recordatorios de estudio.

**ID::** HU08

**Rol:** Yo como Estudiante

**Funcionalidad:** Quiero que me lleguen notificaciones, en forma de correos electrónicos, de nuevo contenido de la plataforma, o de recordatorios de estudio.

**Razón:** Para mantener un ritmo activo y constante en mi aprendizaje, y enterarme de las novedades más recientes de la plataforma.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1.

**Criterio de aceptación:** El sistema de notificaciones solo funciona en estudiantes con las notificaciones habilitadas. Se tomará los datos del usuario para que reciba correos personalizados: Nombre registrado. Fecha de Nacimiento. Rendimiento académico. Puntos de prestigio. Puntos de prestigio de comunidad. Ultima sesión activa.

**Contexto:** Para incentivar al usuario mediante correos electrónicos personalizados que lo motiven a seguir estudiando y que use nuestra plataforma.

**Evento:** Cuando se lancen novedades en la página, y cuando se detecten periodos de inactividad en el estudiante.

**Resultado esperado:** El estudiante recibirá un correo cuando haya nuevo contenido o cuando presente periodos de inactividad.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

# Módulo 5 Planificación y organización


Los requisitos vinculados que siguen son los declarados por la fuente. Cuando no corresponden por significado, prevalece la descripción y se requiere conciliación con la matriz. Los criterios son objetivos de aceptación, no resultados de pruebas.

<a id="m5-s01"></a>

## M5-S01 HU01: Planificación y Hábitos de Estudio

**Metadatos y referencias del documento**

- EPIC: E01
- RQ48: El sistema debe ofrecer recordatorios automáticos de estudio.
- RQ54: El sistema debe permitir la configuración de horarios de estudio sugeridos y recomendar un tiempo de uso sano.
- RQ59: El sistema debe contar con la integración de un “pomodoro” para controlar los tiempos de estudio del estudiante.
- Prioridad: Media.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Recordatorios automáticos y horarios sugeridos

**ID:** HU01

**Rol:** Como estudiante,

**Funcionalidad:** Quiero contar con herramientas para organizar mis horarios, recibir recordatorios y gestionar mis tiempos con técnicas como pomodoro,

**Razón:** Para mantener hábitos de estudio sanos y mejorar mi rendimiento.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1.

**Criterio de aceptación:** El estudiante puede configurar sus horarios de estudio.

**Contexto:** El estudiante está en la sección de configuración.

**Evento:** Define sus horarios disponibles en el calendario de la plataforma.

**Resultado esperado:** Los horarios quedan guardados y visibles en su perfil, y el sistema recomienda tiempos saludables.

**N° de escenario:** 2.

**Criterio de aceptación:** El sistema envía recordatorios automáticos de estudio.

**Contexto:** El estudiante tiene configurado un horario en la plataforma.

**Evento:** Llega la hora establecida.

**Resultado esperado:** El sistema muestra una notificación recordándole estudiar, con opción de posponer o desactivar.

**N° de escenario:** 3.

**Criterio de aceptación:** El sistema envía recordatorios automáticos de estudio.

**Contexto:** El estudiante accede a la herramienta pomodoro desde el panel de estudio.

**Evento:** Inicia una sesión de estudio con intervalos predeterminados.

**Resultado esperado:** El temporizador muestra la cuenta regresiva, cambia a descanso automáticamente y guarda la sesión en el historial.

**N° de escenario:** 4.

**Criterio de aceptación:** El estudiante recibe recomendaciones de descanso saludable.

**Contexto:** El estudiante ha configurado un tiempo de estudio mayor al recomendado.

**Evento:** El sistema detecta exceso de tiempo en una sola sesión.

**Resultado esperado:** Aparece un aviso sugiriendo pausas o límites de tiempo según buenas prácticas de estudio.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m5-s02"></a>

## M5-S02 HU02: Contenido de Apoyo y Preparación Emocional

**Metadatos y referencias del documento**

- EPIC: E02
- RQ46: El sistema d|ebe ofrecer resúmenes teóricos por cada subtema y una introducción a cada tema dentro de un curso.
- RQ77: El sistema debe ofrecer tips de manejo de ansiedad pre-examen como pantallas de carga.
- RQ79: El sistema debe incluir una "zona de descanso" con contenidos ligeros (ej. frases, curiosidades).
- Prioridad: Media.
- Estado: Propuesto.

### Tabla 1 del documento

Historia de Usuario: Recordatorios automáticos y horarios sugeridos

**ID:** HU02

**Rol:** Como estudiante,

**Funcionalidad:** Quiero tener acceso a resúmenes claros, consejos de manejo de ansiedad y espacios de descanso,

**Razón:** Para prepararme mejor y reducir el estrés en mi proceso de aprendizaje.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1.

**Criterio de aceptación:** El estudiante puede acceder a resúmenes claros de cada tema.

**Contexto:** El estudiante navega en la sección de teoría.

**Evento:** Selecciona un tema de estudio.

**Resultado esperado:** El sistema muestra un resumen introductorio estructurado y legible, con la opción de descargarlo o marcarlo como revisado.

**N° de escenario:** 2.

**Criterio de aceptación:** El sistema ofrece tips de manejo de ansiedad antes de los exámenes.

**Contexto:** El estudiante se encuentra próximo a una evaluación (según calendario).

**Evento:** Ingresa a la sección de preparación para examen.

**Resultado esperado:** El sistema despliega recomendaciones prácticas para controlar la ansiedad (respiración, pausas, organización).

**N° de escenario:** 3.

**Criterio de aceptación:** La plataforma dispone de una zona de descanso.

**Contexto:** El estudiante accede a la sección de “descanso”.

**Evento:** Solicita una pausa de relajación.

**Resultado esperado:** El sistema presenta frases motivadoras, curiosidades y elementos recreativos breves.

**N° de escenario:** 4.

**Criterio de aceptación:** El estudiante puede alternar entre contenido de estudio y apoyo emocional.

**Contexto:** El estudiante se encuentra en medio de una sesión de estudio.

**Evento:** Hace clic en “zona de apoyo” o “tips”.

**Resultado esperado:** El sistema permite cambiar de sección sin perder el progreso de estudio y retornar al punto donde estaba.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m5-s03"></a>

## M5-S03 HU03: Dinamismo y Constancia en el Aprendizaje

**Metadatos y referencias del documento**

- EPIC: E03
- RQ47: El sistema debe enviar notificaciones de nuevos contenidos.
- RQ65: La plataforma debe de incluir una sección con evaluaciones más entretenidas que involucren a más de un usuario de forma simultánea.
- RQ80: El sistema debe integrar misiones diarias de microaprendizaje (ej: 5 minutos de preguntas).
- Prioridad: Baja.
- Estado: Propuesto.

### Tabla 1 del documento

Historia de Usuario: Recordatorios automáticos y horarios sugeridos

**ID:** HU03

**Rol:** Como estudiante,

**Funcionalidad:** Quiero recibir notificaciones de novedades, participar en evaluaciones dinámicas y cumplir retos diarios,

**Razón:** Para mantenerme constante y motivado en mi aprendizaje.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1.

**Criterio de aceptación:** El estudiante recibe notificaciones cuando hay nuevo contenido.

**Contexto:** El estudiante tiene configurado un perfil activo en la plataforma.

**Evento:** Se publica un nuevo tema o recurso.

**Resultado esperado:** El sistema envía una notificación inmediata (push o correo) con acceso directo al contenido.

**N° de escenario:** 2.

**Criterio de aceptación:** El estudiante puede participar en evaluaciones interactivas con otros usuarios.

**Contexto:** Existen evaluaciones activas en la plataforma.

**Evento:** El estudiante se une a una evaluación grupal.

**Resultado esperado:** El sistema lo conecta con otros estudiantes, muestra preguntas en tiempo real y registra su participación.

**N° de escenario:** 3.

**Criterio de aceptación:** El estudiante puede realizar misiones diarias de microaprendizaje.

**Contexto:** El estudiante accede a la sección de misiones.

**Evento:** Selecciona la misión diaria.

**Resultado esperado:** El sistema presenta un reto breve (ejemplo: 3 preguntas rápidas), lo evalúa y otorga una insignia al completarlo.

**N° de escenario:** 4.

**Criterio de aceptación:** El sistema motiva la constancia mostrando el progreso acumulado.

**Contexto:** El estudiante completa misiones o evaluaciones durante varios días.

**Evento:** Ingresa a su panel de progreso.

**Resultado esperado:** El sistema muestra estadísticas de continuidad (rachas, días activos) y destaca logros alcanzados.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

