# Matriz ejecutable: 32 óptimos + 32 pésimos

Los 64 casos cubren nueve categorías. Cargas locales acotadas; los umbrales son presupuestos de ingeniería para esta ejecución, no una certificación de producción. Un caso adverso aprueba cuando se observa el rechazo o recuperación especificado. Las pruebas de interfaz usan navegador real; PI-P01 y PR-P03 inducen fallo de transporte en el navegador y no prueban una caída real del servicio. PE-P03 sí detiene Redis aislado.

Los fixtures quedan únicamente en el volumen qa-db y se crean con identificadores únicos; nunca se borran datos de pruebas_pae. Los límites de CPU se restauran en finally.

## PU-O01 — Contraseña y OTP válidos

- Categoría: Unitarias; escenario: óptimo.
- Objetivo/funcionalidad: Contraseña y OTP válidos.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Password Test1234 y OTP 123456, cero intentos.
- Procedimiento: ejecutar `QA_CASES=PU-O01 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PU-O01'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Contraseña válida y OTP aceptado. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PU-O01 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PU-P01 — Contraseña y OTP inválidos o agotados

- Categoría: Unitarias; escenario: pésimo.
- Objetivo/funcionalidad: Contraseña y OTP inválidos o agotados.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: null, vacío, sin dígitos, OTP incorrecto en tercer intento.
- Procedimiento: ejecutar `QA_CASES=PU-P01 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PU-P01'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Todos rechazados y desafío bloqueado. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PU-P01 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PU-O02 — Extracción de dispositivo

- Categoría: Unitarias; escenario: óptimo.
- Objetivo/funcionalidad: Extracción de dispositivo.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Agente Mozilla/5.0 (Windows NT 10.0).
- Procedimiento: ejecutar `QA_CASES=PU-O02 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PU-O02'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Windows NT 10.0 y fallback cuando falta. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PU-O02 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PU-P02 — Agente hostil acotado

- Categoría: Unitarias; escenario: pésimo.
- Objetivo/funcionalidad: Agente hostil acotado.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Un millón de paréntesis sin cierre.
- Procedimiento: ejecutar `QA_CASES=PU-P02 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PU-P02'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Fallback sin bloqueo; duración menor a 100ms. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PU-P02 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PU-O03 — Regla versionada de premios

- Categoría: Unitarias; escenario: óptimo.
- Objetivo/funcionalidad: Regla versionada de premios.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Resultado confirmado v1 y regla de 15 puntos.
- Procedimiento: ejecutar `QA_CASES=PU-O03 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PU-O03'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Beneficiario 2, fuente 1, 15 puntos. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PU-O03 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PU-P03 — Resultado manipulado por cliente

- Categoría: Unitarias; escenario: pésimo.
- Objetivo/funcionalidad: Resultado manipulado por cliente.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Campo points extra y resultado pendiente.
- Procedimiento: ejecutar `QA_CASES=PU-P03 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PU-P03'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Dominio rechaza evidencia no confirmada. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PU-P03 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PU-O04 — Asignación administrativa de rol

- Categoría: Unitarias; escenario: óptimo.
- Objetivo/funcionalidad: Asignación administrativa de rol.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Actor admin; destino docente.
- Procedimiento: ejecutar `QA_CASES=PU-O04 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PU-O04'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Permitido; alta pública siempre estudiante. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PU-O04 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PU-P04 — Escalada de privilegios

- Categoría: Unitarias; escenario: pésimo.
- Objetivo/funcionalidad: Escalada de privilegios.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Actor estudiante/docente; destino admin.
- Procedimiento: ejecutar `QA_CASES=PU-P04 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PU-P04'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Ambos rechazados. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PU-P04 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PC-O01 — Lectura con diez sesiones

- Categoría: Carga; escenario: óptimo.
- Objetivo/funcionalidad: Lectura con diez sesiones.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: 10 cuentas; 40 consultas a preferencias, concurrencia 10.
- Procedimiento: ejecutar `QA_CASES=PC-O01 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PC-O01'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: 40 respuestas 200; p95 <= 5s. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PC-O01 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PC-P01 — Carga sin credenciales

- Categoría: Carga; escenario: pésimo.
- Objetivo/funcionalidad: Carga sin credenciales.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: 40 consultas protegidas, concurrencia 10.
- Procedimiento: ejecutar `QA_CASES=PC-P01 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PC-P01'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: 40 respuestas 401; ningún dato privado. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PC-P01 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PC-O02 — Lecturas repetidas de mensajes

