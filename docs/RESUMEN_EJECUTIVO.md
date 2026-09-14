# Resumen ejecutivo de PAE Software

PAE Software reúne una plataforma web de preparación académica con repositorios, lecciones, evaluaciones, colaboración y seguimiento del aprendizaje. El código disponible permite continuar el desarrollo de una solución integrada para estudiantes y docentes. La entrega consolida ese trabajo en un repositorio organizado, con configuración local reproducible y trazabilidad de requisitos. El paso siguiente del producto es cerrar las brechas de aceptación y seguridad antes de un despliegue con usuarios reales.

## Propósito y alcance

El proyecto busca apoyar a estudiantes de quinto de secundaria y preuniversitarios en su preparación para exámenes de admisión y otras evaluaciones. Para los docentes, centraliza recursos y preguntas y facilita organizar comunidades, preparar evaluaciones y revisar el progreso. La especificación vincula esta finalidad con el ODS 4, Educación de calidad, y sitúa el trabajo en el contexto académico de la Universidad Agraria de la Selva, semestre 2026 I.

La propuesta cubre ocho módulos: gestión de usuarios, contenido educativo, exámenes y simulacros, análisis y seguimiento, planificación, comunidad, gamificación e infraestructura/interfaz. Incluye tanto aprendizaje individual como actividades grupales. Las integraciones externas de identidad y correo, la generación inteligente de contenidos y la operación de producción requieren trabajo adicional.

La fuente de alcance es «Documento de Especificacion de Requisitos de PAE..docx». Se contrastó con los fuentes de frontend y backend, esquemas, configuración, pruebas y documentación técnica existentes. La especificación expresa lo que se solicita; el código muestra lo construido; las pruebas aportan evidencia limitada al escenario que ejecutan. Ninguna de estas tres perspectivas se presenta como equivalente a las otras.

## Interesados y necesidades

| Interesado | Necesidad principal | Relación con la plataforma |
| --- | --- | --- |
| Estudiantes de secundaria y preuniversitarios | Practicar, identificar dificultades y sostener hábitos de estudio | Repositorios, simulacros, estadísticas, planificación y comunidades |
| Docentes de academia y elaboradores de evaluaciones | Gestionar preguntas y recursos, acompañar estudiantes | Panel docente, banco de preguntas, comunidades y revisión |
| Tutores | Conocer avances y bajo rendimiento | Seguimiento y alertas; entrega externa pendiente |
| Directores e instituciones | Incorporar apoyo académico y observar su utilidad | Interesados secundarios; no se acredita un portal institucional separado |
| Administradores y equipo técnico | Controlar acceso, calidad, soporte y continuidad | Configuración, tickets, pruebas y administración operativa |
| Proveedores de contenido y estudiantes con barreras de acceso | Material relevante, accesibilidad y compatibilidad | Revisión editorial, experiencia adaptable y opciones de lectura |

La elicitación documenta entrevistas, encuestas, observación, lluvia de ideas, análisis de plataformas, casos de uso e historias. Sus siete sprints describen preparación, recolección, análisis, depuración y consolidación de requisitos. Estos sprints de elicitación no equivalen a siete entregas de software aceptadas. El backlog original contiene prioridades y esfuerzo ordinales; no constituye una estimación vigente de fechas ni presupuesto.

## Requisitos e historias

La [matriz](MATRIZ_REQUISITOS.md) conserva **114 identificadores, RQ01 a RQ114**, incluyendo descartados y ampliaciones históricas. Presenta descripción, prioridad, estado en la fuente, evidencia y brecha. La [colección de historias](HISTORIAS_USUARIO.md) reproduce **78 secciones de historias o épicas** con sus tablas de aceptación. Una sección puede contener más de un ID original.

