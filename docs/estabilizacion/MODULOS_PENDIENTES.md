# Alcance pendiente y dependencias

## Integración de Contenido y Planificación autorizada el 27 de octubre

Se incorpora Juan_Rengifo (c81275c) a codex/estabilizacion-qa por petición expresa del usuario. Contenido mantiene /api/content/*; Planificación usa /api/learning/planning en Learning con PostgreSQL propio. No se fusiona automáticamente develop ni main.

La integración añade pruebas HTTP reales de preferencias, recordatorios, aislamiento, PDF privado, enlaces firmados y revocación. Se corrigen migraciones, lectura JSON y suplantación de userId. El equipo aún debe aceptar la trazabilidad completa de requisitos e historias. El transporte Outbox depende de configuración externa; la proyección recordLessonCompletionProjection de Learning aún es un adaptador provisional sin persistencia y no debe presentarse como integración productiva de progreso.

## Pendientes del alcance existente que impiden afirmar cierre total

- Proveedor real de correo y recuperación/MFA: actualmente hay mecanismos de desafíos de desarrollo, pero no prueba de entrega externa ni política MFA persistente por cuenta. No afirmar que MFA está habilitado para producción. El transporte de avisos sin adaptador retorna fallo explícito.
- OAuth: el acceso social sin verificar identidad se retiró de la interfaz; endpoint responde 503. Requiere integración con proveedor y validación de su credencial.
- Estadística de partidas diarias: no existe conteo autoritativo conectado a esas tarjetas; se muestra no disponible en lugar de un número aleatorio.
- Learning modular: validar migración completa de la autoridad de premios antes de sustituir el servicio heredado; no duplicar el cálculo entre Exam y Learning.
- Cobertura: importar reportes reales, medir código nuevo en Sonar y ampliar pruebas sobre las líneas sin ejecutar. No usar exclusiones para lograr 80% artificialmente.
- Frontend: corregir deuda de lint heredada y ampliar pruebas de pantallas de evaluación, administración y accesibilidad. Una compilación correcta no cierra esos requisitos.

Las 64 pruebas son una matriz de estabilización reproducible del alcance descrito, no una certificación de todas las historias del proyecto ni una prueba de capacidad productiva.
