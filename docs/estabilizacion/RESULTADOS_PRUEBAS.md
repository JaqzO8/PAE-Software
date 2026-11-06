# Resultados de la ejecución QA

Fecha UTC: 2026-11-06T13:28:24.425Z. Revisión Git: 03760ea7b05122caa7683f7f1f438a14b5461352. Ejecución: local; puede incluir cambios sin commit. Ambiente: pae_qa, puertos 13000 y 15173. Evidencia detallada: test-results/qa/results.json, capturas por ID y logs de ejecución.

| ID | Caso | Estado real | Duración ms | Resultado / defecto |
|---|---|---|---:|---|
| PU-O01 | Contraseña y OTP válidos | aprobado | 0 | Assertions satisfechas; ver evidencia JSON  |
| PU-P01 | Contraseña y OTP inválidos o agotados | aprobado | 0 | Assertions satisfechas; ver evidencia JSON  |
| PU-O02 | Extracción de dispositivo | aprobado | 0 | Assertions satisfechas; ver evidencia JSON  |
| PU-P02 | Agente hostil acotado | aprobado | 1 | Assertions satisfechas; ver evidencia JSON  |
| PU-O03 | Regla versionada de premios | aprobado | 1 | Assertions satisfechas; ver evidencia JSON  |
| PU-P03 | Resultado manipulado por cliente | aprobado | 44 | Assertions satisfechas; ver evidencia JSON  |
| PU-O04 | Asignación administrativa de rol | aprobado | 0 | Assertions satisfechas; ver evidencia JSON  |
| PU-P04 | Escalada de privilegios | aprobado | 0 | Assertions satisfechas; ver evidencia JSON  |
| PC-O01 | Lectura con diez sesiones | aprobado | 4399 | Assertions satisfechas; ver evidencia JSON  |
| PC-P01 | Carga sin credenciales | aprobado | 266 | Assertions satisfechas; ver evidencia JSON  |
| PC-O02 | Lecturas repetidas de mensajes | aprobado | 3620 | Assertions satisfechas; ver evidencia JSON  |
| PC-P02 | Lecturas reiteradas por miembro ajeno | aprobado | 2920 | Assertions satisfechas; ver evidencia JSON  |
| PC-O03 | Escrituras concurrentes válidas | aprobado | 1590 | Assertions satisfechas; ver evidencia JSON  |
| PC-P03 | Escrituras inválidas bajo carga | aprobado | 1573 | Assertions satisfechas; ver evidencia JSON  |
| PC-O04 | Tráfico sostenido autorizado | aprobado | 5410 | Assertions satisfechas; ver evidencia JSON  |
| PC-P04 | Tráfico sostenido con token inválido | aprobado | 5036 | Assertions satisfechas; ver evidencia JSON  |
| PR-O01 | Latencia de endpoint protegido | aprobado | 1051 | Assertions satisfechas; ver evidencia JSON  |
| PR-P01 | Latencia del rechazo de credencial | aprobado | 356 | Assertions satisfechas; ver evidencia JSON  |
| PR-O02 | Consulta de historial con índice | aprobado | 2031 | Assertions satisfechas; ver evidencia JSON  |
| PR-P02 | Consulta sobre historial amplio | aprobado | 2750 | Assertions satisfechas; ver evidencia JSON  |
| PR-O03 | Carga de interfaz de acceso | aprobado | 2210 | Assertions satisfechas; ver evidencia JSON  |
| PR-P03 | Interfaz ante API no disponible | aprobado | 2614 | Assertions satisfechas; ver evidencia JSON  |
| PR-O04 | Recursos durante lectura concurrente | aprobado | 4567 | Assertions satisfechas; ver evidencia JSON  |
| PR-P04 | Recuperación de memoria tras peticiones inválidas | aprobado | 2375 | Assertions satisfechas; ver evidencia JSON  |
| PN-O01 | Actualizaciones secuenciales con versiones | aprobado | 1507 | Assertions satisfechas; ver evidencia JSON  |
| PN-P01 | Edición simultánea conflictiva | aprobado | 1505 | Assertions satisfechas; ver evidencia JSON  |
| PN-O02 | Solicitudes independientes simultáneas | aprobado | 1952 | Assertions satisfechas; ver evidencia JSON  |
| PN-P02 | Idempotencia con payload incompatible | aprobado | 1469 | Assertions satisfechas; ver evidencia JSON  |
| PN-O03 | Aceptaciones simultáneas de invitación | aprobado | 2181 | Assertions satisfechas; ver evidencia JSON  |
| PN-P03 | Aceptación concurrente con revocación | aprobado | 2715 | Assertions satisfechas; ver evidencia JSON  |
| PN-O04 | Reintentos de mensaje tras respuesta perdida | aprobado | 1551 | Assertions satisfechas; ver evidencia JSON  |
| PN-P04 | Amistad en direcciones opuestas | aprobado | 691 | Assertions satisfechas; ver evidencia JSON  |
| PE-O01 | Carga progresiva dentro del presupuesto | aprobado | 1258 | Assertions satisfechas; ver evidencia JSON  |
| PE-P01 | Sobrecarga del límite de publicación | aprobado | 2638 | Assertions satisfechas; ver evidencia JSON  |
| PE-O02 | Saturación controlada de lecturas | aprobado | 1974 | Assertions satisfechas; ver evidencia JSON  |
| PE-P02 | Saturación de autenticación fallida | aprobado | 2055 | Assertions satisfechas; ver evidencia JSON  |
| PE-O03 | Servicio con CPU limitada | aprobado | 2791 | Assertions satisfechas; ver evidencia JSON  |
| PE-P03 | Pérdida del almacén de sesión | aprobado | 3398 | Assertions satisfechas; ver evidencia JSON  |
| PE-O04 | Recuperación después de pico de consultas | aprobado | 1863 | Assertions satisfechas; ver evidencia JSON  |
| PE-P04 | Recuperación tras reinicio del servicio | aprobado | 5126 | Assertions satisfechas; ver evidencia JSON  |
| PS-O01 | Flujo de chat desde navegador hasta BD | aprobado | 4648 | Assertions satisfechas; ver evidencia JSON  |
| PS-P01 | Acceso a grupo ajeno desde navegador | aprobado | 3935 | Assertions satisfechas; ver evidencia JSON  |
| PS-O02 | Login real por interfaz | aprobado | 2543 | Assertions satisfechas; ver evidencia JSON  |
| PS-P02 | Rechazo de contraseña desde interfaz | aprobado | 2630 | Assertions satisfechas; ver evidencia JSON  |
| PS-O03 | Navegación de funcionalidades integradas | aprobado | 2863 | Assertions satisfechas; ver evidencia JSON  |
| PS-P03 | Formulario de publicación vacío | aprobado | 3533 | Assertions satisfechas; ver evidencia JSON  |
| PI-O01 | Frontend/API de foros con persistencia | aprobado | 2757 | Assertions satisfechas; ver evidencia JSON  |
| PI-P01 | Respuesta de error de API visible en interfaz | aprobado | 2693 | Assertions satisfechas; ver evidencia JSON  |
| PI-O02 | PDF privado persistido y descargado | aprobado | 2023 | Assertions satisfechas; ver evidencia JSON  |
| PI-P02 | Archivo no PDF rechazado | aprobado | 2097 | Assertions satisfechas; ver evidencia JSON  |
| PI-O03 | Identidad autoriza Comunidad y Evaluación | aprobado | 381 | Assertions satisfechas; ver evidencia JSON  |
| PI-P03 | Logout revoca acceso distribuido real | aprobado | 582 | Assertions satisfechas; ver evidencia JSON  |
| PG-O01 | Registro conserva contrato de alumno | aprobado | 323 | Assertions satisfechas; ver evidencia JSON  |
| PG-P01 | Acceso social sin identidad verificada | aprobado | 544 | Assertions satisfechas; ver evidencia JSON  |
| PG-O02 | Renovar sesión mantiene contrato | aprobado | 444 | Assertions satisfechas; ver evidencia JSON  |
| PG-P02 | Cambio de rol invalida permiso anterior | aprobado | 1838 | Assertions satisfechas; ver evidencia JSON  |
| PG-O03 | Migraciones repetibles sin pérdida | aprobado | 4003 | Assertions satisfechas; ver evidencia JSON  |
| PG-P03 | Inyección SQL en búsqueda de usuarios | aprobado | 1546 | Assertions satisfechas; ver evidencia JSON  |
| PA-O01 | Crear, invitar, aceptar, conversar | aprobado | 1530 | Assertions satisfechas; ver evidencia JSON  |
| PA-P01 | Expulsión impide reingreso con invitación anterior | aprobado | 1418 | Assertions satisfechas; ver evidencia JSON  |
| PA-O02 | Foro con respuesta y resolución | aprobado | 890 | Assertions satisfechas; ver evidencia JSON  |
| PA-P02 | Moderación ajena bloqueada | aprobado | 674 | Assertions satisfechas; ver evidencia JSON  |
| PA-O03 | Preferencias persistentes y aislamiento | aprobado | 724 | Assertions satisfechas; ver evidencia JSON  |
| PA-P03 | Cuenta desactivada sin acceso residual | aprobado | 996 | Assertions satisfechas; ver evidencia JSON  |
| PS-O04 | Soporte completo desde interfaz hasta persistencia | aprobado | 3871 | Assertions satisfechas; ver evidencia JSON  |
| PS-P04 | Soporte ante fallo de transporte | aprobado | 3133 | Assertions satisfechas; ver evidencia JSON  |
| PI-O04 | Identidad central autoriza contenido privado propio | aprobado | 1137 | Assertions satisfechas; ver evidencia JSON  |
| PI-P04 | Contenido privado no cruza identidades | aprobado | 1973 | Assertions satisfechas; ver evidencia JSON  |
| PG-O04 | Propietario de desafío conserva permisos con IDs serializados | aprobado | 1523 | Assertions satisfechas; ver evidencia JSON  |
| PG-P04 | Corrección de propiedad no concede edición a terceros | aprobado | 1580 | Assertions satisfechas; ver evidencia JSON  |
| PA-O04 | Exportación personal útil sin credenciales | aprobado | 333 | Assertions satisfechas; ver evidencia JSON  |
| PA-P04 | Exportación no acepta suplantación de otra cuenta | aprobado | 663 | Assertions satisfechas; ver evidencia JSON  |

Aprobados: 72/72. Fallidos: 0. La aceptación de producto requiere revisión del equipo.
