# Resultados de la ejecución QA

Fecha UTC: 2026-10-27T20:05:28.094Z. Base Git: 3ea25331127a4d53ed37142c71c4ea9e11b59bd1; merge de comprobación de GitHub para PR #4, cuyo head es 949ce2e; ejecución CI 40574517435. Ambiente: pae_qa, puertos 13000 y 15173. Evidencia detallada: test-results/qa/results.json, capturas por ID y logs de ejecución.

| ID | Caso | Estado real | Duración ms | Resultado / defecto |
|---|---|---|---:|---|
| PU-O01 | Contraseña y OTP válidos | aprobado | 0 | Assertions satisfechas; ver evidencia JSON  |
| PU-P01 | Contraseña y OTP inválidos o agotados | aprobado | 0 | Assertions satisfechas; ver evidencia JSON  |
| PU-O02 | Extracción de dispositivo | aprobado | 0 | Assertions satisfechas; ver evidencia JSON  |
| PU-P02 | Agente hostil acotado | aprobado | 1 | Assertions satisfechas; ver evidencia JSON  |
| PU-O03 | Regla versionada de premios | aprobado | 1 | Assertions satisfechas; ver evidencia JSON  |
| PU-P03 | Resultado manipulado por cliente | aprobado | 0 | Assertions satisfechas; ver evidencia JSON  |
| PU-O04 | Asignación administrativa de rol | aprobado | 0 | Assertions satisfechas; ver evidencia JSON  |
| PU-P04 | Escalada de privilegios | aprobado | 0 | Assertions satisfechas; ver evidencia JSON  |
| PC-O01 | Lectura con diez sesiones | aprobado | 1476 | Assertions satisfechas; ver evidencia JSON  |
| PC-P01 | Carga sin credenciales | aprobado | 28 | Assertions satisfechas; ver evidencia JSON  |
| PC-O02 | Lecturas repetidas de mensajes | aprobado | 989 | Assertions satisfechas; ver evidencia JSON  |
| PC-P02 | Lecturas reiteradas por miembro ajeno | aprobado | 750 | Assertions satisfechas; ver evidencia JSON  |
| PC-O03 | Escrituras concurrentes válidas | aprobado | 489 | Assertions satisfechas; ver evidencia JSON  |
| PC-P03 | Escrituras inválidas bajo carga | aprobado | 468 | Assertions satisfechas; ver evidencia JSON  |
| PC-O04 | Tráfico sostenido autorizado | aprobado | 5316 | Assertions satisfechas; ver evidencia JSON  |
| PC-P04 | Tráfico sostenido con token inválido | aprobado | 5130 | Assertions satisfechas; ver evidencia JSON  |
| PR-O01 | Latencia de endpoint protegido | aprobado | 324 | Assertions satisfechas; ver evidencia JSON  |
| PR-P01 | Latencia del rechazo de credencial | aprobado | 59 | Assertions satisfechas; ver evidencia JSON  |
| PR-O02 | Consulta de historial con índice | aprobado | 520 | Assertions satisfechas; ver evidencia JSON  |
| PR-P02 | Consulta sobre historial amplio | aprobado | 649 | Assertions satisfechas; ver evidencia JSON  |
| PR-O03 | Carga de interfaz de acceso | aprobado | 1237 | Assertions satisfechas; ver evidencia JSON  |
| PR-P03 | Interfaz ante API no disponible | aprobado | 867 | Assertions satisfechas; ver evidencia JSON  |
| PR-O04 | Recursos durante lectura concurrente | aprobado | 3864 | Assertions satisfechas; ver evidencia JSON  |
| PR-P04 | Recuperación de memoria tras peticiones inválidas | aprobado | 2003 | Assertions satisfechas; ver evidencia JSON  |
| PN-O01 | Actualizaciones secuenciales con versiones | aprobado | 427 | Assertions satisfechas; ver evidencia JSON  |
| PN-P01 | Edición simultánea conflictiva | aprobado | 435 | Assertions satisfechas; ver evidencia JSON  |
| PN-O02 | Solicitudes independientes simultáneas | aprobado | 622 | Assertions satisfechas; ver evidencia JSON  |
| PN-P02 | Idempotencia con payload incompatible | aprobado | 404 | Assertions satisfechas; ver evidencia JSON  |
| PN-O03 | Aceptaciones simultáneas de invitación | aprobado | 559 | Assertions satisfechas; ver evidencia JSON  |
| PN-P03 | Aceptación concurrente con revocación | aprobado | 615 | Assertions satisfechas; ver evidencia JSON  |
| PN-O04 | Reintentos de mensaje tras respuesta perdida | aprobado | 453 | Assertions satisfechas; ver evidencia JSON  |
| PN-P04 | Amistad en direcciones opuestas | aprobado | 267 | Assertions satisfechas; ver evidencia JSON  |
| PE-O01 | Carga progresiva dentro del presupuesto | aprobado | 273 | Assertions satisfechas; ver evidencia JSON  |
| PE-P01 | Sobrecarga del límite de publicación | aprobado | 859 | Assertions satisfechas; ver evidencia JSON  |
| PE-O02 | Saturación controlada de lecturas | aprobado | 390 | Assertions satisfechas; ver evidencia JSON  |
| PE-P02 | Saturación de autenticación fallida | aprobado | 704 | Assertions satisfechas; ver evidencia JSON  |
| PE-O03 | Servicio con CPU limitada | aprobado | 623 | Assertions satisfechas; ver evidencia JSON  |
| PE-P03 | Pérdida del almacén de sesión | aprobado | 3686 | Assertions satisfechas; ver evidencia JSON  |
| PE-O04 | Recuperación después de pico de consultas | aprobado | 957 | Assertions satisfechas; ver evidencia JSON  |
| PE-P04 | Recuperación tras reinicio del servicio | aprobado | 2679 | Assertions satisfechas; ver evidencia JSON  |
| PS-O01 | Flujo de chat desde navegador hasta BD | aprobado | 2110 | Assertions satisfechas; ver evidencia JSON  |
| PS-P01 | Acceso a grupo ajeno desde navegador | aprobado | 1524 | Assertions satisfechas; ver evidencia JSON  |
| PS-O02 | Login real por interfaz | aprobado | 1595 | Assertions satisfechas; ver evidencia JSON  |
| PS-P02 | Rechazo de contraseña desde interfaz | aprobado | 1132 | Assertions satisfechas; ver evidencia JSON  |
| PS-O03 | Navegación de funcionalidades integradas | aprobado | 1225 | Assertions satisfechas; ver evidencia JSON  |
| PS-P03 | Formulario de publicación vacío | aprobado | 1205 | Assertions satisfechas; ver evidencia JSON  |
| PI-O01 | Frontend/API de foros con persistencia | aprobado | 1227 | Assertions satisfechas; ver evidencia JSON  |
| PI-P01 | Respuesta de error de API visible en interfaz | aprobado | 954 | Assertions satisfechas; ver evidencia JSON  |
| PI-O02 | PDF privado persistido y descargado | aprobado | 706 | Assertions satisfechas; ver evidencia JSON  |
| PI-P02 | Archivo no PDF rechazado | aprobado | 683 | Assertions satisfechas; ver evidencia JSON  |
| PI-O03 | Identidad autoriza Comunidad y Evaluación | aprobado | 191 | Assertions satisfechas; ver evidencia JSON  |
| PI-P03 | Logout revoca acceso distribuido real | aprobado | 361 | Assertions satisfechas; ver evidencia JSON  |
| PG-O01 | Registro conserva contrato de alumno | aprobado | 207 | Assertions satisfechas; ver evidencia JSON  |
| PG-P01 | Acceso social sin identidad verificada | aprobado | 496 | Assertions satisfechas; ver evidencia JSON  |
| PG-O02 | Renovar sesión mantiene contrato | aprobado | 288 | Assertions satisfechas; ver evidencia JSON  |
| PG-P02 | Cambio de rol invalida permiso anterior | aprobado | 476 | Assertions satisfechas; ver evidencia JSON  |
| PG-O03 | Migraciones repetibles sin pérdida | aprobado | 1480 | Assertions satisfechas; ver evidencia JSON  |
| PG-P03 | Inyección SQL en búsqueda de usuarios | aprobado | 400 | Assertions satisfechas; ver evidencia JSON  |
| PA-O01 | Crear, invitar, aceptar, conversar | aprobado | 600 | Assertions satisfechas; ver evidencia JSON  |
| PA-P01 | Expulsión impide reingreso con invitación anterior | aprobado | 603 | Assertions satisfechas; ver evidencia JSON  |
| PA-O02 | Foro con respuesta y resolución | aprobado | 538 | Assertions satisfechas; ver evidencia JSON  |
| PA-P02 | Moderación ajena bloqueada | aprobado | 507 | Assertions satisfechas; ver evidencia JSON  |
| PA-O03 | Preferencias persistentes y aislamiento | aprobado | 490 | Assertions satisfechas; ver evidencia JSON  |
| PA-P03 | Cuenta desactivada sin acceso residual | aprobado | 338 | Assertions satisfechas; ver evidencia JSON  |

Aprobados: 64/64. Fallidos: 0. La aceptación de producto requiere revisión del equipo.