- Categoría: Carga; escenario: óptimo.
- Objetivo/funcionalidad: Lecturas repetidas de mensajes.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Grupo con mensaje; 60 lecturas, concurrencia 6.
- Procedimiento: ejecutar `QA_CASES=PC-O02 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PC-O02'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Mensaje persistente en todas las respuestas. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PC-O02 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PC-P02 — Lecturas reiteradas por miembro ajeno

- Categoría: Carga; escenario: pésimo.
- Objetivo/funcionalidad: Lecturas reiteradas por miembro ajeno.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: 60 lecturas por una cuenta fuera del grupo.
- Procedimiento: ejecutar `QA_CASES=PC-P02 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PC-P02'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: 403 en todas sin filtrar mensajes. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PC-P02 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PC-O03 — Escrituras concurrentes válidas

- Categoría: Carga; escenario: óptimo.
- Objetivo/funcionalidad: Escrituras concurrentes válidas.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: 12 mensajes distintos; concurrencia 4.
- Procedimiento: ejecutar `QA_CASES=PC-O03 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PC-O03'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: 12 filas distintas persistidas. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PC-O03 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PC-P03 — Escrituras inválidas bajo carga

- Categoría: Carga; escenario: pésimo.
- Objetivo/funcionalidad: Escrituras inválidas bajo carga.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: 12 mensajes vacíos; concurrencia 4.
- Procedimiento: ejecutar `QA_CASES=PC-P03 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PC-P03'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: 400; ninguna fila creada. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PC-P03 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PC-O04 — Tráfico sostenido autorizado

- Categoría: Carga; escenario: óptimo.
- Objetivo/funcionalidad: Tráfico sostenido autorizado.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Lectura de sesión durante 5s, lotes de 5 cada 200ms.
- Procedimiento: ejecutar `QA_CASES=PC-O04 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PC-O04'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Sin 5xx ni pérdida de sesión; p95 <= 5s. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PC-O04 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PC-P04 — Tráfico sostenido con token inválido

- Categoría: Carga; escenario: pésimo.
- Objetivo/funcionalidad: Tráfico sostenido con token inválido.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Token inválido durante 5s.
- Procedimiento: ejecutar `QA_CASES=PC-P04 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PC-P04'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: 401 estable; servicio sano al finalizar. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PC-P04 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PR-O01 — Latencia de endpoint protegido

- Categoría: Rendimiento; escenario: óptimo.
- Objetivo/funcionalidad: Latencia de endpoint protegido.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: 50 lecturas secuenciales de sesión.
- Procedimiento: ejecutar `QA_CASES=PR-O01 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PR-O01'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Media, mediana, p95 y p99 registrados; p95 <= 5s. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PR-O01 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PR-P01 — Latencia del rechazo de credencial

- Categoría: Rendimiento; escenario: pésimo.
- Objetivo/funcionalidad: Latencia del rechazo de credencial.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: 50 JWT malformados.
- Procedimiento: ejecutar `QA_CASES=PR-P01 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PR-P01'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: 401 y p95 <= 2s. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PR-P01 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PR-O02 — Consulta de historial con índice

- Categoría: Rendimiento; escenario: óptimo.
- Objetivo/funcionalidad: Consulta de historial con índice.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: EXPLAIN ANALYZE consulta por comunidad y cursor.
- Procedimiento: ejecutar `QA_CASES=PR-O02 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PR-O02'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Plan válido con tiempo de ejecución <= 100ms. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PR-O02 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PR-P02 — Consulta sobre historial amplio

- Categoría: Rendimiento; escenario: pésimo.
- Objetivo/funcionalidad: Consulta sobre historial amplio.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: 500 filas sintéticas en una comunidad; cursor LIMIT 80.
- Procedimiento: ejecutar `QA_CASES=PR-P02 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PR-P02'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Devuelve 80 y plan ejecuta <= 100ms. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PR-P02 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PR-O03 — Carga de interfaz de acceso