| Módulo | Secciones de historias o épicas | Temas |
| --- | --- | --- |
| 1 Usuarios | 6 | Acceso, recuperación, docentes, sesiones, login rápido y auditoría |
| 2 Contenido | 8 | Repositorios, descargas, lecciones, resumen, multimedia, mapas, guías y avisos |
| 3 Evaluaciones | 17 | Generación, edición, reportes, tiempo, dificultad, resultados, banco y colaboración |
| 4 Seguimiento | 9 | Estadísticas, recomendaciones, tiempos, logros y alertas a tutores |
| 5 Planificación | 3 | Hábitos, bienestar y constancia |
| 6 Comunidad | 8 | Grupos, foros, chat, descanso, desafíos y atribuciones docentes |
| 7 Gamificación | 3 | Encuestas, reconocimientos y motivación global |
| 8 Infraestructura e interfaz | 24 | Dispositivos, apariencia, accesibilidad, seguridad, rendimiento y respaldo |

Hay inconsistencias que requieren una decisión funcional: RQ77 tiene dos significados; RQ88 aparece como funcional y no funcional; algunas historias usan numeraciones de otra versión; M2 HU07 mezcla guías de lectura con duelos; y M1 HU03 menciona tanto rol automático como asignación manual. Se preservan y señalan estas diferencias. El equipo debe resolverlas por significado y criterio de aceptación antes de cerrar historias.

## Funcionalidades disponibles y pendientes por módulo

### Gestión de usuarios

Existen registro, acceso con correo y contraseña, JWT, hash de contraseñas, perfiles, identificador de usuario, historial, gestión de sesiones, cierre global, preferencias, solicitudes de privacidad y soporte. La interfaz diferencia estudiante y docente. La evidencia principal está en [authController](../backend/services/auth-service/src/controllers/authController.js), [tokenService](../backend/services/auth-service/src/services/tokenService.js) y [platformController](../backend/services/auth-service/src/controllers/platformController.js).

La recuperación genera un token, pero el proveedor de correo no está integrado. El login rápido es una simulación que acepta un correo sin validar OAuth. Hay endpoints de 2FA, pero falta acreditar que el segundo factor sea obligatorio antes de crear una sesión. El registro toma `isTeacher` del cliente, por lo que la validación de docentes no cumple el flujo administrativo descrito. Estos puntos impiden considerar el acceso apto para exposición pública. El historial de sesiones tampoco equivale a una auditoría completa de modificaciones de cada campo.

### Contenido educativo

Se encuentran repositorios docentes, clasificación, etiquetas, búsqueda, recursos, favoritos, valoraciones, ranking, compartición y descarga autenticada. Las lecciones tienen contenido, progreso, tiempo, resumen, solucionario, mapa conceptual y generación de un PDF de estudio. Algunos accesos dependen de haber completado la lección. La evidencia se concentra en [content-service](../backend/services/content-service/src) y [las vistas de repositorios](../frontend/src/pages/student/repositories).

El resumen puede usar texto almacenado o un recorte del contenido. El mapa conceptual devuelve información almacenada; no demuestra generación automática inteligente. La presencia de carga multimedia no acredita importación y exportación completa de DOC ni microcursos adaptativos. Quedan pendientes el alcance offline de materiales, las guías avanzadas, el juego de interpretación veloz y la entrega de avisos de nuevo contenido por correo.

### Exámenes y simulacros

Hay banco de preguntas, universidades, clasificación por materia, tema y dificultad, creación y edición docente, intercambio JSON, selección aleatoria, simulacros con temporizador, resultados persistidos, solucionarios y preguntas guardadas. Se incluyen preguntas abiertas con revisión docente, salas de desafíos y trivia, puntuación y comunicación Socket.IO. El frontend contiene caché de intento activo y cola de envíos offline. Véanse [learningRoutes](../backend/services/exam-service/src/routes/learningRoutes.js), [learningController](../backend/services/exam-service/src/controllers/learningController.js) y [los clientes de aprendizaje](../frontend/src/features/learning/services).

No se identificó una integración de IA que genere preguntas directamente desde documentos. El diagnóstico inicial y la ruta adaptativa completa deben validarse y ampliarse. El reporte de preguntas requiere cerrar el circuito de registro, atención y resolución. Una cola offline no garantiza que todas las actividades, materiales y salas funcionen sin conexión. También se deben verificar reloj del servidor, reconexión, duplicación de envíos, permisos de revisión y finalización consistente de partidas.

