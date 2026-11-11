# Resultados de la ejecución QA

Fecha UTC: 2026-11-11T14:51:29.551Z. Revisión Git: b288f61aef3ed640354a61cd4883f3648700acc2. Ejecución: local; puede incluir cambios sin commit. Ambiente: pae_qa, puertos 13000 y 15173. Evidencia detallada: test-results/qa/results.json, capturas por ID y logs de ejecución.

| ID | Caso | Estado real | Duración ms | Resultado / defecto |
|---|---|---|---:|---|
| PU-O01 | Límites y alcance de MFA | aprobado | 5 | Assertions satisfechas; ver evidencia JSON  |
| PU-P01 | Bloqueo irrevocable del desafío | aprobado | 0 | Assertions satisfechas; ver evidencia JSON  |
| PU-O02 | Autenticación y emisión condicionada de MFA | aprobado | 2 | Assertions satisfechas; ver evidencia JSON  |
| PU-P02 | Autenticación ante denegación y fallo de dependencias | aprobado | 3 | Assertions satisfechas; ver evidencia JSON  |
| PU-O03 | Premio con configuración inmutable | aprobado | 4 | Assertions satisfechas; ver evidencia JSON  |
| PU-P03 | Contrato antifraude de resultados y reglas | aprobado | 1 | Assertions satisfechas; ver evidencia JSON  |
| PU-O04 | Política administrativa y solicitud docente válida | aprobado | 1 | Assertions satisfechas; ver evidencia JSON  |
| PU-P04 | Matriz completa de escalada y roles desconocidos | aprobado | 0 | Assertions satisfechas; ver evidencia JSON  |
| PC-O01 | Carga multiusuario con aislamiento de datos | aprobado | 6477 | Assertions satisfechas; ver evidencia JSON  |
| PC-P01 | Carga adversa con credenciales ausentes, falsas y revocadas | aprobado | 1078 | Assertions satisfechas; ver evidencia JSON  |
| PC-O02 | Lecturas repetidas de mensajes | aprobado | 4728 | Assertions satisfechas; ver evidencia JSON  |
| PC-P02 | Lecturas reiteradas por miembro ajeno | aprobado | 3471 | Assertions satisfechas; ver evidencia JSON  |
| PC-O03 | Carga de escritura con integridad y autoría | aprobado | 3091 | Assertions satisfechas; ver evidencia JSON  |
| PC-P03 | Carga inválida sin persistencia parcial y recuperación | aprobado | 2664 | Assertions satisfechas; ver evidencia JSON  |
| PC-O04 | Tráfico sostenido autorizado | aprobado | 5530 | Assertions satisfechas; ver evidencia JSON  |
| PC-P04 | Tráfico sostenido con token inválido | aprobado | 5096 | Assertions satisfechas; ver evidencia JSON  |
| PR-O01 | Latencia de endpoint protegido | aprobado | 1913 | Assertions satisfechas; ver evidencia JSON  |
| PR-P01 | Latencia del rechazo de credencial | aprobado | 751 | Assertions satisfechas; ver evidencia JSON  |
| PR-O02 | Plan de consulta de historial acotado | aprobado | 2444 | Assertions satisfechas; ver evidencia JSON  |
| PR-P02 | Historial amplio paginado sin pérdidas ni filtraciones | aprobado | 5626 | Assertions satisfechas; ver evidencia JSON  |
| PR-O03 | Carga de interfaz de acceso | aprobado | 6004 | Assertions satisfechas; ver evidencia JSON  |
| PR-P03 | Interfaz ante API no disponible | aprobado | 10456 | Assertions satisfechas; ver evidencia JSON  |
| PR-O04 | Recursos durante lectura concurrente | aprobado | 4306 | Assertions satisfechas; ver evidencia JSON  |
| PR-P04 | Ráfaga sobredimensionada sin degradación posterior | aprobado | 1653 | Assertions satisfechas; ver evidencia JSON  |
| PN-O01 | Ediciones concurrentes independientes sin pérdida | aprobado | 1851 | Assertions satisfechas; ver evidencia JSON  |
| PN-P01 | Ocho escritores sobre una misma versión | aprobado | 1700 | Assertions satisfechas; ver evidencia JSON  |
| PN-O02 | Solicitudes independientes simultáneas | aprobado | 1929 | Assertions satisfechas; ver evidencia JSON  |
| PN-P02 | Idempotencia con payload incompatible | aprobado | 1096 | Assertions satisfechas; ver evidencia JSON  |
| PN-O03 | Aceptaciones simultáneas de invitación | aprobado | 1255 | Assertions satisfechas; ver evidencia JSON  |
| PN-P03 | Aceptación concurrente con revocación | aprobado | 1550 | Assertions satisfechas; ver evidencia JSON  |
| PN-O04 | Reintentos de mensaje tras respuesta perdida | aprobado | 800 | Assertions satisfechas; ver evidencia JSON  |
| PN-P04 | Amistad en direcciones opuestas | aprobado | 1483 | Assertions satisfechas; ver evidencia JSON  |
| PE-O01 | Carga progresiva dentro del presupuesto | aprobado | 1209 | Assertions satisfechas; ver evidencia JSON  |
| PE-P01 | Sobrecarga del límite de publicación | aprobado | 3428 | Assertions satisfechas; ver evidencia JSON  |
| PE-O02 | Saturación controlada de lecturas | aprobado | 2344 | Assertions satisfechas; ver evidencia JSON  |
| PE-P02 | Saturación de autenticación fallida | aprobado | 1828 | Assertions satisfechas; ver evidencia JSON  |
| PE-O03 | Servicio con CPU limitada | aprobado | 2976 | Assertions satisfechas; ver evidencia JSON  |
| PE-P03 | Pérdida del almacén de sesión | aprobado | 3436 | Assertions satisfechas; ver evidencia JSON  |
| PE-O04 | Recuperación después de pico de consultas | aprobado | 2274 | Assertions satisfechas; ver evidencia JSON  |
| PE-P04 | Recuperación tras reinicio del servicio | aprobado | 6450 | Assertions satisfechas; ver evidencia JSON  |
| PS-O01 | Flujo de chat desde navegador hasta BD | aprobado | 16367 | Assertions satisfechas; ver evidencia JSON  |
| PS-P01 | Acceso a grupo ajeno desde navegador | aprobado | 3667 | Assertions satisfechas; ver evidencia JSON  |
| PS-O02 | Login real por interfaz | aprobado | 5097 | Assertions satisfechas; ver evidencia JSON  |
| PS-P02 | Rechazo de contraseña desde interfaz | aprobado | 14832 | Assertions satisfechas; ver evidencia JSON  |
| PS-O03 | Consulta académica respondida y resuelta desde interfaz | aprobado | 8767 | Assertions satisfechas; ver evidencia JSON  |
| PS-P03 | Formulario de publicación vacío | aprobado | 6455 | Assertions satisfechas; ver evidencia JSON  |
| PI-O01 | Frontend/API de foros con persistencia | aprobado | 11039 | Assertions satisfechas; ver evidencia JSON  |
| PI-P01 | Respuesta de error de API visible en interfaz | aprobado | 4072 | Assertions satisfechas; ver evidencia JSON  |
| PI-O02 | PDF privado persistido y descargado | aprobado | 2800 | Assertions satisfechas; ver evidencia JSON  |
| PI-P02 | Archivo no PDF rechazado | aprobado | 2524 | Assertions satisfechas; ver evidencia JSON  |
| PI-O03 | Identidad autoriza Comunidad y Evaluación | aprobado | 388 | Assertions satisfechas; ver evidencia JSON  |
| PI-P03 | Logout revoca acceso distribuido real | aprobado | 568 | Assertions satisfechas; ver evidencia JSON  |
| PG-O01 | Registro conserva contrato de alumno | aprobado | 488 | Assertions satisfechas; ver evidencia JSON  |
| PG-P01 | Acceso social sin identidad verificada | aprobado | 740 | Assertions satisfechas; ver evidencia JSON  |
| PG-O02 | Renovar sesión mantiene contrato | aprobado | 487 | Assertions satisfechas; ver evidencia JSON  |
| PG-P02 | Cambio de rol invalida permiso anterior | aprobado | 2148 | Assertions satisfechas; ver evidencia JSON  |
| PG-O03 | Migraciones repetibles sin pérdida | aprobado | 4871 | Assertions satisfechas; ver evidencia JSON  |
| PG-P03 | Inyección SQL en búsqueda de usuarios | aprobado | 2138 | Assertions satisfechas; ver evidencia JSON  |
| PA-O01 | Crear, invitar, aceptar, conversar | aprobado | 1739 | Assertions satisfechas; ver evidencia JSON  |
| PA-P01 | Expulsión impide reingreso con invitación anterior | aprobado | 1859 | Assertions satisfechas; ver evidencia JSON  |
| PA-O02 | Foro con respuesta y resolución | aprobado | 900 | Assertions satisfechas; ver evidencia JSON  |
| PA-P02 | Moderación ajena bloqueada | aprobado | 769 | Assertions satisfechas; ver evidencia JSON  |
| PA-O03 | Preferencias persistentes y aislamiento | aprobado | 730 | Assertions satisfechas; ver evidencia JSON  |
| PA-P03 | Cuenta desactivada sin acceso residual | aprobado | 1036 | Assertions satisfechas; ver evidencia JSON  |
| PS-O04 | Soporte completo desde interfaz hasta persistencia | aprobado | 7968 | Assertions satisfechas; ver evidencia JSON  |
| PS-P04 | Soporte ante fallo de transporte | aprobado | 3559 | Assertions satisfechas; ver evidencia JSON  |
| PI-O04 | Identidad central autoriza contenido privado propio | aprobado | 1158 | Assertions satisfechas; ver evidencia JSON  |
| PI-P04 | Contenido privado no cruza identidades | aprobado | 2042 | Assertions satisfechas; ver evidencia JSON  |
| PG-O04 | Propietario de desafío conserva permisos con IDs serializados | aprobado | 1494 | Assertions satisfechas; ver evidencia JSON  |
| PG-P04 | Corrección de propiedad no concede edición a terceros | aprobado | 1364 | Assertions satisfechas; ver evidencia JSON  |
| PA-O04 | Exportación personal útil sin credenciales | aprobado | 397 | Assertions satisfechas; ver evidencia JSON  |
| PA-P04 | Exportación no acepta suplantación de otra cuenta | aprobado | 741 | Assertions satisfechas; ver evidencia JSON  |

Aprobados: 72/72. Fallidos: 0. La aceptación de producto requiere revisión del equipo.