- Categoría: Rendimiento; escenario: óptimo.
- Objetivo/funcionalidad: Carga de interfaz de acceso.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Navegador nuevo, sin caché; pantalla login.
- Procedimiento: ejecutar `QA_CASES=PR-O03 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PR-O03'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Formulario utilizable <= 10s; métricas de navegación. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PR-O03 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PR-P03 — Interfaz ante API no disponible

- Categoría: Rendimiento; escenario: pésimo.
- Objetivo/funcionalidad: Interfaz ante API no disponible.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Bloqueo de solicitudes verify solo en navegador de prueba.
- Procedimiento: ejecutar `QA_CASES=PR-P03 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PR-P03'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: No muestra datos protegidos ni carga infinita por más de 10s. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PR-P03 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PR-O04 — Recursos durante lectura concurrente

- Categoría: Rendimiento; escenario: óptimo.
- Objetivo/funcionalidad: Recursos durante lectura concurrente.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: 50 lecturas con concurrencia 10; estadísticas Docker.
- Procedimiento: ejecutar `QA_CASES=PR-O04 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PR-O04'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: 0 errores; métricas CPU/memoria registradas; contenedor activo. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PR-O04 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PR-P04 — Recuperación de memoria tras peticiones inválidas

- Categoría: Rendimiento; escenario: pésimo.
- Objetivo/funcionalidad: Recuperación de memoria tras peticiones inválidas.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: 100 JSON de 120KB superiores al límite del parser.
- Procedimiento: ejecutar `QA_CASES=PR-P04 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PR-P04'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: 413 en cada respuesta, sin caída posterior. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PR-P04 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PN-O01 — Actualizaciones secuenciales con versiones

- Categoría: Concurrencia; escenario: óptimo.
- Objetivo/funcionalidad: Actualizaciones secuenciales con versiones.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Mensaje v1 editado a v2 y v3.
- Procedimiento: ejecutar `QA_CASES=PN-O01 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PN-O01'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Contenido final coincide y version=3. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PN-O01 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PN-P01 — Edición simultánea conflictiva

- Categoría: Concurrencia; escenario: pésimo.
- Objetivo/funcionalidad: Edición simultánea conflictiva.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Dos ediciones de la misma versión.
- Procedimiento: ejecutar `QA_CASES=PN-P01 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PN-P01'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Una 200, una 409; versión final 2. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PN-P01 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PN-O02 — Solicitudes independientes simultáneas

- Categoría: Concurrencia; escenario: óptimo.
- Objetivo/funcionalidad: Solicitudes independientes simultáneas.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: 5 preferencias de usuarios distintos actualizadas a dark.
- Procedimiento: ejecutar `QA_CASES=PN-O02 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PN-O02'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Todas conservan su propio valor. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PN-O02 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PN-P02 — Idempotencia con payload incompatible

- Categoría: Concurrencia; escenario: pésimo.
- Objetivo/funcionalidad: Idempotencia con payload incompatible.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Mismo client_id con dos contenidos distintos.
- Procedimiento: ejecutar `QA_CASES=PN-P02 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PN-P02'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Una 201, una 409; una sola fila. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PN-P02 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PN-O03 — Aceptaciones simultáneas de invitación

- Categoría: Concurrencia; escenario: óptimo.
- Objetivo/funcionalidad: Aceptaciones simultáneas de invitación.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: 8 aceptaciones de la misma emisión.
- Procedimiento: ejecutar `QA_CASES=PN-O03 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PN-O03'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Una membresía activa; respuestas idempotentes. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PN-O03 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PN-P03 — Aceptación concurrente con revocación

- Categoría: Concurrencia; escenario: pésimo.
- Objetivo/funcionalidad: Aceptación concurrente con revocación.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Aceptar y revocar la misma emisión a la vez.
- Procedimiento: ejecutar `QA_CASES=PN-P03 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PN-P03'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Estado final coherente: aceptada con miembro o revocada sin miembro. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PN-P03 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PN-O04 — Reintentos de mensaje tras respuesta perdida

- Categoría: Concurrencia; escenario: óptimo.
- Objetivo/funcionalidad: Reintentos de mensaje tras respuesta perdida.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: 10 POST con mismo UUID y contenido.
- Procedimiento: ejecutar `QA_CASES=PN-O04 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PN-O04'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Una 201 y nueve 200; una sola fila. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PN-O04 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PN-P04 — Amistad en direcciones opuestas

- Categoría: Concurrencia; escenario: pésimo.
- Objetivo/funcionalidad: Amistad en direcciones opuestas.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Solicitudes A→B y B→A simultáneas.
- Procedimiento: ejecutar `QA_CASES=PN-P04 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PN-P04'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Una 201, una 409; relación pendiente única. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PN-P04 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PE-O01 — Carga progresiva dentro del presupuesto

