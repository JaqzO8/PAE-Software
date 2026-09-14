> Antecedente técnico de la versión anterior. Para el estado verificado de esta entrega consulta [Resumen ejecutivo](RESUMEN_EJECUTIVO.md), [Instalación](INSTALACION_LOCAL.md) y [Validación](VALIDACION.md). Las afirmaciones históricas de completitud no constituyen aceptación integral.

# Auditoria de requisitos PAE

Fuentes:
- `HISTORIAS DE USUARIO COMPLETO.docx`
- `Documento de Especificacion de Requisitos de PAE..docx`

Nota: ambos documentos usan numeraciones RQ distintas para algunas historias. Se conserva la numeracion del documento de especificacion como principal y la de historias completas como alias cuando aplica.

## Modulos principales

| Modulo | Nombre | Estado actual | Observaciones |
| --- | --- | --- | --- |
| 1 | Gestion de usuarios | Completo funcional basico | Login, registro, perfil, cambio de password, sesiones, recuperacion, login rapido y 2FA tecnico quedan implementados en backend. Frontend expone login, recuperacion, login rapido y sesiones reales. |
| 2 | Contenido educativo | Parcial avanzado | Repositorios, recursos, favoritos, categorias, uploads, descarga autenticada, lecciones, progreso, resumen, solucionario, mapa conceptual y material PDF existen. Faltan microcursos/rutas adaptativas completas, lectura rapida, offline real y notificaciones de nuevo contenido. |
| 3 | Examenes y simulacros | Completo funcional basico | `exam-service` integrado con Docker/gateway. Tiene universidades, banco de preguntas con UI docente, import/export JSON, simulacros con seleccion aleatoria, temporizador compatible frontend, autoevaluacion inmediata, solucionario, resultados persistidos, preguntas guardadas para repaso, revision docente de preguntas abiertas, salas de desafio en vivo con WebSocket, motor pregunta-a-pregunta con scoring por velocidad para desafios y trivia, cache local del intento activo, cola offline con IndexedDB y service worker para shell offline. |
| 4 | Analisis y seguimiento | Completo funcional basico | Dashboards y stats basicos existen. Ya se incorporan metricas reales desde simulacros y lecciones: intentos, precision promedio, mejor puntaje, horas de practica, materias debiles, recomendaciones, comparativa contra cohorte, distribucion de rendimiento, alertas de bajo desempeno, tiempo por leccion, sesiones largas y cierres rapidos. Las reglas de seguimiento y habitos quedan parametrizadas en base de datos y editables por docente. Hay logros persistentes con reglas parametrizadas, avisos internos y cola marcada para correo externo pendiente de proveedor SMTP. |
| 5 | Planificacion y organizacion | Parcial funcional inicial | Se implementan preferencias de estudio, horarios sugeridos, recordatorios persistentes, configuracion global parametrizada y pomodoro en frontend. Pendiente gestion avanzada de ansiedad/bienestar, notificaciones push/correo reales y calendario avanzado. |
| 6 | Comunidad y colaboracion | Completo funcional basico | Community-service integrado con Docker, gateway y frontend. Existen comunidades, miembros, mensajes, recursos, invitaciones, amistades, desafios, zona de descanso, noticias universitarias, orientacion vocacional/bienestar, reglas parametrizadas y perfiles de rendimiento por comunidad. |
| 7 | Gamificacion y motivacion | Completo funcional basico | Hay logros/medallas persistidos, puntos globales, niveles, eventos auditables, ranking, onboarding gamificado, reglas parametrizadas por docente e integracion con simulacros, desafios y trivia. |
| 8 | Infraestructura tecnica y UI | Completo funcional basico | Docker integrado para auth/content/community/exam/frontend/gateway/DB/Redis. Se agregan preferencias reales de tema, tamano de fuente, reduccion de movimiento, alto contraste y notificaciones persistidas por usuario; soporte tecnico y privacidad con tickets; paginas publicas de terminos/privacidad; cabeceras y limites en gateway; SQL de inicializacion, script de backups y prueba de carga basica. |

## Modulo 1: Gestion de usuarios

