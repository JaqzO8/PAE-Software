# Contratos de transición

Estos contratos describen el primer piloto; no declaran que Evaluación ya publique eventos. Cada contrato nuevo se acuerda entre productor y consumidor antes del corte.

| Propietario | Contrato | Consumidor / estado |
|---|---|---|
| Richar / Identidad | `GET /api/auth/users/search?query=`; JWT, 2–100 caracteres, máximo 25 usuarios activos; id, identificador, nombres, apellidos, avatar, rol | Comunidad; implementado para invitaciones. No correo, IP ni sesiones |
| José / Comunidad | `POST /api/community/:id/invite` con `estudiante_id`; solo docente creador | UI; consulta Identidad antes de guardar |
| José / Comunidad | `GET /api/community/invitations`; invitaciones propias vigentes con `expires_at` | UI; máximo 50, primero las recientes |
| José / Comunidad | `POST /api/community/invitations/:id/accept` o `/reject` | Destinatario; operación atómica; repetición del mismo resultado devuelve 200 |
| José / Comunidad | `GET /api/community/:id/resources/:resourceId/download` | Miembro activo; Bearer, descarga privada; `/uploads` ya no sirve archivos |
| Amelia / Evaluación | ResultadoConfirmado.v1 | Gamificación; esquema y fixture de piloto, productor pendiente |
| José / Aprendizaje | PuntosOtorgados.v1 en Outbox | Transporte pendiente; no equivale a aviso entregado |

Errores nuevos de Comunidad: `{ success:false, code, message }`; 400 entrada, 401 sesión, 403 permiso, 404 recurso, 409 conflicto, 410 invitación vencida, 503 Identidad no disponible. Códigos estables viven en `communityPolicy`/casos de uso. Otros endpoints heredados conservan sus respuestas.

Los IDs de eventos son UUID, referencias de usuario/intento cadenas decimales, fechas UTC. El payload no incluye respuestas, notas ni perfiles. El consumidor solo recibe eventos de un futuro transporte autenticado; comprobar `producer` no autentica al emisor. No existe endpoint público para conceder puntos.

Pendientes compartidos: contrato autoritativo de revocación REST/WSS, ResultadoRevisado, archivos de Contenido por membresía y transporte/broker productivo. `LeccionCompletada.v1` y `RecursoPublicado.v1` ya tienen schema, fixtures, productor Outbox, validación y consumidores idempotentes en el alcance de Juan; su transporte operativo aún depende del despliegue compartido.