- Categoría: Estrés; escenario: óptimo.
- Objetivo/funcionalidad: Carga progresiva dentro del presupuesto.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Etapas 5, 10, 20 lectores; 20 peticiones por etapa.
- Procedimiento: ejecutar `QA_CASES=PE-O01 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PE-O01'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Sin errores; p95 por etapa <= 5s. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PE-O01 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PE-P01 — Sobrecarga del límite de publicación

- Categoría: Estrés; escenario: pésimo.
- Objetivo/funcionalidad: Sobrecarga del límite de publicación.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: 60 mensajes simultáneos de un usuario (límite 40/min).
- Procedimiento: ejecutar `QA_CASES=PE-P01 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PE-P01'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Al menos un 429; sin 5xx; filas iguales a respuestas 201. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PE-P01 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PE-O02 — Saturación controlada de lecturas

- Categoría: Estrés; escenario: óptimo.
- Objetivo/funcionalidad: Saturación controlada de lecturas.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: 120 lecturas con 30 concurrentes.
- Procedimiento: ejecutar `QA_CASES=PE-O02 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PE-O02'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Todas 200; p95 <= 10s. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PE-O02 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PE-P02 — Saturación de autenticación fallida

- Categoría: Estrés; escenario: pésimo.
- Objetivo/funcionalidad: Saturación de autenticación fallida.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: 8 contraseñas incorrectas de una cuenta.
- Procedimiento: ejecutar `QA_CASES=PE-P02 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PE-P02'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: 401 seguido de 429; contraseña correcta sigue bloqueada. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PE-P02 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PE-O03 — Servicio con CPU limitada

- Categoría: Estrés; escenario: óptimo.
- Objetivo/funcionalidad: Servicio con CPU limitada.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Auth en 0.5 CPU, 50 consultas, concurrencia 5.
- Procedimiento: ejecutar `QA_CASES=PE-O03 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PE-O03'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Sin errores; p95 <= 10s; límite restaurado. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PE-O03 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PE-P03 — Pérdida del almacén de sesión

- Categoría: Estrés; escenario: pésimo.
- Objetivo/funcionalidad: Pérdida del almacén de sesión.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Redis de pae_qa detenido temporalmente.
- Procedimiento: ejecutar `QA_CASES=PE-P03 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PE-P03'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Acceso denegado/indisponible; no sesión nueva; recuperación comprobada. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PE-P03 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PE-O04 — Recuperación después de pico de consultas

- Categoría: Estrés; escenario: óptimo.
- Objetivo/funcionalidad: Recuperación después de pico de consultas.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: 120 solicitudes, después una lectura y una escritura.
- Procedimiento: ejecutar `QA_CASES=PE-O04 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PE-O04'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Preferencia guardada y recuperada sin pérdida. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PE-O04 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PE-P04 — Recuperación tras reinicio del servicio

- Categoría: Estrés; escenario: pésimo.
- Objetivo/funcionalidad: Recuperación tras reinicio del servicio.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Reinicio de Community con mensaje previo.
- Procedimiento: ejecutar `QA_CASES=PE-P04 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PE-P04'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Mensaje sobrevive; acceso ajeno sigue 403. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PE-P04 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PS-O01 — Flujo de chat desde navegador hasta BD

- Categoría: Sistema; escenario: óptimo.
- Objetivo/funcionalidad: Flujo de chat desde navegador hasta BD.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Miembro abre grupo y envía texto por interfaz.
- Procedimiento: ejecutar `QA_CASES=PS-O01 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PS-O01'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Aviso guardado, recarga conserva texto y BD contiene una fila. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PS-O01 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PS-P01 — Acceso a grupo ajeno desde navegador

- Categoría: Sistema; escenario: pésimo.
- Objetivo/funcionalidad: Acceso a grupo ajeno desde navegador.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Estudiante no miembro visita grupo privado.
- Procedimiento: ejecutar `QA_CASES=PS-P01 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PS-P01'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Sin mensajes privados ni formulario de envío. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PS-P01 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PS-O02 — Login real por interfaz

