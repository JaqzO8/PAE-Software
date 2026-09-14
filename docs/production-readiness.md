> Antecedente técnico de la versión anterior. Para el estado verificado de esta entrega consulta [Resumen ejecutivo](RESUMEN_EJECUTIVO.md), [Instalación](INSTALACION_LOCAL.md) y [Validación](VALIDACION.md). Las afirmaciones históricas de completitud no constituyen aceptación integral.

# Preparacion de produccion y concurrencia

## Objetivo operativo

La instalacion queda preparada para validar al menos 200 estudiantes simultaneos usando:

- API autenticada de usuarios, comunidad y aprendizaje.
- Chat rapido con cache de autores y rate limit por usuario.
- Juegos de estudio en vivo por Socket.IO con limites de conexion y heartbeat.
- Gateway Nginx con keepalive, gzip y limites por IP aptos para redes institucionales.
- Frontend servido como build estatico por Nginx, con cache para assets y proxy relativo hacia `/api`.
- Parametrizacion documentada en `docs/parametrizacion-i18n-personalizacion-solid.md`.

## Seguridad aplicada

- Los servicios fallan en `NODE_ENV=production` si `JWT_SECRET` conserva un valor debil, placeholder o menor de 32 caracteres.
- Cambio de contrasena exige contrasena actual y minimo de 8 caracteres con mayuscula, minuscula y numero.
- Nginx agrega cabeceras `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` y CSP para respuestas del gateway.
- Rate limiting por IP en gateway y por usuario en mensajes de comunidad.
- Socket.IO valida JWT, limita payloads y rechaza salas con identificadores no numericos.
- Redis usa AOF, memoria maxima y politica de eviction parametrizadas para proteger cache/presencia bajo carga.

## Prueba de 200 estudiantes

Con Docker levantado:

```powershell
$env:PAE_VUS="200"
$env:PAE_DURATION_MS="30000"
$env:PAE_SOCKET_USERS="80"
node .\scripts\load-test-200-students.mjs
```

Variables opcionales:

- `PAE_API_URL`: gateway, por defecto `http://127.0.0.1:3000/api`.
- `PAE_SOCKET_URL`: host Socket.IO, por defecto se deriva de `PAE_API_URL`.
- `PAE_STUDENT_EMAIL` y `PAE_STUDENT_PASSWORD`: cuenta estudiante usada para autenticar la prueba.
- `PAE_COMMUNITY_ID`: si se indica, la prueba incluye lectura de mensajes de esa comunidad.
- `PAE_SOCKET_USERS`: conexiones Socket.IO simultaneas, por defecto `80`.

La prueba falla si la tasa de errores HTTP supera 5% o si falla mas de 10% de conexiones Socket.IO.

## Recomendaciones para produccion real

- Usar `NODE_ENV=production` y un `JWT_SECRET` aleatorio de al menos 32 bytes.
- Mantener `LOG_SQL=false` en pruebas de carga y produccion.
- Ajustar `*_DB_POOL_MAX`, `SOCKET_MAX_CONNECTIONS` y rate limits desde `.env` segun recursos reales.
- No publicar puertos de bases de datos fuera de la red privada del servidor.
- Ejecutar backups programados con `scripts/backup-databases.ps1` y almacenar copias cifradas fuera del host.
- Colocar TLS delante del gateway o terminar TLS en Nginx si se despliega fuera de localhost.
- Monitorear CPU, memoria, latencia p95, errores 4xx/5xx y conexiones Socket.IO activas.
