> Antecedente técnico de la versión anterior. Para el estado verificado de esta entrega consulta [Resumen ejecutivo](RESUMEN_EJECUTIVO.md), [Instalación](INSTALACION_LOCAL.md) y [Validación](VALIDACION.md). Las afirmaciones históricas de completitud no constituyen aceptación integral.

# Operacion del Modulo 8

## Backups

Ejecutar desde la raiz del proyecto con Docker levantado:

```powershell
.\scripts\backup-databases.ps1
```

El script genera dumps SQL de auth, content, community y exam en `backups/` y elimina respaldos con mas de 14 dias por defecto.

## Prueba de carga basica

```powershell
node .\scripts\load-test-api.mjs
```

Parametros disponibles:

- `PAE_API_URL`: URL base del gateway, por defecto `http://127.0.0.1:3000/api`.
- `PAE_LOAD_CONCURRENCY`: usuarios concurrentes sinteticos, por defecto `8`.
- `PAE_LOAD_DURATION_MS`: duracion en milisegundos, por defecto `20000`.
- `PAE_LOAD_DELAY_MS`: pausa entre requests por worker, util para smoke tests sin activar rate limiting.
- `PAE_TOKEN`: token JWT opcional para endpoints autenticados futuros.

El resultado reporta total de requests, errores y percentiles `p50`, `p95`, `p99`.

Para validar el objetivo de 200 estudiantes simultaneos, usar `scripts/load-test-200-students.mjs`.
