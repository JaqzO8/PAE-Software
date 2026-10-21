# Continuación de Juan: M2 y M5

[Orden común, Git y cierre](README.md) · [Todos los RQ/HU](TRAZABILIDAD.md) · [Plan de pruebas](PLAN_PRUEBAS.md)

Actualizado: 21 de octubre de 2026. Esta guía continúa la base f8ea677 y conserva el backlog detallado y anexos A–E de la guía adjunta, con los nombres de colaboradores corregidos donde estaban intercambiados. Los estados y códigos documentales se mantienen. Las casillas inferiores representan trabajo por verificar/completar, no una afirmación de que todo falte o esté aceptado.

## Tu punto de partida y orden de entrega

Tu rama es **Juan_Rengifo**. Posees Contenido (M2) y Planificación (M5). Planificación se integra dentro de Aprendizaje, no en otro microservicio. Incorpora la base y los contratos de E01 desde develop.

| Orden | Qué implementar | Entrega / prueba de cierre |
|---|---|---|
| 1 | JUA-01–04: clasificar archivos, cerrar acceso alternativo a privados y conciliar criterios | E02 / T-CONT con usuario ajeno y URL directa |
| 2 | JUA-05–10: vertical repositorio → carga → publicación → descarga; catálogo, lecciones, favoritos y pruebas reales | E02 / T-CONT; UI docente/estudiante completas |
| 3 | JUA-12/15/18: eventos durables y contrato de recursos/versiones/compartición; coordinar migración de PDFs de Comunidad | E02 y E04 / contratos y reconciliación de archivos |
| 4 | JUA-11/13/14/16/17: después de E05, mover agenda/preferencias y construir recordatorios concurrentes | E06 / T-PLAN; corte y rollback ensayados |
| 5 | JUA-19–24: completar pendientes/variantes aprobadas de M2/M5 y RQ110/111; colaborar en RQ86/112/113 | E08 / pruebas específicas de cada criterio |
| 6 | JUA-25–27: carga de consultas/archivos, accesibilidad, restore y recorrido estudio-plan | E09–E10 / T-OPS y aceptación |

**Ya disponible:** createApp de Contenido y pruebas heredadas; siguen pendientes la extracción del negocio y la protección integral de archivos de Contenido. La descarga privada implementada en Comunidad no resuelve tu directorio uploads. La planificación productiva sigue en Contenido; el módulo de destino es solo un punto de extensión.

**Archivos de entrada:** [app de Contenido](../../backend/services/content-service/src/app.js), [controladores](../../backend/services/content-service/src/controllers), [Planificación de destino](../../backend/services/learning-service/src/modules/planning/README.md), [contratos](../../backend/contracts/README.md).

**Handoff:** entrega a Amelia catálogo y eventos de lección/publicación; a José, recurso/version/visibilidad y descarga que revalida membresía. No convertir una URL firmada de larga vida en permiso permanente. Amelia entrega proyecciones y composición de Aprendizaje antes del corte de Planificación. Migra preferencias, fechas, zonas, cancelaciones e historial, no solo tablas vacías.

## Cómo cerrar tu rama

En cada entrega seguir fetch → merge de develop → implementación y pruebas → commit/push a `Juan_Rengifo` → PR a develop → revisión/CI → integración. Los comandos completos están en la guía común. No incorporar cambios de otro dueño mediante acceso directo a sus tablas.

Revisar todas las filas de tus módulos en trazabilidad, los RQ complementarios asignados y los aliases del Anexo B. Cada extensión aceptada necesita criterios y pruebas adicionales. Adjuntar manual de usuario, runbook de recuperación y evidencia por criterio. Terminar con E09/E10, no al completar el backend.

## Backlog detallado conservado de la guía personal

La numeración H0–H6 identifica los hitos originales; E00–E10 de la guía central define el orden de integración actual. La separación app/servidor ya existe: completar los casos de uso pendientes de ese ticket sin reescribirla. Los anexos resumen el alcance; las tablas originales completas de aceptación están en [M2](../historias/M2.md) y [M5](../historias/M5.md).

## 2. Implementación por hitos

### H0 — Material privado y backlog coherente

