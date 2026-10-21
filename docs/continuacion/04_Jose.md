# Continuación de José: M6 y M7

[Orden común, Git y cierre](README.md) · [Todos los RQ/HU](TRAZABILIDAD.md) · [Plan de pruebas](PLAN_PRUEBAS.md)

Actualizado: 21 de octubre de 2026. Esta guía continúa la base f8ea677 y conserva el backlog detallado y anexos A–E de la guía adjunta, con los nombres de colaboradores corregidos donde estaban intercambiados. Los estados y códigos documentales se mantienen. Las casillas inferiores representan trabajo por verificar/completar, no una afirmación de que todo falte o esté aceptado.

## Tu punto de partida y orden de entrega

Tu rama es **Jose_Queshyac**, sin acento. Posees Comunidad (M6) y Gamificación (M7). La base ya contiene tu primera vertical; continúa sobre ella y sobre los contratos integrados por los demás.

| Orden | Qué implementar | Entrega / prueba de cierre |
|---|---|---|
| 1 | JOS-01–04: con E01, completar revocación y permisos; conciliar foro, moderación y alcance | E04 / T-COM; usuario expulsado/revocado sin acceso |
| 2 | JOS-05–08: terminar grupos, emisión/historial de invitaciones, amistades, mensajes y recursos de Contenido | E04 / integración, concurrencia y UI completa |
| 3 | JOS-09/10 y JOS-17–20: foro aprobado y tiempo real; motor de desafíos recibido de Amelia | E04/E08 / reconexión, cursor, idempotencia y permisos |
| 4 | JOS-11–15: con E03/E05, conectar eventos reales, migrar premios y cerrar reglas, medallas/ranking | E07 / T-GAM; libro mayor y escrituras antiguas reconciliados |
| 5 | JOS-16 y JOS-21–27: encuesta y extensiones aprobadas, onboarding separado, descanso/orientación/desafíos | E08 / aceptación de cada criterio y variantes HUC |
| 6 | JOS-28–30: carga, accesibilidad, privacidad, recuperación y demostración completa | E09–E10 / T-OPS y recorrido final |

Los números JOS conservan los del checklist detallado inferior; cuando una tarea cruza filas, cerrar todas sus condiciones y las dependencias indicadas, no solo su primera aparición.

**Ya disponible:** casos de crear/invitar/aceptar/rechazar/entrar/salir/expulsar/cerrar y publicar mensaje, bloqueos transaccionales, UI de invitaciones, búsqueda de Identidad y descarga autenticada de PDF. El piloto de Gamificación tiene inbox/ledger/saldo/outbox y deduplicación, sin productor conectado ni endpoint público de premios. JOS-01/02/05/06/07/08/11/13 están parcialmente avanzados; no equivalen a M6/M7 completos.

**Archivos de entrada:** [casos de Comunidad](../../backend/services/community-service/src/application/communityUseCases.js), [adaptador transaccional](../../backend/services/community-service/src/infrastructure/sequelizeCommunityRepository.js), [tests reales](../../backend/services/community-service/test/integration/community.test.js), [Gamificación](../../backend/services/learning-service/src/modules/gamification), [integración de premios](../../backend/services/learning-service/test/integration/awards.test.js).

**Siguientes brechas concretas:** cada emisión de invitación debe tener identidad/historial propios; mensajes necesitan cursor e idempotencia; completar amistad aceptada y autorización por acción en sockets; mover PDFs con Juan y verificar checksums/permisos antes de retirar volumen viejo. No usar Redis como fuente definitiva de membresía o premios.

**Handoff:** esperar contrato E01 para revocación, E02 para recursos y E03 para resultados. Acordar con Amelia política de recalificación/compensación antes de consumir resultados reales. Migrar puntos/logros con conciliación por usuario y retirar su escritor heredado de Evaluación. La regla de 15 puntos usada en tests es fixture, no regla de producto. Quality/Sonar no implementa la encuesta de satisfacción.

