# Manual breve de Contenido y Planificación

## Docente

1. Crear un repositorio desde **Mis repositorios → Crear repositorio**.
2. Cargar un PDF o recurso multimedia desde **Agregar recurso**. El servidor valida tamaño, tipo, nombre y contenido binario.
   Cada archivo válido conserva un checksum SHA-256 para comprobar su integridad durante respaldo y restauración.
3. Revisar el recurso en el repositorio y publicarlo. Los borradores no aparecen a estudiantes ni se descargan por URL directa.
4. Crear lecciones con contenido, resumen, preguntas editoriales, mapa conceptual y recursos multimedia.
5. Compartir el repositorio usando la comunidad y sus permisos vigentes; el servicio de Comunidad conserva la membresía.

## Estudiante

1. Explorar repositorios públicos o entrar a un repositorio autorizado.
2. Descargar recursos publicados; los privados requieren autorización actual.
3. Iniciar y completar una lección. El resumen, solucionario, mapa y material PDF se habilitan después de completarla.
4. Consultar **Planificación** para configurar días, horario, materias, zona horaria y recordatorios.
5. Usar Pomodoro y las pausas sugeridas. Si la API no responde, una lección previamente almacenada para esa cuenta puede leerse sin conexión.

## Seguridad y recuperación

- No compartir URLs de `/uploads` como mecanismo de autorización.
- Las descargas de archivos usan enlaces firmados con expiración corta; solicitar un enlace nuevo si vence.
- Eliminar o reemplazar archivos desde la API para conservar metadatos y permisos.
- Ejecutar el [runbook operativo](RUNBOOK_CONTENIDO_PLANIFICACION_JUAN.md) para backup, restore y validación de checksums.
- Los eventos Outbox se procesan con reintentos; `published` confirma transporte, `pending` requiere procesamiento y `failed` requiere intervención.