- [ ] JUA-01: inventariar visibilidad pública/privada, dueño, grupo y versión de cada tipo de recurso. Con José acordar permiso por membresía; con Richar rol/sesión.
- [ ] JUA-02: reproducir accesos sin token, con estudiante ajeno y mediante URL directa a uploads. Bloquear solo recursos privados, mantener los públicos deliberadamente publicados con clasificación explícita.
- [ ] JUA-03: descomponer M2-HU07: guía de lectura/estudio y juego de velocidad multijugador tienen criterios diferentes; este último requiere motor de Amelia, salas de José y premios de José.
- [ ] JUA-04: conciliar títulos copiados de M2-HU02/HU05, “Aceptado” de HU08 y RQ47 en análisis; no cerrar una HU con criterios de otra.
- [ ] Salida: archivos privados sin acceso alternativo; inventario y criterios aprobados.

### H1–H2 — Contenido completo y publicación segura

- [ ] JUA-05: caracterizar rutas y migrar una vertical CrearRepositorio → SubirRecurso → Publicar → Descargar. Separar negocio de controller/Sequelize.
- [ ] JUA-06: uploads con límite/tipo real, nombres seguros, prevención de traversal, revisión de riesgo de archivos y almacenamiento privado; no confiar solo en extensión/MIME enviado. Elegir análisis de archivos según riesgo/entorno.
- [ ] JUA-07: estado borrador/subiendo/revisado/publicado/retirado o equivalente aceptado; compensar archivos huérfanos y cargas fallidas; reintento de carga/publicación no duplica recurso.
- [ ] JUA-08: categorías/tema/subtema coordinados con Amelia; favoritos únicos, rating consistente, comentarios autorizados, búsqueda paginada y popularidad con definición de conteo y protección contra manipulación.
- [ ] JUA-09: lecciones, ejercicios, resúmenes, solucionarios editoriales y progreso asociado a versión. El contenido no puede revelar respuestas de un examen activo.
- [ ] JUA-10: corregir scripts de test e incorporar integración de app real/DB/uploads temporales; E2E docente publica/estudiante autorizado estudia/usuario ajeno no descarga.
- [ ] Salida: M2 aprobado con permisos y regresión; recursos incompletos no aparecen publicados.

### H3 — Planificación en Aprendizaje

- [ ] JUA-11: extraer casos de uso de Planificación con puertos de reloj, agenda y notificador; coordinar composición con Amelia. M5 no se convierte en un servicio separado.
- [ ] JUA-12: conservar Contenido como fuente de finalización de lección y su versión; emitir LeccionCompletada.v1 tras confirmar. Aprendizaje mantiene proyección de progreso/plan, no una segunda verdad que escriba de vuelta sin comando definido.
- [ ] JUA-13: migrar StudyPreference/StudyReminder/configuración a su propietario acordado en Aprendizaje: equivalencia de usuario, fecha, zona horaria, cancelación e historial. Ensayar copia/reconciliación/corte; retirar escritura vieja solo después de validar.
- [ ] JUA-14: agenda, horas sugeridas, descansos, sesiones saludables, Pomodoro pausado/reanudado e historial. Hora del usuario explícita (America/Lima por defecto si se acuerda), UTC para persistencia y conversión en bordes.
- [ ] Salida: mismo comportamiento útil y datos reconciliados; planificación deja de depender de modelos internos de Contenido.

### H4 — Recordatorios y objetos privados

- [ ] JUA-15: publicación de eventos RecursoPublicado.v1 y LeccionCompletada.v1 con Outbox, sin incluir archivos completos ni respuestas secretas.
- [ ] JUA-16: recordatorios con clave única por usuario/plan/ocurrencia, claim atómico para múltiples workers, reintento limitado y estado de entrega. Cancelar/modificar un plan invalida ocurrencias viejas.
- [ ] JUA-17: notificación interna primero; correo/push tras elección de proveedor y consentimiento. Guardar intentado/enviado/fallido, no afirmar lectura o entrega garantizada.
- [ ] JUA-18: almacenamiento de objetos privado con metadatos, checksum, autorización y enlaces temporales; migrar archivos y verificar contenido íntegro con backup de Richar.
- [ ] Salida: dos workers/replay no envían dos recordatorios; URL temporal vencida o permiso retirado no mantiene acceso indefinido.