## Cómo cerrar tu rama

En cada entrega seguir fetch → merge de develop → implementación y pruebas → commit/push a `Jose_Queshyac` → PR a develop → revisión/CI → integración. Los comandos completos están en la guía común. No incorporar cambios de otro dueño mediante acceso directo a sus tablas.

Revisar todas las filas de tus módulos en trazabilidad, los RQ complementarios asignados y los aliases del Anexo B. Cada extensión aceptada necesita criterios y pruebas adicionales. Adjuntar manual de usuario, runbook de recuperación y evidencia por criterio. Terminar con E09/E10, no al completar el backend.

## Backlog detallado conservado de la guía personal

La numeración H0–H6 identifica los hitos originales; E00–E10 de la guía central define el orden de integración actual. La separación app/servidor ya existe: completar los casos de uso pendientes de ese ticket sin reescribirla. Los anexos resumen el alcance; las tablas originales completas de aceptación están en [M6](../historias/M6.md) y [M7](../historias/M7.md).

## 2. Implementación por hitos

### H0 — Alcance y permisos de comunidad

- [ ] JOS-01: documentar rol global versus owner/moderador/miembro local, invitaciones, bloqueo/expulsión y derecho a material/resultados. Revisar con Richar.
- [ ] JOS-02: pruebas de miembro ajeno, invitación reutilizada, cambio de grupo y lectura directa de recursos. Juan cierra acceso de archivos privados; José mantiene la membresía autoritativa.
- [ ] JOS-03: formalizar F01–F08 y nueve alias de M6; redactar aceptación real de desafíos semanales y resolver títulos HU05/HU04, EPIC duplicadas y permisos.
- [ ] JOS-04: congelar variantes no aprobadas (RQ42) y delimitar foro RQ85; aprobar moderación y reglas de competencia antes de habilitar funciones públicas.
- [ ] Salida: permiso por operación y recurso, no solo menú oculto; backlog sin ambigüedad bloqueante.

### H1–H2 — Colaboración completa y segura

- [ ] JOS-05: extraer casos CrearGrupo, InvitarMiembro, AceptarInvitacion, PublicarMensaje, CompartirRecurso, ReportarAbuso y ModerarComunidad; separar consultas de performance de reglas de membresía.
- [ ] JOS-06: grupo/comunidad, búsqueda paginada, invitaciones con expiración/estado y operación atómica, amistades con aceptación; no añadir contacto unilateralmente ni exponer datos privados.
- [ ] JOS-07: mensajes persistentes con autor/fecha/orden, edición/retirada según política, limites y sanitización; paginar por cursor para recuperar conversación.
- [ ] JOS-08: compartir vínculo a recurso autorizado de Juan. Comunidad no copia archivos a una segunda zona pública ni expone directorios de Contenido.
- [ ] JOS-09: foros/hilos/respuestas según variante aprobada; reportes, cola de revisión, motivo, auditoría y apelación/corrección según política. Límites por usuario y defensa frente a spam/XSS.
- [ ] JOS-10: tests de community y UI, permisos backend de cada flujo y E2E crear–invitar–aceptar–conversar–compartir–expulsar.
- [ ] Salida: salida/expulsión revoca acceso; otra comunidad no ve conversación/material ni rendimiento.

### H3 — Gamificación en Aprendizaje