| HU | Requisitos principales | Estado | Implementacion |
| --- | --- | --- | --- |
| HU01 Inicio de sesion | RQ94/RQ53 login con correo; RQ95/RQ54 2FA; RQ109/RQ70 aviso nuevo dispositivo | Completo funcional basico | `auth-service` tiene login JWT, registro de sesiones y endpoints 2FA. La notificacion queda registrada/auditable como sesion nueva, sin proveedor de email externo. |
| HU02 Recuperacion y cambio de clave | RQ96/RQ55 recuperacion; RQ100/RQ61 cambio password; RQ101/RQ62 historial | Completo funcional basico | Endpoints `forgot-password`, `reset-password`, `password`. En desarrollo retorna token de recuperacion; en produccion queda oculto para integracion con email. |
| HU03 Registro y rol profesor | RQ97/RQ57 rol docente; RQ50/RQ59 perfil inicial; RQ99 registro | Completo | Registro crea usuario con rol estudiante/docente y perfil base. |
| HU04 Gestion y cierre de sesiones | RQ104/RQ65 sesiones activas; RQ107/RQ68 cierre global; RQ101/RQ62 historial | Completo | Endpoints `sessions`, `logout`, `logout-all`; perfil consume sesiones reales. |
| HU05 Login rapido | RQ58/RQ89 login rapido; RQ95 2FA; RQ50 perfil | Completo funcional basico | Endpoint `quick-login` y boton en login. Implementado como flujo local/social simplificado, listo para reemplazar por OAuth real. |
| HU06 Auditoria y perfil | RQ100/RQ56 actualizar datos; RQ108/RQ69 auditoria; RQ104/RQ65 sesiones | Completo funcional basico | Perfil y password expuestos por rutas; historial de sesiones audita accesos/cambios. |

## Principios de UI aplicados

- Ley de Jakob: se mantienen patrones comunes de formularios, tabs, cards y sidebar ya usados en el proyecto.
- Ley de Fitts: acciones principales (`Ingresar`, `Crear comunidad`, `Enviar`) tienen botones visibles y de tamano consistente.
- Ley de Hick: en auth y perfil se agrupan decisiones en bloques cortos para reducir opciones simultaneas.
- Ley de proximidad: labels, inputs y ayudas quedan agrupados por contexto.
- Consistencia visual: se reutiliza el design system existente (`Button`, `Input`, `Tabs`, `Card`, `Skeleton`, `Toast`).
- Prevencion de errores: validacion de formularios con `zod`, estados disabled y mensajes de feedback.

## Modulo 2: Contenido educativo

| HU | Requisitos principales | Estado | Implementacion |
| --- | --- | --- | --- |
| HU01 Descarga de materiales | RQ01 descargar materiales; RQ43 descarga de archivos; RQ14/RQ38 recursos PDF, multimedia y enlaces externos | Completo funcional basico | `content-service` registra descargas, valida JWT real, protege el stream de archivos y devuelve metadata para enlaces externos. El frontend descarga blobs con token y actualiza el contador local. |
| HU02 Repositorios educativos | Repositorios por docente, busqueda, categorias, favoritos, calificaciones | Parcial avanzado | Backend y frontend existentes para repositorios/categorias/favoritos/calificaciones. Pendiente revisar filtros avanzados y consistencia completa con todos los requisitos documentados. |
| HU03 Microcursos y lecciones | Microcursos, unidades, lecciones, resumenes teoricos, ejercicios por leccion | Completo funcional basico | `content-service` tiene modelos `lecciones` y `progreso_lecciones`, endpoints CRUD docente y flujo estudiante iniciar/completar. Frontend permite crear lecciones desde repositorios y abrirlas desde la vista estudiante. |
| HU04 Recursos enriquecidos | Videos/audios por tema, mapas conceptuales, lectura rapida, modo offline | Parcial | Las lecciones soportan recursos multimedia, mapa conceptual y PDF descargable tras completar. Faltan lectura rapida, offline real y experiencia avanzada de microcurso/ruta. |
| HU05 Notificaciones de contenido | Avisos por nuevo contenido o actualizaciones | Faltante | Requiere servicio/eventos de notificaciones o integracion con modulo de planificacion. |

## Siguiente requisito

