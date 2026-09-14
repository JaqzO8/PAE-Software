> Antecedente técnico de la versión anterior. Para el estado verificado de esta entrega consulta [Resumen ejecutivo](RESUMEN_EJECUTIVO.md), [Instalación](INSTALACION_LOCAL.md) y [Validación](VALIDACION.md). Las afirmaciones históricas de completitud no constituyen aceptación integral.

# Parametrizacion, internacionalizacion, personalizacion y SOLID

Este documento describe como se maneja la configuracion del proyecto PAE para evitar hard coding, facilitar despliegues por ambiente y mantener el codigo extensible.

## 1. Parametrizacion

La configuracion operativa vive en `.env` y el contrato publico para nuevos entornos vive en `.env.example`. El codigo solo conserva fallbacks seguros para desarrollo local o para que el servicio falle de forma explicita cuando falte un parametro critico.

Variables principales:

- `NODE_ENV`, `LOG_SQL`: perfil de ejecucion y logging SQL.
- `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`: seguridad de tokens. En `production` se rechazan secretos debiles o menores de 32 caracteres.
- `BCRYPT_ROUNDS`, `MAX_LOGIN_ATTEMPTS`, `LOCKOUT_TIME`: politicas de autenticacion.
- `DB_POOL_MAX`, `*_DB_POOL_MAX`, `DB_POOL_MIN`, `DB_POOL_ACQUIRE_MS`, `DB_POOL_IDLE_MS`: pools de PostgreSQL.
- `AUTH_RATE_LIMIT_MAX`, `LOGIN_RATE_LIMIT_MAX`, `CONTENT_RATE_LIMIT_MAX`, `COMMUNITY_RATE_LIMIT_MAX`: limites por servicio.
- `SOCKET_MAX_CONNECTIONS`, `SOCKET_PING_TIMEOUT_MS`, `SOCKET_PING_INTERVAL_MS`, `SOCKET_MAX_HTTP_BUFFER_BYTES`: motor en vivo.
- `GAMIFICATION_SUMMARY_CACHE_TTL_SECONDS`, `GAMIFICATION_LEADERBOARD_CACHE_TTL_SECONDS`: cache corto de resumen y ranking de gamificacion.
- `COMMUNITY_MESSAGE_RATE_LIMIT_MAX`, `COMMUNITY_MESSAGE_RATE_LIMIT_WINDOW_SECONDS`, `COMMUNITY_USER_CACHE_TTL_SECONDS`: chat rapido y cache de autores.
- `REDIS_MAXMEMORY`, `REDIS_MAXMEMORY_POLICY`: memoria y eviction de Redis.
- `MAX_FILE_SIZE`, `COMMUNITY_ALLOWED_FILE_TYPES`: carga de archivos.
- `VITE_API_URL`: endpoint del frontend. En Docker productivo se usa `/api`.

Reglas:

- No agregar URLs, secretos, tamanos de pool, limites o timeouts directamente en controladores/componentes.
- Si un valor afecta seguridad, carga, despliegue o experiencia configurable, debe entrar por `.env` y documentarse aqui.
- Si un fallback existe en codigo, debe ser seguro para desarrollo y no debe permitir despliegue productivo inseguro.

## 2. Internacionalizacion

La base de i18n esta centralizada en `frontend/src/config/i18nConfig.ts`:

- `SUPPORTED_LOCALES`: locales permitidos.
- `DEFAULT_LOCALE`: locale por defecto del producto.
- `LOCALE_LABELS`: nombres mostrables en UI.

El `AppearanceProvider` aplica `document.documentElement.lang` y `data-locale`, de modo que formatos, accesibilidad y futuras traducciones tengan una fuente unica. Actualmente el idioma se guarda como preferencia local del cliente; cuando se requiera persistencia completa en backend, se debe agregar una migracion para guardar `idioma` en `preferencias_usuario` y mapearlo en `PlatformController`.

## 3. Personalizacion

La personalizacion de interfaz esta separada en tres capas:

- Backend: `UserPreference` y `PlatformController` guardan preferencias sincronizadas por usuario.
- Frontend: `AppearanceContext` aplica tema, tamano de fuente, reduccion de movimiento, alto contraste e idioma.
- UI: `Profile` expone controles claros para que estudiante/docente ajusten la experiencia.

Decisiones de interfaz aplicadas:

- Ley de Jakob y consistencia: pantallas con componentes comunes del design system.
- Ley de Fitts: acciones principales con area suficiente.
- Ley de Hick: configuraciones agrupadas por apariencia, notificaciones, soporte y privacidad.
- Accesibilidad: alto contraste, reduccion de movimiento, tamano de fuente y atributo `lang`.

## 4. SOLID y construccion de software

- Single Responsibility: controladores manejan HTTP; servicios/configuracion concentran reglas de negocio y runtime.
- Open/Closed: parametros de reglas, limites y sockets se extienden por entorno sin modificar controladores.
- Liskov Substitution: respuestas y tipos mantienen contratos consistentes por modulo.
- Interface Segregation: el frontend divide clientes por dominio (`platformService`, `learningService`, `repositoryService`).
- Dependency Inversion: los modulos dependen de configuracion y clientes estables, no de valores literales.

Practicas obligatorias para nuevos requisitos:

- Validar entrada en backend y frontend cuando el flujo sea critico.
- Centralizar reglas cambiantes en configuracion, base de datos o servicios de dominio.
- Mantener limites de paginacion y rate limit en endpoints con listas, chats o sockets.
- Evitar llamadas N+1 entre microservicios; usar cache Redis o consultas agrupadas.
- Documentar cualquier nuevo parametro en `.env.example` y en este archivo.

## 5. Escalabilidad minima objetivo

El perfil actual busca soportar al menos 200 estudiantes simultaneos en uso local/controlado:

- Frontend servido como build estatico por Nginx.
- Assets con cache immutable en `/assets`.
- API bajo gateway Nginx con keepalive, gzip y limites de conexion.
- Redis para cache de usuarios en chat y rate limiting.
- Socket.IO con limite configurable de conexiones y payload maximo.
- Pools de PostgreSQL configurables por microservicio.
- Script `scripts/load-test-200-students.mjs` para smoke de concurrencia.

Para produccion real se recomienda ejecutar multiples replicas de servicios stateless, usar Redis compartido, Postgres administrado con pooler y TLS delante del gateway.