- [ ] JOS-11: separar motor de premios de la finalización del examen; Amelia produce resultado confirmado/revisado, José consume evidencia y concede según regla.
- [ ] JOS-12: migrar definiciones/reglas, logros concedidos, perfil/puntos/eventos y configuración a Aprendizaje. Comparar cantidades y totales por alumno; corte gradual sin duplicar premios.
- [ ] JOS-13: libro mayor de puntos/premios con evento de origen, regla/versiones y restricción única (evento, beneficiario, regla/versión según semántica acordada). Transacción de concesión + actualización de saldo.
- [ ] JOS-14: acordar corrección/recalificación: premio puede conservarse, ajustarse o compensarse según regla; registrar compensación, no borrar historia para esconder error.
- [ ] JOS-15: ranking/insignias/niveles/racha con reglas públicas y privacidad; cálculos reproducibles y ventanas de tiempo. Caché Redis si es necesaria, con TTL/invalidation y fuente persistente.
- [ ] JOS-16: encuesta opcional postactividad independiente de Sonar y onboarding gamificado consumiendo registro/primer ingreso de Richar. Omitir encuesta no bloquea estudiar.
- [ ] Salida: replay no otorga puntos otra vez; pérdida de caché no pierde prestigio ni logros; onboarding y encuesta tienen criterios distintos.

### H4 — Tiempo real y coordinación de desafíos

- [ ] JOS-17: añadir canal WSS de Comunidad si se acepta chat en vivo; autorización por membresía al conectar y por mensaje, revocación, límites, acknowledgement e ID de cliente.
- [ ] JOS-18: reconexión recupera historial desde cursor; persistir antes de confirmar, deduplicar mensaje repetido y definir orden. No prometer entrega al receptor solo porque emisor recibió ack.
- [ ] JOS-19: varias réplicas con estado/presencia y adaptador adecuados; presencia no es membresía ni prueba de identidad. Richar aporta WSS y sesión, Amelia coordina socket del motor.
- [ ] JOS-20: Comunidad programa/inscribe/cancela desafíos; Evaluación ejecuta preguntas/cronómetro/cierre; Gamificación concede un premio a un resultado confirmado. No añadir otro motor de evaluación a Community.
- [ ] JOS-21: eventos MiembroIncorporado/Retirado, DesafioProgramado/Cancelado y LogroOtorgado versionados con Outbox; Solo datos mínimos. Amelia gestiona avisos de progreso/tutor con permisos vigentes.
- [ ] Salida: cancelación/replay/reconexión no inicia dos salas ni entrega premios dobles; revocación protege chat y resultados.

### H5 — Comunidad futura aprobada

- [ ] JOS-22: zona de descanso ligera: noticias, curiosidades, mural, orientación y bienestar; Juan aporta contenido revisado; registrar fuente, fecha y responsable editorial.
- [ ] JOS-23: avatar 2D/mapa/movimiento multijugador separado como épica de alto costo, condicionado a aprobación. Accesibilidad con alternativa textual, privacidad/presencia, límites y rendimiento; no comprometerlo como pantalla ya terminada.
- [ ] JOS-24: juego de lectura rápida y juegos colaborativos con Amelia/Juan; Comunidad gestiona lobby/invitaciones, no notas por velocidad del cliente.
- [ ] JOS-25: panel de comunidad con API/proyección de Amelia y datos mínimos; política de tutor/administrador local por resolver, cohortes pequeñas y estadísticas agregadas.
- [ ] JOS-26: desafíos semanales manuales/generados: timezone, frecuencia, condiciones de inscripción, mínimos de participantes, cancelación y reglas de puntos explícitas. No adoptar automáticamente “100 preguntas”, premios negativos o sanciones sin validación pedagógica.
- [ ] JOS-27: orientación vocacional opcional, evaluación de utilidad y consentimiento; no presentar un cuestionario como diagnóstico definitivo ni recolectar datos sin finalidad.
- [ ] Salida: cada propuesta tiene aceptación y pruebas; contenido ligero no se presenta como mundo virtual completo.

### H6 — Integración, seguridad y entrega

- [ ] JOS-28: pruebas de chat/foros y premisas de premios bajo carga; no confundir 200 lecturas con 200 miembros enviando/recibiendo y rendiendo.
- [ ] JOS-29: restore/replay de membresías, mensajes, libro mayor y reglas con Richar/Amelia; comprobar permisos después del restore.
- [ ] JOS-30: demostración comunidad → invitación → recurso → desafío → resultado → insignia/ranking → moderación → acceso revocado.
- [ ] Salida: aceptación funcional, integridad de premios, moderación y runbooks; sin puntos arbitrarios ni datos ajenos.

