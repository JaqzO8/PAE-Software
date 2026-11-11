# Auditoría de pertinencia y capacidad de detección de pruebas

Revisión: 11 de noviembre de 2026. Alcance: los 72 casos de la matriz, conservando 4 óptimos y 4 pesimistas por categoría. Los resultados de ejecución corresponden a `RESULTADOS_PRUEBAS.md` y a los artefactos de cada ejecución de CI.

## Criterios de revisión

Cada caso debe proteger una capacidad del sistema, tener un fallo reconocible que lo haga fallar y comprobar una consecuencia observable: datos, permisos, transiciones, persistencia o un presupuesto de latencia. La complejidad se concentra en los recorridos y riesgos que la requieren; una regla de seguridad aislada sigue necesitando una prueba unitaria focalizada. El número de assertions no se cuenta como número de casos.

## Debilidades encontradas y cambios

- Los ocho casos unitarios tenían pocas combinaciones; el reconocimiento de dispositivo desplazaba reglas de mayor riesgo. Ahora cubren límites y bloqueo de MFA, autenticación con dependencias aisladas, configuración inmutable de premios, entradas manipuladas y la matriz de asignación de roles. La prueba adversa de MFA exige que un código correcto tampoco eluda un bloqueo agotado.
- Cuatro casos de carga miraban principalmente códigos HTTP o cantidades. Ahora comparan identidad y preferencias entre diez sesiones, ausencia de datos en rechazos, UUID, autoría y contenido exacto de 24 escrituras, filas reales y recuperación después de carga inválida.
- `PN-O01` era secuencial: ahora realiza ocho ediciones simultáneas sobre mensajes independientes. `PN-P01` enfrenta ocho escritores de la misma versión y exige un único ganador, siete conflictos y contenido final idéntico al del ganador. `PN-P04` comprueba además la unicidad de la amistad en PostgreSQL.
- `PR-P02` solo verificaba la primera página: ahora recorre siete páginas y exige 500 IDs/contenidos únicos, sin omisiones ni datos ajenos, además de los presupuestos HTTP y SQL.
- `PR-P04` afirmaba recuperación de memoria sin medirla: se corrige su objetivo a recuperación de servicio y latencia, comparando 20 lecturas antes y después de 100 peticiones sobredimensionadas. No se presenta como prueba de ausencia de fugas de memoria.
- `PS-O03` solo comprobaba encabezados: ahora valida un recorrido alumno/docente de consulta, respuesta, resolución desde interfaz, recarga y consistencia con API.
- `PI-O01` prometía persistencia tras recarga sin recargar: ahora comprueba también esa recarga real.
- `PR-O02` no demostraba uso de índice: su descripción refleja lo que comprueba, plan de consulta y tiempo SQL, sin exigir una elección concreta del optimizador sobre un conjunto pequeño.

Se refuerzan 19 casos y se corrige una descripción de rendimiento. Los demás conservan objetivos distintos que siguen siendo necesarios, detallados abajo.

La regresión del agente de dispositivo se conserva fuera de la matriz en `tests/auth/deviceInfo.test.cjs`: entrada malformada, prefijo limitado a 512 caracteres y cabecera hostil de un millón de caracteres. CI la ejecuta con las unitarias; no se suma al total de 72.

## Riesgo y evidencia por pareja de casos

Cada fila representa un caso óptimo y uno pesimista; el detalle ejecutable de entradas y resultados está en `MATRIZ_PRUEBAS.md`.

