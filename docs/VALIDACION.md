# Validación de la publicación

Revisión local realizada el 13 de septiembre de 2026, zona America/Lima. Este informe se refiere a la copia preparada para PAE-Software; no certifica todos los requisitos ni la aplicación en producción.

## Resultados locales

| Comprobación | Resultado | Alcance |
| --- | --- | --- |
| Instalación frontend desde lock | Correcta | `npm ci --prefix frontend` |
| Compilación frontend | Correcta | TypeScript y Vite, 2118 módulos transformados |
| Contenido | 13 suites, 25 pruebas aprobadas | Configuración, PDF, repositorios, favoritos, compartición y ranking |
| Calidad | 2 suites, 6 pruebas aprobadas | Transformación de métricas y cliente SonarQube con dobles de prueba |
| Reglas de evaluación en vivo | 1 suite, 4 pruebas aprobadas | Condiciones de respuesta de `liveAnswerRules` |
| Configuración auth y community | 8 comprobaciones aprobadas | Rechazo de JWT débil/ausente y contraseña ausente en producción; admisión de configuración explícita |
| Docker Compose | Validación estática correcta | `docker compose config --quiet` |

Total: **35 pruebas Jest aprobadas y 8 comprobaciones adicionales de configuración**. Las suites de contenido incluyen aplicaciones simuladas y mocks; no todas ejercitan el código productivo completo. Los resultados de reglas aisladas no prueban funcionamiento integral de salas con usuarios conectados.

El archivo de bloqueo de content-service se actualizó porque `npm ci` inicialmente fallaba al no encontrar PDFKit y sus dependencias. Se añadieron archivos de bloqueo en auth/community, que no los tenían, y los Dockerfiles usan `npm ci`. El runtime de Docker y CI se alineó a Node 24; las pruebas locales se ejecutaron con Node 24.11.1. No se construyeron imágenes Docker en esta sesión porque su motor estaba apagado.

## Auditoría de dependencias

Se consultó `npm audit --omit=dev --json` por paquete. Estos recuentos dependen del registro de avisos en la fecha de consulta; las dependencias compartidas pueden repetirse entre paquetes y no deben sumarse como vulnerabilidades únicas.

| Paquete | Bajas | Moderadas | Altas | Críticas |
| --- | --- | --- | --- | --- |
| Raíz, dependencias productivas | 0 | 0 | 0 | 0 |
| Frontend | 1 | 1 | 8 | 0 |
| Auth | 0 | 4 | 0 | 0 |
| Contenido | 1 | 3 | 0 | 0 |
| Comunidad | 0 | 4 | 0 | 0 |
| Evaluaciones | 0 | 5 | 4 | 0 |
| Calidad | 0 | 3 | 0 | 0 |

Las alertas requieren revisión y actualización compatible antes de producción. No se aplicó `npm audit fix --force` ni se introdujo una actualización masiva ajena a la preparación del repositorio. Esta auditoría excluye herramientas de desarrollo y no sustituye una revisión de seguridad de la aplicación.

## Controles de publicación

Se preparó una copia con historial nuevo, exclusiones de secretos y datos operativos, generador de configuración privada, revisión preventiva de archivos y contextos Docker que excluyen archivos `.env`. Se quitaron las contraseñas de respaldo de auth/community y se documentaron las limitaciones del login simulado, rol docente y 2FA.

La revisión del catálogo encontró 114 RQ distintos y 78 secciones de historias/épicas. Los enlaces del resumen y de la matriz apuntan a código existente. La aceptación de las historias se mantiene pendiente cuando faltan escenarios, integraciones o validación de usuarios.

## Verificaciones no ejecutadas

- Arranque completo desde bases vacías, imágenes Docker y recorrido E2E: motor Docker no disponible en la sesión.
- Suites dinámicas contra una API activa y prueba de 200 estudiantes: requieren servicios, cuentas de prueba y datos aislados.
- Análisis real de SonarQube y su quality gate: no se utilizó un servidor/token real en la copia publicada.
- Compatibilidad completa de navegadores, dispositivos y lectores de pantalla.
- TLS en un dominio, envío efectivo de correo, OAuth, 2FA integral y control institucional del rol docente.
- Respaldos diarios programados y restauración ante fallos.

Las capturas o porcentajes de cobertura históricos no se trasladaron como evidencia nueva. El perfil Sonar existente excluye capas amplias de la métrica de cobertura y no incluye auth/community en sus fuentes; sus resultados no deben presentarse como cobertura total de PAE.

## Reproducir controles

```sh
npm ci
npm ci --prefix frontend
npm ci --prefix backend/services/content-service
npm ci --prefix backend/services/quality-service
npm ci --prefix backend/services/auth-service
npm ci --prefix backend/services/community-service
npm run build --prefix frontend
npm test --prefix backend/services/content-service -- --runInBand
npm test --prefix backend/services/quality-service
npm run test:exam
npm run test:config
node scripts/check-repository-safety.mjs
docker compose config --quiet
```

Genera primero `.env` con `node scripts/setup-local.mjs` para validar Compose. GitHub Actions ejecuta compilación, pruebas y revisión de fuentes; sus ejecuciones remotas constituyen evidencia adicional y sus resultados deben consultarse en la pestaña Actions.

La revisión previa del índice encontró 398 archivos, solo `.env.example` entre archivos de entorno y ninguna coincidencia con los valores privados de contraseñas, JWT y tokens de las configuraciones locales inspeccionadas. También se comprobaron enlaces internos de la documentación. Es una revisión de patrones y valores conocidos, no una garantía universal de ausencia de secretos.