## 3. Contratos y colaboración

| Límite | José posee | Otro integrante |
| --- | --- | --- |
| Membresía y rol local | Comunidad, decisión de acceso por grupo | Richar rol global/sesión; Juan permiso material |
| Recomendación de recursos en chat | Mensaje/vínculo y audiencia | Juan recurso/versionado; no acceso a uploads privados sin autorización |
| Desafío | Inscripción/programación/lobby en Comunidad | Amelia ejecuta evaluación, José premia en Aprendizaje |
| Rendimiento de grupo | Audiencia autorizada/presentación | Amelia produce métricas correctas |
| Premio/logro | Regla, concesión y libro mayor en Aprendizaje | Amelia/Juan aportan hechos confirmados |
| Onboarding | Gamificación del recorrido | Richar primer ingreso/perfil, Juan/Amelia tareas del recorrido |
| Encuesta de experiencia | Satisfacción y agregación | No usar Sonar/quality-service como sustituto |
| Bienestar/orientación | Presentación opcional y comunidad | Juan contenido revisado; validación institucional de finalidad |

Eventos contienen eventId/schemaVersion/occurredAt/correlationId y referencias necesarias, no cuerpos de chat ni perfil privado cuando no haga falta. Retirar miembro invalida autorizaciones/cachés; notificación asíncrona por sí sola no garantiza revocación inmediata.

## 4. Clean code y modelo específico

Comunidad: entidades Comunidad/Membresia/Invitacion/Mensaje/ReporteModeracion, casos de uso y puertos RepositorioComunidad, PoliticaSesion, CatalogoRecursos, Reloj y Outbox. Separar rol local de rol global. Services config/maintenance/performance no deben mezclarse con cada regla de entrada a grupo.

Gamificación: ReglaVersionada, Evidencia, Concesion, MovimientoPuntos y PerfilDerivado. Función pura evalúa la regla; caso de uso transaccional concede una sola vez; adaptador consume evento. El navegador no manda saldo ni premio definitivo. Mantener ranking como proyección recalculable, no fuente del saldo. React separa chat/foro/lobby/perfil de logros y muestra loading, offline, error y pendientes sin simular éxito.

## 5. Pruebas personales

| Nivel | Casos exigidos |
| --- | --- |
| Unitario | Permisos locales, invitación, reglas/versiones, cálculo/compensación de puntos y rachas |
| Integración | DB real aislada: dos aceptaciones/envíos/premios concurrentes; restricción única y transacción |
| Seguridad | Miembro ajeno/expulsado, sesión revocada, XSS/spam, recurso privado y estadísticas de otra comunidad |
| Contrato | Membresía, material, resultado confirmado/revisado, logro y cancelación |
| E2E | Grupo–invitación–recurso–desafío–premio; encuesta opcional; onboarding independiente |
| WSS/resiliencia | Replay, ack perdido, reconexión, varios procesos, proveedor caído y restore |
| Accesibilidad | Chat con teclado/lector, avisos no solo color, ranking y alternativa a avatar/mapa |

Revisor habitual: **Richar** para permisos/chat y **Amelia** para eventos/premios; Juan revisa recursos y contenido de bienestar.

## 6. Entregables personales

- [ ] M6/M7 completos en alcance aprobado, con alias/criterios conciliados.
- [ ] Comunidad con permisos reales, moderación y contratos de material/resultados.
- [ ] Gamificación migrada, idempotencia, ledger y ajuste auditado.
- [ ] WSS/reconexión probado si se aprueba, sin confundirlo con chat REST existente.
- [ ] Encuesta, onboarding, ranking y logros documentados como flujos distintos.
- [ ] Manual de moderación/comunidad y runbook de replay, revocación y reconstrucción de ranking.

