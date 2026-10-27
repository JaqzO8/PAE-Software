# Auditoría de estabilización PAE

Fecha de revisión: 25 de octubre de 2026 (America/Lima). Base: `origin/develop` en `9c1706e035d30e411fba28021911a952e8aadb59`. Rama de trabajo: `codex/estabilizacion-qa`. Árbol limpio al inicio. Los avances previos de José ya forman parte de develop; no se reaplican.

## Evidencia inicial

- `origin/main` está cuatro commits por delante de develop; la diferencia de contenido se limita a README.md (5 inserciones, 3 eliminaciones). Preservar ese README al preparar la promoción.
- PR #3 develop → main ya fusionado. La última validación Actions de main, ejecución `40162737689`, y develop, `40162502222`, figuran exitosas. No se ha realizado ningún merge en esta tarea.
- SonarQube Cloud es un proyecto privado, accesible mediante la sesión del navegador. Resumen de main: commit `33647f6ef1204dc19d1b998a132cb85aff0a14fb`, gate fallido por seguridad C (exige A), 27 incidencias nuevas, duplicación nueva 1.69% (máximo 3%), sin cobertura importada. El check del PR #3 pasó con 0 incidencias nuevas; su alcance diferencial no demuestra la calidad de main.
- Runtime real: React 18 / TypeScript / Vite 7; servicios Node.js 24 con Express, Sequelize/PostgreSQL; Redis, Socket.IO y Nginx. Learning usa PostgreSQL y un piloto de inbox/ledger/outbox. Existen 16 contenedores en pruebas_pae, con datos que deben preservarse.
- CI compila frontend y ejecuta pruebas Content, Quality, Exam, arquitectura y Learning, además de integración PostgreSQL. No ejecuta las suites Auth y M8 existentes ni publica cobertura en SonarCloud.

## Hallazgos y plan de verificación

| ID | Prioridad | Evidencia / impacto | Corrección propuesta | Verificación |
|---|---|---|---|---|
| QA-01 | Alta | Learning Dockerfile instala paquetes con scripts de ciclo de vida; incidencia de seguridad nueva | Instalación reproducible con scripts deshabilitados si las dependencias no los necesitan | Build y arranque real del servicio |
| QA-02 | Alta | Auth/Content registran método/ruta sin normalizar; hallazgos de inyección de logs | Registro estructurado con datos acotados, sin secretos | Entradas con controles y comprobación de formato |
| QA-03 | Alta | Cobertura no importada; configuración local excluye amplios bloques funcionales y omite Auth/Community/Learning | Medir alcance real, eliminar exclusiones funcionales injustificadas, informar brechas; no declarar 80% sin evidencia | LCOV + reporte de cobertura + análisis remoto |
| QA-04 | Alta | CI omite pruebas de autorización, MFA, revocación y plataforma | Incorporarlas con evidencias y fallo propagado | CI y ejecución local |
| QA-05 | Media | Sonar reporta complejidad en autenticar y changeMessage | Extraer reglas cohesivas manteniendo contratos | Regresión, casos normales, inválidos y concurrencia |
| QA-06 | Media | Sonar señala resolución de ejecutables por PATH en scripts Docker | Resolver ejecutables de manera explícita y validada | Tests de resolución y pruebas Docker |
| QA-07 | Media | Incidencias menores de imports, optional chaining y booleanos | Cambios puntuales verificables | Suites existentes y análisis nuevo |
| QA-08 | Alta | Piloto Learning no equivale a migración completa de Gamificación; módulos de Contenido/Planificación pendientes del equipo | Mantener autoridad y contratos existentes; clasificar funciones sin inventar integraciones | Flujos reales y documentación de dependencias |
| QA-09 | Media | Migraciones checksummed ya aplicadas tienen avisos de estilo | Preservar historial; evaluar aviso sin modificar SQL ejecutado para silenciarlo | Reejecución de migración sobre esquema existente |

## Defectos reproducidos durante estabilización

| ID | Prioridad | Defecto | Reparación y evidencia |
|---|---|---|---|
| QA-10 | Crítica | quick-login emitía sesión únicamente con el correo proporcionado | Endpoint 503 hasta disponer de proveedor verificado; acceso por contraseña conservado; PG-P01 |
| QA-11 | Alta | Los consumidores aceptaban sesiones revocadas o permisos antiguos; tests inyectaban una caché artificial | Autoridad HTTP de Auth, estado activo en BD y fingerprint de sesión; PI-P03, PG-P02, PA-P03 y test HTTP sin caché inyectada |
| QA-12 | Alta | Fallback Redis en memoria durante fallos de infraestructura perdía revocaciones/TTL entre instancias | Redis obligatorio en servicios; adaptador en memoria solo para unitarias; PE-P03 falla cerrado y recupera |
| QA-13 | Alta | MFA verificaba intentos y consumía el código en operaciones separadas | Validación, contador y consumo en Lua atómico; regresión real concurrente de Redis |
| QA-14 | Alta | Refresh no rotaba una sesión de manera indivisible | Transacción y bloqueo de fila; dos renovaciones concurrentes producen un único token vigente |
| QA-15 | Alta | Realtime de evaluación difundía partidas al lobby y no comprobaba permisos actuales | Entrega privada a participantes con revalidación de sesión; pruebas de usuario revocado, ajeno y autoridad caída |
| QA-16 | Media | Frontend refrescaba una sesión inexistente tras contraseña errónea y ocultaba el error al redirigir | No refrescar solicitudes de credenciales; PS-P02 pasó en navegador real |
| QA-17 | Alta | Logs de registro/autenticación podían contener credenciales o información del perfil | Eliminados logs de payload/objetos Axios; errores del request registran solo código |
| QA-18 | Media | Recursos confiaban solo en MIME declarado | Cabecera PDF comprobada; PI-P02 rechaza también un MIME falsificado |
| QA-19 | Media | Contadores diarios de trivia/desafíos se inventaban con Math.random; transporte de avisos inventaba entregas | UI indica no disponible; transporte sin proveedor devuelve fallido; test exige ausencia de éxito simulado |
| QA-20 | Alta | Dependencias con avisos críticos/altos | Lockfiles actualizados con npm audit fix sin force; ocho auditorías posteriores sin niveles high/critical |

## Clasificación funcional

- Verificados en el entorno aislado: registro estudiantil, acceso y rechazo, revocación distribuida, preferencias, desactivación, foros, chat persistente, invitaciones, expulsión, PDF, conflictos de versión e idempotencia. Evidencias en la matriz y resultados.
- Implementados con deuda técnica pendiente: frontend compila, pero lint global no está limpio; varios hooks y tipos heredados requieren corrección. No equivale a un fallo demostrado de todos los flujos.
- Parciales: entrega externa de correo/MFA, OAuth social, conteos diarios de partidas y cobertura automatizada de todas las pantallas. El flujo MFA de QA usa código de desarrollo y no certifica entrega de segundo factor en producción.
- Piloto: ledger/inbox/outbox de Learning comprobado por integración; no implica migración completa de gamificación ni cierre de todas las extensiones propuestas.
- Actualización del 27 de octubre: se integra Juan_Rengifo por autorización explícita. Se corrigen ruta de migraciones, arranque sobre BD existente/nueva, JSON de Planificación, identidad no sobrescribible y revocación en Learning/descargas privadas. Permanecen pendientes la aceptación de producto y las integraciones externas descritas en MODULOS_PENDIENTES.md.
