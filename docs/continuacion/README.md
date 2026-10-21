# Continuación del equipo hasta la entrega final

Actualizado: 21 de octubre de 2026 (Lima). Base de código: `f8ea67709540b2e679f957e4bf9153fe0a7364dc`, en **Jose_Queshyac**. Esta guía organiza el trabajo pendiente; no certifica que todos los módulos estén terminados.

## Por dónde empezar

1. Leer [la base implementada](../ARQUITECTURA_TRANSICION.md) y reproducir [su runbook](../RUNBOOK_PRUEBAS_ARQUITECTURA.md).
2. Incorporar esta entrega a `develop` mediante PR revisado. Este documento no significa que ese PR ya exista o esté integrado.
3. Seguir la secuencia de entregas de abajo desde la rama personal. Cada entrega comprende backend, interfaz, migraciones, pruebas y documentación; no dejar toda la integración para el final.
4. Usar [TRAZABILIDAD.md](TRAZABILIDAD.md) para seleccionar los RQ y las historias. Usar los criterios originales completos, además de los escenarios de [PLAN_PRUEBAS.md](PLAN_PRUEBAS.md).

| Persona | Rama existente exacta | Responsabilidad y guía |
|---|---|---|
| Richar | `Richard_Estela` | [M1 Identidad y M8 Plataforma/UI](01_Richar.md) |
| Juan | `Juan_Rengifo` | [M2 Contenido y M5 Planificación](02_Juan.md) |
| Amelia | `Amelia_Mauricio` | [M3 Evaluación y M4 Seguimiento](03_Amelia.md) |
| José | `Jose_Queshyac` | [M6 Comunidad y M7 Gamificación](04_Jose.md) |

La rama antigua `José_Queshyac`, con acento, no es la de esta entrega. Algunos párrafos comunes de las guías originales intercambian Juan/José: prevalece el reparto de esta tabla y de sus encabezados personales. Las guías personales incluyen los anexos originales para conservar las referencias, sin convertir sus textos en autorizaciones operativas.

## Estado real de partida

Existe separación `createApp()`/arranque para los cuatro servicios heredados, una primera vertical de Comunidad con invitaciones y archivos privados, y un piloto transaccional de Gamificación en `learning-service`. Están comprobados 57 tests automatizados y el smoke HTTP/Chrome registrados en el runbook de la base.

Planificación y Seguimiento dentro de Aprendizaje aún son puntos de extensión. No hay productor real de resultados conectado al piloto ni entrega operativa de Outbox. Puntos/logros siguen siendo autoritativos en Evaluación y planificación en Contenido. Un endpoint `/health` correcto no cierra un módulo. Continúan pendientes, entre otros, la habilitación docente segura, la revocación entre servicios y el cierre del acceso alternativo a archivos privados de Contenido.

## Secuencia obligatoria de integración

El orden resuelve dependencias entre personas. Cada fila se integra y verifica antes de la fila que depende de ella. Un integrante vuelve en varias rondas; no debe completar aisladamente sus dos módulos antes de compartir contratos.

| Entrega | Responsable / revisor | Trabajo y dependencia | Puerta de salida |
|---|---|---|---|
| E00 Base | José / Richar y Amelia | Revisar e integrar la base y estas guías a develop; acordar alcance y contratos pendientes | Runbook reproducido; decisiones D01–D08 registradas con dueño y fecha |
| E01 Identidad | Richar / José | Cerrar escalada docente, quick-login, MFA, sesiones; publicar contrato de identidad/autorización | T-ID; token revocado rechazado por todos los dominios y conexiones activas |
| E02 Contenido | Juan / Richar | Con E01: publicación, archivos privados, catálogo/versiones, completar lección y eventos de Contenido | T-CONT; descarga ajena/URL alternativa denegadas; publicación y Outbox atómicas |
| E03 Evaluación | Amelia / Juan | Con E01/E02: intentos, reloj, respuestas privadas, corrección, ResultadoConfirmado durable y motor de desafíos para Comunidad | T-EXAM; dos finalizaciones producen un resultado; contrato productor/consumidor compatible |
| E04 Comunidad | José / Richar y Juan | Con E01/E02/E03: colaboración completa, recursos por contrato, amistades, foro aprobado y coordinación de desafíos | T-COM; expulsión/revocación cortan acceso; permisos comprobados en HTTP y sockets |
| E05 Seguimiento | Amelia / Juan y José | Con E02/E03: composición de Aprendizaje, proyecciones de resultados/progreso, métricas y rutas | T-TRACK; replay no duplica ni altera verdad académica; autorización de grupos |
| E06 Planificación | Juan / Amelia | Con E05: mover agenda/preferencias/recordatorios de Contenido a Aprendizaje y conectarlos a progreso | T-PLAN; reconciliación y corte ensayados; cancelación y dos workers sin avisos duplicados |
| E07 Gamificación | José / Amelia | Con E03/E05: conectar consumidor durable, reglas, compensaciones, libro mayor, logros/ranking, encuesta separada | T-GAM; replay/recalificación correctos; saldo reconciliado y escritor antiguo retirado |
| E08 Cierre funcional | Richar → Juan → Amelia → José / otro integrante | En ese orden, completar todos los RQ/HU restantes del alcance acordado; integrar cada lote antes del siguiente | Cada RQ/HU con evidencia o exclusión formal; extensiones aprobadas también probadas |
| E09 Operación y calidad | Richar coordina; cada dueño corrige | HTTPS/WSS, backups/restore, accesibilidad, rendimiento, privacidad, dependencias, recuperación | T-OPS y pruebas transversales con resultados medidos; ningún riesgo crítico sin resolver |
| E10 Aceptación y versión | Los cuatro / responsable funcional | Ejecutar recorrido integral sobre develop congelado para entrega, revisar matriz y manuales | Acta de aceptación y CI del commit final; PR develop → main; etiqueta y rollback documentados |