| IDs O/P | Capacidad y defecto que deben detectar | Evidencia decisiva |
|---|---|---|
| PU-01 | Seguridad de contraseña, OTP y bloqueo | Límites de longitud, intentos restantes 2/1/0, bloqueo incluso con código correcto, alcance restringido |
| PU-02 | Autenticación y MFA ante dependencias fallidas | Orden de validación, desafío persistido, ausencia de OTP en producción, errores propagados sin sesión completa |
| PU-03 | Premios sustentados en resultados confirmados | Identidad/origen/versión exactos, configuración inmutable, rechazo de evidencia o reglas manipuladas antes de persistir |
| PU-04 | Administración de roles y solicitud docente | Tabla de permisos, roles desconocidos rechazados, registro público sin privilegios |
| PC-01 | Aislamiento de sesiones bajo carga | Identidades y preferencias exactas; rechazos sin datos para token ausente, falso o revocado |
| PC-02 | Lectura concurrente de chat privado | Mensajes disponibles para miembros y 403 para ajenos bajo carga |
| PC-03 | Integridad de escritura bajo carga | IDs, UUID, contenido y autoría exactos; BD sin residuos inválidos y escritura posterior válida |
| PC-04 | Continuidad con tráfico sostenido válido/inválido | Presupuesto de latencia, códigos de respuesta y disponibilidad posterior |
| PR-01 | Latencia de consulta protegida y rechazo | Media, mediana, p95/p99 y presupuestos distintos para acceso y rechazo |
| PR-02 | Consultas e historial paginado | Plan/tiempo SQL; siete páginas sin duplicados, pérdidas ni filtraciones |
| PR-03 | Tiempo de acceso y salida del estado de carga ante fallo | Formulario utilizable y navegación fuera de datos protegidos bajo interrupción controlada |
| PR-04 | Recursos y recuperación ante peticiones excesivas | Estadísticas Docker; 413 en ráfaga y p95 posterior comparado con el basal |
| PN-01 | Actualización optimista bajo contención | Ocho ediciones independientes; un ganador exacto al competir por la misma versión |
| PN-02 | Escrituras de usuarios distintos e idempotencia incompatible | Preferencias aisladas; mismo UUID con distinto contenido no produce dos mensajes |
| PN-03 | Aceptación/revocación de invitación | Una membresía; estado final de invitación coherente con la membresía real |
| PN-04 | Reintentos y amistad bidireccional | Una fila por operación lógica, sin duplicación por reintento o solicitudes opuestas |
| PE-01 | Escalamiento de lectores y límite de publicación | Métricas por etapa, 429 observado, filas iguales a publicaciones aceptadas |
| PE-02 | Saturación y fuerza bruta | Lecturas dentro del presupuesto; cuenta bloqueada tampoco acepta la contraseña correcta |
| PE-03 | CPU restringida y pérdida del almacén de sesiones | Sin errores bajo CPU limitada; denegación durante caída real de Redis y recuperación posterior |
| PE-04 | Recuperación tras pico y reinicio | Lectura/escritura posteriores correctas; mensaje persistido y permisos conservados al reiniciar Community |
| PS-01 | Chat extremo a extremo y acceso a grupo privado | Interfaz, recarga y fila en BD; ausencia de formulario/datos para ajenos |
| PS-02 | Acceso por interfaz y credenciales erróneas | Sesión y navegación correctas; ningún token ante rechazo |
| PS-03 | Consulta académica completa y validación de formulario | Respuesta docente, resolución persistida tras recarga; formulario vacío no crea registros |
| PS-04 | Soporte extremo a extremo y fallo de transporte | Ticket en interfaz/API/BD; error visible, datos del formulario conservados y cero confirmaciones falsas |
| PI-01 | Contrato frontend/API de foros | Publicación persistida tras recarga; error de servicio visible sin contenido simulado |
| PI-02 | Subida/descarga privada de PDF | Bytes exactos y fila real; archivos inválidos y MIME falsificado rechazados |
| PI-03 | Identidad distribuida y revocación | Misma sesión entre servicios; JWT revocado rechazado por todos los servicios comprobados |
| PI-04 | Identidad central y repositorio privado | Propietario autorizado; visitante anónimo y otro docente reciben 404 sin detalle |
| PG-01 | Registro público y acceso social no verificado | Registro conserva rol estudiante; quick-login no emite token sin identidad externa verificada |
| PG-02 | Refresh y cambio de rol | Token anterior rechazado; JWT viejo no conserva privilegios revocados |
| PG-03 | Migraciones repetibles y búsqueda hostil | Filas conservadas al migrar dos veces; búsqueda maliciosa sin alterar tablas |
| PG-04 | Propiedad de desafío con IDs serializados | Propietario legítimo puede editar; miembro no autorizado no cambia estado ni contenido |
| PA-01 | Incorporación a grupo y expulsión | Invitación habilita comunicación; replay de invitación no elude una expulsión |
| PA-02 | Resolución de foro y moderación | Respuesta/estado persistidos; tercero no puede retirar una publicación ajena |
| PA-03 | Preferencias personales y cuenta desactivada | Aislamiento entre cuentas y rechazo de acceso residual de cuenta desactivada |
| PA-04 | Exportación de datos personales | Datos útiles propios sin credenciales; parámetro userId no permite suplantación |

## Comprobación de sensibilidad ante defectos

`node tests/qa/mutation-probes.mjs` ejecuta las pruebas sobre el código original y sobre cuatro copias aisladas con fallos deliberados: omitir bloqueo MFA, omitir longitud mínima de contraseña, admitir campos extra del premio y permitir asignación de roles por no administradores. La ejecución falla si un defecto sobrevive o si ocurre un error distinto de una assertion. No modifica los archivos originales ni servicios en ejecución.

Los cuatro defectos fueron detectados en la validación focalizada. Esto prueba sensibilidad ante esos cuatro riesgos; no es un porcentaje de mutación de todo el repositorio. CI ejecuta la comprobación y conserva `test-results/qa/mutation-results.json`.

## Límites que se conservan explícitos

- La matriz no reemplaza la aceptación de todas las historias ni valida los proveedores externos pendientes del proyecto.
- Las cargas de CI son acotadas. Sus presupuestos son criterios de regresión, no un SLA de producción ni una certificación de cientos de usuarios reales.
- Los fallos interceptados por Playwright prueban reacción del frontend; no equivalen a caída física del backend. Las caídas de Redis y el reinicio de Community sí son reales dentro del entorno aislado.
- Las unitarias de autenticación usan adaptadores aislados. Las garantías distribuidas, transacciones e idempotencia se comprueban aparte con API, PostgreSQL y Redis reales.
- Se mantienen 72 IDs; las verificaciones de mutación y otras suites auxiliares no se suman para inflar ese total.
