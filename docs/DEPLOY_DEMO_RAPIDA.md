> Procedimiento opcional heredado. No se ha ejecutado al publicar este repositorio. Antes de crear un túnel público resuelve los bloqueantes de [Seguridad](../SECURITY.md). El workflow de Pages ahora se inicia manualmente.

# Despliegue de demostracion PAE

Esta modalidad levanta frontend, gateway, cuatro microservicios, cuatro bases de
datos PostgreSQL y Redis. Un proxy adicional publica toda la aplicacion bajo un
solo origen y Cloudflare crea una URL HTTPS temporal sin credenciales.

## Requisitos

- Docker Desktop en ejecucion.
- Puertos del archivo `.env` disponibles.
- Acceso a Internet para descargar imagenes y crear el tunel.

## Inicio completo

Desde la raiz del repositorio:

```powershell
docker compose -f docker-compose.yml -f docker-compose.demo.yml up --build -d
```

Comprobar el estado:

```powershell
docker compose -f docker-compose.yml -f docker-compose.demo.yml ps
Invoke-WebRequest http://localhost:8080/health -UseBasicParsing
Invoke-WebRequest http://localhost:8080/api/auth/health -UseBasicParsing
Invoke-WebRequest http://localhost:8080/api/content/health -UseBasicParsing
Invoke-WebRequest http://localhost:8080/api/community/health -UseBasicParsing
Invoke-WebRequest http://localhost:8080/api/learning/health -UseBasicParsing
```

Obtener la URL publica:

```powershell
docker compose -f docker-compose.yml -f docker-compose.demo.yml logs demo-tunnel
```

Buscar la direccion terminada en `trycloudflare.com`. La URL es temporal y
cambia al recrear el contenedor `demo-tunnel`.

Para consumir el backend desde un frontend alojado en otro dominio, establecer
`PUBLIC_FRONTEND_ORIGIN` y `FRONTEND_URL` con su origen, sin ruta final. Por
ejemplo, una URL `https://usuario.github.io/proyecto/` usa el origen
`https://usuario.github.io`.

## Detener la demostracion

```powershell
docker compose -f docker-compose.yml -f docker-compose.demo.yml down
```

Los volumenes de PostgreSQL se conservan. Para una demostracion normal no se
debe usar `down -v`, ya que elimina los datos locales.

## GitHub Pages

El workflow `deploy-frontend.yml` publica el frontend en GitHub Pages. En
`Settings > Pages`, seleccionar `GitHub Actions` como origen. Para conectarlo a
un backend permanente, crear la variable de repositorio `VITE_API_URL` con una
URL HTTPS que termine en `/api` y volver a ejecutar el workflow.

GitHub Pages aloja solo archivos estaticos. El stack Docker y sus bases de datos
deben ejecutarse en una maquina o proveedor externo para un entorno permanente.

## Seguridad de configuracion

Los archivos `.env` son locales y no se publican. Se debe copiar `.env.example`
a `.env` y asignar secretos distintos en cada entorno. Si un secreto estuvo en
el historial de Git, debe rotarse; eliminar el archivo del ultimo commit no
invalida el valor anterior.