### H5 — Evolución educativa aprobada

- [ ] JUA-19: microcursos y guía/ruta por temas con secuencia, prerequisitos y enlaces vigentes; Amelia suministra diagnóstico/ruta y Juan compone contenido (RQ64).
- [ ] JUA-20: videos/audio/transcripciones, mapas conceptuales con alternativa textual y revisión humana; IA solo borradores con trazabilidad, no publicación automática.
- [ ] JUA-21: lectura rápida: evaluar primero experiencia individual; juego multijugador se implementa solo con criterios pedagógicos, accesibilidad y contratos aprobados.
- [ ] JUA-22: offline de lectura con almacenamiento local separado por cuenta, sincronización de progreso idempotente, control de versión y revocación/limpieza. No descargar material privado automáticamente en dispositivos compartidos.
- [ ] JUA-23: importar/exportar materiales PDF/DOC (RQ24 propuesto): definir fidelidad/conversión y límites. No confundir con bancos JSON/CSV/XLSX que pertenecen a Amelia.
- [ ] JUA-24: apoyo emocional, ansiedad y motivación como contenido opcional revisado; minimizar datos, sin diagnóstico. José puede mostrar contenido en Comunidad; Juan conserva material/planificación.
- [ ] Salida: propuestas aceptadas con evidencia; lo no aprobado queda explicitado, no implementado por anticipación.

### H6 — Validación y entrega

- [ ] JUA-25: medir listas/búsquedas/descargas, paginación y DB; eliminar N+1 y usar índices según consultas medidas. No cachear permisos indefinidamente.
- [ ] JUA-26: probar restore con metadatos/archivos y agenda, baja conectividad, teclado/lector, fuentes grandes y cambios de cuenta.
- [ ] JUA-27: demostrar ciclo docente publica → alumno estudia → progreso actualiza → plan recuerda → usuario cancela sin avisos posteriores.
- [ ] Salida: runbook de contenido/planificación, evidencias y aceptación completa del alcance.

## 3. Contratos y propiedad de datos

| Contrato | Juan produce/posee | Dependencia |
| --- | --- | --- |
| Catálogo de material | ID, tema, versión, visibilidad y metadatos mínimos | Amelia obtiene material autorizado, no DB ni directorio de uploads |
| Compartir con grupo | Permiso del recurso y vínculo de compartición | José aporta membresía vigente; denegar si permiso no puede comprobarse |
| LeccionCompletada.v1 | Hecho confirmado con usuario/lección/versión/fecha | Amelia proyecta progreso; José aplica regla de logro |
| RecursoPublicado.v1 | Publicación confirmada y audiencia autorizada | Avisos sin duplicados; José puede recomendar enlace autorizado |
| Ruta de aprendizaje | Juan compone contenido vigente de la ruta | Amelia posee diagnóstico y criterio de recomendación |
| Agenda/recordatorios | Juan en Aprendizaje | Richar coordina transporte; otros no crean otra agenda |
| Actividad breve | Juan organiza y liga recurso | Amelia evalúa; José concede recompensa confirmada |

Todos los contratos candidatos se documentan en OpenAPI/esquema de evento y se validan antes de usarse. No llamar un evento “publicado” desde un borrador.

## 4. Clean code y modelo sugerido

Contenido: casos CrearRepositorio, AdjuntarMaterial, PublicarMaterial, DescargarMaterial y CompletarLeccion; puertos RepositorioContenido, AlmacenArchivos, PoliticaAccesoGrupo, Reloj y PublicadorDeHechos. Infraestructura adapta Sequelize/objetos/HTTP. Planificación: casos CrearPlan, CambiarPlan, ProgramarOcurrencia y ProcesarRecordatorio separados del transporte.

Mantener invariantes: recurso publicado referencia un archivo válido; archivo privado requiere permiso actual; favorito único usuario/repositorio; una ocurrencia de recordatorio tiene estado auditable; un progreso corresponde a la versión consumida. Centralizar límites/tipos/configuración, evitar números operativos incrustados. En UI separar editor/listado/visor y sus hooks; no repetir clientes HTTP ni convertir el Pomodoro en autoridad de progreso académico.

