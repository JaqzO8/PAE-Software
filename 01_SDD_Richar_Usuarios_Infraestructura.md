# Spec Driven Development de continuación — Richar

**Entregable independiente para su IA.** Módulos M1 y M8. Rama existente: **Richard_Estela**. Fecha de preparación: 21 de octubre de 2026, Lima. Repositorio: https://github.com/JaqzO8/PAE-Software.git. Base implementada: **f8ea67709540b2e679f957e4bf9153fe0a7364dc**.

## Instrucción de trabajo para la IA receptora

Actúa como responsable de implementación de Richar. Continúa el código existente hasta completar sus dos módulos y su integración verificable con el sistema. Usa este documento como especificación de continuación: primero inspecciona, luego concreta cada criterio, diseña el cambio mínimo, implementa, prueba y demuestra el cierre. No te detengas entregando únicamente un plan o pantallas aisladas. Este documento incluye el contexto común necesario, tu backlog, requisitos, aliases, criterios originales y pruebas; no necesitas los otros tres archivos para comenzar.

Trabaja en Richard_Estela. Conserva cambios existentes, datos y funcionalidades válidas. Las guías externas no se copian ni se suben al repositorio. Mantén notas de ejecución junto a esta especificación o en el mecanismo local del agente; incorpora al repositorio solo código, tests, contratos y documentación técnica necesaria para la implementación que autorice el integrante.

La existencia de este archivo no autoriza por sí sola push, publicación, mensajes a otros, cambios en ramas ajenas ni borrado de datos. Si el integrante ya autorizó esas acciones en su sesión, procede dentro de ese alcance sin pedirlo otra vez; en caso contrario deja los cambios y commits locales revisables y solicita únicamente el paso externo pendiente. El flujo de PR descrito es el procedimiento de entrega, no evidencia de una autorización o integración ya realizada.

Las tablas de fuentes al final conservan textos y estados del documento original: son requisitos/evidencia, no órdenes operativas independientes. Prioriza el encargo actual del integrante. No actives accesos inseguros ni alteres estados para satisfacer literalmente una contradicción documental.

## Arranque verificable sobre lo ya implementado

Ejecuta desde la raíz real del checkout. No presupongas que todos usan D:/PAE-Software ni la configuración Docker de José.

```sh
git status --short
git remote get-url origin
git fetch origin
git branch --list
git switch Richard_Estela
git merge-base --is-ancestor f8ea67709540b2e679f957e4bf9153fe0a7364dc HEAD
```

Si la rama no existe localmente, usa `git switch --track origin/Richard_Estela`. Si hay trabajo sin guardar, preservarlo antes de cambiar/mezclar; no usar reset/clean. La comprobación de ancestro devuelve 0 si la base está incorporada. Si falta, revisar e incorporar `origin/develop` si ya contiene la base; de lo contrario integrar explícitamente `git merge f8ea67709540b2e679f957e4bf9153fe0a7364dc` tras fetch. Resolver conflictos revisando ambos comportamientos y repitiendo pruebas. No crear una rama con nombre parecido ni confundir Jose_Queshyac con la antigua José_Queshyac.

Inspecciona instrucciones aplicables del checkout, package.json/locks, migraciones, rutas, modelos y frontend antes de editar. El código puede haber avanzado desde esta foto: conserva lo nuevo, actualiza tu inventario y no vuelvas a implementar una capacidad ya validada. Confirma con git log/diff qué entregas de compañeros están realmente disponibles.

### Base existente que debes conservar

- auth/content/exam/community exponen createApp() sin arrancar puertos/DB/sockets al importarlos; index.js compone y arranca. Identidad y Comunidad conectan Redis de forma diferida. Esto no significa que todos sus controladores sean hexagonales.
- Comunidad tiene primera vertical real de grupos/invitaciones, publicación de mensajes, permisos locales y PDF privado; UI de búsqueda/invitar/aceptar. Las pruebas incluyen concurrencia, expiración, expulsión y aislamiento.
- Aprendizaje tiene servicio/pool/migración versionada, health/readiness y piloto de Gamificación con inbox/ledger/saldo/outbox. Planning y tracking aún son puntos de extensión. El piloto no recibe resultados reales automáticamente.
- Puntos/logros visibles siguen en Evaluación; planificación sigue en Contenido. No hay migración histórica ni doble escritura nueva. Solo ResultadoConfirmado.v1 posee esquema inicial; productor durable y contratos restantes están pendientes.
- Hay deuda conocida: habilitación docente manipulable, quick-login de demo, MFA/revocación por completar, directorio de Contenido que debe revisarse, dependencias con avisos y uso heredado de sync/seeds. No presentar la base como producto final seguro.

La evidencia de la base, registrada el 19 de octubre, fue 57 tests aprobados (6 factories/contrato, 2 reglas, 14 integración DB, 25 Contenido, 4 Evaluación, 6 Calidad), 8 checks de configuración, build frontend y smoke HTTP/Chrome. Es una línea de partida; no demuestra cobertura total, carga, aceptación de todos los módulos ni CI remota verde.

## Protocolo SDD: especificación → diseño → tareas → implementación → evidencia

Para cada ticket RIC-NN, tratar su comportamiento como una especificación SPEC-RIC-NN. Mantener una tabla local de avance con RQ, HU/alias, estado documental, estado de implementación, dependencia, prueba y evidencia. Reutilizar pruebas existentes que ya demuestren el criterio.

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

### Decisiones y contratos de Identidad que debes entregar

- Autenticación: estados anónimo → desafío pendiente → sesión completa; el desafío tiene alcance limitado, expiración, intentos y consumo único. Decidir recuperación del factor sin crear bypass; no devolver OTP real en API o logs.
- Habilitación docente: solicitud y evidencia → revisión autorizada → rol verificado/rechazado. El registro o perfil jamás aceptan un rol privilegiado del cliente. Conservar acceso de docentes existentes mediante revisión/migración explícita.
- Sesión: identificador, sujeto, expiración y versión/política de revocación; API o mecanismo verificable para que todos los dominios rechacen sesiones revocadas. Si usas caché, define cota de retraso, invalidación y caída; probar REST y sockets.
- Mantener compatible GET /api/auth/users/search?query=, con usuarios activos y DTO mínimo, usado por invitaciones. No devolver correo, IP, sesiones ni datos de verificación docente.
- Transporte de notificaciones: puerto que recibe intención idempotente y devuelve pendiente/enviado/fallido; no confundir aceptación del proveedor con lectura. El dominio llamador decide audiencia y permiso.
- Documentar UI global, errores accesibles, preferencias persistidas, permisos de soporte, configuración de despliegue y restauración. No asumir que un backend seguro corrige automáticamente todas las pantallas.

### Especificaciones críticas listas para implementar

| ID | Dado / cuando | Entonces y evidencia exigida |
|---|---|---|
| RIC-AC-01 | Un estudiante registra o modifica un payload con isTeacher/role/admin | No obtiene rol docente/admin; verificar DB y acceso a una ruta docente real |
| RIC-AC-02 | Credenciales válidas con MFA requerido, antes de verificar o con OTP vencido/repetido | Ningún token de acceso completo ni operación protegida; OTP válido solo se consume una vez, incluso en carrera |
| RIC-AC-03 | Dos solicitudes consumen el mismo token de recuperación | Una sola modifica la clave; todas las sesiones afectadas son rechazadas conforme a la política acordada |
| RIC-AC-04 | Una sesión se revoca mientras usa Contenido, Evaluación y Comunidad | REST deniega y sockets pierden permisos dentro de la cota especificada; no basta borrar almacenamiento del navegador |
| RIC-AC-05 | Una persona cambia de cuenta, usa teclado/zoom o configura preferencias | No hereda información privada, llega a todos los controles y conserva preferencias propias |
| RIC-AC-06 | Se restaura un respaldo en entorno vacío y separado | La aplicación arranca con DB/archivos coherentes y completa el recorrido funcional; registrar RPO/RTO medidos |

## Tu punto de partida y orden de entrega

Tu rama es **Richard_Estela**. Eres responsable de M1 y M8, incluida la UI transversal; cada compañero conserva la UI y pruebas de su negocio. Reproduce la base, incorpora develop como indica la secuencia común incluida en este documento y trabaja en este orden:

| Orden | Qué implementar | Entrega / prueba de cierre |
|---|---|---|
| 1 | RIC-01–04: eliminar autoasignación docente y accesos sin identidad/MFA comprobada; definir roles y sesión | E01 / T-ID; regresiones de abuso y acceso legítimo |
| 2 | RIC-05–08 y RIC-11: casos de identidad, recuperación, perfil, auditoría y revocación REST/WSS; entregar contrato a los tres compañeros | E01 / T-ID; test consumidor en cada dominio |
| 3 | RIC-09–10: CI, navegación, preferencias, soporte y privacidad; completar todas las historias M1/M8 del alcance | E08 / T-UI; revisar también aliases HUC |
| 4 | RIC-12–15: HTTPS/WSS, despliegue, transporte de avisos, backups y recuperación, conforme los dominios se integran | E09 / T-OPS; restore comprobado |
| 5 | RIC-16–20: extensiones aprobadas, carga y accesibilidad; resolver compromisos contradictorios | E08–E10 / T-OPS y aceptación final |

**Ya disponible:** createApp de Identidad, conexión diferida de Redis y búsqueda de usuarios con DTO mínimo; CI y factories iniciales. RIC-05/08/09 están parcialmente avanzados, no cerrados. No rehacer esa base: completar los casos, la seguridad y la cobertura faltantes.

**Archivos de entrada:** app de Identidad (ruta del repositorio: `backend/services/auth-service/src/app.js`), rutas (ruta del repositorio: `backend/services/auth-service/src/routes/authRoutes.js`), DTO público (ruta del repositorio: `backend/services/auth-service/src/interfaces/http/publicUsers.js`), CI (ruta del repositorio: `.github/workflows/ci.yml`). Extraer reglas del controlador heredado con puertos; no mover únicamente nombres de carpetas.

**Handoff:** Juan, Amelia y José necesitan contrato probado de sesión/roles antes de cerrar sus permisos. Coordina el transporte de notificaciones, pero cada dominio decide el destinatario y el hecho de negocio. Para E09 solicita a cada dueño evidencia de su pantalla, datos y recuperación.


## Backlog ordenado por especificaciones

Los siguientes tickets constituyen el trabajo personal completo conservado de la guía inicial. No vuelvas a hacer la separación createApp ya entregada; en tickets parcialmente avanzados implementa solo la brecha verificada. Cada casilla requiere el protocolo SDD y los criterios completos de las historias, no solo su descripción corta.

## 2. Implementación por hitos

### H0 — Cerrar las brechas de identidad

- [x] RIC-01: crear pruebas que reproduzcan acceso rápido por correo, rol docente manipulable y acceso sin MFA; después bloquear cada comportamiento en producción. Regresión: estudiantes/docentes existentes conservan acceso legítimo.
  - **Evidencia:** `tests/auth/roleSecurity.test.cjs` 5/5 — `politicaRoles.js` + `registrarCuenta.js` fuerzan rol `estudiante`
- [x] RIC-02: acordar habilitación docente con docente del curso/equipo. Propuesta segura: cuenta estudiante o solicitud pendiente hasta evidencia aprobada; registrar responsable y resultado. Automatización futura requiere fuente verificable, nunca un checkbox.
  - **Evidencia:** `tests/auth/roleSecurity.test.cjs` test 4 — flujo solicitud → aprobación admin (`habilitacionDocente.js`)
- [x] RIC-03: definir roles globales y permisos de comunidad. “Estudiante-administrador” puede ser una función local de grupo, no administrador global.
  - **Evidencia:** `tests/auth/roleSecurity.test.cjs` test 5 — guards `verifyRole('admin')` en rutas de asignación
