# Configuración de entornos

La plantilla pública es [.env.example](../.env.example). Los valores privados viven en `.env` y los archivos locales de cada desarrollador. El generador `node scripts/setup-local.mjs` crea una configuración local sin imprimir ni versionar secretos. Las variables de entorno del proceso pueden prevalecer sobre el archivo; evita reutilizar variables de otro proyecto accidentalmente.

## Enrutamiento y puertos

| Acceso | Dirección predeterminada |
| --- | --- |
| Interfaz web | http://localhost:5173 |
| Gateway | http://localhost:3000 |
| Auth, comunidad, contenido, evaluaciones, calidad | localhost:3001, 3002, 3003, 3004 y 3005 |
| PostgreSQL auth, contenido, comunidad, evaluaciones desde el host | localhost:5433, 5434, 5435 y 5436 |
| PostgreSQL dentro de Docker | 5432 en cada contenedor |
| Redis desde el host | localhost:6379 |
| SonarQube opcional en el host | http://localhost:9010 |

Docker utiliza los nombres de servicio en la red `pae-network`. Las aplicaciones del host utilizan localhost y el puerto publicado. Compose traduce `AUTH_DB_*`, `CONTENT_DB_*`, `COMMUNITY_DB_*` y `EXAM_DB_*` a `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` en cada contenedor. Auth y comunidad también admiten aliases específicos del servicio para algunos parámetros.

Los usuarios de base `auth_user`, `content_user` y `community_user` figuran en instrucciones GRANT de los SQL iniciales. Si cambias esos nombres, adapta también los SQL y los scripts operativos. Cambiar las credenciales en `.env` solo afecta a la inicialización de volúmenes nuevos; coordina cambios sobre bases existentes.

## Secretos y seguridad de entorno

Usa un `JWT_SECRET` aleatorio compartido por los servicios del mismo entorno, y contraseñas independientes para las cuatro bases. No compartas estos valores entre desarrollo, pruebas y producción. El archivo de ejemplo contiene marcadores, no credenciales utilizables.

`NODE_ENV=development` permite las funciones de demostración local; no es un perfil público. En production, los servicios validan el secreto JWT; auth, community, content y exam rechazan contraseñas ausentes, y quality exige un token de SonarQube. Estos chequeos de configuración no resuelven las brechas funcionales de autenticación enumeradas en [Seguridad](../SECURITY.md).

Los prefijos `VITE_` son públicos y se incorporan al bundle del navegador. `VITE_API_URL=/api` es correcto en el frontend Docker. Para Vite en el host se utiliza `http://localhost:3000/api`. Cambiar esta variable requiere reconstruir el frontend o reiniciar Vite. `FRONTEND_URL` configura el origen permitido por backend; utiliza el origen sin una ruta de repositorio o `/api`.

El tamaño de carga se limita tanto en servicios (`MAX_FILE_SIZE`) como en Nginx (`client_max_body_size`, inicialmente 50 MB). Si cambias uno, revisa el otro y las validaciones del cliente. Los límites de solicitudes, conexión y pools deben ajustarse con mediciones; aumentarlos no acredita capacidad real.

## Calidad y SonarQube opcional

SonarQube no forma parte de `docker-compose.yml`. Utiliza una instancia propia accesible desde Docker y desde el navegador. Crea un proyecto con clave `pae-software` y un token con los permisos mínimos necesarios para analizar y consultar las métricas del proyecto; sigue la documentación de tu versión. Si separas análisis y consulta, usa tokens distintos en el proceso del scanner y en el servicio.

En el `.env` privado configura:

```dotenv
SONARQUBE_URL=http://host.docker.internal:9010
SONARQUBE_PUBLIC_URL=http://localhost:9010
SONAR_PROJECT_KEY=pae-software
```

Guarda `SONAR_TOKEN` localmente con tu valor propio, sin pegarlo en el repositorio ni en capturas. La URL interna sirve para las peticiones del contenedor y la pública para los enlaces del usuario. Después de cambiar la configuración:

```sh
docker compose up -d --force-recreate quality-service
```

Para generar análisis, instala una versión compatible de SonarScanner según la documentación de tu servidor. `scripts/sonar/run-sonarqube-analysis.ps1` ejecuta pruebas y crea reportes; requiere `SONAR_TOKEN` en el entorno antes de ejecutarse. Usa `-SkipSystemTests` cuando no tengas la API activa. El script heredado usa el servidor `http://localhost:9010`; adapta esa URL si tu instancia es diferente. No ejecutes el scanner con trazas de depuración que expongan su configuración privada.