## Anexo A. Historias de la especificación a cargo de José

11 entradas temáticas. El estado corresponde a la fuente, no al resultado de pruebas de este turno. La tarea y la prueba de cierre son la guía de implementación; refinarlas en tickets con criterios completos antes de comenzar. Las historias compartidas mantienen a esta persona como responsable de cierre de su módulo.

| Clave de planificación | Historia | Estado de la fuente | Implementación/resultado esperado | Prueba mínima de cierre |
| --- | --- | --- | --- | --- |
| M6-F01 | Grupos de estudio virtuales | Aprobado | Crear/editar grupos, buscar, invitar/aceptar, incorporar miembros y compartir recursos con autorización. | Invitación expirada/repetida; recurso ajeno; membresía eliminada pierde acceso. |
| M6-F02 | Foros públicos y dinámicas | Aprobado; alcance por conciliar | Foro RQ85, hilos/respuestas/moderación y dinámica grupal separada; RQ42 permanece congelado. | Permisos, XSS, paginación, reportes y eliminación auditada. |
| M6-F03 | Interfaz de comunidad y canal de texto | Aprobado | Amistades, lista de miembros y mensajes persistidos; tiempo real en Comunidad como evolución explícita. | No entrar a sala ajena; reconectar sin perder/duplicar mensajes; revocación inmediata según contrato. |
| M6-F04 | Zona de descanso virtual | Propuesto | Primero contenido ligero; después avatar 2D/movimiento/salas si se aprueba presupuesto y accesibilidad. | Acceso opcional, alternativa textual, payload/límites y sincronización entre réplicas. |
| M6-F05 | Secciones de descanso y desafíos | Propuesto; encabezado HU05 y tabla HU04 | Separar noticias, orientación, bienestar, mural y juegos; definir criterios independientes con el equipo. | Fuentes/fecha/editor; sin diagnósticos ni captación innecesaria de datos; juegos con servidor autoritativo. |
| M6-F06 | Expulsar, aprobar e invitar | Propuesto | Resolver docente versus estudiante-administrador; moderación con motivos y trazabilidad. | No autoelevar rol; expulsión válida revoca acceso; sanciones de puntos no automáticas sin regla aprobada. |
| M6-F07 | Rendimiento de la comunidad | Propuesto | Resumen autorizado suministrado por Amelia; integrar logros de Gamificación (José) sin consultar DB ajena. | Cohorte/muestra/privacidad; responsable de otro grupo recibe denegación. |
| M6-F08 | Desafíos semanales programados | Propuesto; criterios duplicados de estadísticas | Redactar aceptación real: programación, inscripción, cancelación y condiciones de inicio; Amelia ejecuta motor. | Cambio/cancelación no dispara sala antigua; una ejecución y un premio por resultado. |
| M7-HU01 | Calidad de la experiencia | Aprobado | Encuesta opcional posterior al uso con minimización de datos y análisis agregado. | Rechazar encuesta no bloquea estudio; envío repetido no multiplica respuestas; privacidad. |
| M7-HU02 | Reconocimiento y logros | Propuesto | Reglas de insignias/medallas versionadas, evidencia y concesión única. | Evento duplicado/fuera de orden; regla nueva no cambia premios históricos sin política. |
| M7-HU03 | Gamificación global | Propuesto | Puntos, niveles, ranking y constancia; separar prestigio de nota académica. | Recalcular desde libro mayor; no autoasignar puntos; empates/privacidad/fraude. |

## Anexo B. Correspondencia con «Historias de usuario completo»

12 entradas asignadas. El prefijo HUC distingue la fuente alternativa. Para M6, B01…B09 es el orden de sus bloques, porque repiten EPIC/IDs; no son IDs originales nuevos. Los estados contradictorios no se resuelven automáticamente. Las extensiones señaladas forman parte del backlog futuro condicionado a aprobación.