- Categoría: Sistema; escenario: óptimo.
- Objetivo/funcionalidad: Login real por interfaz.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Cuenta registrada y contraseña correcta.
- Procedimiento: ejecutar `QA_CASES=PS-O02 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PS-O02'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Navega a estudiante y sesión validada. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PS-O02 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PS-P02 — Rechazo de contraseña desde interfaz

- Categoría: Sistema; escenario: pésimo.
- Objetivo/funcionalidad: Rechazo de contraseña desde interfaz.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Contraseña incorrecta para usuario existente.
- Procedimiento: ejecutar `QA_CASES=PS-P02 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PS-P02'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Mensaje de error, no sesión ni navegación protegida. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PS-P02 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PS-O03 — Navegación de funcionalidades integradas

- Categoría: Sistema; escenario: óptimo.
- Objetivo/funcionalidad: Navegación de funcionalidades integradas.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Sesión estudiante visita foros y gamificación.
- Procedimiento: ejecutar `QA_CASES=PS-O03 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PS-O03'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Ambas páginas muestran su encabezado y no errores de página. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PS-O03 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PS-P03 — Formulario de publicación vacío

- Categoría: Sistema; escenario: pésimo.
- Objetivo/funcionalidad: Formulario de publicación vacío.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Intento de publicar sin título/contenido.
- Procedimiento: ejecutar `QA_CASES=PS-P03 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PS-P03'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Validación del navegador; cero publicaciones creadas. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PS-P03 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PI-O01 — Frontend/API de foros con persistencia

- Categoría: Integración; escenario: óptimo.
- Objetivo/funcionalidad: Frontend/API de foros con persistencia.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Publicación creada en interfaz y consultada por HTTP.
- Procedimiento: ejecutar `QA_CASES=PI-O01 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PI-O01'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Título coincide después de recargar. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PI-O01 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PI-P01 — Respuesta de error de API visible en interfaz

- Categoría: Integración; escenario: pésimo.
- Objetivo/funcionalidad: Respuesta de error de API visible en interfaz.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: API de foros devuelve 503 mediante interrupción controlada en navegador.
- Procedimiento: ejecutar `QA_CASES=PI-P01 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PI-P01'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Error visible; sin datos simulados. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PI-P01 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PI-O02 — PDF privado persistido y descargado

- Categoría: Integración; escenario: óptimo.
- Objetivo/funcionalidad: PDF privado persistido y descargado.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: PDF sintético subido por docente y leído por miembro.
- Procedimiento: ejecutar `QA_CASES=PI-O02 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PI-O02'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Bytes exactos y registro en BD. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PI-O02 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PI-P02 — Archivo no PDF rechazado

- Categoría: Integración; escenario: pésimo.
- Objetivo/funcionalidad: Archivo no PDF rechazado.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Subida text/plain y archivo con MIME application/pdf falsificado por docente.
- Procedimiento: ejecutar `QA_CASES=PI-P02 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PI-P02'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: 400/415; no fila ni descarga. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PI-P02 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PI-O03 — Identidad autoriza Comunidad y Evaluación

- Categoría: Integración; escenario: óptimo.
- Objetivo/funcionalidad: Identidad autoriza Comunidad y Evaluación.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Misma sesión vigente consulta tres servicios.
- Procedimiento: ejecutar `QA_CASES=PI-O03 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PI-O03'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Perfil válido, listado de invitaciones y resultados disponibles. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PI-O03 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PI-P03 — Logout revoca acceso distribuido real

- Categoría: Integración; escenario: pésimo.
- Objetivo/funcionalidad: Logout revoca acceso distribuido real.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Cerrar sesión y reutilizar JWT en Auth/Community/Exam/Content/Quality.
- Procedimiento: ejecutar `QA_CASES=PI-P03 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PI-P03'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Todas las rutas protegidas responden 401. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PI-P03 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PG-O01 — Registro conserva contrato de alumno

- Categoría: Regresión; escenario: óptimo.
- Objetivo/funcionalidad: Registro conserva contrato de alumno.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: isTeacher=true enviado por cliente.
- Procedimiento: ejecutar `QA_CASES=PG-O01 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PG-O01'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Rol estudiante y solicitud pendiente; sin creación de grupo. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PG-O01 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PG-P01 — Acceso social sin identidad verificada

- Categoría: Regresión; escenario: pésimo.
- Objetivo/funcionalidad: Acceso social sin identidad verificada.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Correo de cuenta existente en quick-login.
- Procedimiento: ejecutar `QA_CASES=PG-P01 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PG-P01'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: 503, sin token; contraseña sigue funcionando. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PG-P01 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PG-O02 — Renovar sesión mantiene contrato

