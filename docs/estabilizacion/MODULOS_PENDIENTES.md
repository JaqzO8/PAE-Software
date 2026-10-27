# Alcance pendiente y dependencias

## Fuera del cierre de esta estabilización

Contenido y Planificación todavía requieren la entrega de su responsable. Se mantienen los contratos /api/content/* y las pantallas existentes; las correcciones de autenticación y dependencias compartidas no constituyen su aceptación funcional. No integrar automáticamente Juan_Rengifo ni otras ramas.

Antes de integrar esos módulos: comparar contratos con la SPA; aplicar migraciones sobre copia de QA; validar permisos, persistencia, consultas y errores; ejecutar las 64 regresiones y las suites propias; revisar eventos que alimentan progreso y gamificación. El equipo debe confirmar la trazabilidad requisito/historia de usuario de esa entrega.

## Pendientes del alcance existente que impiden afirmar cierre total

- Proveedor real de correo y recuperación/MFA: actualmente hay mecanismos de desafíos de desarrollo, pero no prueba de entrega externa ni política MFA persistente por cuenta. No afirmar que MFA está habilitado para producción. El transporte de avisos sin adaptador retorna fallo explícito.
- OAuth: el acceso social sin verificar identidad se retiró de la interfaz; endpoint responde 503. Requiere integración con proveedor y validación de su credencial.
- Estadística de partidas diarias: no existe conteo autoritativo conectado a esas tarjetas; se muestra no disponible en lugar de un número aleatorio.
- Learning modular: validar migración completa de la autoridad de premios antes de sustituir el servicio heredado; no duplicar el cálculo entre Exam y Learning.
- Cobertura: importar reportes reales, medir código nuevo en Sonar y ampliar pruebas sobre las líneas sin ejecutar. No usar exclusiones para lograr 80% artificialmente.
- Frontend: corregir deuda de lint heredada y ampliar pruebas de pantallas de evaluación, administración y accesibilidad. Una compilación correcta no cierra esos requisitos.

Las 64 pruebas son una matriz de estabilización reproducible del alcance descrito, no una certificación de todas las historias del proyecto ni una prueba de capacidad productiva.