| Alias de fuente | Título original | Estado alternativo | Correspondencia y alcance que no debe perderse |
| --- | --- | --- | --- |
| HUC-M6-B01 | EPIC01: Formación de grupos de estudio virtuales | Aprobado | M6-F01 — Creación y gestión de grupos. |
| HUC-M6-B02 | EPIC01: Formación de grupos de estudio virtuales | Aprobado | M6-F02 — Segundo bloque de grupos/foros; delimitar RQ85 versus RQ42 congelado. |
| HUC-M6-B03 | Interfaz de comunidad y canal de texto. | Aprobado | M6-F03 — Chat/interfaz; requisitos vinculados diferentes requieren conciliación. |
| HUC-M6-B04 | EPIC02: Interfaz gráfica, “Zona de descanso”. | Propuesto | M6-F04 — Descanso virtual; no adoptar tecnologías opcionales del texto como decisión. |
| HUC-M6-B05 | EPIC02: Interfaz gráfica, “Zona de descanso”. | Propuesto | M6-F05 — Secciones/noticias/orientación; EPIC repetida. |
| HUC-M6-B06 | Desafíos Semanales o Generados. | Propuesto | M6-F08; M3-HU15 — Desafíos semanales/generados: Comunidad organiza, Amelia ejecuta. |
| HUC-M6-B07 | EPIC03: Privilegios de Estudiante – Administrador | Aprobado | M6-F06 — Estudiante-administrador aprobado aquí versus privilegios docentes propuestos en especificación; resolver actor. |
| HUC-M6-B08 | EPIC03: Privilegios de Estudiante – Administrador | Propuesto | M6-F07 — Rendimiento del grupo y privacidad. |
| HUC-M6-B09 | EPIC02: Privilegios de Estudiante – Administrador | Propuesto | M6-F08 — Programación; conciliar EPIC y criterios duplicados. |
| HUC-M7-HU01 | Onboarding guiado con gamificación inicial | Aprobado | RQ99; M7-HU03 — Onboarding gamificado adicional; Richar entrega primer ingreso, José recorrido/premios. NO equivale a encuesta M7-HU01. |
| HUC-M7-HU02 | Sistema de logros con recompensas visuales | Propuesto | M7-HU02 — Logros/recompensas visuales. |
| HUC-M7-HU03 | Interacción gamificada continua | Propuesto | M7-HU03 — Interacción continua y constancia. |

## Anexo C. Correspondencia con las 18 historias del primer avance

La presentación resumida selecciona estas historias de las anteriores; no limita el resto del plan.

| HU normalizada | Historia(s) de origen o responsabilidad |
| --- | --- |
| HU-PAE-15 | M6-F01 |
| HU-PAE-16 | M6-F02/03/06 |
| HU-PAE-17 | M7-HU02/03 |

## Anexo D. Requisitos con responsabilidad principal

15 registros asignados de los 109 del catálogo. CAT conserva posición para distinguir duplicados. Estado/prioridad se mantienen literalmente. El responsable puede necesitar a otro dominio (por ejemplo RQ12: José autoriza grupo y Juan almacena el recurso); asignación principal no autoriza modificar tablas ajenas. Vincular cada fila a HU/ticket, prueba y evidencia en H0–H1. Si un requisito no tiene HU propia, crear historia derivada para aprobación, sin fabricar un estado aprobado.

