# Plan de estabilización

La instrucción directa del usuario amplía el documento adjunto: **32 casos óptimos y 32 pésimos, 64 en total**. Se conservarán las nueve categorías y al menos cuatro casos totales por categoría. Un caso pésimo aprueba cuando el sistema rechaza, limita o se recupera como exige su especificación; no significa un test deliberadamente fallido.

1. Auditar ramas, contratos, CI, Sonar y suites existentes; registrar línea base.
2. Corregir defectos demostrados y riesgos de seguridad del alcance integrado, con regresión.
3. Preparar ambiente QA aislado con datos ficticios; carga, estrés y fallos inducidos únicamente en ese ambiente.
4. Implementar matriz de 64 casos con identificadores, datos, pasos, expectativas y evidencia por ejecución. Reutilizar regresiones existentes.
5. Ejecutar compilación, análisis, cobertura, seguridad, pruebas HTTP/BD y navegador. Registrar fallidos y corregir; distinguir revisión técnica de evidencia ejecutada.
6. Publicar rama y PR hacia develop con resultados verificables. El merge requiere revisión del equipo. Preparar promoción hacia main solo cuando se satisfagan los criterios; no fusionar main automáticamente.

Distribución: unitarias, carga, rendimiento, concurrencia y estrés: 4 óptimas + 4 pésimas cada una. Sistema, integración, regresión y aceptación: 3 óptimas + 3 pésimas cada una. Total: 32 + 32. Las comprobaciones auxiliares existentes no se cuentan dos veces para inflar la matriz.

Contenido y Planificación quedan fuera de finalización funcional. Las reparaciones necesarias de límites compartidos se documentan sin introducir implementaciones ficticias. Se preservan datos de pruebas_pae y trabajo de otras ramas.
