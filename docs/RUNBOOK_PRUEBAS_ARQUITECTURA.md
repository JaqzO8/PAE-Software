# Ejecutar la transición en pruebas_pae

## Carpetas y configuración

El código de esta entrega vive en `D:\PAE-Software`, rama `Jose_Queshyac`. El proyecto Docker `pruebas_pae` conserva su configuración y volúmenes originales de `D:\Pruebas_PAE`. `scripts/run-pruebas-pae.mjs` consulta las etiquetas del contenedor, valida el nombre del proyecto y aplica `docker-compose.architecture.yml` con contextos de build del checkout actual. No copia fuentes encima de la otra carpeta.

El script crea `.env.architecture` **solo si falta**, con una contraseña aleatoria para la nueva base piloto. Está excluido de Git. Conservar ese archivo al reutilizar el volumen piloto; no reemplazar la contraseña sin coordinar su cambio en PostgreSQL. No compartirlo ni imprimir `docker compose config` con secretos.

```sh
# Desde la raíz del checkout, con Docker Desktop activo
node scripts/run-pruebas-pae.mjs
node scripts/run-pruebas-pae.mjs up -d --build learning-db learning-service
node scripts/run-pruebas-pae.mjs exec -T learning-service npm run migrate
docker exec pae-nginx-gateway nginx -s reload
```

La primera instrucción reconstruye los cuatro servicios de dominio existentes y el frontend sin recrear sus bases. La segunda añade Aprendizaje y su volumen. La migración es explícita e idempotente; no se ejecuta `DROP`, `sync({force:true})` ni migración del historial académico. El gateway necesita recargar resolución de nombres tras recrear sus upstreams.

- Aplicación: `http://localhost:5173`.
- Gateway existente: `http://localhost:3000`.
- Aprendizaje piloto: `http://localhost:3006/health` y `/ready`, publicado solo en loopback.
- `/ready` devuelve 503 si falta la conexión o la migración. Los health heredados son liveness, no prueba exhaustiva de dependencias.
- La base piloto no publica un puerto al host. El gateway sigue enviando `/api/learning` a Evaluación, como antes.

## Preparar dependencias y verificar

Node.js 24. Instalar con `npm ci` en raíz, frontend y cada servicio que se vaya a probar, incluido `backend/services/learning-service`. No se unificaron versiones Jest heredadas; las nuevas suites usan `node:test`.

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

`test:docker` identifica `pae-community-db`, exige la etiqueta `pruebas_pae`, crea una base `pae_test_<uuid>` y ejecuta Comunidad real con Sequelize y Gamificación con PostgreSQL. Al finalizar elimina **solo esa base creada por la ejecución**. No trunca las tablas del proyecto. Se puede cambiar el contenedor con `PAE_TEST_DB_CONTAINER`; CI usa el ID de su servicio PostgreSQL aislado con la misma etiqueta.

Identidad se sustituye por un servidor HTTP de fixtures en la suite de Comunidad: eso permite probar sus fallos sin usar personas reales. El smoke siguiente usa Identidad, Redis, gateway, frontend y las bases Docker reales del entorno autorizado.

```sh
node scripts/smoke-community.mjs
```

El smoke registra tres cuentas sintéticas con correo de `example.test` y contraseña aleatoria, crea una comunidad, busca/invita/acepta, publica texto, sube/descarga un PDF sintético y comprueba expulsión. Después elimina su PDF, cierra la comunidad y desactiva exclusivamente sus cuentas. Quedan filas sintéticas cerradas como evidencia; no toca cuentas existentes. El registro docente usa el mecanismo heredado de desarrollo; no demuestra validación de credenciales docentes.

Para reproducir la comprobación de UI con Chrome instalado:

```sh
npm install --prefix .codex/browser playwright --no-save --package-lock=false --ignore-scripts
node scripts/smoke-community.mjs --browser
```

Usa contextos de navegador nuevos con sesiones de las cuentas sintéticas, busca e invita desde la pantalla docente y acepta desde la pantalla estudiante. No prueba el formulario de login. `PAE_PLAYWRIGHT_MODULE` permite indicar otra instalación de Playwright y `PAE_BROWSER_CHANNEL` otro canal compatible. Las capturas quedan en `test-results/architecture`, fuera de Git. El modo HTTP no necesita Playwright.

## Evidencia de esta entrega

Validado el 19 de octubre de 2026, hora de Lima:

| Control | Resultado |
|---|---|
| Integración PostgreSQL: Comunidad y Gamificación | 14 pruebas iniciales aprobadas; incluye 12 aceptaciones simultáneas, 20 replays de premios, permisos, expiración y rollback inducido |
| Factories y fixture de contrato | 6 pruebas aprobadas, sin arrancar DB/Redis/sockets al componer aplicación |
| Reglas del consumidor | 2 pruebas aprobadas, entradas no confirmadas/alteradas rechazadas |
| Suites heredadas | Contenido 25, Evaluación 4, Calidad 6 aprobadas |
| Configuración | 8 comprobaciones aprobadas |
| Frontend | TypeScript y Vite build aprobados; lint de componentes/hook/cliente nuevos aprobado |
| Docker real | Frontend, Identidad, Comunidad, Contenido, Evaluación y readiness de Aprendizaje responden 200 |
| Smoke HTTP + Chrome | Invitación docente/aceptación estudiante; mensaje persistido, PDF privado y pérdida de acceso tras expulsión aprobados |

No se afirma lint global verde, cobertura 80%, E2E de todos los módulos, revocación cruzada de sesión, varios nodos/WSS ni carga de producción. La cobertura heredada de Contenido sigue siendo parcial. `npm install` reportó vulnerabilidades en dependencias del frontend y de las herramientas de la raíz; no se ejecutó actualización masiva ni `audit fix --force`. El nuevo paquete de Aprendizaje instaló sin alertas en esa ejecución. CI quedó configurado; su ejecución remota depende de abrir un PR a develop/main o lanzarlo manualmente después de publicar la rama.

## Continuación y reversión

Para trabajar en una vertical, mantener dominio/aplicación independientes, añadir adaptador y probar con datos aislados antes de modificar el arranque. El piloto de Gamificación recibe una regla explícita: no activar procesamiento de resultados reales hasta disponer de Outbox del productor, política de recalificación y plan de conciliación.

Para detener el piloto conservando sus datos:

```sh
node scripts/run-pruebas-pae.mjs stop learning-service learning-db
```

La reversión de código se hace reconstruyendo una revisión conocida y conservando volúmenes. No usar `down -v`. La migración de Aprendizaje es aditiva; no se incluye un rollback destructivo automático. Cualquier retiro de esquema necesita respaldo/reconciliación. Volver al backend antiguo de Comunidad también restablecería sus rutas públicas de archivos y fallos de permisos: no usar esa reversión como solución de seguridad.
