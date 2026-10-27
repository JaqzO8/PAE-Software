# Preparación de entrega

Estado: **candidato de estabilización para revisión; no aprobado para producción ni merge automático a main**.

## Criterios verificados

- 64 casos locales aprobados (32 óptimos + 32 pésimos), con persistencia real, controles negativos, navegador y fallos de infraestructura inducidos en QA.
- Regresiones adicionales de MFA y refresh concurrentes aprobadas.
- Compilación y suites existentes aprobadas según REPORTE_CALIDAD.md.
- Cierre de vías de acceso por correo sin prueba de identidad, sesiones revocadas y roles obsoletos; entrega privada de eventos en vivo.
- Datos de pruebas_pae preservados; secretos y evidencias sensibles fuera de Git.

## Criterios aún abiertos

1. Ejecutar el PR y comprobar Quality Gate remoto con cobertura importada sobre su commit exacto.
2. Demostrar al menos 80% de cobertura nueva; no está demostrado por los porcentajes locales actuales.
3. Resolver o clasificar con evidencia la deuda de lint y los avisos moderados de dependencias, sin reducir reglas.
4. Completar la configuración y aceptación de proveedores externos (correo/MFA/OAuth) si forman parte de la entrega productiva.
5. Revisión del equipo sobre contratos, migraciones y requisitos/historias pendientes; no confundir los casos QA con aceptación global.

## Secuencia de integración

Publicar codex/estabilizacion-qa y abrir PR hacia develop. CI ejecuta pruebas y análisis. Resolver fallos antes de solicitar aprobación. Después de revisión del equipo, integrar a develop y repetir validación. Preparar develop → main conservando los cambios de README presentes en main, solo al cumplir los criterios; no fusionar automáticamente. Contenido/Planificación se entregarán por su flujo separado.

Reproducción local: npm ci; instalar dependencias de servicios; npm run qa:up; npm run test:coverage; npm run test:qa; npm run test:qa:security; npm run qa:coverage. Usar Node 24, Docker y Chrome local (o Playwright Chromium con QA_BROWSER_CHANNEL=chromium). npm run qa:stop detiene el entorno conservando los datos. No ejecutar down -v sobre entornos del equipo.