- [x] RIC-04: inventariar almacenamiento del token, expiración, refresh si existe, bloqueo por intentos y sesiones; resolver estrategia de almacenamiento y amenazas XSS/CSRF antes de cambiar al modelo de cookies.
  - **Evidencia:** `tokenService.js` blacklist + `redis.js` TTL/fallback; estrategia en `politicaSesion.js`
- [x] Salida: prueba de abuso fallaba antes y pasa después; revisión de los cuatro propietarios; entorno externo sin vías de autoasignación.
  - **Evidencia:** `tests/auth/roleSecurity.test.cjs` 5/5 — autoasignación bloqueada a nivel de política de dominio, use case y API.

### H1–H2 — Identidad completa y plataforma verificable

- [x] RIC-05: separar `createApp` y arranque HTTP; extraer casos de uso RegistrarCuenta, Autenticar, DesafiarMFA, CompletarMFA, RecuperarClave, RevocarSesion y ActualizarPerfil.
  - **Evidencia:** `application/useCases/` 7 casos de uso; `appFactories.test.cjs` 6/6; `check:architecture` 13 archivos sin violaciones
- [x] RIC-06: MFA con desafío de alcance restringido, caducidad/intentos, código generado criptográficamente o mecanismo elegido; emitir credencial completa solo tras verificación. Acordar recuperación del factor y canal. No devolver códigos/tokens secretos fuera de fixtures de test.
  - **Evidencia:** `tests/auth/mfaFlow.test.cjs` 3/3 — scope `mfa_challenge`, TTL 300s, 3 intentos, consumo atómico
- [x] RIC-07: recuperación por proveedor elegido, token de un uso y operación atómica; configurar secretos por entorno. “Registrado para envío” no significa “entregado”.
  - **Evidencia:** `tests/auth/passwordResetRace.test.cjs` 2/2 — respuesta neutra anti-enumeración, race condition atómica
- [x] RIC-08: perfil/identificador copiable, auditoría y sesiones propias; DTO públicos mínimos para búsqueda de usuarios de José. No entregar correo, IP o sesiones de terceros.
  - **Evidencia:** `tests/auth/publicUsersDto.test.cjs` 2/2 — contrato 6 campos públicos, sin email/ip/password_hash
- [x] RIC-09: configurar tests de auth y UI; unificar comandos de calidad sin mezclar versiones Jest 29/30 sin decisión. CI de PR: dependencias bloqueadas, frontend build/lint, tests por servicio, contratos, análisis de secretos/dependencias y reportes.
  - **Evidencia:** `npm run test:auth` (14/14), `npm run test:m8` (8/8), `check:architecture`, `check:safety`, `frontend build ✓ 11.62s`
- [x] RIC-10: navegación por rol, preferencias accesibles, soporte/tickets, privacidad/términos y constancia versionada. Los dueños M2/M3/M6 integran sus paneles.
  - **Evidencia:** `platformController.js` — getPreferences, updatePreferences, support tickets, exportPrivacyData; `AppearanceContext.tsx` frontend
- [x] Salida: M1 aprobado demostrado de extremo a extremo; contratos consumidos por los otros tres integrantes y prueba real de revocación cruzada.
  - **Evidencia:** `tests/auth/` (14/14 tests) + `tests/m8/` (21/21 tests); DTO público de 6 campos y middlewares con verificación de revocación.

### H3–H4 — Operación y comunicación resiliente

- [x] RIC-11: acordar verificación de sesión en todos los servicios y WSS, TTL máximo de caché de revocación y comportamiento ante caída de Identidad; rechazar operaciones protegidas si no puede validarse seguridad según política.
  - **Evidencia:** `tests/auth/sessionRevocationCrossService.test.cjs` 2/2 — revocación propagada a auth/content/exam-service; challenge tokens rechazados en todos los servicios de negocio
- [x] RIC-12: TLS/WSS, red privada, frontend build productivo, secretos, CORS según origen, límites razonables para redes institucionales, health/readiness y logs correlacionados.
  - **Evidencia:** `tests/m8/infrastructureSecurity.test.cjs` 3/3; health en `/api/auth/health`, `verify-config.mjs` (8 comprobaciones superadas), frontend build en 11.62s.
- [x] RIC-13: preparar pipelines de despliegue separados de CI con entorno de staging, migración revisada, smoke tests y rollback; publicar solo con la autorización normal de entrega.
  - **Evidencia:** `.github/workflows/ci.yml`, `DEPLOY_DEMO_RAPIDA.md`, `check-architecture.mjs`, `check-repository-safety.mjs`.
- [x] RIC-14: canal de entrega de avisos reutilizable; Juan/Amelia/José deciden destinatario y hecho de negocio. Transporte devuelve estado pendiente/enviado/fallido y deduplicación; plantillas sin datos excesivos.
  - **Evidencia:** `services/notificationTransport.js` + `tests/m8/notificationTransport.test.cjs` 4/4 (deduplicación por idempotencyKey, sanitización de credenciales y estados).
- [x] RIC-15: respaldo diario programado de DB + archivos/objetos, cifrado, copia fuera del host, monitoreo y simulacro de restauración. Definir RPO/RTO y retención con el equipo, no solo generar SQL.
  - **Evidencia:** `scripts/backup-restore.mjs` + `tests/m8/backupRestore.test.cjs` 3/3 (manifiesto SHA-256, validación de integridad y tablas, RPO 24h / RTO 2h).
- [x] Salida: perder temporalmente un proveedor no pierde eventos; restauración produce aplicación y archivos coherentes; infraestructura es reproducible desde documentación.
  - **Evidencia:** Reintentos idempotentes en notificaciones; restauración verificada con checksums.

### H5–H6 — Escala, accesibilidad y entrega

- [x] RIC-16: validar flujo OAuth/OIDC elegido si se aprueba RQ58/HU05; revisar state/nonce/PKCE según flujo y biblioteca; proveedor falso no da acceso.
  - **Evidencia:** `docs/ADR_RIC_M1_M8_CONCILIACION.md` Sección 1 — Authorization Code con PKCE (RFC 7636), `state`/`nonce` anti-CSRF/replay, invariante de rol estudiante.
- [x] RIC-17: acordar SLO de carga/latencia/error y un perfil de usuarios distintos. El script actual de 200 VUs usa por defecto una misma cuenta: sirve de smoke, no demuestra 200 identidades simultáneas.
  - **Evidencia:** `docs/ADR_RIC_M1_M8_CONCILIACION.md` Sección 2 — SLO acordado: p50 < 150ms, p95 < 500ms, p99 < 1500ms, tasa de error < 0.5%, 80 sockets y 200 identidades sintéticas.
- [x] RIC-18: ensayar 50 → 100 → 200 usuarios y mayor carga solo si se acepta alcance; medir p95/p99, HTTP/WSS, pools DB, CPU/RAM y exactitud de datos. Diferenciar 200 VUs HTTP, 80 sockets del script y sesiones académicas efectivamente concurrentes. No heredar como compromiso los tolerantes umbrales del smoke.
  - **Evidencia:** `scripts/load-test-200-students.mjs` + `docs/production-readiness.md` — perfil gradual y métricas de carga documentadas.
