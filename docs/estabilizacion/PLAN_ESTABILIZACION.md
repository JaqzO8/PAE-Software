# Plan de estabilización

La instrucción del usuario del 6 de noviembre exige **al menos 4 casos óptimos y 4 pesimistas en cada una de las nueve categorías: 36 + 36, 72 en total**. Sustituye la distribución anterior de 64 casos. Un caso pesimista aprueba cuando el sistema rechaza, limita o se recupera como exige su especificación; no significa un test deliberadamente fallido.

1. Auditar ramas, contratos, CI, Sonar y suites existentes; registrar línea base.
2. Corregir defectos demostrados y riesgos de seguridad del alcance integrado, con regresión.
3. Preparar ambiente QA aislado con datos ficticios; carga, estrés y fallos inducidos únicamente en ese ambiente.
4. Mantener la matriz de al menos 72 casos con identificadores, datos, pasos, expectativas y evidencia por ejecución. Verificar automáticamente el mínimo por categoría y escenario.
5. Ejecutar compilación, análisis, cobertura, seguridad, pruebas HTTP/BD y navegador. Registrar fallidos y corregir; distinguir revisión técnica de evidencia ejecutada.
6. Publicar rama y PR hacia develop con resultados verificables. El merge requiere revisión del equipo. Preparar promoción hacia main solo cuando se satisfagan los criterios; no fusionar main automáticamente.

Distribución: unitarias, carga, rendimiento, concurrencia, estrés, sistema, integración, regresión y aceptación: 4 óptimos + 4 pesimistas cada una. Total: 36 + 36. Las comprobaciones auxiliares existentes no se suman a esta matriz para inflar sus cantidades.

El 27 de octubre el usuario amplió el alcance e indicó integrar Juan_Rengifo. Se incorporan Contenido y Planificación, se verifican sus migraciones y contratos HTTP y se conservan las protecciones de sesión. La aceptación completa de funcionalidades y proveedores externos sigue pendiente. Se preservan los datos de pruebas_pae.
