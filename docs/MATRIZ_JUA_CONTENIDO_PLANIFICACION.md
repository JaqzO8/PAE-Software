# Matriz de trazabilidad JUA — Contenido y Planificación

Esta matriz conserva la diferencia entre implementación técnica, evidencia local y aceptación funcional. Los checks que dependen de PostgreSQL/Docker o de otro responsable no se marcan como aceptación completa.

| ID | Alcance | Implementación principal | Evidencia local | Estado técnico |
|---|---|---|---|---|
| JUA-01/02 | Visibilidad y acceso privado | `secureUploadsMiddleware`, políticas de descarga | `jua01-jua02-private-access.test.js`, 24 pruebas Contenido | Implementado; E2E requiere entorno |
| JUA-03/04 | Backlog y límites de HU | `JUA_H0_INVENTARIO_Y_CONCILIACION.md` | Contratos H0/H5 y SDD | Documentado |
| JUA-05/07 | Repositorio, carga, publicación e idempotencia | `contentPolicy`, `contentUseCases`, migración de Contenido | pruebas unitarias, checksum, Outbox | Implementado |
| JUA-06/18 | Integridad y almacenamiento privado | magic bytes, path traversal, SHA-256, enlace temporal HMAC | pruebas de acceso, checksum y expiración | Implementado; storage externo/restore real pendiente |
| JUA-08/10 | Catálogo, favoritos, ranking y regresión | controllers existentes + vertical de Contenido | suite unitaria/integración de Contenido | Implementado técnicamente |
| JUA-09/12 | Lecciones, progreso y evento de finalización | `lessonController`, `LeccionCompletada.v1` | fixture y contrato de evento | Implementado; consumidor externo pendiente |
| JUA-11/14 | Planificación, zona horaria y Pomodoro | módulo `planning` de Learning, transiciones server-side | 11 pruebas Learning, build frontend | Implementado |
| JUA-13 | Migración de autoridad | migración Learning, reconciliación y retiro de rutas Content | scripts `migrate`/`reconcile`, runbook | Implementado; ejecución real pendiente |
| JUA-15 | Outbox y publicación versionada | `OutboxEvent`, worker, retry/cuarentena | contratos y pruebas de eventos | Implementado; transporte operativo pendiente |
| JUA-16/17 | Recordatorios y estados de entrega | claim atómico, cancelación, estados | pruebas concurrentes/cancelación | Implementado |
| JUA-19/21 | Ruta educativa y alcance aprobado | contratos H5, visor y límites de juego | documentación y build frontend | Implementado según alcance; aceptación pedagógica pendiente |
| JUA-20/24 | Multimedia, accesibilidad y bienestar | campos editoriales, UI multimedia, contenido opcional | accesibilidad, registro editorial | Implementado técnicamente |
| JUA-22 | Offline por cuenta y versión | `offlineLessonStore`, limpieza al logout | build frontend y aislamiento por usuario | Implementado técnicamente |
| JUA-23 | Importación/exportación y límites | validación de carga y delimitación de formatos | políticas de archivo | Delimitado; conversiones DOC/PDF completas pendientes |
| JUA-25 | Rendimiento y paginación | índices, límites y consultas paginadas existentes | revisión estática | Parcial; carga medida pendiente |
| JUA-26 | Restore, conectividad y accesibilidad | runbook, manifiesto/checksum y pruebas locales | `test:ops` (6/6) | Local validado; restore real pendiente |
| JUA-27 | Recorrido docente-estudiante-plan | rutas, eventos, planificación y cancelación | suites de módulos y build | Integración local; aceptación E10 pendiente |

## Comandos de evidencia local

```bash
npm test
npm run check:architecture
npm run check:safety
npm run build --prefix frontend
```

`npm test` valida Contenido, Learning, contratos, backup/restore lógico y accesibilidad estática. Las pruebas de Docker/PostgreSQL, carga, restore físico y aceptación E09/E10 deben ejecutarse en un entorno con infraestructura disponible.