## 5. Pruebas personales

| Nivel | Casos exigidos |
| --- | --- |
| Unitario | Publicación, visibilidad, favorito, horarios, zona horaria, cancelación, creación de ocurrencia |
| Integración | Upload/download contra app real, DB y storage temporal; dos favoritos/cargas/workers concurrentes |
| Seguridad | Sin token, otro estudiante, profesor ajeno, grupo retirado, path traversal, archivo inválido y URL directa |
| Contrato | Recurso/versión/visibilidad, finalización de lección, evento repetido y catálogo de rutas |
| E2E | Publicación–consulta–descarga–favorito–lección–plan–recordatorio cancelado |
| Resiliencia | Objeto perdido, caída proveedor, replay/out-of-order, offline/reconexión/cambio de usuario |
| Accesibilidad | Editor y lector, contenido multimedia equivalente, mapa textual, Pomodoro y agenda con teclado |

Revisor habitual: **Richar** para archivos/permisos y **Amelia** para planificación/contratos de Aprendizaje.

## 6. Entregables personales

- [ ] M2 y M5 con pruebas y aceptación; propuestas claramente separadas.
- [ ] Catálogo/versionado, autorización de archivos y migración de storage ensayada.
- [ ] Planificación migrada a Aprendizaje sin duplicar estado autoritativo.
- [ ] Contratos de publicación/progreso/recordatorios y pruebas de idempotencia.
- [ ] Manual breve para docente/estudiante y runbook de upload, limpieza controlada, recordatorios y restore.
- [ ] Registro de revisión editorial, licencias/fuentes y límites de asistencia IA.

## Anexo A. Historias de la especificación a cargo de Juan

11 entradas temáticas. El estado corresponde a la fuente, no al resultado de pruebas de este turno. La tarea y la prueba de cierre son la guía de implementación; refinarlas en tickets con criterios completos antes de comenzar. Las historias compartidas mantienen a esta persona como responsable de cierre de su módulo.

| Clave de planificación | Historia | Estado de la fuente | Implementación/resultado esperado | Prueba mínima de cierre |
| --- | --- | --- | --- | --- |
| M2-HU01 | Descarga de materiales | Aprobado | Buscar recursos autorizados, descargar versión correcta y gestionar lectura offline consentida. | Recurso privado inaccesible por URL directa; descarga íntegra; logout limpia caché sensible. |
| M2-HU02 | Repositorios | Aprobada | CRUD, publicación/retirada, categorías, etiquetas, compartir, favoritos y valoración. | Autoría y membresía verificadas; cargas incompletas no se publican; favoritos únicos. |
| M2-HU03 | Preguntas y respuestas por lección | Aprobado | Mostrar ejercicios/soluciones autorizados y asociarlos al tema y versión. | No filtrar claves de un examen activo; completar una lección una sola vez. |
| M2-HU04 | Resumen teórico | Aprobado | Resumen editorial por sección; asistencia de IA como borrador revisable si se aprueba. | Resumen coincide con versión publicada y mantiene autoría/referencias. |
| M2-HU05 | Videos y recursos explicativos | Propuesta | Recursos multimedia, audio y transcripciones con permisos y derechos de uso. | Enlaces permitidos; subtítulos/transcripción; recurso retirado no queda público. |
| M2-HU06 | Mapas conceptuales | Propuesta | Mapa asociado al tema; editar y revisar antes de publicar; alternativa textual. | Relaciones coherentes, teclado y descripción equivalente; no depender solo de imagen. |
| M2-HU07 | Guías y lectura rápida | Propuesta; contenido mezclado | Separar guía personalizada y juego multijugador de interpretación; Juan guía, Amelia evaluación, José invitaciones. | Guía/versiones verificadas; juego, tiempo y premios requieren criterios propios aprobados. |
| M2-HU08 | Nuevo contenido y recordatorios | Aceptado; confirmar equivalencia de estado | Alertar publicación y programar avisos según preferencias; minimizar datos y evitar duplicados. | Reintento no duplica; cancelación y opt-out efectivos; proveedor caído deja estado pendiente. |
| M5-HU01 | Planificación y hábitos | Aprobado | Agenda, disponibilidad, horas saludables, historial, Pomodoro y recordatorios con zona horaria. | Conflictos/horarios inválidos; cambio de plan; recordatorio antiguo no se envía. |
| M5-HU02 | Apoyo y preparación emocional | Propuesto | Contenido de bienestar revisado y descansos opcionales; no diagnóstico ni consejo clínico automatizado. | Consentimiento y accesibilidad; usuario puede omitir; contenido revisado antes de publicar. |
| M5-HU03 | Constancia y microaprendizaje | Propuesto | Actividades breves vinculadas a contenidos, desafíos diarios y progreso; coordinar premios con José. | Finalización idempotente; tareas pertinentes; no premiar repeticiones ni enviar avisos excesivos. |

