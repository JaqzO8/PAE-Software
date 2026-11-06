# Base compartida y primera vertical de José

Fecha: 19 de octubre de 2026. Rama de trabajo: **Jose_Queshyac**, siguiendo `origin/Jose_Queshyac`. Existe también una rama antigua `José_Queshyac`; esta entrega no la modifica. Estado: implementación inicial verificada, pendiente de revisión del equipo; no aceptación integral de M6/M7.

Se usaron las cuatro guías de implementación adjuntas. Algunos apartados comunes de las guías de Richar/Amelia todavía intercambian los nombres de Juan y José. Prevalecen el encargo del usuario y los encabezados personales: José posee Comunidad/Gamificación, Juan Contenido/Planificación. Los estados históricos de HU/RQ no se cambian.

## Responsabilidades y estructura

| Integrante | Dominio y módulos | Punto de continuación |
|---|---|---|
| Richar | Identidad (M1) y plataforma/UI (M8) | `auth-service/src/app.js`, autenticación, sesiones, despliegue y CI |
| Juan | Contenido (M2), Planificación (M5) | `content-service/src/app.js`, `learning-service/src/modules/planning` |
| Amelia | Evaluación (M3), Seguimiento (M4), composición de Aprendizaje | `exam-service/src/app.js`, `learning-service/src/modules/tracking` |
| José | Comunidad (M6), Gamificación (M7) | `community-service/src/domain`, `application`, `infrastructure`, `bootstrap`; `learning-service/src/modules/gamification` |

Aprendizaje es **un servicio y una base de datos**, con tres módulos internos. Planificación ya tiene migración `002_planning.sql`, repositorio PostgreSQL y rutas autenticadas bajo `/api/learning/planning`; el endpoint de Contenido se conserva solo para transición y no es el destino nuevo del frontend. Quality/Sonar sigue siendo una herramienta técnica; no es satisfacción estudiantil ni un sexto dominio académico. Analytics/notification heredados no se presentan como servicios funcionales.

```mermaid
flowchart LR
    UI[React] --> GW[Gateway]
    GW --> ID[Identidad]
    GW --> CO[Contenido]
    GW --> EV[Evaluación]
    GW --> CM[Comunidad]
    CM -->|DTO público y destinatario| ID
    EV -. ResultadoConfirmado.v1 pendiente de productor .-> AP[Aprendizaje: Seguimiento / Planificación / Gamificación]
    CO -->|LeccionCompletada.v1 / Outbox| AP
    AP --> LP[(Base learning_pilot)]
```

Los cuatro servicios existentes exponen `createApp()` sin abrir puerto, sincronizar tablas ni arrancar sockets. `index.js` es la composición/arranque ejecutable. Redis conecta de forma diferida en Identidad y Comunidad. Esto permite probar las rutas reales sin arrancar todo el sistema; no elimina el uso heredado de Sequelize ni convierte automáticamente todos los controladores a arquitectura hexagonal.

Para cada vertical nueva:

1. `domain`: decisiones y errores del negocio; sin Express, Sequelize ni configuración global.
2. `application`: caso de uso que recibe puertos por parámetros; no importa adaptadores.
3. `infrastructure`: persistencia, clientes de otros dominios y proveedores.
4. `interfaces/http` o controlador adaptado: valida el borde HTTP, invoca el caso y mapea su respuesta.
5. `bootstrap`: compone puertos reales, reloj y configuración. No registrar procesos desde `domain`.

`npm run check:architecture` comprueba imports estáticos de las nuevas capas. Las capas heredadas quedan fuera del control hasta su extracción. No detecta imports dinámicos ni sustituye revisión humana. No se crean interfaces vacías para cada función ni se copian modelos entre servicios.

## Primera vertical de Comunidad

Flujo implementado: docente crea grupo → busca estudiante por nombre/identificador → invita → estudiante acepta/rechaza → miembro conversa/descarga PDF → docente expulsa o cierra grupo.

Los casos de uso CrearGrupo, InvitarMiembro, Aceptar/RechazarInvitación, Entrar/Salir, Expulsar, CerrarGrupo y PublicarMensaje usan un repositorio transaccional. Las escrituras toman primero un bloqueo de la comunidad; la creación del grupo y su membresía de propietario se confirman juntas. La aceptación y la membresía se confirman juntas. Las restricciones únicas existentes siguen activas.

| Operación | Regla aplicada |
|---|---|
| Crear | Rol global docente; nombre y campos validados; cliente no elige propietario |
| Invitar/expulsar/cerrar | Docente creador de esa comunidad; ser docente en otro grupo no basta |
| Aceptar/rechazar | Solo destinatario; expiración de 168 horas; comunidad activa; repetición del mismo resultado no repite efectos |
| Reingresar | Grupo público o nueva invitación válida; una expulsión bloquea reingreso y replay |
| Leer/escribir conversación | Membresía activa; mensajes como texto, máximo 1000 caracteres |
| Detalle público | Al visitante se entrega ficha básica; no mensajes, participantes ni rendimiento |
| Archivos | Membresía activa y recurso de la misma comunidad; descarga autenticada `private, no-store` |