No fijar fechas de entrega sin estimación del equipo. Si una dependencia falla, corregir su entrega y repetir sus consumidores afectados antes de continuar. Los criterios que cruzan módulos tienen un responsable de cierre aunque necesiten aportes de otros.

## Decisiones que deben quedar explícitas

Registrar cada decisión en un ticket/ADR enlazado desde el PR con criterio, responsable, resolución y fecha. No bloquear el trabajo independiente de una decisión pendiente.

| ID | Decisión | Responsable de coordinación |
|---|---|---|
| D01 | Resolver contradicciones entre HU aprobada, RQ en análisis/congelado y textos alternativos; alcance de cada versión | Cada dueño con responsable funcional |
| D02 | Habilitación docente, proveedor de login rápido y política de revocación/MFA | Richar |
| D03 | Visibilidad y compartición de recursos; traslado de PDFs de Comunidad; retención y almacenamiento | Juan con José |
| D04 | Reloj de examen, pausas, corrección manual, recalificación y versión de resultado | Amelia |
| D05 | Transporte durable, outbox/inbox, autenticación entre servicios, reintentos y cuarentena | Richar con productores/consumidores |
| D06 | Reglas y versiones de puntos/logros, compensaciones, ranking y migración de historial | José con Amelia |
| D07 | Métricas de carga, navegadores/dispositivos, accesibilidad, retención, RPO/RTO y proveedores externos | Richar con todo el equipo |
| D08 | Ambigüedades RQ65/RQ77/RQ88 y asignación complementaria de RQ82/83/86/110–114 | Dueños indicados en trazabilidad |

Los estados documentales se conservan. Aprobado no equivale a probado; propuesto/en análisis/pendiente necesita criterios y decisión de alcance; congelado/descartado requiere reactivación explícita antes de construirlo. Si el objetivo es entregar también esas variantes, registrarlas como nuevo alcance y pasar por el mismo ciclo completo. Una exclusión formal permite cerrar una versión delimitada, pero no afirmar implementación de esos requisitos.

## Trabajar en las ramas sin perder cambios

Antes de cambiar de rama, guardar el trabajo propio en commits revisados. Si hay archivos locales ajenos, separarlos o usar otro checkout; no usar reset/clean para despejar el árbol.

```sh
git status --short
git fetch origin
git switch Richard_Estela
git merge origin/develop
```

Sustituir `Richard_Estela` por la rama personal de la tabla. Si todavía no existe localmente, usar `git switch --track origin/Richard_Estela`. Después de integrar la base a develop, comprobar:

```sh
git merge-base --is-ancestor f8ea67709540b2e679f957e4bf9153fe0a7364dc HEAD
```

Un código de salida 0 confirma que se heredó el commit. Para conservar esta comprobación, integrar la base mediante merge; si se elige squash, registrar el nuevo SHA equivalente y revisar su contenido. Mientras ese PR no esté integrado, se puede incorporar explícitamente el commit de base con `git merge f8ea67709540b2e679f957e4bf9153fe0a7364dc` después de fetch; la guía se consulta en la rama de José. No fusionar versiones futuras de la rama personal de otro integrante por accidente.

En cada entrega:

1. Crear un ticket por vertical con RQ, HU, alias, criterios originales, cambios de contrato/datos y pruebas. Revisar lo existente antes de reescribirlo.
2. Implementar dominio → aplicación/puertos → adaptadores → HTTP → UI. Extender los checks de arquitectura a las capas nuevas. Aplicar permisos en el servidor.
3. Ejecutar pruebas del dominio y consumidores afectados; guardar evidencia sanitizada con SHA, entorno y resultado. Actualizar matriz/estado de implementación sin reescribir el estado documental original.
4. Preparar solo archivos del cambio y revisar el diff antes de commit:

```sh
git add ruta/al/archivo
node scripts/check-repository-safety.mjs --staged
git diff --cached --check
git diff --cached
git commit -m "feat(dominio): describe el comportamiento RQxx"
git push origin Richard_Estela
```

5. Abrir PR desde la rama personal hacia develop. Adjuntar criterios cubiertos, pruebas, migración/reconciliación, rollback y brechas. El revisor señalado prueba los contratos que consume. Esperar CI y revisión antes de fusionar.
6. Tras la integración, ejecutar fetch/merge de develop en la rama del siguiente responsable y en la propia antes del próximo lote. Resolver conflictos conservando los dos comportamientos y repitiendo sus pruebas. No forzar push ni sobrescribir main/develop.

La CI actual se ejecuta en PR a develop/main, push a esas ramas y manualmente; subir una rama personal por sí solo no demuestra CI remota verde. Configurar las protecciones requeridas en GitHub y comprobarlas, porque el texto de la guía no las aplica.

## Contratos y migraciones compartidos

| Propietario | Entrega | Consumidores / regla |
|---|---|---|
| Richar | Identidad mínima pública, rol verificado, sesión/revocación | Todos: no copiar usuarios/contraseñas; fallo de validación no autoriza acceso |
| Juan | Recurso/version/visibilidad; descarga autorizada; LeccionCompletada.v1 y RecursoPublicado.v1 | Comunidad y Aprendizaje; Evaluación obtiene solo material autorizado |
| Amelia | Intento/resultado confirmado/version; ResultadoConfirmado.v1; métricas/ruta | Gamificación y Seguimiento; no filtrar claves ni respuestas de intentos activos |
| José | Membresía vigente y vínculo de grupo; permisos; premio confirmado | Contenido consulta autorización; UI consume proyecciones mínimas |
| Juan en Aprendizaje | Plan y ocurrencias de recordatorio | Progreso entra por contrato; transporte de notificación desacoplado |

Solo ResultadoConfirmado.v1 tiene esquema/fixture inicial en [contratos](../../backend/contracts/README.md); los demás son entregables pendientes. Añadir ejemplos válidos/negativos, permisos, errores, timeout, paginación y compatibilidad. Un cambio incompatible requiere nueva versión y transición de consumidores.

Aprendizaje mantiene una sola base con módulos internos `tracking`, `planning`, `gamification`. Amelia coordina su composición; cada dueño implementa sus reglas. Numerar migraciones desde el último número integrado, una entrega a la vez; no editar `001_gamification.sql` aplicado porque tiene checksum. No escribir tablas de otro dominio ni usar joins entre bases. Un repositorio transitorio debe tener fecha/hito de retirada.

Para mover datos: respaldar → ensayar copia a destino → comparar conteos, claves y agregados por usuario → procesar cambios ocurridos durante la copia con mecanismo explícito → cortar escritor/lector con bandera → verificar → retirar legado tras ventana acordada. Registrar quién es autoridad en cada fase. Si el nuevo sistema ya recibió escrituras, un rollback requiere recuperar/reconciliar esas escrituras antes de volver; cambiar una bandera solo no basta. Probar reinicios entre cada fase y conservar los respaldos necesarios.

## Cierre del software

- Los 114 RQ y las 78 secciones de historias tienen resolución trazable. Cada criterio del alcance final tiene prueba reproducible y aceptación; lo excluido se enumera explícitamente.
- Cada módulo tiene UI y API integradas, autorización, persistencia, migraciones probadas, manual de usuario y runbook operativo. No quedan mocks en recorridos productivos ni doble autoridad.
- Pasan las pruebas de [PLAN_PRUEBAS.md](PLAN_PRUEBAS.md), incluida integración completa, seguridad, accesibilidad, carga y restauración. Incidencias se corrigen y se repite la prueba afectada.
- Se acepta una revisión concreta de develop, se integra a main y se registra una versión con notas, configuración sin secretos, respaldos y procedimiento de reversión ensayado.

Formato mínimo de evidencia por ticket: `RQ/HU/alias | criterio | commit | prueba/comando | fixture/entorno | esperado | obtenido | evidencia | revisor | estado de implementación`. Estados sugeridos: pendiente → en curso → validado técnicamente → aceptado. Los hallazgos históricos de la matriz no se convierten automáticamente en aceptación.