## Anexo B. Correspondencia con «Historias de usuario completo»

11 entradas asignadas. El prefijo HUC distingue la fuente alternativa. Los estados contradictorios no se resuelven automáticamente. Las extensiones señaladas forman parte del backlog futuro condicionado a aprobación.

| Alias de fuente | Título original | Estado alternativo | Correspondencia y alcance que no debe perderse |
| --- | --- | --- | --- |
| HUC-M2-HU01 | Descarga de materiales de estudio | Aprobado | M2-HU01 — Incluye microcursos/descarga offline; permiso, versión y caché por cuenta. |
| HUC-M2-HU02 | Descarga de materiales de estudio - Repositorio | Aprobada | M2-HU02 — Incluye microcursos/descarga offline; permiso, versión y caché por cuenta. |
| HUC-M2-HU03 | Visualización de preguntas y respuestas por lección | Aprobado | M2-HU03 — Conservar requisitos alternativos y criterios de la fuente. |
| HUC-M2-HU04 | Resumen teórico por sección. | Aprobado | M2-HU04 — Conservar requisitos alternativos y criterios de la fuente. |
| HUC-M2-HU05 | Historia de Usuario: Videos explicativos vinculadas a temas. | Propuesta | M2-HU05 — Conservar requisitos alternativos y criterios de la fuente. |
| HUC-M2-HU06 | Generación de mapas conceptuales. | Propuesta | M2-HU06 — Conservar requisitos alternativos y criterios de la fuente. |
| HUC-M2-HU07 | Lectura rápida / HU sin título | Propuesta | M2-HU07 — Lectura rápida y guía no se dan por equivalentes; separar juego con Amelia/José. |
| HUC-M2-HU08 | Notificaciones de nuevo contenido y recordatorios de estudio. | Aceptado | M2-HU08 — Avisos de nuevo contenido; conservar estado Aceptado hasta conciliar. |
| HUC-M5-HU01 | Recordatorios automáticos y horarios sugeridos | Aprobado | M5-HU01 — Recordatorios/horarios; añadir reglas de fecha y cancelación. |
| HUC-M5-HU02 | Micro aprendizaje y favoritos personalizados | Propuesto | M5-HU03; M2-HU02 — Microaprendizaje/favoritos; no equivale a M5-HU02 emocional. |
| HUC-M5-HU03 | Tipos de manejo de ansiedad y mensajes motivacionales | Propuesto | M5-HU02 — Manejo de ansiedad/motivación; distinto orden de HU respecto de la especificación. |

## Anexo C. Correspondencia con las 18 historias del primer avance

La presentación resumida selecciona estas historias de las anteriores; no limita el resto del plan.

| HU normalizada | Historia(s) de origen o responsabilidad |
| --- | --- |
| HU-PAE-05 | M2-HU01 |
| HU-PAE-06 | M2-HU02 |
| HU-PAE-13 | M5-HU01 |
| HU-PAE-14 | M5-HU03 |

## Anexo D. Requisitos con responsabilidad principal

18 registros asignados de los 109 del catálogo. CAT conserva posición para distinguir duplicados. Estado/prioridad se mantienen literalmente. El responsable puede necesitar a otro dominio (por ejemplo RQ12: José autoriza grupo y Juan almacena el recurso); asignación principal no autoriza modificar tablas ajenas. Vincular cada fila a HU/ticket, prueba y evidencia en H0–H1. Si un requisito no tiene HU propia, crear historia derivada para aprobación, sin fabricar un estado aprobado.