El archivo raíz `sonar-project.properties` establece fuentes, pruebas y **exclusiones de cobertura amplias**: frontend, controladores y otras capas quedan fuera de esa métrica. Además, auth y community no están incluidos en `sonar.sources` de ese perfil. Un porcentaje alto o un quality gate aprobado para este perfil no certifica cobertura del producto completo. El archivo separado de content-service conserva un perfil histórico de módulo con clave `Pae_Mod2`.

## Configuración para publicar la aplicación

El workflow de GitHub Pages es manual. GitHub Pages publica únicamente archivos estáticos; el backend, Socket.IO, bases y almacenamiento requieren alojamiento separado. Si se habilita Pages, configura la variable pública de repositorio `VITE_API_URL` con una URL HTTPS de backend terminada en `/api` y establece CORS con el origen del frontend. No utilices un token como variable `VITE_*`.

Antes de un despliegue externo deben resolverse los bloqueantes de autenticación, habilitar TLS, gestionar secretos, restringir bases/Redis, revisar dependencias y probar respaldos y carga. El Compose actual es una base local. El Compose de demostración adicional crea un túnel público solo si se ejecuta explícitamente; no forma parte de los comandos de instalación recomendados.

## Variables de la plantilla

La siguiente referencia enumera todas las variables de `.env.example`. Los valores sensibles se describen sin incluir una credencial. Las variables de pruebas dinámicas se consultan en cada suite, porque algunas crean cuentas y otras requieren cuentas de prueba existentes.

