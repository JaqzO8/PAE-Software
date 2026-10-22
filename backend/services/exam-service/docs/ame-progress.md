# Amelia: Evaluación y Seguimiento — avance de ejecución

Registro de ejecución de la especificación externa `03_SDD_Amelia_Evaluacion_Seguimiento.md`.
Rama de trabajo: `Amelia_Mauricio`. Base verificada: `f8ea67709540b2e679f957e4bf9153fe0a7364dc`.
Checkpoints locales: intentos `4731f6d`, auditoría de revisión `48eef01`, DTOs privados `6347f80`. Este registro describe evidencia observada; no afirma aceptación integral.

## Seguimiento por ticket

| Ticket / criterios | Estado documental | Estado de implementación | Dependencia o brecha | Prueba / evidencia |
| --- | --- | --- | --- | --- |
| AME-01–04, integridad y decisiones | Requisitos aprobados y propuestas identificadas por el SDD | Parcial: se caracterizó el flujo anterior por lectura de código; todavía no se reprodujeron carreras y vencimientos con PostgreSQL | PostgreSQL/Docker para pruebas de concurrencia; acuerdos pendientes de revisión manual y modos offline | Observación de código y limitación de entorno registradas en esta sesión |
| AME-05, casos de uso y reloj inyectable | Aprobado en el plan | Parcial: reglas puras para snapshot, hash, informe de nota y cálculo de revisión; el controlador heredado aún concentra los casos de uso | Extracción completa a puertos/repositorios pendiente | `npm run test:exam`: 10 pruebas pasan |
| AME-06, selección y snapshot | Aprobado | Parcial: inicio de simulacro guarda snapshot privado y fecha límite; la publicación, versionado del banco y rúbrica no están completos | Flujo de revisión/publicación docente y criterios académicos | Snapshot caracterizado por prueba unitaria; falta PostgreSQL |
| AME-07, permisos y claves privadas | Aprobado | Parcial: inicio no incluye claves; banco e historial ya no serializan claves/snapshots a alumnos. Paneles/revisiones docentes fallan cerrados sin alcance de grupo | E01/E02: sesión vigente y relación docente-estudiante/grupo firmada | Prueba unitaria de DTO público; integración de permisos pendiente |
| AME-08, cierre e idempotencia | Aprobado | Implementación: reloj del servidor, cierre transaccional con lock, hash de payload y replay estable; entrega vencida cierra con respuestas vacías; Outbox se escribe en la misma transacción para resultados sin revisión manual | Falta prueba real de PostgreSQL, caída entre commit/publicación y publicación/replay | `npm run test:exam` cubre hash/reglas; integración bloqueada por Docker apagado |
| AME-09, revisión abierta y recalificación | Aprobado | Parcial no activado: migración y lógica transaccional/auditada están preparadas, pero las rutas de revisión responden 403 hasta tener alcance docente-grupo. Recalificación permanece bloqueada; rúbrica aún sin definición | Integrar membresías E01/E02; acordar rúbrica y `ResultadoRevisado`/proyecciones/premios con José | Prueba unitaria de cálculo/transición; concurrencia DB no ejecutada ni flujo habilitado |
| AME-10, banco y reportes | Aprobado / propuesto según historia | Parcial: se conserva el flujo existente; historial/versionado, selección reproducible, reportes y extensiones no están cerrados | Validación editorial y coordinación de Contenido | No se declara cerrado |
| AME-11, integración de UI | Aprobado | Parcial: el cliente envía clave idempotente y usa la fecha límite recibida; el servidor calcula duración y aplica vencimiento | Sin sincronización de estado desde servidor al reconectar; sin recorrido funcional con DB | Build frontend exitoso |
| AME-12–21, Seguimiento, eventos y tiempo real | Según estado individual en el SDD | Pendiente o parcial previo; esta entrega solo añade Outbox local durable | Contratos de Juan/José/Richar, consumidor autenticado y operación entre réplicas | No hay contrato de transporte operativo; no se activa proyección ni premio desde este Outbox |
| AME-22–31, extensiones y cierre operativo | Propuesto/condicionado según el SDD | Pendiente | Aprobación de alcance, módulos propietarios y entorno de carga/restore | No se declara cerrado |

## Registro de ejecución

- SHA de base: `f8ea67709540b2e679f957e4bf9153fe0a7364dc`.
- Configuración: Node.js 24.19.0; configuración local sanitizada; no se registran secretos.
- `npm run test:exam`: 2 suites, 10 pruebas aprobadas.
- `npm run test:architecture`: 6 pruebas aprobadas al permitir sockets HTTP locales.
- `npm run check:architecture`: aprobado.
- `npm run check:safety`: aprobado; revisión de 443 archivos versionados antes del último checkpoint.
- `npm run build --prefix frontend`: TypeScript y Vite aprobados.
- Pruebas con PostgreSQL y Docker: no ejecutadas; el motor Docker Desktop Linux no estaba disponible.
- CI, revisor independiente, recorrido funcional con datos reales, mediciones de carga, restore y aceptación académica: pendientes.

## Próximo paso

Habilitar PostgreSQL aislado, probar AME-08 con dos envíos concurrentes y edición de pregunta durante el intento, y acordar el contrato de resultado revisado antes de conectar Seguimiento o reactivar premios.