- Categoría: Regresión; escenario: óptimo.
- Objetivo/funcionalidad: Renovar sesión mantiene contrato.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Refresh de token vigente.
- Procedimiento: ejecutar `QA_CASES=PG-O02 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PG-O02'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Nuevo token funciona, anterior rechazado. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PG-O02 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PG-P02 — Cambio de rol invalida permiso anterior

- Categoría: Regresión; escenario: pésimo.
- Objetivo/funcionalidad: Cambio de rol invalida permiso anterior.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Docente pasa a estudiante en la BD aislada.
- Procedimiento: ejecutar `QA_CASES=PG-P02 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PG-P02'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: JWT anterior no conserva permiso docente. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PG-P02 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PG-O03 — Migraciones repetibles sin pérdida

- Categoría: Regresión; escenario: óptimo.
- Objetivo/funcionalidad: Migraciones repetibles sin pérdida.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Invitación y mensajes existentes; ejecutar migrate dos veces.
- Procedimiento: ejecutar `QA_CASES=PG-O03 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PG-O03'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Mismas filas y versiones; sin errores de checksum. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PG-O03 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PG-P03 — Inyección SQL en búsqueda de usuarios

- Categoría: Regresión; escenario: pésimo.
- Objetivo/funcionalidad: Inyección SQL en búsqueda de usuarios.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Consulta con comilla, porcentaje y comentario SQL.
- Procedimiento: ejecutar `QA_CASES=PG-P03 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PG-P03'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: 200 con lista acotada; tablas y cuentas intactas. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PG-P03 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PA-O01 — Crear, invitar, aceptar, conversar

- Categoría: Aceptación; escenario: óptimo.
- Objetivo/funcionalidad: Crear, invitar, aceptar, conversar.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Docente y alumno en grupo privado.
- Procedimiento: ejecutar `QA_CASES=PA-O01 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PA-O01'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Alumno inicialmente excluido; aceptación habilita texto persistente. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PA-O01 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PA-P01 — Expulsión impide reingreso con invitación anterior

- Categoría: Aceptación; escenario: pésimo.
- Objetivo/funcionalidad: Expulsión impide reingreso con invitación anterior.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Invitación aceptada, expulsión y replay.
- Procedimiento: ejecutar `QA_CASES=PA-P01 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PA-P01'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: 403 en mensajes y replay; no reactivación. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PA-P01 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PA-O02 — Foro con respuesta y resolución

- Categoría: Aceptación; escenario: óptimo.
- Objetivo/funcionalidad: Foro con respuesta y resolución.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Publicación pública, comentario y cierre por autor.
- Procedimiento: ejecutar `QA_CASES=PA-O02 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PA-O02'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: Respuesta visible y estado resuelto. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PA-O02 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PA-P02 — Moderación ajena bloqueada

- Categoría: Aceptación; escenario: pésimo.
- Objetivo/funcionalidad: Moderación ajena bloqueada.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Estudiante intenta retirar publicación de otro.
- Procedimiento: ejecutar `QA_CASES=PA-P02 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PA-P02'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: 403 y contenido original intacto. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PA-P02 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PA-O03 — Preferencias persistentes y aislamiento

- Categoría: Aceptación; escenario: óptimo.
- Objetivo/funcionalidad: Preferencias persistentes y aislamiento.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Cuenta A elige dark; cuenta B independiente.
- Procedimiento: ejecutar `QA_CASES=PA-O03 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PA-O03'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: A conserva dark; B no cambia. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PA-O03 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.

## PA-P03 — Cuenta desactivada sin acceso residual

- Categoría: Aceptación; escenario: pésimo.
- Objetivo/funcionalidad: Cuenta desactivada sin acceso residual.
- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.
- Entrada: Desactivar cuenta con JWT vigente.
- Procedimiento: ejecutar `QA_CASES=PA-P03 node tests/qa/run.mjs` (PowerShell: `$env:QA_CASES='PA-P03'; node tests/qa/run.mjs`). La implementación exacta está en `tests/qa/cases.mjs`.
- Resultado esperado/criterio de aprobación: 401 en identidad, preferencias y evaluación. Se comprueba mediante assertions; cualquier discrepancia falla el caso.
- Resultado real, estado, evidencia y defecto: véase fila PA-P03 en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.