La invitación calcula vencimiento desde `fecha_invitacion`; no se requiere alterar tablas de Comunidad. `COMMUNITY_INVITATION_TTL_HOURS` admite >0 y ≤720, valor inicial 168. Las invitaciones anteriores a ese plazo dejan de poder aceptarse. El modelo heredado conserva una fila por comunidad/destinatario; un nuevo envío reutiliza la fila cerrada y actualiza sus fechas. Historial inmutable de invitaciones y un identificador distinto por emisión quedan para una migración posterior.

Se corrigió el orden de rutas: `/invitations` y `/friends` ya no caen en `/:id`. Se añadió búsqueda pública mínima en Identidad y se verifica el destinatario al invitar, con timeout y error 503 cuando Identidad no está disponible.

Los PDFs existentes se conservan en el volumen de Comunidad. Las respuestas devuelven una URL autenticada de descarga y `/uploads` ya no los publica. Este adaptador es transitorio: trasladar propiedad/almacenamiento a Contenido exige el contrato de Juan y reconciliación de archivos. No se afirma que el directorio público heredado de Contenido haya sido resuelto.

## Piloto de Gamificación

`learning-service` es independiente del `exam-service`. Tiene su propia base `learning_pilot`, migración versionada con checksum y bloqueo de migraciones, endpoints `/health` y `/ready`, y un consumidor interno `createAwardConfirmedResult`. No hay endpoint HTTP de concesión ni conexión automática con los exámenes actuales.

El consumidor exige ResultadoConfirmado.v1 y una regla habilitada con ID, versión y puntos explícitos. Los valores de 15 puntos usados en pruebas son fixtures, **no una regla de producto aprobada**. Una regla/version no puede cambiar puntos después de usarse.

Una transacción guarda inbox, movimiento en el libro mayor, saldo y evento en Outbox. La clave única `(source_type, source_id, user_id, rule_id, rule_version)` impide otorgar dos veces el mismo premio incluso si cambia `eventId`. Reutilizar un `eventId` con contenido distinto falla. Un error al escribir Outbox revierte toda la concesión. El saldo se puede cotejar con `SUM(ledger.points)`.

El piloto solo admite la primera versión de un resultado confirmado. Recalificaciones y compensaciones requieren política acordada y otra vertical. El módulo de gamificación todavía requiere publicador/broker operativo propio; en Contenido, el Outbox de publicación/finalización ya tiene worker HTTP opcional, reintentos y consumidores contractuales. Guardar un evento pendiente no equivale a entregarlo.

**Autoridad actual:** los puntos/logros visibles siguen en Evaluación; las nuevas lecturas/escrituras de planificación usan `learning-service` y su esquema `planning`, mientras el endpoint histórico de Contenido queda para transición. No hay doble escritura desde el frontend. Antes de retirar el endpoint histórico se necesitan copia, comparación por usuario, estrategia de corte y rollback.

## Trazabilidad y siguiente trabajo

| Ticket / fuente | Resultado de esta entrega | Pendiente para cierre |
|---|---|---|
| Base H1, RIC-05/JUA-05/AME-05/JOS-05 | Separación app/arranque, pruebas de factories, contrato inicial, control de dependencias y CI | Extraer verticales propias de Identidad/Contenido/Evaluación |
| JOS-01/02, M6-F01/F03 | Permisos locales, aislamiento de conversaciones/PDF, bloqueo tras expulsión | Revocación autoritativa de sesión con Richar; política de moderadores |
| JOS-05/06, RQ10/RQ11 | Crear/invitar/aceptar con transacción, UI y concurrencia comprobada | Historial por emisión, paginación completa, aceptación de amistades |
| JOS-07, M6-F03 | PublicarMensaje extraído y persistente, validación en servidor | Cursor, idempotencia de mensajes, edición, auditoría y WSS |
| JOS-08, RQ12 | Descarga privada del adaptador existente | Recursos de Contenido por contrato, UI completa de recursos y reconciliación |
| JOS-11/13, M7-HU02/HU03 | Motor de puntos/inbox/ledger/saldo/Outbox probado en piloto | Productor durable en Evaluación, reglas aprobadas, migración de historial y medallas |
| JOS-16, M7-HU01 | Delimitado como satisfacción y separado de Sonar/onboarding | Implementar encuesta opcional y onboarding por separado |

RQ42 permanece fuera de esta entrega. Foro público RQ85 y variantes de moderación no se amplían aquí. Zona de descanso 2D, desafíos programados, nuevos juegos y sanciones automáticas requieren sus criterios específicos.

Brechas existentes relevantes para el siguiente hito: habilitación docente manipulable en registro, quick-login sin proveedor real, MFA posterior a login, revocación entre servicios, dependencias con avisos de seguridad y migración de `sequelize.sync`/seeds a operación versionada. No se afirma cumplimiento de H0 completo, accesibilidad integral o preparación productiva.

## Pruebas y operación

Ver [RUNBOOK_PRUEBAS_ARQUITECTURA.md](RUNBOOK_PRUEBAS_ARQUITECTURA.md) para reproducir comandos, entorno Docker, evidencias y reversión. Contratos: [backend/contracts](../backend/contracts/README.md).