## Modulo 3: Examenes y simulacros

| HU | Requisitos principales | Estado | Implementacion |
| --- | --- | --- | --- |
| HU01 Preguntas tipo examen por materia | RQ03 preguntas por materia; filtros por universidad, materia y dificultad | Completo funcional basico | `exam-service` tiene banco de preguntas con materia, tema, dificultad, universidad, tipo y explicacion. Incluye seed inicial por universidades. |
| HU02 Simulacros con temporizador | RQ04 simulacro temporizado; estado de intento; dificultad estimada | Completo funcional basico | Endpoint `POST /api/learning/simulacro/start` crea intento persistido, selecciona preguntas aleatorias y devuelve `timeLimit` segun dificultad. |
| HU03 Autoevaluacion inmediata | RQ09 resultados inmediatos; solucionario por pregunta; feedback explicativo | Completo funcional basico | Endpoint `POST /api/learning/simulacro/submit` califica, persiste resultado y devuelve puntaje, percentil y solucionario. |
| HU04 Banco y carga docente | RQ71 carga de preguntas; RQ22 opcion multiple/abierta; RQ72 categorizacion | Completo funcional basico | Endpoint docente `POST /api/learning/questions` y pantalla `Banco de Preguntas` permiten crear preguntas de opcion multiple/abierta con materia, tema, universidad, dificultad y explicacion. |
| HU05 Preguntas dificiles guardadas | Guardar preguntas dificiles para repaso | Completo funcional basico | Endpoint `POST /api/learning/questions/:id/save` crea guardado, `GET /api/learning/questions/saved` lista el repaso y `DELETE /api/learning/questions/:id/save` retira preguntas. El frontend permite guardar desde el solucionario y estudiar/eliminar desde `Preguntas Guardadas`. |
| HU06 Eventos en vivo y desafios | Simulacros en vivo, salas, desafios colaborativos | Completo funcional basico | Desafios colaborativos y trivia tienen salas persistidas, control de participantes, join/leave, eventos Socket.IO via gateway, partida pregunta-a-pregunta, avance automatico al responder todos, avance manual del anfitrion y scoring por velocidad. |
| HU07 Importar/exportar banco | RQ117 importar/exportar bancos de preguntas | Parcial | Endpoints y UI docente permiten importar/exportar JSON. Pendiente CSV/XLSX, validacion avanzada y vista previa formal antes de guardar. |
| HU08 Revision docente de abiertas | RQ22 preguntas abiertas; calificacion manual; feedback docente | Completo funcional basico | `exam-service` crea revisiones pendientes al enviar respuestas abiertas. Frontend estudiante usa textarea para abiertas y frontend docente tiene pantalla `Revision de Abiertas` para puntuar 0-5 y guardar feedback. |
| HU09 Modo offline de intentos | Reintento de envio si se pierde conexion durante un simulacro | Completo funcional basico | El frontend guarda el simulacro activo con preguntas/respuestas/tiempo restante, recupera el intento si se pierde el estado de navegacion, encola envios fallidos/offline en IndexedDB con fallback a `localStorage`, muestra resultado pendiente, sincroniza automaticamente al recuperar conexion y registra un service worker para recargar el shell de la app sin conexion. |

## Siguiente requisito

Modulo 3 cerrado a nivel funcional basico. Modulo 4 cerrado a nivel funcional basico con analitica real, comparativas por cohorte, distribucion de rendimiento, alertas internas, tiempo por leccion, reglas parametrizadas en `analytics_settings` y `study_settings`, logros persistentes y notificaciones internas con cola de correo pendiente. Modulo 5 iniciado con preferencias, horarios sugeridos, recordatorios persistentes y pomodoro. Modulo 6 cerrado a nivel funcional basico con hub comunitario, bienestar/orientacion, noticias, settings parametrizados y rendimiento comunitario. Modulo 7 cerrado a nivel funcional basico con perfil de gamificacion, niveles, puntos, ranking, onboarding y parametros editables. Modulo 8 cerrado a nivel funcional basico con preferencias UI persistentes, soporte, privacidad, cumplimiento legal visible, hardening del gateway, backups y prueba de carga reproducible.