| Registro | RQ | Tipo | Estado | Prioridad | HU/tarea de enlace | Descripción de la fuente |
| --- | --- | --- | --- | --- | --- | --- |
| CAT-003 | RQ03 | Funcional | Aprobado | Alta | M6-F03 | Agregar una barra de búsqueda de usuarios por nombre o por identificador único para agregarlos como amigo. |
| CAT-010 | RQ10 | Funcional | Aprobado | Alta | M6-F01 | Permitir que los profesores puedan crear su propio grupo de estudio. |
| CAT-011 | RQ11 | Funcional | Aprobado | Alta | M6-F01 | Permitir que los profesores puedan enviar invitaciones a estudiantes específicos a través del identificador único. |
| CAT-012 | RQ12 | Funcional | Aprobado | Media | M6-F01/03 | Permitir que los profesores compartan archivos en formato PDF en sus grupos de estudio. |
| CAT-030 | RQ49 | Funcional | Aprobado | Alta | M7-HU01 | El sistema debe mostrar una encuesta de calidad tras realizar un examen, simulacro o desafió. |
| CAT-046 | RQ70 | Funcional | Aprobado | Media | M7-HU02 | El sistema debe tener un sistema de logros o medallas por avances académicos. |
| CAT-051 | RQ78 | Funcional | Aprobado | Media | M7-HU02; M4-HU06/07 | El sistema debe detectar y notificar logros significativos en el progreso del estudiante. |
| CAT-055 | RQ85 | Funcional | Aprobado | Media | M6-F02 | Establecer foros públicos para intercambio de conocimientos. |
| CAT-061 | RQ93 | Funcional | Aprobado | Media | M7-HU03 | Incorporar elementos de gamificación para motivar y enganchar a los estudiantes. |
| CAT-078 | RQ51 | Funcional | En análisis | Baja | M6-F05 | El sistema debe ofrecer orientación vocacional opcional. |
| CAT-081 | RQ71 | Funcional | En análisis | Alta | M6-F03 | El sistema debe permitir que los profesores recomienden recursos del repositorio académico de forma directa dentro del chat de su grupo de estudio. |
| CAT-084 | RQ79 | Funcional | En análisis | Baja | M6-F04/05 | El sistema debe incluir una "zona de descanso" con contenidos ligeros (ej. frases, curiosidades). |
| CAT-085 | RQ89 | Funcional | En análisis | Media | M6-F01/07/08 | Facilitar la gestión eficiente de grupos de estudio, gráficos de rendimiento de estudiantes y desafíos generados. |
| CAT-086 | RQ42 | Funcional | Congelado | Media | M6-F02 (congelado: no ejecutar esta variante) | El sistema debe tener un foro de preguntas y respuestas entre usuarios. |
| CAT-095 | RQ77 | Funcional | En análisis | Por validar | M6-F03 (significado distinto de CAT-083) | El sistema debe permitir que los profesores recomienden recursos del repositorio académico de forma directa dentro del chat de su grupo de estudio. |

## Anexo E. Plantilla de ticket y cierre de versión

```text
Ticket: [RIC/JOS/AME/JUA]-NN · Título orientado a resultado
Dueño / revisor:
HU de especificación / alias HUC / CAT y RQ:
Estado y decisión de alcance aprobada:
Dado… Cuando… Entonces… (positivo, negativo y concurrencia/fallo)
Permisos por recurso y datos personales:
Contrato/evento y versión / dependencia / responsable de desbloqueo:
Backend + UI + migración + rollback:
Tests y entorno aislado / reporte / demostración:
PR / fecha de aceptación / validador / riesgo o pendiente restante:
```

Checklist final personal: todas las historias del alcance aprobado aceptadas; contratos compatibles; regresión verde; datos reconciliados; manual/runbook actualizado; seguridad/accesibilidad revisadas; evidencia guardada; propuestas/congeladas y decisiones pendientes separadas. “Completar implementación futura” significa implementar las propuestas **cuando se aprueben**, no ejecutar sin definición ni reactivar congeladas.


## Procedencia

Guía adjunta: `04_Jose_Comunidad_Gamificacion.md`, de 5 de octubre de 2026. SHA-256 del archivo recibido: `f744029ddd861bb577db340ec51dfcc487ee062e470233864b881322dcc6d3a9`. Se incorporan secciones 2–6 y anexos A–E; el marco común repetido se sustituye por la guía central actualizada. No se requieren archivos temporales de extracción para continuar.
