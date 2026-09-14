# Instalación local de PAE Software

Esta guía configura una copia de desarrollo con datos propios de prueba. Los comandos parten de la raíz del repositorio. Para el primer arranque se recomienda Docker Compose; así no es necesario instalar PostgreSQL, Redis ni Nginx por separado.

## Requisitos del equipo

- Git y acceso al repositorio. Si es privado, autentícate con GitHub CLI (`gh auth login`) o Git Credential Manager; no incluyas tokens en la URL de clonación.
- Node.js 24 y npm para generar la configuración, desarrollar y ejecutar pruebas. Los Dockerfiles también usan Node 24. Consulta las [versiones oficiales](https://nodejs.org/en/about/previous-releases).
- Docker Desktop iniciado con contenedores Linux y Compose v2. En Windows utiliza un entorno compatible con WSL 2 según la [guía oficial de instalación](https://docs.docker.com/desktop/setup/install/windows-install/). En Linux puede utilizarse Docker Engine y el plugin Compose; consulta [las opciones de Compose](https://docs.docker.com/compose/install/).
- Conexión a Internet durante la descarga inicial de paquetes e imágenes. Como punto de partida para desarrollo, reserva aproximadamente 8 GB de RAM para Docker y espacio para imágenes y datos; es una recomendación operativa, no una medición de capacidad ni un mínimo certificado.
- Puertos libres: 5173, 3000–3005, 5433–5436 y 6379. Todos se publican solo en la interfaz local `127.0.0.1`.

```sh
git --version
node --version
npm --version
docker version
docker compose version
```

`docker version` debe mostrar también el servidor. Si solo responde el cliente, inicia Docker Desktop antes de continuar.

## Descargar y configurar

```sh
git clone https://github.com/JaqzO8/PAE-Software.git
cd PAE-Software
node scripts/setup-local.mjs
```

El script copia la plantilla, genera cuatro contraseñas de PostgreSQL y un secreto JWT distintos con 48 bytes aleatorios cada uno, y crea las carpetas de carga. No muestra los secretos ni sobrescribe `.env`. En Windows, aplica a la carpeta las restricciones de acceso correspondientes a tu cuenta; el modo POSIX del archivo no sustituye las ACL del sistema.

La alternativa manual consiste en copiar `.env.example` a `.env` y reemplazar cada contraseña y `JWT_SECRET` por valores propios. Nunca uses los marcadores de la plantilla como credenciales. No modifiques los hosts internos de Docker (`auth-db`, `content-db`, `community-db`, `exam-db`, `redis`).

La configuración inicial establece `NODE_ENV=development` y deja `SONAR_TOKEN` vacío. La plataforma puede arrancar en este modo sin SonarQube, pero el panel de calidad no tendrá métricas reales. Consulta [Configuración](CONFIGURACION.md) para habilitarlo.

## Construir e iniciar

```sh
docker compose config --quiet
docker compose up --build -d
docker compose ps
```

El primer comando valida la composición sin imprimir sus secretos. El segundo construye frontend, gateway y cinco servicios, e inicia cuatro bases y Redis. La primera construcción puede tardar varios minutos. Espera a que finalicen los arranques y los indicadores de salud.

Abre [la aplicación](http://localhost:5173). El frontend Docker utiliza `/api` y Nginx la dirige al gateway. No cambies `VITE_API_URL` a los nombres internos de los contenedores: esos nombres no son resolubles desde el navegador del host.

Para comprobar las rutas en PowerShell:

```powershell
Invoke-RestMethod http://localhost:3000/health
Invoke-RestMethod http://localhost:3000/api/auth/health
Invoke-RestMethod http://localhost:3000/api/content/health
Invoke-RestMethod http://localhost:3000/api/community/health
Invoke-RestMethod http://localhost:3000/api/learning/health
Invoke-RestMethod http://localhost:3000/api/quality/health
```

En Bash puedes usar `curl -fsS` con cada URL. La salud HTTP indica disponibilidad del proceso; no prueba por sí sola toda la funcionalidad, ni conectividad efectiva con SonarQube.

## Datos iniciales y primer uso

PostgreSQL ejecuta los SQL de `database/auth-db/init`, `database/content-db/init` y `database/community-db/init` cuando sus volúmenes están vacíos. `exam-service` sincroniza sus modelos y crea datos de referencia al arrancar. Los servicios también inicializan configuraciones y datos de demostración según sus modelos. No se incluyen copias de las bases originales ni recursos que subieron usuarios.

No hay una contraseña universal ni una cuenta real incluida para ingresar. Registra un estudiante desde la interfaz con datos ficticios y una contraseña propia. Para probar el flujo docente local, el formulario de registro permite elegir docente. Esa elección actual no verifica la condición de profesor: debe reemplazarse por aprobación administrativa antes de operar con usuarios reales.

Recorrido inicial sugerido:

1. Registrar un estudiante y un docente de prueba; comprobar login y perfiles.
2. Crear un repositorio y subir un PDF permitido como docente.
3. Crear/publicar una lección y preguntas; formar una comunidad e invitar al estudiante.
4. Explorar, marcar favoritos, estudiar y resolver un simulacro como estudiante.
5. Ver resultados, preguntas guardadas, estadísticas y participación en desafíos.

El acceso rápido de demostración no integra Google OAuth. En desarrollo, el endpoint de recuperación puede devolver un token para pruebas, pero no envía un correo real. No utilices esta configuración con datos de personas ni mediante un túnel público.

## Detener, reiniciar y actualizar

```sh
docker compose stop
docker compose start
docker compose logs --tail=100 auth-service
docker compose logs --tail=100 content-service
docker compose logs --tail=100 exam-service
```

Para reconstruir después de un cambio de código:

```sh
docker compose up --build -d
```

`docker compose down` retira los contenedores y la red, pero conserva los volúmenes de las bases. **La opción `down -v` elimina los volúmenes y los datos**; no forma parte del procedimiento normal. Los nombres fijos `pae-*` impiden ejecutar simultáneamente dos copias sin adaptar `container_name`, puertos y volúmenes.

Cambiar la contraseña en `.env` no cambia la contraseña de una base ya inicializada. Si trabajas con datos existentes, coordina un cambio de credenciales en PostgreSQL; no borres volúmenes para resolverlo. Los scripts SQL de inicio tampoco se vuelven a ejecutar sobre un volumen que ya contiene datos.

## Desarrollo del frontend con recarga

Mantén el backend en Docker. Detén únicamente el frontend del stack si ocupa el puerto 5173:

```sh
docker compose stop frontend
npm ci --prefix frontend
```

Crea `frontend/.env.local`, que está excluido de Git, con este único valor público:

```dotenv
VITE_API_URL=http://localhost:3000/api
```

```sh
npm run dev --prefix frontend -- --host 127.0.0.1
```

Vite no define un proxy de desarrollo en la configuración actual; por eso usa la URL absoluta del gateway. Mantén `FRONTEND_URL=http://localhost:5173` para CORS. Los valores `VITE_*` llegan al navegador: solo deben contener configuración pública.

## Desarrollo de un servicio con Node

Usa este modo solo cuando necesites depurar el backend. Mantén las bases y Redis en Docker y detén el servicio que vas a ejecutar en el host para liberar su puerto. Instala sus dependencias con `npm ci --prefix backend/services/<servicio>`.

Cada servicio carga `.env` desde su directorio de ejecución. Crea un `.env` local en ese directorio a partir de los valores privados de la raíz, usando los siguientes nombres genéricos:

| Servicio | PORT | DB_HOST | DB_PORT del host | DB_NAME | DB_USER |
| --- | --- | --- | --- | --- | --- |
| auth-service | 3001 | localhost | 5433 | auth_db | auth_user |
| community-service | 3002 | localhost | 5435 | community_db | community_user |
| content-service | 3003 | localhost | 5434 | content_db | content_user |
| exam-service | 3004 | localhost | 5436 | exam_db | exam_user |
| quality-service | 3005 | No usa DB | No aplica | No aplica | No aplica |

Asigna `DB_PASSWORD` al secreto de su base y `JWT_SECRET` al mismo secreto compartido del entorno. Para autenticación y comunidad usa `REDIS_URL=redis://localhost:6379`; para contenido y comunidad usa `AUTH_SERVICE_URL=http://localhost:3001` si también ejecutas auth en el host, o su puerto local publicado por Docker. Usa `FRONTEND_URL=http://localhost:5173` y un `UPLOAD_PATH` local con permisos de escritura. Para calidad, configura la URL accesible de SonarQube.

Ejecuta `npm run dev` desde la carpeta del servicio. Un gateway dentro de Docker sigue resolviendo nombres de contenedores: para que apunte a un servicio que ahora corre en el host debes ajustar su upstream a `host.docker.internal:<puerto>` y reconstruirlo, o probar directamente el puerto del servicio. Por este motivo, la ruta de instalación recomendada mantiene el backend completo en Compose.

## Pruebas

```sh
npm ci
npm ci --prefix backend/services/content-service
npm ci --prefix backend/services/quality-service
npm test --prefix backend/services/content-service -- --runInBand
npm test --prefix backend/services/quality-service
npm run test:exam
npm run build --prefix frontend
```

Las pruebas dinámicas de `tests/dynamic` necesitan servicios activos y variables específicas como `PAE_TEST_BASE_URL=http://localhost:3000/api`, cuentas de estudiante/docente y rutas de evidencias. Revisa la lista `requiredEnv` de cada suite. Ejecutan escrituras: usa un entorno y cuentas de prueba, guarda las credenciales en variables de la terminal y dirige evidencias a `tmp/` o `coverage/`. No ejecutes todas las pruebas contra una base productiva.

El informe [VALIDACION](VALIDACION.md) señala cuáles se ejecutaron en esta entrega. Los scripts antiguos de favoritos que apuntaban a rutas inexistentes se corrigieron para utilizar las suites disponibles.

## Copias de seguridad y restauración

Desde PowerShell y con el stack activo:

```powershell
./scripts/backup-databases.ps1
```

El script usa los nombres de contenedores, bases y usuarios de la configuración inicial. Si los cambias, adapta el script. La programación diaria no está creada por este repositorio; configúrala en el Programador de tareas o servicio operativo elegido. Conserva copias cifradas fuera del host y verifica el código de salida y la integridad del volcado.

Para practicar una restauración utiliza una base de ensayo independiente y el archivo SQL seleccionado, con `psql` en un contenedor compatible. Los volcados contienen instrucciones de limpieza (`--clean --if-exists`): restaurarlos sobre una base activa reemplaza objetos. Documenta una prueba de restauración antes de dar por cumplido RQ33.

## Problemas frecuentes

| Síntoma | Comprobación y acción |
| --- | --- |
| Error de conexión al pipe de Docker | Iniciar Docker Desktop y esperar `docker version` con servidor operativo |
| Puerto o nombre de contenedor ocupado | Detener la otra copia propia o cambiar puertos/nombres con cuidado de sus datos |
| JWT rechazado o servicio que no inicia | Generar `.env`; usar el mismo secreto en servicios y revisar el perfil production |
| Error de contraseña PostgreSQL | Comprobar si el volumen ya tenía credenciales anteriores |
| Error `npm ci` | Usar los `package-lock.json` versionados; después de cambiar package.json actualizar su lock y revisarlo |
| Panel de calidad sin métricas | Comprobar URL, token, clave de proyecto y análisis previo en SonarQube |
| Frontend local llama `/api` al puerto de Vite | Definir `frontend/.env.local` con la URL absoluta del gateway y reiniciar Vite |
| Archivos antiguos no aparecen | Los uploads y las bases originales no forman parte del repositorio; cargar material de prueba |
| Rutas antiguas después de actualizar | El frontend incluye service worker; limpiar sus datos/caché en herramientas del navegador si persiste una versión anterior |

El Compose local usa HTTP y una configuración de demostración. Un despliegue externo necesita cerrar primero las brechas de [Seguridad](../SECURITY.md); subir el código a GitHub no equivale a publicar la aplicación.