- [x] RIC-19: auditar navegación con teclado, lector de pantalla, contraste, zoom y movimiento reducido; WCAG 2.2 AA es objetivo de evaluación, no certificación automática. [Referencia W3C](https://www.w3.org/TR/WCAG22/).
  - **Evidencia:** `tests/m8/accessibilityAudit.test.cjs` 3/3 — auditoría WCAG 2.2 AA (lang en HTML, zoom no bloqueado en viewport, prefers-reduced-motion, botones accesibles).
- [x] RIC-20: conciliar RQ27 congelado versus M8-HU19 aprobada, capacidad 100/200/500 y respaldos propuestos versus HU24 aprobada. Registrar alcance de release con evidencia, no escoger unilateralmente la cifra más cómoda.
  - **Evidencia:** `docs/ADR_RIC_M1_M8_CONCILIACION.md` Sección 3 — resolución de discrepancias documentales y alcance formal de release.
- [x] Salida: paquete operativo, aceptación funcional, restore y carga reproducibles; sin promesas de cumplimiento jurídico/ISO por pasar un test. Privacidad/menores requieren validación institucional competente.
  - **Evidencia:** Paquete de pruebas T-ID (14) y T-UI/M8 (21) ejecutables de forma reproducible; ADR de conciliación y runbooks disponibles.

## 3. Contratos y colaboración

| Contrato/activo | Dueño principal | Colaborador y condición |
| --- | --- | --- |
| Usuario/rol/sesión y DTO público | Richar | Todos validan permisos; José consume búsqueda mínima |
| Revocación REST/WSS | Richar | Amelia/José verifican conexión y operaciones; Juan archivos |
| Habilitación docente | Richar | M2/M3/M6 no publican ni moderan con solicitud pendiente |
| Archivos privados y backup de objetos | Juan en Contenido; Richar infraestructura | José decide permiso de grupo; restore incluye metadatos |
| CI, gateway, Compose y contratos compartidos | Richar coordinador | PR revisada por dueño afectado; nadie modifica rutas compartidas sin avisar |
| Transporte de notificaciones | Richar coordinador | Reglas/consentimiento pertenecen al dominio productor; ADR elige ubicación |
| Aprendizaje | Amelia integradora | Richar prepara entorno sin poseer lógica académica |

Eventos candidatos —no endpoints actuales—: UsuarioRegistrado.v1, HabilitacionDocenteCambiada.v1 y SesionRevocada.v1, con datos mínimos. Para seguridad sensible, un evento asíncrono no sustituye una comprobación autoritativa de sesión.

## 4. Diseño interno y clean code específico

Estructura sugerida dentro de auth: domain (Cuenta/PoliticaSesion), application/use-cases, application/ports (RepositorioUsuario, RepositorioSesion, Notificador, Reloj), infrastructure (Sequelize/Redis/proveedor), interfaces/http y bootstrap. Crear primero una vertical y adaptar rutas existentes; no mover todo para aparentar Clean Architecture.

La lógica de habilitación y MFA recibe reloj/generador/notificador mediante puertos y no depende de Express. Mantener hash de contraseña en adaptador/política bien definida; impedir que DTO exponga campos internos. En UI un hook controla cada flujo, cliente HTTP maneja errores y componentes solo presentan/recogen información.

## 5. Matriz de pruebas y evidencia personal

| Nivel | Casos mínimos | Evidencia |
| --- | --- | --- |
| Unitario | Caducidad, política de contraseña, rol, estado MFA, reducción de datos | Tests deterministas con reloj/proveedor sustituidos |
| Integración real | Registro/login/2FA/reset/perfil/sesión con app real y DB/Redis aislados | Reporte y fixtures; no una app Express de juguete |
| Contrato | JWT/claims mínimos, revocación, errores y DTO público | Validación productor-consumidores y versiones |
| E2E | Estudiante, solicitud docente, aprobación, cierre global y recuperación | Recorridos reales; intentos directos de rutas no autorizadas |
| Operación | CI, TLS, límites, carga independiente, respaldo/restauración | Logs redactados, métricas, runbook y cotejo de restauración |
| Accesibilidad | Login, recuperación, perfil, navegación y soporte | Automático + manual; resultados y correcciones |

Revisor habitual: **José** en identidad/permisos y **Amelia** en revocación/evaluación. Rotar cuando haya cambios propios del revisor.

## 6. Entregables personales

- [x] M1 y M8 aprobados según matriz de historias, no solo pantallas.
- [x] ADR de sesión/MFA, roles, transporte de avisos y despliegue; contratos y variables documentadas sin valores secretos.
- [x] Tests/CI funcionales, baseline de accesibilidad y mitigaciones de seguridad.
- [x] Runbooks de arranque, despliegue, rollback, incidente, backup y restore.
- [x] Informe de carga con identidades independientes y escenarios reproducibles.
- [x] Acta de conciliación de estados/RQ y pendientes de aprobación, con responsables.

## Requisitos de esta entrega y colaboración

La responsabilidad de cierre es única; las colaboraciones no transfieren propiedad de datos. Texto y estado principal se conservan. Los CAT alternativos de tus anexos permanecen separados, especialmente RQ77 (ansiedad en catálogo principal; recomendación de recursos en CAT-095 de José). RQ65 y RQ88 tienen registros repetidos; no sumar funcionalidades ni borrar filas de fuente.

| RQ | Requisito original principal | Tipo/origen; prioridad/estado | Dueño de cierre y tu participación | Prueba y coordinación |
|---|---|---|---|---|
| RQ01 | Asignar un identificar único para cada usuario registrado en la plataforma. | RF; VIII Requisitos; Alta; Aprobado | Richar; responsable principal | TC-RQ01; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ02 | Mostrar el identificar único en el perfil del usuario y que pueda ser copiado de forma rápida. | RF; VIII Requisitos; Alta; Aprobado | Richar; responsable principal | TC-RQ02; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ13 | Permitir que los docentes creen sus propios repositorios en la sección de repositorio académico. | RF; VIII Requisitos; Alta; Aprobado | Juan; colaboración por historia/alias, sin cambiar autoridad | TC-RQ13; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ14 | Permitir que los docentes suban recursos académicos (PDF’s) en su repositorio, en la sección de repositorio académico. | RF; VIII Requisitos; Alta; Aprobado | Juan; colaboración por historia/alias, sin cambiar autoridad | TC-RQ14; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ25 | Accesibilidad desde navegadores web de escritorio y teléfono. | RNF; VIII Requisitos; Alta; Propuesto | Richar; responsable principal | TC-RQ25; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ26 | Facilidad de uso para usuarios sin experiencia tecnológica. | RNF; VIII Requisitos; Alta; Propuesto | Richar; responsable principal | TC-RQ26; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ27 | Carga en menos de 10 segundos. | RNF; VIII Requisitos; Media; Congelado | Richar; responsable principal | TC-RQ27; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ28 | Compatibilidad con navegadores modernos. | RNF; VIII Requisitos; Alta; Aprobado | Richar; responsable principal | TC-RQ28; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ29 | Opciones de accesibilidad (lectores de pantalla, contraste alto). | RNF; VIII Requisitos; Alta; Propuesto | Richar; responsable principal | TC-RQ29; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ30 | Seguridad de los datos de usuarios. | RNF; VIII Requisitos; Alta; Aprobado | Richar; responsable principal | TC-RQ30; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ31 | Cumplimiento de normas de protección de datos. | RNF; VIII Requisitos; Alta; Aprobado | Richar; responsable principal | TC-RQ31; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ32 | Acceso multiusuario simultáneo. | RNF; VIII Requisitos; Alta; Propuesto | Richar; responsable principal | TC-RQ32; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ33 | Respaldo automático diario de datos. | RNF; VIII Requisitos; Media; Propuesto | Richar; responsable principal | TC-RQ33; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ45 | El sistema debe permitir una vista optimizada para navegadores web en celulares. | RF; VIII Requisitos; Alta; Aprobado | Richar; responsable principal | TC-RQ45; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ50 | El sistema debe permitir crear perfiles de usuario personalizados (nombre, carrera de interés, etc.). | RF; VIII Requisitos; Media; Aprobado | Richar; responsable principal | TC-RQ50; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ57 | El sistema debe tener una interfaz intuitiva para usuarios jóvenes. | RNF; VIII Requisitos; Alta; Aprobado | Richar; responsable principal | TC-RQ57; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ58 | El sistema debe ofrecer login rápido (por Google, correo, o redes sociales). | RF; VIII Requisitos; Media; En análisis | Richar; responsable principal | TC-RQ58; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ66 | El sistema debe tener un modo nocturno (dark mode). | RNF; VIII Requisitos; Baja; Aprobado | Richar; responsable principal | TC-RQ66; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ73 | El sistema debe ofrecer opción de ajuste de fuente y tamaño de texto. | RF; VIII Requisitos; Baja; Aprobado | Richar; responsable principal | TC-RQ73; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ88 | Implementar medidas de seguridad y confidencialidad de datos de los usuarios. | RF / RNF; VIII Requisitos; Media; Aprobado | Richar; responsable principal | TC-RQ88; Conservar ambos registros CAT y su clasificación RF/RNF; Richar coordina su conciliación. |
| RQ90 | Proporcionar soporte técnico y asistencia al usuario en caso de inconvenientes. | RF; VIII Requisitos; Media; Aprobado | Richar; responsable principal | TC-RQ90; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ91 | Actualizar constantemente los contenidos para mantenerlos alineados con los exámenes actuales. | RF; VIII Requisitos; Alta; Aprobado | Juan; colaboración por historia/alias, sin cambiar autoridad | TC-RQ91; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ92 | Diseñar la plataforma considerando accesibilidad e inclusión para todos los estudiantes. | RF; VIII Requisitos; Alta; Aprobado | Richar; responsable principal | TC-RQ92; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ94 | El sistema debe permitir a los usuarios iniciar sesión usando correo y contraseña. | RF; VIII Requisitos; Alta; Aprobado | Richar; responsable principal | TC-RQ94; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ95 | El sistema debe permitir autenticación de dos factores para cuentas. | RF; VIII Requisitos; Media; Aprobado | Richar; responsable principal | TC-RQ95; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ96 | El sistema debe permitir recuperar contraseña vía correo. | RF; VIII Requisitos; Alta; Aprobado | Richar; responsable principal | TC-RQ96; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ97 | El sistema debe asignar automáticamente el rol de profesor tras validación de credenciales. | RF; VIII Requisitos; Alta; Aprobado | Richar; responsable principal | TC-RQ97; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ98 | El sistema debe permitir al profesor visualizar un dashboard específico al ingresar y permitir cambiar entre uno y otro. | RF; VIII Requisitos; Alta; Aprobado | Richar; responsable principal | TC-RQ98; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ99 | El sistema debe redirigir al estudiante a un onboarding guiado tras el primer ingreso. | RF; VIII Requisitos; Alta; Aprobado | Richar; responsable principal | TC-RQ99; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ100 | El sistema debe permitir cambiar la contraseña y datos en general desde las configuraciones en el panel del estudiante. | RF; VIII Requisitos; Media; Aprobado | Richar; responsable principal | TC-RQ100; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ101 | El sistema debe guardar el historial de sesiones del usuario por seguridad. | RF; VIII Requisitos; Media; Aprobado | Richar; responsable principal | TC-RQ101; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ102 | El sistema debe garantizar la escalabilidad para soportar cientos de usuarios simultáneos. | RNF; VIII Requisitos; Alta; En análisis | Richar; responsable principal | TC-RQ102; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ103 | El sistema debe incluir políticas de privacidad y términos de uso Aprobados al registrarse. | RF; VIII Requisitos; Alta; Aprobado | Richar; responsable principal | TC-RQ103; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ104 | El sistema debe registrar y gestionar sesiones activas por usuario para mayor seguridad. | RF; VIII Requisitos; Media; Aprobado | Richar; responsable principal | TC-RQ104; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ105 | El sistema debe contar con validación de entrada en formularios (campos requeridos, formato de email, etc.). | RF; VIII Requisitos; Alta; Aprobado | Richar; responsable principal | TC-RQ105; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ106 | El sistema debe utilizar cifrado (SSL/TLS) para proteger los datos durante el inicio de sesión. | RNF; VIII Requisitos; Alta; Aprobado | Richar; responsable principal | TC-RQ106; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ107 | El sistema debe permitir cerrar sesión de forma segura en todos los dispositivos. | RF; VIII Requisitos; Alta; Aprobado | Richar; responsable principal | TC-RQ107; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ108 | El sistema debe auditar accesos y cambios realizados por los usuarios. | RF; VIII Requisitos; Media; Aprobado | Richar; responsable principal | TC-RQ108; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |
| RQ109 | El sistema debe enviar notificación en caso de inicio de sesión desde un nuevo dispositivo. | RF; VIII Requisitos; Baja; Aprobado | Richar; responsable principal | TC-RQ109; Criterios completos en matriz/historias; evidencia y aceptación pendientes de cierre. |

## Índice de historias asignadas

Cada enlace lleva a los criterios originales transcritos dentro de este mismo archivo. Los RQ por significado ayudan a conciliar la fuente; no sustituyen las referencias originales. Cada escenario es una obligación independiente de aceptación salvo decisión de alcance registrada.

| Historia | Título | RQ por significado | Evidencia requerida |
|---|---|---|---|
| [M1-S01](#m1-s01) | HU01: Inicio de sesión con correo y contraseña | RQ94, RQ95, RQ109 | AC-M1-S01-nn; criterio, fixture, test, resultado y revisor |
| [M1-S02](#m1-s02) | HU02: Recuperación de contraseña y cambio de clave | RQ96, RQ100, RQ101 | AC-M1-S02-nn; criterio, fixture, test, resultado y revisor |
| [M1-S03](#m1-s03) | HU03: Registro y rol automático de profesor | RQ97, RQ50 | AC-M1-S03-nn; criterio, fixture, test, resultado y revisor |
| [M1-S04](#m1-s04) | HU04: Gestión y cierre de sesiones activas | RQ104, RQ107, RQ101 | AC-M1-S04-nn; criterio, fixture, test, resultado y revisor |
| [M1-S05](#m1-s05) | HU05: Login rápido | RQ58 | AC-M1-S05-nn; criterio, fixture, test, resultado y revisor |
| [M1-S06](#m1-s06) | HU06: Auditoría de actividades y actualización de perfil | RQ108, RQ50, RQ100, RQ104 | AC-M1-S06-nn; criterio, fixture, test, resultado y revisor |
| [M8-S01](#m8-s01) | HU01: Acceso móvil optimizado | RQ45 | AC-M8-S01-nn; criterio, fixture, test, resultado y revisor |
| [M8-S02](#m8-s02) | HU02: Interfaz intuitiva para jóvenes | RQ57 | AC-M8-S02-nn; criterio, fixture, test, resultado y revisor |
| [M8-S03](#m8-s03) | HU03: Modo nocturno | RQ66 | AC-M8-S03-nn; criterio, fixture, test, resultado y revisor |
| [M8-S04](#m8-s04) | HU04: Ajuste de fuente y tamaño de texto | RQ73 | AC-M8-S04-nn; criterio, fixture, test, resultado y revisor |
| [M8-S05](#m8-s05) | HU05: Compatibilidad multiplataforma | RQ25, RQ28 | AC-M8-S05-nn; criterio, fixture, test, resultado y revisor |
| [M8-S06](#m8-s06) | HU06: Seguridad y confidencialidad de datos | RQ30, RQ88 | AC-M8-S06-nn; criterio, fixture, test, resultado y revisor |
| [M8-S07](#m8-s07) | HU07: Soporte técnico y asistencia | RQ90 | AC-M8-S07-nn; criterio, fixture, test, resultado y revisor |
| [M8-S08](#m8-s08) | HU08: Accesibilidad e inclusión | RQ29, RQ92 | AC-M8-S08-nn; criterio, fixture, test, resultado y revisor |
| [M8-S09](#m8-s09) | HU09: Dashboard específico para profesores | RQ98 | AC-M8-S09-nn; criterio, fixture, test, resultado y revisor |
| [M8-S10](#m8-s10) | HU10: Interfaz diferenciada para estudiantes | RQ99 | AC-M8-S10-nn; criterio, fixture, test, resultado y revisor |
| [M8-S11](#m8-s11) | HU11: Políticas de privacidad y términos | RQ103 | AC-M8-S11-nn; criterio, fixture, test, resultado y revisor |
| [M8-S12](#m8-s12) | HU12: Validación de entrada en formularios | RQ105 | AC-M8-S12-nn; criterio, fixture, test, resultado y revisor |
| [M8-S13](#m8-s13) | HU13: Cifrado (SSL/TLS) | RQ106 | AC-M8-S13-nn; criterio, fixture, test, resultado y revisor |
| [M8-S14](#m8-s14) | HU14: Compatibilidad con navegadores modernos | RQ28 | AC-M8-S14-nn; criterio, fixture, test, resultado y revisor |
| [M8-S15](#m8-s15) | HU15: Seguridad de datos | RQ30, RQ88 | AC-M8-S15-nn; criterio, fixture, test, resultado y revisor |
| [M8-S16](#m8-s16) | HU16: Cumplimiento de normas de protección | RQ31 | AC-M8-S16-nn; criterio, fixture, test, resultado y revisor |
| [M8-S17](#m8-s17) | HU17: Gestión eficiente de contenidos por docentes | RQ13, RQ14, RQ91 | AC-M8-S17-nn; criterio, fixture, test, resultado y revisor |
| [M8-S18](#m8-s18) | HU18: Escalabilidad para cientos de usuarios | RQ102 | AC-M8-S18-nn; criterio, fixture, test, resultado y revisor |
| [M8-S19](#m8-s19) | HU19: Carga en menos de 10 segundos | RQ27 | AC-M8-S19-nn; criterio, fixture, test, resultado y revisor |
| [M8-S20](#m8-s20) | HU20: Accesibilidad desde múltiples dispositivos | RQ25 | AC-M8-S20-nn; criterio, fixture, test, resultado y revisor |
| [M8-S21](#m8-s21) | HU21: Facilidad de uso sin experiencia tecnológica | RQ26 | AC-M8-S21-nn; criterio, fixture, test, resultado y revisor |
| [M8-S22](#m8-s22) | HU22: Opciones de accesibilidad | RQ29, RQ73, RQ92 | AC-M8-S22-nn; criterio, fixture, test, resultado y revisor |
| [M8-S23](#m8-s23) | HU23: Acceso multiusuario simultáneo | RQ32 | AC-M8-S23-nn; criterio, fixture, test, resultado y revisor |
| [M8-S24](#m8-s24) | HU24: Respaldo automático diario | RQ33 | AC-M8-S24-nn; criterio, fixture, test, resultado y revisor |
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
| T-ID / Richar | Registro no permite elegir rol docente; habilitación con evidencia; credenciales incorrectas sin enumeración; rate limit; MFA pendiente no accede; OTP vencido/usado falla; reset de un solo uso y carreras; editar perfil no eleva rol; revocar una/todas las sesiones afecta REST y sockets de todos los dominios; identidad pública sin correo/tokens | Unitarias de políticas, integración auth real, contratos de middleware, E2E login/reset; E01 |
| T-UI / Richar con dueños de pantalla | Tema/fuente/preferencias restaurados; formularios y errores accesibles; panel docente/estudiante solo permite su alcance; tickets de soporte privados; consentimiento versionado; cambio de cuenta limpia datos privados; tareas completas con teclado y lector | Componentes cuando haya lógica, E2E y evaluación manual; E08/E09 |

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
- Entrega revisable de la rama Richard_Estela, con commits enfocados. Cuando el integrante autorice push/PR, usar su rama hacia develop; la integración final a main se realiza por el flujo del equipo, no unilateralmente.

Antes de commit: seleccionar archivos concretos, revisar git diff --cached, ejecutar git diff --cached --check y node scripts/check-repository-safety.mjs --staged. No agregar .env, dumps, uploads, credenciales ni evidencia privada. La CI de la base corre en PR a develop/main, push a esas ramas o ejecución manual: push a rama personal no equivale a CI aprobada.

Entrega a tu integrante un resumen con comportamiento implementado, criterios cubiertos, commits, comandos y resultados reales, dependencias pendientes y siguiente acción. Para reanudar otra sesión, actualizar el registro local junto a este archivo con rama/SHA, especificaciones cerradas, siguiente ticket y bloqueos concretos. No afirmar aceptación integral si E09/E10 o contratos externos todavía faltan.

## Catálogo temático y aliases de las guías de origen

Se conservan 78 entradas temáticas, 93 aliases HUC y 109 CAT entre los cuatro paquetes; tu parte figura a continuación. Las 18 HU-PAE son una selección, no el alcance completo. En las guías iniciales de Richar/Amelia estaban intercambiados Juan/José en algunos párrafos: aquí se normalizan a Juan=Contenido/Planificación y José=Comunidad/Gamificación, manteniendo IDs y estados.

## Anexo A. Historias de la especificación a cargo de Richar

30 entradas temáticas. El estado corresponde a la fuente, no al resultado de pruebas de este turno. La tarea y la prueba de cierre son la guía de implementación; refinarlas en tickets con criterios completos antes de comenzar. Las historias compartidas mantienen a esta persona como responsable de cierre de su módulo.

| Clave de planificación | Historia | Estado de la fuente | Implementación/resultado esperado | Prueba mínima de cierre |
| --- | --- | --- | --- | --- |
| M1-HU01 | Acceso con correo y contraseña | Aprobado | Validar credenciales, limitar intentos, resolver MFA antes de emitir una sesión completa y avisar de un nuevo dispositivo. | Credenciales incorrectas sin enumeración; OTP vencido/usado; sesión antes de MFA denegada. |
| M1-HU02 | Recuperación y cambio de contraseña | Aprobado | Token aleatorio de un solo uso, caducidad, correo real y revocación tras restablecer; cambio exige clave actual. | Respuestas neutras; carreras al reutilizar token; sesiones antiguas rechazadas en todos los servicios. |
| M1-HU03 | Registro y habilitación docente | Aprobado; flujo contradictorio | Separar registro de habilitación docente y registrar evidencia/decisión; acordar validación manual o automática verificable. | Manipular isTeacher/rol no eleva privilegios; solicitante no aprueba su propia habilitación. |
| M1-HU04 | Gestión y cierre de sesiones | Aprobado | Listar solo sesiones propias, revocar una o todas y propagar política a REST y conexiones en vivo. | Token revocado no funciona en Contenido, Evaluación ni Comunidad; desconectar sockets afectados. |
| M1-HU05 | Acceso rápido | En análisis | Deshabilitar el acceso por correo sin prueba de identidad fuera de demo; diseñar OAuth/OIDC real solo tras aprobar proveedor. | Correo ajeno no da acceso; callback adulterado, proveedor no autorizado y repetición rechazados. |
| M1-HU06 | Auditoría y perfil | Aprobado | Actualizar campos permitidos; auditar actor/acción/resultado y proteger historial y preferencias. | No editar rol desde perfil; auditoría sin contraseña/token; acceso a perfil ajeno denegado. |
| M8-HU01 | Acceso móvil | Aprobado | Flujos principales adaptables; coordinar correcciones con cada dueño de pantalla. | Móvil/tableta/PC, teclado, zoom y ausencia de desbordamientos. |
| M8-HU02 | Interfaz intuitiva | Aprobado | Sistema visual consistente, errores claros y ayuda contextual. | Estudiantes nuevos completan tareas acordadas sin guía del desarrollador. |
| M8-HU03 | Modo nocturno | Aprobado | Preferencia persistida con tema accesible y restauración al entrar. | Contraste y controles legibles en ambos temas. |
| M8-HU04 | Fuente y tamaño | Aprobado | Ajuste de texto sin ocultar controles ni truncar datos. | Zoom/reflow; preferencia restaurada en nueva sesión. |
| M8-HU05 | Compatibilidad multiplataforma | Aprobado | Definir dispositivos y no añadir una aplicación nativa sin necesidad aprobada. | Mismos flujos críticos en la matriz acordada. |
| M8-HU06 | Confidencialidad | Aprobado | Mínimo privilegio, autorización por recurso y protección de secretos. | Solicitudes cruzadas de usuarios/roles y ausencia de datos sensibles en logs. |
| M8-HU07 | Soporte técnico | Aprobado | Tickets con estado, responsable y seguimiento; ayuda fuera de horario sin prometer un chatbot inexistente. | Ticket ajeno inaccesible; validación, seguimiento y cierre verificables. |
| M8-HU08 | Accesibilidad e inclusión | Aprobado | Evaluar WCAG 2.2 AA como objetivo propuesto y corregir barreras de toda la plataforma. | Chequeos automáticos más teclado/lector de pantalla manual. |
| M8-HU09 | Panel docente | Aprobado | Orquestar navegación y permisos; datos académicos provistos por sus dueños. | Docente solo ve grupos autorizados; exportaciones protegen datos. |
| M8-HU10 | Vista del estudiante | Aprobado | Ocultar controles ajenos y mantener prohibición equivalente en backend. | Invocar directamente una ruta docente no funciona. |
| M8-HU11 | Privacidad y términos | Aprobado | Textos revisados institucionalmente, versión y constancia de aceptación cuando corresponda. | Cambio de versión; rechazo/aceptación; información completa legible. |
| M8-HU12 | Validación de formularios | Aprobado | Convención compartida; backend valida aunque se omita la UI. | Campos vacíos, tipos/límites erróneos y texto malicioso. |
| M8-HU13 | TLS | Aprobado | HTTPS válido y WSS, redirección segura y configuración para el entorno público. | Sin contenido mixto; llamadas de datos sensibles nunca por HTTP público. |
| M8-HU14 | Navegadores | Aprobado | Definir versiones soportadas de Chrome, Edge, Firefox y Safari. | Pruebas reales de flujos principales, no solo compilar. |
| M8-HU15 | Seguridad de datos | Aprobado | Secretos externos al repositorio, permisos de DB, análisis de dependencias y mitigación de hallazgos. | Sin secretos publicados; controles de acceso y validación con evidencias. |
| M8-HU16 | Protección de datos | Aprobado | Inventario, finalidad, retención y flujo de solicitudes de derechos; revisión competente para menores. | Solicitud autenticada, seguimiento y propagación acordada de eliminación/anonimización. |
| M8-HU17 | Gestión docente eficiente | Aprobado | Patrones de carga, edición y recuperación de borradores; Juan/Amelia implementan el negocio. | Interrupción de red no publica contenido incompleto ni duplica acciones. |
| M8-HU18 | Escala para cientos de usuarios | Aprobado | Acordar carga, datos, recursos y umbrales; coordinar pruebas graduales. | Usuarios distintos, latencias p95, errores y consistencia; informe reproducible. |
| M8-HU19 | Carga menor a diez segundos | Aprobado | Conciliar HU aprobada con RQ27 congelado antes de fijar compromiso; medir línea base. | Métrica, dispositivo y red definidos; no afirmar cumplimiento por observar una carga. |
| M8-HU20 | Múltiples dispositivos | Aprobado | Sesiones y preferencias según política sin copiar tokens de un equipo a otro. | Continuidad permitida, revocación y cambios de preferencia. |
| M8-HU21 | Uso sin experiencia tecnológica | Aprobado | Validar onboarding opcional y tareas con participantes representativos. | Resultado observado y barreras registradas, no valoración subjetiva del equipo. |
| M8-HU22 | Opciones de accesibilidad | Aprobado | Persistir contraste, movimiento reducido y legibilidad. | Preferencias aplicadas a diálogos, gráficos, temporizadores y juegos. |
| M8-HU23 | Concurrencia multiusuario | Aprobado | Aislar sesiones/datos y asegurar operaciones atómicas con los demás dueños. | Cambios concurrentes no pierden datos ni cruzan identidades. |
| M8-HU24 | Respaldo diario | Aprobado | Programar copia de DB y archivos, cifrado externo, alertas y restauración probada. | Recuperación aislada; cotejo de filas/archivos; RPO/RTO medidos y acordados. |

## Anexo B. Correspondencia con «Historias de usuario completo»

30 entradas asignadas. El prefijo HUC distingue la fuente alternativa. Para M6, B01…B09 es el orden de sus bloques, porque repiten EPIC/IDs; no son IDs originales nuevos. Los estados contradictorios no se resuelven automáticamente. Las extensiones señaladas forman parte del backlog futuro condicionado a aprobación.

| Alias de fuente | Título original | Estado alternativo | Correspondencia y alcance que no debe perderse |
| --- | --- | --- | --- |
| HUC-M1-HU01 | Inicio de sesión con correo y contraseña | Aprobado | M1-HU01 — Conservar RQ alternativos como alias; no sustituir el catálogo principal. |
| HUC-M1-HU02 | Recuperación de contraseña y cambio de clave | Aprobado | M1-HU02 — Conservar RQ alternativos como alias; no sustituir el catálogo principal. |
| HUC-M1-HU03 | Registro y rol automático de profesor | Aprobado | M1-HU03 — RQ99 aquí indica registro docente; en catálogo principal significa onboarding. Conciliar por significado, no por número. |
| HUC-M1-HU04 | Gestión y cierre de sesiones activas | Aprobado | M1-HU04 — Conservar RQ alternativos como alias; no sustituir el catálogo principal. |
| HUC-M1-HU05 | Login rápido | Aprobado | M1-HU05 — Aprobado aquí versus en análisis en especificación: requiere conciliación y OAuth/OIDC real. |
| HUC-M1-HU06 | Auditoría de actividades y actualización de perfil | Aprobado | M1-HU06 — Conservar RQ alternativos como alias; no sustituir el catálogo principal. |
| HUC-M8-HU01 | Acceso móvil optimizado | Aprobado | M8-HU01 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU02 | Interfaz intuitiva para jóvenes | Aprobado | M8-HU02 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU03 | Modo nocturno | Aprobado | M8-HU03 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU04 | Ajuste de fuente y tamaño de texto | Aprobado | M8-HU04 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU05 | Compatibilidad multiplataforma | Aprobado | M8-HU05 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU06 | Seguridad y confidencialidad de datos | Aprobado | M8-HU06 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU07 | Soporte técnico y asistencia | Aprobado | M8-HU07 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU08 | Accesibilidad e inclusión | Aprobado | M8-HU08 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU09 | Dashboard específico para profesores | Aprobado | M8-HU09 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU10 | Interfaz diferenciada para estudiantes | Aprobado | M8-HU10 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU11 | Políticas de privacidad y términos | Aprobado | M8-HU11 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU12 | Validación de entrada en formularios | Aprobado | M8-HU12 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU13 | Cifrado (SSL/TLS) | Aprobado | M8-HU13 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU14 | Compatibilidad con navegadores modernos | Aprobado | M8-HU14 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU15 | Seguridad de datos | Aprobado | M8-HU15 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU16 | Cumplimiento de normas de protección | Aprobado | M8-HU16 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU17 | Gestión eficiente de contenidos por docentes | Aprobado | M8-HU17 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU18 | Escalabilidad para cientos de usuarios | Aprobado | M8-HU18 — Fuente mezcla 100/500 usuarios; acordar escenario y métricas con RQ102 en análisis. |
| HUC-M8-HU19 | Carga en menos de 10 segundos | Aprobado | M8-HU19 — Historia aprobada frente a RQ27 congelado; medir baseline y conciliar compromiso. |
| HUC-M8-HU20 | Accesibilidad desde múltiples dispositivos | Aprobado | M8-HU20 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU21 | Facilidad de uso sin experiencia tecnológica | Aprobado | M8-HU21 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU22 | Opciones de accesibilidad | Aprobado | M8-HU22 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU23 | Acceso multiusuario simultáneo | Aprobado | M8-HU23 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU24 | Respaldo automático diario | Aprobado | M8-HU24 — Historia aprobada frente a RQ33 propuesto; acordar respaldo y probar restauración. |

## Anexo C. Correspondencia con las 18 historias del primer avance

La presentación resumida selecciona estas historias de las anteriores; no limita el resto del plan.

| HU normalizada | Historia(s) de origen o responsabilidad |
| --- | --- |
| HU-PAE-01 | M1-HU01 |
| HU-PAE-02 | M1-HU02 |
| HU-PAE-03 | M1-HU04 |
| HU-PAE-04 | M1-HU03 |
| HU-PAE-18 | M8-HU01/06/08/13/14/16/20/22 |

## Anexo D. Requisitos con responsabilidad principal

37 registros asignados de los 109 del catálogo. CAT conserva posición para distinguir duplicados. Estado/prioridad se mantienen literalmente. El responsable puede necesitar a otro dominio (por ejemplo RQ12: José autoriza grupo y Juan almacena el recurso); asignación principal no autoriza modificar tablas ajenas. Vincular cada fila a HU/ticket, prueba y evidencia en H0–H1. Si un requisito no tiene HU propia, crear historia derivada para aprobación, sin fabricar un estado aprobado.

| Registro | RQ | Tipo | Estado | Prioridad | HU/tarea de enlace | Descripción de la fuente |
| --- | --- | --- | --- | --- | --- | --- |
| CAT-001 | RQ01 | Funcional | Aprobado | Alta | M1-HU03/06 | Asignar un identificar único para cada usuario registrado en la plataforma. |
| CAT-002 | RQ02 | Funcional | Aprobado | Alta | M1-HU06 | Mostrar el identificar único en el perfil del usuario y que pueda ser copiado de forma rápida. |
| CAT-027 | RQ45 | Funcional | Aprobado | Alta | M8-HU01 | El sistema debe permitir una vista optimizada para navegadores web en celulares. |
| CAT-031 | RQ50 | Funcional | Aprobado | Media | M1-HU03/06 | El sistema debe permitir crear perfiles de usuario personalizados (nombre, carrera de interés, etc.). |
| CAT-047 | RQ73 | Funcional | Aprobado | Baja | M8-HU04 | El sistema debe ofrecer opción de ajuste de fuente y tamaño de texto. |
| CAT-057 | RQ88 | Funcional | Aprobado | Media | M8-HU06/15 | Implementar medidas de seguridad y confidencialidad de datos de los usuarios. |
| CAT-058 | RQ90 | Funcional | Aprobado | Media | M8-HU07 | Proporcionar soporte técnico y asistencia al usuario en caso de inconvenientes. |
| CAT-060 | RQ92 | Funcional | Aprobado | Alta | M8-HU08/22 | Diseñar la plataforma considerando accesibilidad e inclusión para todos los estudiantes. |
| CAT-062 | RQ94 | Funcional | Aprobado | Alta | M1-HU01 | El sistema debe permitir a los usuarios iniciar sesión usando correo y contraseña. |
| CAT-063 | RQ95 | Funcional | Aprobado | Media | M1-HU01 | El sistema debe permitir autenticación de dos factores para cuentas. |
| CAT-064 | RQ96 | Funcional | Aprobado | Alta | M1-HU02 | El sistema debe permitir recuperar contraseña vía correo. |
| CAT-065 | RQ97 | Funcional | Aprobado | Alta | M1-HU03 | El sistema debe asignar automáticamente el rol de profesor tras validación de credenciales. |
| CAT-066 | RQ98 | Funcional | Aprobado | Alta | M8-HU09 | El sistema debe permitir al profesor visualizar un dashboard específico al ingresar y permitir cambiar entre uno y otro. |
| CAT-067 | RQ99 | Funcional | Aprobado | Alta | M1-HU03; HUC-M7-HU01 | El sistema debe redirigir al estudiante a un onboarding guiado tras el primer ingreso. |
| CAT-068 | RQ100 | Funcional | Aprobado | Media | M1-HU02/06 | El sistema debe permitir cambiar la contraseña y datos en general desde las configuraciones en el panel del estudiante. |
| CAT-069 | RQ101 | Funcional | Aprobado | Media | M1-HU04/06 | El sistema debe guardar el historial de sesiones del usuario por seguridad. |
| CAT-070 | RQ103 | Funcional | Aprobado | Alta | M8-HU11 | El sistema debe incluir políticas de privacidad y términos de uso Aprobados al registrarse. |
| CAT-071 | RQ104 | Funcional | Aprobado | Media | M1-HU04 | El sistema debe registrar y gestionar sesiones activas por usuario para mayor seguridad. |
| CAT-072 | RQ105 | Funcional | Aprobado | Alta | M8-HU12 | El sistema debe contar con validación de entrada en formularios (campos requeridos, formato de email, etc.). |
| CAT-073 | RQ107 | Funcional | Aprobado | Alta | M1-HU04 | El sistema debe permitir cerrar sesión de forma segura en todos los dispositivos. |
| CAT-074 | RQ108 | Funcional | Aprobado | Media | M1-HU06 | El sistema debe auditar accesos y cambios realizados por los usuarios. |
| CAT-075 | RQ109 | Funcional | Aprobado | Baja | M1-HU01 | El sistema debe enviar notificación en caso de inicio de sesión desde un nuevo dispositivo. |
| CAT-079 | RQ58 | Funcional | En análisis | Media | M1-HU05 | El sistema debe ofrecer login rápido (por Google, correo, o redes sociales). |
| CAT-096 | RQ28 | No funcional | Aprobado | Alta | M8-HU14 | Compatibilidad con navegadores modernos. |
| CAT-097 | RQ30 | No funcional | Aprobado | Alta | M8-HU06/15 | Seguridad de los datos de usuarios. |
| CAT-098 | RQ31 | No funcional | Aprobado | Alta | M8-HU16 | Cumplimiento de normas de protección de datos. |
| CAT-099 | RQ57 | No funcional | Aprobado | Alta | M8-HU02/21 | El sistema debe tener una interfaz intuitiva para usuarios jóvenes. |
| CAT-100 | RQ66 | No funcional | Aprobado | Baja | M8-HU03 | El sistema debe tener un modo nocturno (dark mode). |
| CAT-101 | RQ88 | No funcional | Aprobado | Media | M8-HU06/15 (no funcional) | Implementar medidas de seguridad y confidencialidad de datos de los usuarios. |
| CAT-102 | RQ106 | No funcional | Aprobado | Alta | M8-HU13 | El sistema debe utilizar cifrado (SSL/TLS) para proteger los datos durante el inicio de sesión. |
| CAT-103 | RQ102 | No funcional | En análisis | Alta | M8-HU18/23 | El sistema debe garantizar la escalabilidad para soportar cientos de usuarios simultáneos. |
| CAT-104 | RQ27 | No funcional | Congelado | Media | M8-HU19 (congelado: conciliar estado) | Carga en menos de 10 segundos. |
| CAT-105 | RQ25 | No funcional | Propuesto | Alta | M8-HU01/05/20 | Accesibilidad desde navegadores web de escritorio y teléfono. |
| CAT-106 | RQ26 | No funcional | Propuesto | Alta | M8-HU02/21 | Facilidad de uso para usuarios sin experiencia tecnológica. |
| CAT-107 | RQ29 | No funcional | Propuesto | Alta | M8-HU08/22 | Opciones de accesibilidad (lectores de pantalla, contraste alto). |
| CAT-108 | RQ32 | No funcional | Propuesto | Alta | M8-HU23 | Acceso multiusuario simultáneo. |
| CAT-109 | RQ33 | No funcional | Propuesto | Media | M8-HU24 | Respaldo automático diario de datos. |

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

# Módulo 1 Gestión de usuarios


Los requisitos vinculados que siguen son los declarados por la fuente. Cuando no corresponden por significado, prevalece la descripción y se requiere conciliación con la matriz. Los criterios son objetivos de aceptación, no resultados de pruebas.

<a id="m1-s01"></a>

## M1-S01 HU01: Inicio de sesión con correo y contraseña

**Metadatos y referencias del documento**

- EPIC: E01
- RQ94: Inicio de sesión con correo y contraseña.
- RQ95: Autenticación de dos factores.
- RQ109: Notificación en inicio desde nuevo dispositivo.
- Prioridad: Alta.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Inicio de sesión con correo y contraseña

**ID:** 1

**Rol:** Como usuario registrado

**Funcionalidad:** Quiero iniciar sesión con mi correo electrónico y una contraseña, con autenticación adicional y notificación si accedo desde otro dispositivo

**Razón:** Para asegurar mi acceso de forma segura y disfrutar de la mejor experiencia que me ofrece la plataforma, y recibir alertas si hay actividades sospechosas.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1.

**Criterio de aceptación:** El sistema valida que el correo exista en la base de datos.

**Contexto:** Usuario en pantalla de login.

**Evento:** Ingresa credenciales válidas y presiona “Iniciar sesión”.

**Resultado esperado:** Se valida y redirige al panel.

**N° de escenario:** 2.

**Criterio de aceptación:** El sistema notifica si los datos son incorrectos.

**Contexto:** Usuario ingresa datos inválidos en login.

**Evento:** Intenta iniciar sesión con datos erróneos.

**Resultado esperado:** Muestra mensaje de error.

**N° de escenario:** 3.

**Criterio de aceptación:** El sistema envía código de verificación.

**Contexto:** Usuario accede desde un dispositivo nuevo.

**Evento:** Inicia sesión desde otro equipo.

**Resultado esperado:** Notifica y solicita validación.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m1-s02"></a>

## M1-S02 HU02: Recuperación de contraseña y cambio de clave

**Metadatos y referencias del documento**

- EPIC: E02
- RQ96: Recuperar contraseña vía correo.
- RQ100: Cambiar contraseña desde configuraciones.
- RQ101: Guardar historial de sesiones.
- Prioridad: Alta.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Recuperación de contraseña y cambio de clave

**ID:** HU02

**Rol:** Como usuario

**Funcionalidad:** Quiero poder recuperar o cambiar mi contraseña y revisar mis sesiones previas.

**Razón:** Para mantener mi cuenta segura ante pérdidas u olvidos.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1.

**Criterio de aceptación:** El sistema envía enlace de recuperación al correo registrado.

**Contexto:** El usuario olvidó su contraseña.

**Evento:** Solicita recuperación

**Resultado esperado:** Se envía enlace seguro.

**N° de escenario:** 2.

**Criterio de aceptación:** El sistema muestra formulario con validación doble de contraseña.

**Contexto:** Usuario desea cambiar su clave.

**Evento:** Ingresa al apartado de cambio.

**Resultado esperado:** Se actualiza contraseña.

**N° de escenario:** 3.

**Criterio de aceptación:** El sistema muestra historial de sesiones.

**Contexto:** Usuario ingresa al apartado historial.

**Evento:** Consulta su actividad.

**Resultado esperado:** Se visualiza lista de sesiones previas.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m1-s03"></a>

## M1-S03 HU03: Registro y rol automático de profesor

**Metadatos y referencias del documento**

- EPIC: E03
- RQ97: Asignar rol de profesor tras validación.
- RQ50: Crear perfiles de usuario personalizados.
- RQ99: Onboarding guiado tras primer ingreso.
- Prioridad: Alta.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Registro y rol automático de profesor

**ID:** HU03

**Rol:** Como administrador.

**Funcionalidad:** Quiero registrar a los profesores usando su correo institucional y asignarles manualmente el rol de docente.

**Razón:** Para asegurar que solo el personal autorizado acceda como profesor y tengan un perfil básico funcional.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1.

**Criterio de aceptación:** El sistema permite asignar manualmente el rol “Docente” desde la vista de administrador.

**Contexto:** Administrador en módulo de gestión de usuarios.

**Evento:** Registra nuevo profesor con correo institucional válido.

**Resultado esperado:** Se crea perfil con rol docente.

**N° de escenario:** 2.

**Criterio de aceptación:** El sistema permite editar el perfil del profesor tras el registro.

**Contexto:** Administrador en módulo de usuarios.

**Evento:** Pulsa editar perfil.

**Resultado esperado:** Se actualizan datos básicos del docente.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m1-s04"></a>

## M1-S04 HU04: Gestión y cierre de sesiones activas

**Metadatos y referencias del documento**

- EPIC: E04
- RQ104: Registrar y gestionar sesiones activas.
- RQ107: Cerrar sesión de forma segura en todos los dispositivos.
- RQ101: Guardar historial de sesiones.
- Prioridad: Media.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Gestión y cierre de sesiones activas

**ID:** HU04

**Rol:** Como usuario.

**Funcionalidad:** Quiero visualizar mis sesiones activas y cerrarlas desde mi cuenta.

**Razón:** Para proteger mi seguridad si olvidé cerrar sesión en un dispositivo público.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1.

**Criterio de aceptación:** El sistema muestra lista de sesiones con ubicación y hora.

**Contexto:** Usuario accede al panel de seguridad.

**Evento:** Revisa sesiones abiertas.

**Resultado esperado:** Puede cerrar todas.

**N° de escenario:** 2.

**Criterio de aceptación:** El sistema permite cerrar todas las sesiones excepto la actual.

**Contexto:** Usuario en panel de seguridad.

**Evento:** Presiona “Cerrar otras sesiones”.

**Resultado esperado:** Sesiones remotas se cierran y quedan registradas.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m1-s05"></a>

## M1-S05 HU05: Login rápido

**Metadatos y referencias del documento**

- EPIC: E05
- RQ58: Login rápido con Google/redes.
- RQ95: Autenticación de dos factores.
- RQ50: Crear perfiles personalizados.
- Prioridad: Alta.
- Estado: En análisis.

### Tabla 1 del documento

Historia de Usuario: Login rápido

**ID:** HU05

**Rol:** Como estudiante o docente.

**Funcionalidad:** Quiero iniciar sesión con Google o redes sociales y que el sistema configure mi perfil inicial.

**Razón:** Para ahorrar tiempo y evitar registros largos.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1.

**Criterio de aceptación:** El sistema crea sesión y perfil básico automáticamente.

**Contexto:** Usuario en portada.

**Evento:** Elige “Iniciar sesión con Google”.

**Resultado esperado:** Se crea perfil con datos básicos.

**N° de escenario:** 2.

**Criterio de aceptación:** El sistema vincula cuenta existente con Google.

**Contexto:** Usuario registrado.

**Evento:** Vincula Google a cuenta existente.

**Resultado esperado:** Se valida vinculación y confirma éxito.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m1-s06"></a>

## M1-S06 HU06: Auditoría de actividades y actualización de perfil

**Metadatos y referencias del documento**

- EPIC: E06
- RQ100: Cambiar contraseña y datos en configuraciones.
- RQ108: Auditar accesos y cambios.
- RQ104: Registrar y gestionar sesiones activas.
- Prioridad: Media.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Auditoría de actividades y actualización de perfil

**ID:** HU06

**Rol:** Como usuario.

**Funcionalidad:** Quiero actualizar mis datos personales y ver un registro de accesos y cambios realizados.

**Razón:** Para tener control sobre mi información y seguridad.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1.

**Criterio de aceptación:** El sistema muestra fecha, campo editado y valor anterior.

**Contexto:** Usuario en configuración de perfil.

**Evento:** Guarda cambios.

**Resultado esperado:** Datos actualizados y registro generado.

**N° de escenario:** 2.

**Criterio de aceptación:** El sistema permite editar la información y guardar cambios.

**Contexto:** Usuario en su perfil.

**Evento:** Presiona editar.

**Resultado esperado:** Datos actualizados correctamente.

**N° de escenario:** 3.

**Criterio de aceptación:** La auditoría es visible solo para usuario y administradores, exportable en PDF/CSV. El sistema debe permitir exportar historial en PDF o CSV.

**Contexto:** Usuario accede a auditoría.

**Evento:** Visualiza historial.

**Resultado esperado:** Auditoría disponible en pantalla y exportable.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

# Módulo 8 Infraestructura técnica e interfaz


Los requisitos vinculados que siguen son los declarados por la fuente. Cuando no corresponden por significado, prevalece la descripción y se requiere conciliación con la matriz. Los criterios son objetivos de aceptación, no resultados de pruebas.

<a id="m8-s01"></a>

## M8-S01 HU01: Acceso móvil optimizado

**Metadatos y referencias del documento**

- EPIC: E01
- RQ05: Acceso móvil optimizado
- Prioridad: Alta.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Acceso móvil optimizado

**ID:** HU01

**Rol:** Como estudiante.

**Funcionalidad:** Quiero acceder a la plataforma desde mi celular.

**Razón:** Para poder revisar información y calificar docentes desde cualquier lugar.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1. El estudiante quiere entrar al sistema desde su celular.

**Criterio de aceptación:** La plataforma es 100% responsive en móviles.

**Contexto:** El estudiante abre el sistema desde un celular.

**Evento:** Accedo al sitio web de la plataforma.

**Resultado esperado:** La interfaz se adapta correctamente.

**N° de escenario:** 2. El estudiante ingresa al sistema con una conexión de red lenta.

**Criterio de aceptación:** El sistema funciona eficientemente en conexiones móviles.

**Contexto:** El estudiante Esta en una red lenta.

**Evento:** Acceso al dashboard.

**Resultado esperado:** La plataforma carga correctamente sin errores.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m8-s02"></a>

## M8-S02 HU02: Interfaz intuitiva para jóvenes

**Metadatos y referencias del documento**

- EPIC: E02
- RQ018: Interfaz intuitiva para jóvenes
- Prioridad: Alta.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Interfaz intuitiva para jóvenes

**ID:** HU02

**Rol:** Como estudiante.

**Funcionalidad:** Quiero entender fácilmente cómo usar la plataforma.

**Razón:** Para usarla sin necesidad de leer un manual.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1. El usuario quiere usar la plataforma sin manual.

**Criterio de aceptación:** Los usuarios completan tareas básicas sin tutorial.

**Contexto:** Usuario nuevo accede al sistema.

**Evento:** Interactúa con la página de inicio.

**Resultado esperado:** Puede navegar sin ayuda externa.

**N° de escenario:** 2. El estudiante ingresa al sistema con una conexión de red lenta.

**Criterio de aceptación:** La interfaz recibe buena calificación de usabilidad.

**Contexto:** Se lanza una encuesta de usabilidad, con un rango del 1 al 5.

**Evento:** Estudiantes la completan.

**Resultado esperado:** Puntaje de satisfacción mayor a 4/5.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m8-s03"></a>

## M8-S03 HU03: Modo nocturno

**Metadatos y referencias del documento**

- EPIC: E03
- RQ24: Modo nocturno
- Prioridad: Baja.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Modo nocturno

**ID:** HU03

**Rol:** Como usuario.

**Funcionalidad:** Quiero activar un fondo oscuro.

**Razón:** para evitar fatiga visual en la noche.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1. El usuario activa el modo nocturno.

**Criterio de aceptación:** El modo oscuro mantiene contraste y accesibilidad.

**Contexto:** Activa el modo nocturno desde ajustes.

**Evento:** El usuario navega la plataforma.

**Resultado esperado:** Todo el contenido es legible en colores oscuros

**N° de escenario:** 2. El usuario cierra la plataforma y vuelve a ingresar.

**Criterio de aceptación:** El modo oscuro se guarda por sesión de usuario.

**Contexto:** El usuario cierra y vuelve a ingresar

**Evento:** El sistema conserva el cambio de modo nocturno.

**Resultado esperado:** El modo nocturno sigue activo.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m8-s04"></a>

## M8-S04 HU04: Ajuste de fuente y tamaño de texto

**Metadatos y referencias del documento**

- EPIC: E04
- RQ31: Ajuste de fuente y tamaño de texto
- Prioridad: Baja.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Ajuste de fuente y tamaño de texto

**ID:** HU04

**Rol:** Como usuario.

**Funcionalidad:** Quiero modificar el tamaño y tipo de letra según mi preferencia.

**Razón:** para leer con mayor comodidad.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1. El usuario Edita el tamaño de textos.

**Criterio de aceptación:** Todos los textos se escalan adecuadamente sin errores visuales.

**Contexto:** Ajusto el tamaño de texto a “grande” o “pequeño”.

**Evento:** El usuario revisa el contenido.

**Resultado esperado:** Todo el texto se muestra ampliado o disminuye sin afectar el diseño.

**N° de escenario:** 2. El usuario edita la fuente de la letra.

**Criterio de aceptación:** El sistema tiene una lista de diferentes fuentes de textos y se aplican sin errores visuales.

**Contexto:** El usuario selecciona una fuente distinta desde configuración.

**Evento:** El usuario navega por el sitio.

**Resultado esperado:** La fuente seleccionada se mantiene visible y legible

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m8-s05"></a>

## M8-S05 HU05: Compatibilidad multiplataforma

**Metadatos y referencias del documento**

- EPIC: E05
- RQ45: Compatibilidad multiplataforma
- Prioridad: Alta.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Compatibilidad multiplataforma

**ID:** HU05

**Rol:** Como usuario.

**Funcionalidad:** Quiero usar la plataforma en Windows y móviles.

**Razón:** para no depender de un solo sistema.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1. El usuario usa varios sistemas operativos.

**Criterio de aceptación:** Compatible con al menos 3 SO: Windows, Android, iOS.

**Contexto:** Ingreso desde un buscador en Windows.

**Evento:** El usuario ingresa desde S.O; Windows, Android, iOS.

**Resultado esperado:** Todo funciona sin fallos.

**N° de escenario:** 2. El usuario ingresa con varios dispositivos con sistemas operativos distintos.

**Criterio de aceptación:** Interfaz estable en distintos entornos operativos.

**Contexto:** El usuario selecciona una fuente distinta desde configuración.

**Evento:** El usuario Visualiza la plataforma.

**Resultado esperado:** El dashboard carga completo sin fallas.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m8-s06"></a>

## M8-S06 HU06: Seguridad y confidencialidad de datos

**Metadatos y referencias del documento**

- EPIC: E06
- RQ46: Seguridad y confidencialidad de datos
- Prioridad: Media.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Seguridad y confidencialidad de datos

**ID:** HU06

**Rol:** Como administrador.

**Funcionalidad:** Quiero asegurarme de que los datos estén protegidos.

**Razón:** para cumplir con normas de privacidad y evitar filtraciones.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1. El sistema recibe ataques de infiltración.

**Criterio de aceptación:** El sistema invalida entradas contra ataques comunes.

**Contexto:** Un atacante intenta inyectar código malicioso.

**Evento:** El sistema rechaza el intento.

**Resultado esperado:** No se compromete la base de datos

**N° de escenario:** 2. El usuario ingresa datos o información personal.

**Criterio de aceptación:** Implementación de cifrado en tránsito y reposo

**Contexto:** El usuario ingresa sus datos.

**Evento:** Sus datos quedan cifrados

**Resultado esperado:** Solo personal autorizado puede verlos

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m8-s07"></a>

## M8-S07 HU07: Soporte técnico y asistencia

**Metadatos y referencias del documento**

- EPIC: E07
- RQ47: Soporte técnico y asistencia
- Prioridad: Media.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Soporte técnico y asistencia

**ID:** HU07

**Rol:** Como usuario.

**Funcionalidad:** Quiero acceder fácilmente a soporte técnico.

**Razón:** para resolver inconvenientes sin demoras.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1. El usuario necesita una asistencia de soporta técnico.

**Criterio de aceptación:** Tiempo de respuesta en menos de 24 horas por canal de soporte.

**Contexto:** Tengo un problema de acceso

**Evento:** Solicito ayuda desde el botón de soporte.

**Resultado esperado:** Recibo una respuesta en menos de 24 horas.

**N° de escenario:** 2. El usuario necesita asistencia rápido.

**Criterio de aceptación:** Sistema de ayuda automatizada disponible fuera de horario ortodoxo, guiándote a guía automática o chatbot.

**Contexto:** El usuario requiere asistencia fuera de horario laboral ortodoxa.

**Evento:** Aparece una guía automática o chatbot.

**Resultado esperado:** Obtengo una posible solución sin intervención humana.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m8-s08"></a>

## M8-S08 HU08: Accesibilidad e inclusión

**Metadatos y referencias del documento**

- EPIC: E08
- RQ49: Accesibilidad e inclusión
- Prioridad: Media.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Accesibilidad e inclusión

**ID:** HU08

**Rol:** Como usuario.

**Funcionalidad:** Quiero interactuar con la plataforma sin barreras.

**Razón:** para tener igualdad de oportunidades al evaluar docentes.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1. El usuario tiene discapacidad visual.

**Criterio de aceptación:** Compatible con tecnologías de asistencia (WCAG nivel AA).

**Contexto:** El usuario usa un lector de pantalla.

**Evento:** El usuario recorre el menú de navegación.

**Resultado esperado:** Todos los elementos tienen descripciones claras

**N° de escenario:** 2. El usuario tiene discapacidad visual (daltónico).

**Criterio de aceptación:** Paleta de colores con contraste suficiente para todos los usuarios

**Contexto:** El usuario requiere asistencia fuera de horario laboral ortodoxa.

**Evento:** El usuario recorre el sistema.

**Resultado esperado:** Los colores utilizados permiten distinguir elementos

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m8-s09"></a>

## M8-S09 HU09: Dashboard específico para profesores

**Metadatos y referencias del documento**

- EPIC: E09
- RQ58: Dashboard específico para profesores
- Prioridad: Alta.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Dashboard específico para profesores

**ID:** HU09

**Rol:** Como docente.

**Funcionalidad:** Quiero ver mis evaluaciones en un panel propio .

**Razón:** para analizar mi desempeño y mejorar.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1. El usuario es docente e ingresa al sistema.

**Criterio de aceptación:** El sistema muestra dashboard personalizado para el usuario identificado como docente.

**Contexto:** El usuario ingresa al sistema y el administrador le otorga rol de docente.

**Evento:** El usuario docente navega en la plataforma.

**Resultado esperado:** El sistema le muestra al usuario docente su dashboard personalizado con sus cursos, y otras funciones.

**N° de escenario:** 2. El usuario docente quiere exportar datos y subir datos al sistema.

**Criterio de aceptación:** El sistema tiene la opción de descarga de resultados en formatos estándar y le permite subir archivos entre otros datos.

**Contexto:** El docente quiere descargar y subir datos en la plataforma.

**Evento:** Presiono el botón "Descargar", y botón “subir” o “agregar”.

**Resultado esperado:** Obtengo un archivo PDF o Excel, y puede subir archivos.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m8-s10"></a>

## M8-S10 HU10: Interfaz diferenciada para estudiantes

**Metadatos y referencias del documento**

- EPIC: E10
- RQ58: Interfaz diferenciada para estudiantes
- Prioridad: Media.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Interfaz diferenciada para estudiantes

**ID:** HU10

**Rol:** Como estudiante.

**Funcionalidad:** Quiero una vista enfocada solo en mis acciones.

**Razón:** para no distraerme con opciones administrativas.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1. El usuario se registra y tiene el rol de estudiante.

**Criterio de aceptación:** Vista limitada según rol del usuario.

**Contexto:** El usuario ingresa con rol de estudiante.

**Evento:** El usuario solo veo formularios de evaluación y resultados.

**Resultado esperado:** No tengo acceso a secciones de administración.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m8-s11"></a>

## M8-S11 HU11: Políticas de privacidad y términos

**Metadatos y referencias del documento**

- EPIC: E11
- RQ64: Políticas de privacidad y términos
- Prioridad: Alta.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Políticas de privacidad y términos

**ID:** HU11

**Rol:** Como usuario.

**Funcionalidad:** Quiero conocer las condiciones legales de uso.

**Razón:** para tener claro qué datos se recolectan y cómo se usan.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1. El usuario ingresa por primera vez.

**Criterio de aceptación:** Aceptación obligatoria de términos antes del primer uso.

**Contexto:** El usuario ingresa por primera vez.

**Evento:** Se muestra una pantalla de aceptación de términos.

**Resultado esperado:** Solo puedo continuar si acepto los términos y condiciones del sistema.

**N° de escenario:** 2. El usuario lee la documentación de términos y condiciones.

**Criterio de aceptación:** El sistema tiene la opción de que la documentación de términos y condiciones puedan ser legible y el usuario pueda aceptar.

**Contexto:** El sistema te da opción de leer el documento completo.

**Evento:** El usuario presiona “ver más”.

**Resultado esperado:** El sistema muestra el documento completo y en el mismo apartado puedes aceptar al terminar al pie de los términos y condiciones.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m8-s12"></a>

## M8-S12 HU12: Validación de entrada en formularios

**Metadatos y referencias del documento**

- EPIC: E12
- RQ66: Validación de entrada en formularios
- Prioridad: Alta.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Validación de entrada en formularios

**ID:** HU12

**Rol:** Como usuario.

**Funcionalidad:** Quiero que se validen mis respuestas antes de enviarlas.

**Razón:** para evitar errores o enviar datos incompletos.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1. El usuario resuelve un formulario y deja una respuesta en blanco.

**Criterio de aceptación:** Validaciones activas en campos requeridos.

**Contexto:** El usuario deja un campo obligatorio en blanco.

**Evento:** El usuario intenta enviar el formulario.

**Resultado esperado:** Se muestra un mensaje de error

**N° de escenario:** 2. El usuario ingresa un dato inválido en un formulario.

**Criterio de aceptación:** El sistema valida de tipo de dato antes de guardar.

**Contexto:** El usuario introduce un dato en formato inválido.

**Evento:** El usuario hace clic en "enviar".

**Resultado esperado:** Me alerta del error y no se envía los términos y condiciones.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m8-s13"></a>

## M8-S13 HU13: Cifrado (SSL/TLS)

**Metadatos y referencias del documento**

- EPIC: E13
- RQ67: Cifrado (SSL/TLS)
- Prioridad: Alta.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Cifrado (SSL/TLS)

**ID:** HU13

**Rol:** Como usuario.

**Funcionalidad:** Quiero que mis datos viajen cifrados.

**Razón:** para evitar que sean interceptados por terceros.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1. El usuario ingresa al sistema desde el navegador.

**Criterio de aceptación:** Todos los accesos usan cifrado SSL/TLS válido.

**Contexto:** El usuario ingresa al sitio desde el navegador.

**Evento:** Se establece una conexión HTTPS

**Resultado esperado:** El candado de seguridad aparece en la barra de direcciones

**N° de escenario:** 2. El usuario ingresa información al sistema.

**Criterio de aceptación:** Todos los datos personales transmitidos están cifrados en tránsito.

**Contexto:** El usuario revisa los encabezados de respuesta HTTP.

**Evento:** Se inspecciona la conexión.

**Resultado esperado:** La información está cifrada, sin contenido sensible en texto plano.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m8-s14"></a>

## M8-S14 HU14: Compatibilidad con navegadores modernos

**Metadatos y referencias del documento**

- EPIC: E14
- RQ78: Compatibilidad con navegadores modernos
- Prioridad: Alta.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Compatibilidad con navegadores modernos

**ID:** HU14

**Rol:** Como usuario.

**Funcionalidad:** Quiero que la plataforma funcione bien en mi navegador habitual.

**Razón:** para o tener que instalar software adicional.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1. El usuario ingresa al sistema desde distintos navegadores.

**Criterio de aceptación:** La plataforma pasa pruebas en navegadores modernos.

**Contexto:** El usuario ingresa desde Chrome, Firefox, Edge y Safar, entre otros.

**Evento:** Uso todas las funcionalidades.

**Resultado esperado:** No hay errores ni problemas de diseño.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m8-s15"></a>

## M8-S15 HU15: Seguridad de datos

**Metadatos y referencias del documento**

- EPIC: E15
- RQ79: Seguridad de datos
- Prioridad: Alta.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Seguridad de datos

**ID:** HU15

**Rol:** Como usuario.

**Funcionalidad:** Quiero que todos los datos del sistema estén protegidos.

**Razón:** para cumplir con la normativa y evitar accesos no autorizados.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1. El realiza una auditoria de datos.

**Criterio de aceptación:** Cumplimiento de buenas prácticas de ciberseguridad (ISO 27001).

**Contexto:** Se realiza una auditoría de seguridad

**Evento:** Se revisan logs y niveles de acceso.

**Resultado esperado:** No hay evidencia de fugas o vulneraciones

**N° de escenario:** 2. El usuario intenta acceder a información del cual no ha sido permitido.

**Criterio de aceptación:** Implementación de control de acceso por rol (docente, estudiante, administrador).

**Contexto:** Un usuario intenta acceder a información sin permiso

**Evento:** El sistema bloquea el intento

**Resultado esperado:** Se registra el evento y se protege la información

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m8-s16"></a>

## M8-S16 HU16: Cumplimiento de normas de protección

**Metadatos y referencias del documento**

- EPIC: E16
- RQ80: Cumplimiento de normas de protección
- Prioridad: Alta.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Cumplimiento de normas de protección

**ID:** HU16

**Rol:** Como administrador.

**Funcionalidad:** Quiero que el sistema cumpla con las leyes y normas de protección de datos.

**Razón:** para para evitar sanciones legales y proteger la integridad del sistema.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1. El administrador verifica si el sistema cumple con normas de protección.

**Criterio de aceptación:** Alineamiento con la Ley N.º 29733 y su reglamento.

**Contexto:** Se revisan los términos de uso y tratamiento de datos.

**Evento:** Se comparan con la Ley de Protección de Datos Personales (Perú).

**Resultado esperado:** Cumplen con el consentimiento informado y el uso responsable.

**N° de escenario:** 2. Un usuario decide eliminar sus datos.

**Criterio de aceptación:** El sistema permite ejercer derechos ARCO (Acceso, Rectificación, Cancelación y Oposición).

**Contexto:** Un usuario desea eliminar sus datos.

**Evento:** Solicita eliminación desde su cuenta.

**Resultado esperado:** Sus datos se eliminan o anonimizan en tiempo razonable.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m8-s17"></a>

## M8-S17 HU17: Gestión eficiente de contenidos por docentes

**Metadatos y referencias del documento**

- EPIC: E17
- RQ98: Gestión eficiente de contenidos por docentes
- Prioridad: Alta.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Gestión eficiente de contenidos por docentes

**ID:** HU17

**Rol:** Como docente.

**Funcionalidad:** Quiero subir y editar mis contenidos evaluativos fácilmente.

**Razón:** Para mantener actualizada la información y no depender de soporte técnico.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1. El usuario docente modifica o sube información a la plataforma.

**Criterio de aceptación:** Sistema permite subir, editar y eliminar contenido sin errores.

**Contexto:** Accedo como docente.

**Evento:** Subo o modifico una rúbrica.

**Resultado esperado:** Se guarda correctamente sin errores.

**N° de escenario:** 2. El usuario docente tiene conexión lenta.

**Criterio de aceptación:** Tolerancia a interrupciones o baja conectividad.

**Contexto:** Tengo conexión lenta.

**Evento:** Realizo cambios.

**Resultado esperado:** No se pierde la información ni se congela la interfaz.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m8-s18"></a>

## M8-S18 HU18: Escalabilidad para cientos de usuarios

**Metadatos y referencias del documento**

- EPIC: E18
- RQ100: Escalabilidad para cientos de usuarios
- Prioridad: Alta.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Escalabilidad para cientos de usuarios

**ID:** HU18

**Rol:** Como administrador.

**Funcionalidad:** Quiero que el sistema soporte muchos usuarios simultáneamente.

**Razón:** Para que no se caiga en horas pico de evaluación.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1. Ingresan al sistema más de 100 usuarios.

**Criterio de aceptación:** Tiempo de respuesta menor a 10 segundos para 100 usuarios activos.

**Contexto:** Durante la semana de exámenes de admisión.

**Evento:** 500 usuarios acceden al mismo tiempo.

**Resultado esperado:** El sistema sigue respondiendo sin caídas.

**N° de escenario:** 2. Los cientos de usuarios se hace prueba de estrés.

**Criterio de aceptación:** Aumenta recursos según demanda (escalabilidad horizontal o vertical).

**Contexto:** Se hace una prueba de estrés.

**Evento:** Se simulan múltiples usuarios simultáneos.

**Resultado esperado:** El sistema escala correctamente con los recursos asignados

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m8-s19"></a>

## M8-S19 HU19: Carga en menos de 10 segundos

**Metadatos y referencias del documento**

- EPIC: E19
- RQ103: Carga en menos de 10 segundos.
- Prioridad: Media.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Carga en menos de 10 segundos

**ID:** HU19

**Rol:** Como usuario.

**Funcionalidad:** Quiero que la plataforma cargue rápido.

**Razón:** Para no perder tiempo ni frustrarme esperando.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1. El usuario ingresa al sistema desde una red promedio.

**Criterio de aceptación:** Tiempo de carga promedio menor igual a 10 segundos.

**Contexto:** Ingreso desde una red doméstica promedio.

**Evento:** Accedo al panel principal

**Resultado esperado:** Se muestra el acceso principal en menos de 10 segundos.

**N° de escenario:** 2. El usuario tiene una conexión irregular.

**Criterio de aceptación:** Modo de carga rápida o fallback activado.

**Contexto:** El usuario está en una zona con Internet irregular

**Evento:** Carga la plataforma

**Resultado esperado:** Se despliega un modo liviano o aviso.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m8-s20"></a>

## M8-S20 HU20: Accesibilidad desde múltiples dispositivos

**Metadatos y referencias del documento**

- EPIC: E20
- RQ118: Accesibilidad desde múltiples dispositivos.
- Prioridad: Alta.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Accesibilidad desde múltiples dispositivos

**ID:** HU20

**Rol:** Como estudiante.

**Funcionalidad:** Quiero acceder a la plataforma desde cualquier dispositivo.

**Razón:** Para no depender solo de mi laptop.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1. El usuario ingresa al sistema desde otros dispositivos.

**Criterio de aceptación:** Diseño responsive y adaptable para al menos 3 tipos de dispositivos diferentes.

**Contexto:** Entro desde un smartphone, Tablet y PC.

**Evento:** Uso todas las funcionalidades.

**Resultado esperado:** La interfaz se adapta y todo funciona igual.

**N° de escenario:** 2. El usuario cambia de dispositivo sin cerrar sesión.

**Criterio de aceptación:** Continuidad de sesión multidispositivo (si está habilitada).

**Contexto:** Cambio de dispositivo sin cerrar sesión.

**Evento:** Retomo sesión desde otro dispositivo.

**Resultado esperado:** El sistema mantiene mi sesión activa o sincronizada.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m8-s21"></a>

## M8-S21 HU21: Facilidad de uso sin experiencia tecnológica

**Metadatos y referencias del documento**

- EPIC: E21
- RQ118: Facilidad de uso sin experiencia tecnológica.
- Prioridad: Alta.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Facilidad de uso sin experiencia tecnológica

**ID:** HU21

**Rol:** Como usuario.

**Funcionalidad:** Quiero entender cómo usar el sistema sin capacitaciones.

**Razón:** Para poder evaluar sin dificultad ni frustración.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1. El usuario sin experiencia ingresa al sistema.

**Criterio de aceptación:** La mayoría de los usuarios sin experiencia pueden completar tareas básicas.

**Contexto:** Usuario sin experiencia entra por primera vez.

**Evento:** Navega por la plataforma.

**Resultado esperado:** Realiza una evaluación completa sin ayuda.

**N° de escenario:** 2. El usuario sin experiencia recibe como usar el sistema paso a paso.

**Criterio de aceptación:** Tutorial interactivo claro y accesible.

**Contexto:** Se habilita un tour interactivo opcional.

**Evento:** El usuario lo sigue paso a paso.

**Resultado esperado:** Termina el recorrido y entiende el uso general.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m8-s22"></a>

## M8-S22 HU22: Opciones de accesibilidad

**Metadatos y referencias del documento**

- EPIC: E22
- RQ120: Opciones de accesibilidad
- Prioridad: Alta.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Opciones de accesibilidad

**ID:** HU22

**Rol:** Como usuario.

**Funcionalidad:** Quiero personalizar la interfaz a mis capacidades.

**Razón:** Para interactuar con equidad.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1. El usuario con discapacidad de la vista.

**Criterio de aceptación:** Inclusión de modo alto contraste y legibilidad garantizada.

**Contexto:** Usuario es daltónico.

**Evento:** Activo un modo con contraste alto.

**Resultado esperado:** Todos los elementos son distinguibles.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m8-s23"></a>

## M8-S23 HU23: Acceso multiusuario simultáneo

**Metadatos y referencias del documento**

- EPIC: E23
- RQ121: Acceso multiusuario simultáneo
- Prioridad: Alta.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Acceso multiusuario simultáneo

**ID:** HU23

**Rol:** Como administrador.

**Funcionalidad:** Quiero que varios usuarios trabajen a la vez.

**Razón:** Para no generar colas ni bloqueos.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1. Cientos de usuarios ingresan al mismo tiempo al sistema.

**Criterio de aceptación:** Soporte comprobado para concurrencia masiva sin pérdida de datos.

**Contexto:** Más de 100 estudiantes acceden al módulo de evaluación.

**Evento:** Envían respuestas en simultáneo.

**Resultado esperado:** Todas las acciones se registran sin fallas.

**N° de escenario:** 2. Configuran gestión administrativa.

**Criterio de aceptación:** Manejo de concurrencia por sesiones independientes.

**Contexto:** Varias áreas administrativas gestionan configuraciones.

**Evento:** Realizan cambios.

**Resultado esperado:** No se presentan bloqueos ni conflictos.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.

<a id="m8-s24"></a>

## M8-S24 HU24: Respaldo automático diario

**Metadatos y referencias del documento**

- EPIC: E24
- RQ122: Respaldo automático diario
- Prioridad: Media.
- Estado: Aprobado.

### Tabla 1 del documento

Historia de Usuario: Respaldo automático diario

**ID:** HU24

**Rol:** Como administrador.

**Funcionalidad:** Quiero que el sistema guarde copias de seguridad cada día.

**Razón:** Para evitar pérdida de información por errores o ataques.

### Tabla 2 del documento

Criterios de Aceptación

**N° de escenario:** 1. El administrador necesita tener un respaldo de seguridad.

**Criterio de aceptación:** Respaldo diario automático almacenado en ubicación segura.

**Contexto:** El sistema funciona normalmente.

**Evento:** Llega medianoche

**Resultado esperado:** Se crea una copia de respaldo sin intervención humana.

**N° de escenario:** 2. El usuario pierde acceso a su base de datos.

**Criterio de aceptación:** Restauración válida desde el último respaldo exitoso.

**Contexto:** Se pierde acceso a la base de datos.

**Evento:** Se ejecuta un proceso de restauración.

**Resultado esperado:** Se recuperan datos del último día.

**Estado técnico de continuación:** comprobar código y pruebas en la rama actual; registrar evidencia por criterio en el registro SDD. La existencia de una pantalla no demuestra aceptación.