| Variable | Grupo | Valor inicial o tratamiento |
| --- | --- | --- |
| `NODE_ENV` | Runtime | `development` |
| `LOG_SQL` | Runtime | `false` |
| `FRONTEND_PORT` | Public ports | `5173` |
| `NGINX_PORT` | Public ports | `3000` |
| `AUTH_PORT` | Public ports | `3001` |
| `COMMUNITY_PORT` | Public ports | `3002` |
| `CONTENT_PORT` | Public ports | `3003` |
| `EXAM_PORT` | Public ports | `3004` |
| `QUALITY_PORT` | Public ports | `3005` |
| `AUTH_DB_HOST` | Database hosts | `auth-db` |
| `CONTENT_DB_HOST` | Database hosts | `content-db` |
| `COMMUNITY_DB_HOST` | Database hosts | `community-db` |
| `EXAM_DB_HOST` | Database hosts | `exam-db` |
| `AUTH_DB_PORT` | Database hosts | `5432` |
| `CONTENT_DB_PORT` | Database hosts | `5432` |
| `COMMUNITY_DB_PORT` | Database hosts | `5432` |
| `EXAM_DB_PORT` | Database hosts | `5432` |
| `AUTH_DB_HOST_PORT` | Database hosts | `5433` |
| `CONTENT_DB_HOST_PORT` | Database hosts | `5434` |
| `COMMUNITY_DB_HOST_PORT` | Database hosts | `5435` |
| `EXAM_DB_HOST_PORT` | Database hosts | `5436` |
| `AUTH_DB_NAME` | Databases | `auth_db` |
| `AUTH_DB_USER` | Databases | `auth_user` |
| `AUTH_DB_PASSWORD` | Databases | Generado aleatoriamente en .env; nunca versionar su valor real |
| `CONTENT_DB_NAME` | Databases | `content_db` |
| `CONTENT_DB_USER` | Databases | `content_user` |
| `CONTENT_DB_PASSWORD` | Databases | Generado aleatoriamente en .env; nunca versionar su valor real |
| `COMMUNITY_DB_NAME` | Databases | `community_db` |
| `COMMUNITY_DB_USER` | Databases | `community_user` |
| `COMMUNITY_DB_PASSWORD` | Databases | Generado aleatoriamente en .env; nunca versionar su valor real |
| `EXAM_DB_NAME` | Databases | `exam_db` |
| `EXAM_DB_USER` | Databases | `exam_user` |
| `EXAM_DB_PASSWORD` | Databases | Generado aleatoriamente en .env; nunca versionar su valor real |
| `AUTH_SERVICE_URL` | Service URLs | `http://auth-service:3001` |
| `CONTENT_SERVICE_URL` | Service URLs | `http://content-service:3003` |
| `COMMUNITY_SERVICE_URL` | Service URLs | `http://community-service:3002` |
| `EXAM_SERVICE_URL` | Service URLs | `http://exam-service:3004` |
| `QUALITY_SERVICE_URL` | Service URLs | `http://quality-service:3005` |
| `FRONTEND_URL` | Service URLs | `http://localhost:5173` |
| `PUBLIC_FRONTEND_ORIGIN` | Service URLs | `http://localhost:5173` |
| `API_GATEWAY_URL` | Service URLs | `http://localhost:3000` |
| `VITE_API_URL` | Service URLs | `/api` |
| `SONARQUBE_URL` | Quality and SonarQube integration | `http://host.docker.internal:9010` |
| `SONARQUBE_PUBLIC_URL` | Quality and SonarQube integration | `http://localhost:9010` |
| `SONAR_PROJECT_KEY` | Quality and SonarQube integration | `pae-software` |
| `SONAR_TOKEN` | Quality and SonarQube integration | Vacío en desarrollo; token privado de instancia propia para métricas |
| `SONAR_CACHE_TTL_SECONDS` | Quality and SonarQube integration | `60` |
| `SONAR_REQUEST_TIMEOUT_MS` | Quality and SonarQube integration | `8000` |
| `QUALITY_RATE_LIMIT_MAX` | Quality and SonarQube integration | `120` |
| `JWT_SECRET` | Security | Generado aleatoriamente en .env; nunca versionar su valor real |
| `JWT_EXPIRES_IN` | Security | `24h` |
| `JWT_REFRESH_EXPIRES_IN` | Security | `7d` |
| `BCRYPT_ROUNDS` | Security | `10` |
| `MAX_LOGIN_ATTEMPTS` | Security | `5` |
| `LOCKOUT_TIME` | Security | `900000` |
| `DB_POOL_MAX` | Database pools | `20` |
| `AUTH_DB_POOL_MAX` | Database pools | `20` |
| `CONTENT_DB_POOL_MAX` | Database pools | `20` |
| `COMMUNITY_DB_POOL_MAX` | Database pools | `20` |
| `EXAM_DB_POOL_MAX` | Database pools | `25` |
| `DB_POOL_MIN` | Database pools | `0` |
| `DB_POOL_ACQUIRE_MS` | Database pools | `30000` |
| `DB_POOL_IDLE_MS` | Database pools | `10000` |
| `AUTH_RATE_LIMIT_MAX` | Rate limits | `3000` |
| `LOGIN_RATE_LIMIT_MAX` | Rate limits | `20` |
| `AUTH_PREFERENCES_CACHE_TTL_SECONDS` | Rate limits | `120` |
| `CONTENT_RATE_LIMIT_MAX` | Rate limits | `3000` |
| `COMMUNITY_RATE_LIMIT_MAX` | Rate limits | `3000` |
| `COMMUNITY_MESSAGE_RATE_LIMIT_MAX` | Rate limits | `12` |
| `COMMUNITY_MESSAGE_RATE_LIMIT_WINDOW_SECONDS` | Rate limits | `10` |
| `SOCKET_MAX_CONNECTIONS` | Realtime | `500` |
| `SOCKET_PING_TIMEOUT_MS` | Realtime | `20000` |
| `SOCKET_PING_INTERVAL_MS` | Realtime | `25000` |
| `SOCKET_MAX_HTTP_BUFFER_BYTES` | Realtime | `32768` |
| `GAMIFICATION_SUMMARY_CACHE_TTL_SECONDS` | Realtime | `15` |
| `GAMIFICATION_LEADERBOARD_CACHE_TTL_SECONDS` | Realtime | `15` |
| `REDIS_URL` | Redis | `redis://redis:6379` |
| `REDIS_HOST_PORT` | Redis | `6379` |
| `REDIS_MAXMEMORY` | Redis | `256mb` |
| `REDIS_MAXMEMORY_POLICY` | Redis | `allkeys-lru` |
| `COMMUNITY_USER_CACHE_TTL_SECONDS` | Redis | `300` |
| `UPLOAD_PATH` | Uploads | `/app/uploads` |
| `MAX_FILE_SIZE` | Uploads | `52428800` |
| `COMMUNITY_ALLOWED_FILE_TYPES` | Uploads | `application/pdf` |

## Otras opciones del cliente y herramientas

`VITE_USE_MOCKS` es una opción del cliente de foros en `frontend/.env.local`. Incluso sin activarla, ese cliente puede recurrir a datos simulados cuando la API falla; no sirve como evidencia de persistencia. `GITHUB_PAGES=true` y `GITHUB_REPOSITORY` se utilizan solo al construir el frontend para Pages. Los scripts Python históricos de informes requieren `python-docx` y escriben en `tmp/reports` o `.agents/workspace`; son herramientas opcionales, no dependencias de ejecución de PAE.