### Análisis y seguimiento

Se calculan indicadores desde resultados y lecciones, precisión, puntajes, tiempo, áreas débiles, recomendaciones, comparaciones y logros. Existen parámetros de seguimiento y notificaciones internas. Las vistas y servicios permiten un seguimiento básico del aprendizaje; [achievementService](../backend/services/exam-service/src/services/achievementService.js) concentra reglas de logros.

Debe validarse la correspondencia de cada gráfico con las fórmulas del requisito y el alcance de datos visible por docente. No se acredita una ojiva específica ni la totalidad de estadísticas solicitadas. Las alertas a tutores por correo requieren destinatarios verificados, preferencias, proveedor y seguimiento de entrega. La presencia de una notificación persistida no prueba que el destinatario la haya recibido.

### Planificación y organización

Hay preferencias de estudio, horarios sugeridos, recordatorios persistentes y un pomodoro en la interfaz. [PlanningController](../backend/services/content-service/src/controllers/planningController.js) y [Planning](../frontend/src/pages/student/Planning.tsx) son los puntos principales de implementación.

Se requieren calendario avanzado, entrega automática externa, validación de recordatorios e inactividad, y mayor personalización del contenido de bienestar. Las funciones de apoyo emocional se consideran material educativo de bienestar; no se acredita una intervención clínica.

### Comunidad y colaboración

Existen comunidades, membresía, invitaciones, amistades, búsqueda de usuarios, mensajes, recursos compartidos, desafíos, noticias universitarias y contenido de bienestar. Las páginas de grupos y foros reutilizan componentes y servicios. [Community-service](../backend/services/community-service/src) concentra persistencia y autorización por comunidad.

Las pantallas de foros utilizan un cliente con datos de demostración y llamadas a /forums, sin una API de foros correspondiente localizada en el gateway y los servicios. La acción de crear foro muestra un aviso de funcionalidad pendiente. Por tanto, el foro no se considera integrado; deben implementarse y probarse persistencia, comentarios, likes y reportes. La zona de descanso actual no acredita toda la experiencia de avatar, mapa interactivo, emparejamiento de nivel e invitaciones de emergencia de la especificación. Falta cerrar moderación, permisos de visualización y todos los criterios de privilegios docentes.

### Gamificación y motivación

Se encuentran puntos, niveles, logros, medallas, eventos, ranking y tareas de onboarding, conectados con simulacros, desafíos y trivia. Las reglas se almacenan y parametrizan en [gamificationService](../backend/services/exam-service/src/services/gamificationService.js) y sus modelos.

No se localizó una encuesta persistente completa tras cada tipo de evaluación. Las misiones diarias y modos adicionales requieren revisión específica. El panel de calidad de software no reemplaza esa encuesta de satisfacción estudiantil: miden aspectos diferentes.

### Infraestructura e interfaz

El sistema tiene frontend React/TypeScript/Vite, servicios Node/Express, cuatro bases PostgreSQL, Redis, gateway Nginx y Docker Compose. Incorpora preferencias de tema, tamaño de fuente, contraste y movimiento, páginas de privacidad/términos, validación de entradas y controles HTTP. Un servicio adicional consulta SonarQube y presenta métricas en el panel docente de calidad.

La existencia de opciones de accesibilidad no demuestra conformidad con todos los criterios de la fuente. TLS, pruebas entre navegadores, capacidad simultánea, latencia, protección de datos, programación de respaldos y restauración deben validarse en el entorno destino. Las carpetas analytics-service y notification-service solo contienen infraestructura preliminar y no son servicios operativos independientes; parte de esas funciones reside en exam-service.

## Flujo previsto de inicio a fin

