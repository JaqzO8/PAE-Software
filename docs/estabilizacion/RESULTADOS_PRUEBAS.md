# Resultados de la ejecución QA

Fecha UTC: 2026-10-26T03:00:58.567Z. Base Git: 9c1706e035d30e411fba28021911a952e8aadb59; incluye cambios locales de estabilización. Ambiente: pae_qa, puertos 13000 y 15173. Evidencia detallada: test-results/qa/results.json, capturas por ID y logs de ejecución.

| ID | Caso | Estado real | Duración ms | Resultado / defecto |
|---|---|---|---:|---|
| PU-O01 | Contraseña y OTP válidos | aprobado | 0 | Assertions satisfechas; ver evidencia JSON  |
| PU-P01 | Contraseña y OTP inválidos o agotados | aprobado | 0 | Assertions satisfechas; ver evidencia JSON  |
| PU-O02 | Extracción de dispositivo | aprobado | 0 | Assertions satisfechas; ver evidencia JSON  |
| PU-P02 | Agente hostil acotado | aprobado | 1 | Assertions satisfechas; ver evidencia JSON  |
| PU-O03 | Regla versionada de premios | aprobado | 2 | Assertions satisfechas; ver evidencia JSON  |
| PU-P03 | Resultado manipulado por cliente | aprobado | 1 | Assertions satisfechas; ver evidencia JSON  |
| PU-O04 | Asignación administrativa de rol | aprobado | 0 | Assertions satisfechas; ver evidencia JSON  |
| PU-P04 | Escalada de privilegios | aprobado | 0 | Assertions satisfechas; ver evidencia JSON  |
| PC-O01 | Lectura con diez sesiones | aprobado | 1653 | Assertions satisfechas; ver evidencia JSON  |
| PC-P01 | Carga sin credenciales | aprobado | 55 | Assertions satisfechas; ver evidencia JSON  |
| PC-O02 | Lecturas repetidas de mensajes | aprobado | 2052 | Assertions satisfechas; ver evidencia JSON  |
| PC-P02 | Lecturas reiteradas por miembro ajeno | aprobado | 1456 | Assertions satisfechas; ver evidencia JSON  |
| PC-O03 | Escrituras concurrentes válidas | aprobado | 1015 | Assertions satisfechas; ver evidencia JSON  |
| PC-P03 | Escrituras inválidas bajo carga | aprobado | 1165 | Assertions satisfechas; ver evidencia JSON  |
| PC-O04 | Tráfico sostenido autorizado | aprobado | 5352 | Assertions satisfechas; ver evidencia JSON  |
| PC-P04 | Tráfico sostenido con token inválido | aprobado | 5028 | Assertions satisfechas; ver evidencia JSON  |
| PR-O01 | Latencia de endpoint protegido | aprobado | 977 | Assertions satisfechas; ver evidencia JSON  |
| PR-P01 | Latencia del rechazo de credencial | aprobado | 442 | Assertions satisfechas; ver evidencia JSON  |
| PR-O02 | Consulta de historial con índice | aprobado | 1624 | Assertions satisfechas; ver evidencia JSON  |
| PR-P02 | Consulta sobre historial amplio | aprobado | 2412 | Assertions satisfechas; ver evidencia JSON  |
| PR-O03 | Carga de interfaz de acceso | aprobado | 3275 | Assertions satisfechas; ver evidencia JSON  |
| PR-P03 | Interfaz ante API no disponible | aprobado | 1956 | Assertions satisfechas; ver evidencia JSON  |
| PR-O04 | Recursos durante lectura concurrente | aprobado | 3787 | Assertions satisfechas; ver evidencia JSON  |
| PR-P04 | Recuperación de memoria tras peticiones inválidas | aprobado | 2022 | Assertions satisfechas; ver evidencia JSON  |
| PN-O01 | Actualizaciones secuenciales con versiones | aprobado | 1032 | Assertions satisfechas; ver evidencia JSON  |
| PN-P01 | Edición simultánea conflictiva | aprobado | 1042 | Assertions satisfechas; ver evidencia JSON  |
| PN-O02 | Solicitudes independientes simultáneas | aprobado | 630 | Assertions satisfechas; ver evidencia JSON  |
| PN-P02 | Idempotencia con payload incompatible | aprobado | 975 | Assertions satisfechas; ver evidencia JSON  |
| PN-O03 | Aceptaciones simultáneas de invitación | aprobado | 1655 | Assertions satisfechas; ver evidencia JSON  |
| PN-P03 | Aceptación concurrente con revocación | aprobado | 2037 | Assertions satisfechas; ver evidencia JSON  |
| PN-O04 | Reintentos de mensaje tras respuesta perdida | aprobado | 1128 | Assertions satisfechas; ver evidencia JSON  |
| PN-P04 | Amistad en direcciones opuestas | aprobado | 286 | Assertions satisfechas; ver evidencia JSON  |
| PE-O01 | Carga progresiva dentro del presupuesto | aprobado | 470 | Assertions satisfechas; ver evidencia JSON  |
| PE-P01 | Sobrecarga del límite de publicación | aprobado | 2198 | Assertions satisfechas; ver evidencia JSON  |
| PE-O02 | Saturación controlada de lecturas | aprobado | 663 | Assertions satisfechas; ver evidencia JSON  |
| PE-P02 | Saturación de autenticación fallida | aprobado | 743 | Assertions satisfechas; ver evidencia JSON  |
| PE-O03 | Servicio con CPU limitada | aprobado | 2654 | Assertions satisfechas; ver evidencia JSON  |
| PE-P03 | Pérdida del almacén de sesión | aprobado | 3322 | Assertions satisfechas; ver evidencia JSON  |
| PE-O04 | Recuperación después de pico de consultas | aprobado | 1172 | Assertions satisfechas; ver evidencia JSON  |
| PE-P04 | Recuperación tras reinicio del servicio | aprobado | 4705 | Assertions satisfechas; ver evidencia JSON  |
| PS-O01 | Flujo de chat desde navegador hasta BD | aprobado | 4889 | Assertions satisfechas; ver evidencia JSON  |
| PS-P01 | Acceso a grupo ajeno desde navegador | aprobado | 5254 | Assertions satisfechas; ver evidencia JSON  |
| PS-O02 | Login real por interfaz | aprobado | 2274 | Assertions satisfechas; ver evidencia JSON  |
| PS-P02 | Rechazo de contraseña desde interfaz | aprobado | 2523 | Assertions satisfechas; ver evidencia JSON  |
| PS-O03 | Navegación de funcionalidades integradas | aprobado | 2253 | Assertions satisfechas; ver evidencia JSON  |
| PS-P03 | Formulario de publicación vacío | aprobado | 3375 | Assertions satisfechas; ver evidencia JSON  |
| PI-O01 | Frontend/API de foros con persistencia | aprobado | 2876 | Assertions satisfechas; ver evidencia JSON  |
| PI-P01 | Respuesta de error de API visible en interfaz | aprobado | 2248 | Assertions satisfechas; ver evidencia JSON  |
| PI-O02 | PDF privado persistido y descargado | aprobado | 1774 | Assertions satisfechas; ver evidencia JSON  |
| PI-P02 | Archivo no PDF rechazado | aprobado | 1622 | Assertions satisfechas; ver evidencia JSON  |
| PI-O03 | Identidad autoriza Comunidad y Evaluación | aprobado | 376 | Assertions satisfechas; ver evidencia JSON  |
| PI-P03 | Logout revoca acceso distribuido real | aprobado | 501 | Assertions satisfechas; ver evidencia JSON  |
| PG-O01 | Registro conserva contrato de alumno | aprobado | 202 | Assertions satisfechas; ver evidencia JSON  |
| PG-P01 | Acceso social sin identidad verificada | aprobado | 737 | Assertions satisfechas; ver evidencia JSON  |
| PG-O02 | Renovar sesión mantiene contrato | aprobado | 372 | Assertions satisfechas; ver evidencia JSON  |
| PG-P02 | Cambio de rol invalida permiso anterior | aprobado | 1591 | Assertions satisfechas; ver evidencia JSON  |
| PG-O03 | Migraciones repetibles sin pérdida | aprobado | 3274 | Assertions satisfechas; ver evidencia JSON  |
| PG-P03 | Inyección SQL en búsqueda de usuarios | aprobado | 1460 | Assertions satisfechas; ver evidencia JSON  |
| PA-O01 | Crear, invitar, aceptar, conversar | aprobado | 1524 | Assertions satisfechas; ver evidencia JSON  |
| PA-P01 | Expulsión impide reingreso con invitación anterior | aprobado | 1465 | Assertions satisfechas; ver evidencia JSON  |
| PA-O02 | Foro con respuesta y resolución | aprobado | 655 | Assertions satisfechas; ver evidencia JSON  |
| PA-P02 | Moderación ajena bloqueada | aprobado | 701 | Assertions satisfechas; ver evidencia JSON  |
| PA-O03 | Preferencias persistentes y aislamiento | aprobado | 794 | Assertions satisfechas; ver evidencia JSON  |
| PA-P03 | Cuenta desactivada sin acceso residual | aprobado | 901 | Assertions satisfechas; ver evidencia JSON  |

Aprobados: 64/64. Fallidos: 0. La aceptación de producto requiere revisión del equipo.