| Registro | RQ | Tipo | Estado | Prioridad | HU/tarea de enlace | Descripción de la fuente |
| --- | --- | --- | --- | --- | --- | --- |
| CAT-013 | RQ13 | Funcional | Aprobado | Alta | M2-HU02 | Permitir que los docentes creen sus propios repositorios en la sección de repositorio académico. |
| CAT-014 | RQ14 | Funcional | Aprobado | Alta | M2-HU02 | Permitir que los docentes suban recursos académicos (PDF’s) en su repositorio, en la sección de repositorio académico. |
| CAT-015 | RQ15 | Funcional | Aprobado | Media | M2-HU02 | Agregar una función de compartir en todos los repositorios para que los docentes puedan compartirlos con su comunidad. |
| CAT-024 | RQ38 | Funcional | Aprobado | Alta | M2-HU05 | Permitir a los profesores incorporar videos, audios o recursos externos vinculados a cada material que suban en su propio repositorio. |
| CAT-025 | RQ43 | Funcional | Aprobado | Alta | M2-HU01 | El sistema debe permitir descargar recursos de la plataforma. |
| CAT-028 | RQ46 | Funcional | Aprobado | Media | M2-HU04 | El sistema debe ofrecer resúmenes teóricos por cada subtema y una introducción a cada tema dentro de un curso. |
| CAT-029 | RQ48 | Funcional | Aprobado | Media | M5-HU01 | El sistema debe ofrecer recordatorios automáticos de estudio. |
| CAT-034 | RQ54 | Funcional | Aprobado | Media | M5-HU01 | El sistema debe permitir la configuración de horarios de estudio sugeridos y recomendar un tiempo de uso sano. |
| CAT-035 | RQ55 | Funcional | Aprobado | Media | M2-HU02 | El sistema debe contar con una sección de "favoritos" para marcar repositorios en particular. |
| CAT-037 | RQ59 | Funcional | Aprobado | Baja | M5-HU01 | El sistema debe contar con la integración de un “pomodoro” para controlar los tiempos de estudio del estudiante. |
| CAT-042 | RQ64 | Funcional | Aprobado | Alta | M2-HU07; JUA-19 | El sistema debe de apoyarse de la ruta de estudio generada para el contenido de cada curso. Colocando la cantidad de evaluaciones y lecciones necesarias para cada subtema. |
| CAT-048 | RQ74 | Funcional | Aprobado | Baja | M2-HU02 | La sección de Repositorio Académico debe contar con una vista de los repositorios mas solicitados. |
| CAT-052 | RQ80 | Funcional | Aprobado | Media | M5-HU03 | El sistema debe integrar misiones diarias de microaprendizaje (ej: 5 minutos de preguntas). |
| CAT-059 | RQ91 | Funcional | Aprobado | Alta | M2-HU02/04/05 | Actualizar constantemente los contenidos para mantenerlos alineados con los exámenes actuales. |
| CAT-076 | RQ20 | Funcional | En análisis | Alta | M2-HU01/02 | Buscador de recursos por palabras clave. |
| CAT-077 | RQ47 | Funcional | En análisis | Media | M2-HU08 | El sistema debe enviar notificaciones de nuevos contenidos. |
| CAT-083 | RQ77 | Funcional | En análisis | Media | M5-HU02 | El sistema debe ofrecer tips de manejo de ansiedad pre-examen como pantallas de carga. |
| CAT-090 | RQ24 | Funcional | Propuesto | Alta | M2-HU01/02; JUA-23 | Importar y exportar recursos en formato PDF o DOC. |

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

Guía adjunta: `02_Juan_Contenido_Planificacion.md`, de 5 de octubre de 2026. SHA-256 del archivo recibido: `d4af99005b91d216b936647479b9fabb052390a8b6110a792b4f6c786c44af38`. Se incorporan secciones 2–6 y anexos A–E; el marco común repetido se sustituye por la guía central actualizada. No se requieren archivos temporales de extracción para continuar.