1. **Preparación técnica:** clonar, generar secretos locales, iniciar bases y servicios, comprobar salud y crear cuentas ficticias para la demostración.
2. **Ingreso:** registrar al estudiante, iniciar sesión y configurar perfil y apariencia. El flujo institucional de aprobación docente queda pendiente.
3. **Preparación académica:** el docente organiza repositorios, incorpora recursos y lecciones, crea preguntas y configura comunidades y desafíos.
4. **Aprendizaje:** el estudiante explora material, marca favoritos, realiza lecciones y consulta resumen, solucionario o descarga según sus condiciones de acceso.
5. **Evaluación:** selecciona universidad/dificultad, responde un simulacro o participa en una sala; el sistema registra resultados, corrige respuestas y permite revisión de abiertas.
6. **Retroalimentación:** consulta resultados, preguntas guardadas, recomendaciones, estadísticas, puntos y logros. Las alertas externas permanecen pendientes.
7. **Constancia y colaboración:** usa horarios, recordatorios, pomodoro, grupos, mensajes y recursos compartidos; repite el ciclo de práctica y seguimiento.
8. **Operación y mejora:** el equipo revisa pruebas, incidencias y métricas, realiza respaldos, contrasta historias y entrega cambios revisados mediante develop y main.

Este recorrido relaciona los módulos disponibles. Sus pasos deben ejecutarse como prueba integral antes de declarar que todas las historias están aceptadas.

## Calidad y principios de desarrollo

La estructura separa rutas, controladores, servicios de dominio, modelos, configuración y clientes del frontend. Esta separación favorece responsabilidad única, reutilización y contratos claros. Se mantienen parámetros por entorno y archivos de bloqueo de dependencias; los cambios deben incluir su requisito, pruebas relevantes y revisión por pares. La estructura actual no permite afirmar que todo el código cumpla SOLID: hay controladores extensos, datos de demostración y funciones pendientes de extracción o aislamiento.

La publicación añade exclusiones de datos privados, contextos Docker protegidos, generación aleatoria de secretos y una revisión preventiva de archivos versionados. Se retiran credenciales de respaldo del código y se alinea el runtime con Node 24. La validación documentada diferencia pruebas con dobles, reglas unitarias y pruebas contra el sistema real. Los resultados se registran en [VALIDACION](VALIDACION.md), sin extrapolarlos a cobertura total del producto.

## Prioridades para completar el producto

| Orden | Entrega propuesta | Condición de cierre |
| --- | --- | --- |
| P0 | Autenticación y autorización | OAuth verificable o flujo retirado, docentes aprobados, 2FA integrado, revocación consistente entre servicios |
| P0 | Entorno reproducible e integración | Arranque desde volumen vacío, recorrido estudiante/docente y persistencia comprobados |
| P1 | Conciliación de requisitos | IDs únicos por significado, historias sin contradicciones y criterios acordados |
| P1 | Evaluaciones y contenido | Generación/diagnóstico con alcance definido, reportes completos y validación de permisos |
| P1 | Correo y notificaciones | Proveedor, consentimiento, destinatarios, cola, reintentos y evidencia de entrega |
| P1 | Operación | TLS, respaldos programados con restauración, observabilidad y pruebas de carga |
| P2 | Experiencia educativa | Rutas adaptativas, foros completos, juegos de lectura, descanso y encuestas |
| P2 | Accesibilidad y usabilidad | Pruebas con usuarios, lectores de pantalla, navegadores y dispositivos |

No se asignan fechas, costos ni responsables funcionales que no hayan sido acordados. Las cuatro ramas personales permiten repartir estas entregas sin deducir especialidades de los nombres del equipo.

## Contenido de la publicación

El nuevo repositorio conserva los fuentes y cambios locales disponibles, esquemas iniciales, pruebas, scripts y documentación útil. Añade resumen, matriz, historias, arquitectura, instalación, configuración, validación y normas de contribución. Comienza con un historial nuevo y ramas main, develop, José_Queshyac, Amelia_Mauricio, Richard_Estela y Juan_Rengifo.

Los documentos originales, extracciones completas con contexto personal, archivos cargados por usuarios, bases, secretos, dependencias instaladas, coberturas, capturas y reportes de trabajo quedan en el entorno original. Se conserva su información funcional pertinente mediante la documentación de requisitos, sin incorporar datos operativos reales al repositorio. La copia no altera el remoto ni la historia del proyecto anterior.
