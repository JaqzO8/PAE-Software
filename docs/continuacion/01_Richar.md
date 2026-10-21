# Continuación de Richar: M1 y M8

[Orden común, Git y cierre](README.md) · [Todos los RQ/HU](TRAZABILIDAD.md) · [Plan de pruebas](PLAN_PRUEBAS.md)

Actualizado: 21 de octubre de 2026. Esta guía continúa la base f8ea677 y conserva el backlog detallado y anexos A–E de la guía adjunta, con los nombres de colaboradores corregidos donde estaban intercambiados. Los estados y códigos documentales se mantienen. Las casillas inferiores representan trabajo por verificar/completar, no una afirmación de que todo falte o esté aceptado.

## Tu punto de partida y orden de entrega

Tu rama es **Richard_Estela**. Eres responsable de M1 y M8, incluida la UI transversal; cada compañero conserva la UI y pruebas de su negocio. Reproduce la base, incorpora develop como indica la guía central y trabaja en este orden:

| Orden | Qué implementar | Entrega / prueba de cierre |
|---|---|---|
| 1 | RIC-01–04: eliminar autoasignación docente y accesos sin identidad/MFA comprobada; definir roles y sesión | E01 / T-ID; regresiones de abuso y acceso legítimo |
| 2 | RIC-05–08 y RIC-11: casos de identidad, recuperación, perfil, auditoría y revocación REST/WSS; entregar contrato a los tres compañeros | E01 / T-ID; test consumidor en cada dominio |
| 3 | RIC-09–10: CI, navegación, preferencias, soporte y privacidad; completar todas las historias M1/M8 del alcance | E08 / T-UI; revisar también aliases HUC |
| 4 | RIC-12–15: HTTPS/WSS, despliegue, transporte de avisos, backups y recuperación, conforme los dominios se integran | E09 / T-OPS; restore comprobado |
| 5 | RIC-16–20: extensiones aprobadas, carga y accesibilidad; resolver compromisos contradictorios | E08–E10 / T-OPS y aceptación final |

**Ya disponible:** createApp de Identidad, conexión diferida de Redis y búsqueda de usuarios con DTO mínimo; CI y factories iniciales. RIC-05/08/09 están parcialmente avanzados, no cerrados. No rehacer esa base: completar los casos, la seguridad y la cobertura faltantes.

**Archivos de entrada:** [app de Identidad](../../backend/services/auth-service/src/app.js), [rutas](../../backend/services/auth-service/src/routes/authRoutes.js), [DTO público](../../backend/services/auth-service/src/interfaces/http/publicUsers.js), [CI](../../.github/workflows/ci.yml). Extraer reglas del controlador heredado con puertos; no mover únicamente nombres de carpetas.

**Handoff:** Juan, Amelia y José necesitan contrato probado de sesión/roles antes de cerrar sus permisos. Coordina el transporte de notificaciones, pero cada dominio decide el destinatario y el hecho de negocio. Para E09 solicita a cada dueño evidencia de su pantalla, datos y recuperación.

## Cómo cerrar tu rama

En cada entrega seguir fetch → merge de develop → implementación y pruebas → commit/push a `Richard_Estela` → PR a develop → revisión/CI → integración. Los comandos completos están en la guía común. No incorporar cambios de otro dueño mediante acceso directo a sus tablas.

Revisar todas las filas de tus módulos en trazabilidad, los RQ complementarios asignados y los aliases del Anexo B. Cada extensión aceptada necesita criterios y pruebas adicionales. Adjuntar manual de usuario, runbook de recuperación y evidencia por criterio. Terminar con E09/E10, no al completar el backend.

## Backlog detallado conservado de la guía personal

La numeración H0–H6 identifica los hitos originales; E00–E10 de la guía central define el orden de integración actual. La separación app/servidor ya existe: completar los casos de uso pendientes de ese ticket sin reescribirla. Los anexos resumen el alcance; las tablas originales completas de aceptación están en [M1](../historias/M1.md) y [M8](../historias/M8.md).

## 2. Implementación por hitos

### H0 — Cerrar las brechas de identidad

- [ ] RIC-01: crear pruebas que reproduzcan acceso rápido por correo, rol docente manipulable y acceso sin MFA; después bloquear cada comportamiento en producción. Regresión: estudiantes/docentes existentes conservan acceso legítimo.
- [ ] RIC-02: acordar habilitación docente con docente del curso/equipo. Propuesta segura: cuenta estudiante o solicitud pendiente hasta evidencia aprobada; registrar responsable y resultado. Automatización futura requiere fuente verificable, nunca un checkbox.
- [ ] RIC-03: definir roles globales y permisos de comunidad. “Estudiante-administrador” puede ser una función local de grupo, no administrador global.
- [ ] RIC-04: inventariar almacenamiento del token, expiración, refresh si existe, bloqueo por intentos y sesiones; resolver estrategia de almacenamiento y amenazas XSS/CSRF antes de cambiar al modelo de cookies.
- [ ] Salida: prueba de abuso fallaba antes y pasa después; revisión de los cuatro propietarios; entorno externo sin vías de autoasignación.

### H1–H2 — Identidad completa y plataforma verificable

- [ ] RIC-05: separar `createApp` y arranque HTTP; extraer casos de uso RegistrarCuenta, Autenticar, DesafiarMFA, CompletarMFA, RecuperarClave, RevocarSesion y ActualizarPerfil.
- [ ] RIC-06: MFA con desafío de alcance restringido, caducidad/intentos, código generado criptográficamente o mecanismo elegido; emitir credencial completa solo tras verificación. Acordar recuperación del factor y canal. No devolver códigos/tokens secretos fuera de fixtures de test.
- [ ] RIC-07: recuperación por proveedor elegido, token de un uso y operación atómica; configurar secretos por entorno. “Registrado para envío” no significa “entregado”.
- [ ] RIC-08: perfil/identificador copiable, auditoría y sesiones propias; DTO públicos mínimos para búsqueda de usuarios de José. No entregar correo, IP o sesiones de terceros.
- [ ] RIC-09: configurar tests de auth y UI; unificar comandos de calidad sin mezclar versiones Jest 29/30 sin decisión. CI de PR: dependencias bloqueadas, frontend build/lint, tests por servicio, contratos, análisis de secretos/dependencias y reportes.
- [ ] RIC-10: navegación por rol, preferencias accesibles, soporte/tickets, privacidad/términos y constancia versionada. Los dueños M2/M3/M6 integran sus paneles.
- [ ] Salida: M1 aprobado demostrado de extremo a extremo; contratos consumidos por los otros tres integrantes y prueba real de revocación cruzada.

### H3–H4 — Operación y comunicación resiliente

- [ ] RIC-11: acordar verificación de sesión en todos los servicios y WSS, TTL máximo de caché de revocación y comportamiento ante caída de Identidad; rechazar operaciones protegidas si no puede validarse seguridad según política.
- [ ] RIC-12: TLS/WSS, red privada, frontend build productivo, secretos, CORS según origen, límites razonables para redes institucionales, health/readiness y logs correlacionados.
- [ ] RIC-13: preparar pipelines de despliegue separados de CI con entorno de staging, migración revisada, smoke tests y rollback; publicar solo con la autorización normal de entrega.
- [ ] RIC-14: canal de entrega de avisos reutilizable; Juan/Amelia/José deciden destinatario y hecho de negocio. Transporte devuelve estado pendiente/enviado/fallido y deduplicación; plantillas sin datos excesivos.
- [ ] RIC-15: respaldo diario programado de DB + archivos/objetos, cifrado, copia fuera del host, monitoreo y simulacro de restauración. Definir RPO/RTO y retención con el equipo, no solo generar SQL.
- [ ] Salida: perder temporalmente un proveedor no pierde eventos; restauración produce aplicación y archivos coherentes; infraestructura es reproducible desde documentación.

### H5–H6 — Escala, accesibilidad y entrega

- [ ] RIC-16: validar flujo OAuth/OIDC elegido si se aprueba RQ58/HU05; revisar state/nonce/PKCE según flujo y biblioteca; proveedor falso no da acceso.
- [ ] RIC-17: acordar SLO de carga/latencia/error y un perfil de usuarios distintos. El script actual de 200 VUs usa por defecto una misma cuenta: sirve de smoke, no demuestra 200 identidades simultáneas.
- [ ] RIC-18: ensayar 50 → 100 → 200 usuarios y mayor carga solo si se acepta alcance; medir p95/p99, HTTP/WSS, pools DB, CPU/RAM y exactitud de datos. Diferenciar 200 VUs HTTP, 80 sockets del script y sesiones académicas efectivamente concurrentes. No heredar como compromiso los tolerantes umbrales del smoke.
- [ ] RIC-19: auditar navegación con teclado, lector de pantalla, contraste, zoom y movimiento reducido; WCAG 2.2 AA es objetivo de evaluación, no certificación automática. [Referencia W3C](https://www.w3.org/TR/WCAG22/).
- [ ] RIC-20: conciliar RQ27 congelado versus M8-HU19 aprobada, capacidad 100/200/500 y respaldos propuestos versus HU24 aprobada. Registrar alcance de release con evidencia, no escoger unilateralmente la cifra más cómoda.
- [ ] Salida: paquete operativo, aceptación funcional, restore y carga reproducibles; sin promesas de cumplimiento jurídico/ISO por pasar un test. Privacidad/menores requieren validación institucional competente.

## 3. Contratos y colaboración

| Contrato/activo | Dueño principal | Colaborador y condición |
| --- | --- | --- |
| Usuario/rol/sesión y DTO público | Richar | Todos validan permisos; José consume búsqueda mínima |
| Revocación REST/WSS | Richar | Amelia/José verifican conexión y operaciones; Juan archivos |
| Habilitación docente | Richar | M2/M3/M6 no publican ni moderan con solicitud pendiente |
| Archivos privados y backup de objetos | Juan en Contenido; Richar infraestructura | José decide permiso de grupo; restore incluye metadatos |
| CI, gateway, Compose y contratos compartidos | Richar coordinador | PR revisada por dueño afectado; nadie modifica rutas compartidas sin avisar |
| Transporte de notificaciones | Richar coordinador | Reglas/consentimiento pertenecen al dominio productor; ADR elige ubicación |
| Aprendizaje | Amelia integradora | Richar prepara entorno sin poseer lógica académica |

Eventos candidatos —no endpoints actuales—: UsuarioRegistrado.v1, HabilitacionDocenteCambiada.v1 y SesionRevocada.v1, con datos mínimos. Para seguridad sensible, un evento asíncrono no sustituye una comprobación autoritativa de sesión.

## 4. Diseño interno y clean code específico

Estructura sugerida dentro de auth: domain (Cuenta/PoliticaSesion), application/use-cases, application/ports (RepositorioUsuario, RepositorioSesion, Notificador, Reloj), infrastructure (Sequelize/Redis/proveedor), interfaces/http y bootstrap. Crear primero una vertical y adaptar rutas existentes; no mover todo para aparentar Clean Architecture.

La lógica de habilitación y MFA recibe reloj/generador/notificador mediante puertos y no depende de Express. Mantener hash de contraseña en adaptador/política bien definida; impedir que DTO exponga campos internos. En UI un hook controla cada flujo, cliente HTTP maneja errores y componentes solo presentan/recogen información.

## 5. Matriz de pruebas y evidencia personal

| Nivel | Casos mínimos | Evidencia |
| --- | --- | --- |
| Unitario | Caducidad, política de contraseña, rol, estado MFA, reducción de datos | Tests deterministas con reloj/proveedor sustituidos |
| Integración real | Registro/login/2FA/reset/perfil/sesión con app real y DB/Redis aislados | Reporte y fixtures; no una app Express de juguete |
| Contrato | JWT/claims mínimos, revocación, errores y DTO público | Validación productor-consumidores y versiones |
| E2E | Estudiante, solicitud docente, aprobación, cierre global y recuperación | Recorridos reales; intentos directos de rutas no autorizadas |
| Operación | CI, TLS, límites, carga independiente, respaldo/restauración | Logs redactados, métricas, runbook y cotejo de restauración |
| Accesibilidad | Login, recuperación, perfil, navegación y soporte | Automático + manual; resultados y correcciones |

Revisor habitual: **José** en identidad/permisos y **Amelia** en revocación/evaluación. Rotar cuando haya cambios propios del revisor.

## 6. Entregables personales

- [ ] M1 y M8 aprobados según matriz de historias, no solo pantallas.
- [ ] ADR de sesión/MFA, roles, transporte de avisos y despliegue; contratos y variables documentadas sin valores secretos.
- [ ] Tests/CI funcionales, baseline de accesibilidad y mitigaciones de seguridad.
- [ ] Runbooks de arranque, despliegue, rollback, incidente, backup y restore.
- [ ] Informe de carga con identidades independientes y escenarios reproducibles.
- [ ] Acta de conciliación de estados/RQ y pendientes de aprobación, con responsables.

## Anexo A. Historias de la especificación a cargo de Richar

30 entradas temáticas. El estado corresponde a la fuente, no al resultado de pruebas de este turno. La tarea y la prueba de cierre son la guía de implementación; refinarlas en tickets con criterios completos antes de comenzar. Las historias compartidas mantienen a esta persona como responsable de cierre de su módulo.

| Clave de planificación | Historia | Estado de la fuente | Implementación/resultado esperado | Prueba mínima de cierre |
| --- | --- | --- | --- | --- |
| M1-HU01 | Acceso con correo y contraseña | Aprobado | Validar credenciales, limitar intentos, resolver MFA antes de emitir una sesión completa y avisar de un nuevo dispositivo. | Credenciales incorrectas sin enumeración; OTP vencido/usado; sesión antes de MFA denegada. |
| M1-HU02 | Recuperación y cambio de contraseña | Aprobado | Token aleatorio de un solo uso, caducidad, correo real y revocación tras restablecer; cambio exige clave actual. | Respuestas neutras; carreras al reutilizar token; sesiones antiguas rechazadas en todos los servicios. |
| M1-HU03 | Registro y habilitación docente | Aprobado; flujo contradictorio | Separar registro de habilitación docente y registrar evidencia/decisión; acordar validación manual o automática verificable. | Manipular isTeacher/rol no eleva privilegios; solicitante no aprueba su propia habilitación. |
| M1-HU04 | Gestión y cierre de sesiones | Aprobado | Listar solo sesiones propias, revocar una o todas y propagar política a REST y conexiones en vivo. | Token revocado no funciona en Contenido, Evaluación ni Comunidad; desconectar sockets afectados. |
| M1-HU05 | Acceso rápido | En análisis | Deshabilitar el acceso por correo sin prueba de identidad fuera de demo; diseñar OAuth/OIDC real solo tras aprobar proveedor. | Correo ajeno no da acceso; callback adulterado, proveedor no autorizado y repetición rechazados. |
| M1-HU06 | Auditoría y perfil | Aprobado | Actualizar campos permitidos; auditar actor/acción/resultado y proteger historial y preferencias. | No editar rol desde perfil; auditoría sin contraseña/token; acceso a perfil ajeno denegado. |
| M8-HU01 | Acceso móvil | Aprobado | Flujos principales adaptables; coordinar correcciones con cada dueño de pantalla. | Móvil/tableta/PC, teclado, zoom y ausencia de desbordamientos. |
| M8-HU02 | Interfaz intuitiva | Aprobado | Sistema visual consistente, errores claros y ayuda contextual. | Estudiantes nuevos completan tareas acordadas sin guía del desarrollador. |
| M8-HU03 | Modo nocturno | Aprobado | Preferencia persistida con tema accesible y restauración al entrar. | Contraste y controles legibles en ambos temas. |
| M8-HU04 | Fuente y tamaño | Aprobado | Ajuste de texto sin ocultar controles ni truncar datos. | Zoom/reflow; preferencia restaurada en nueva sesión. |
| M8-HU05 | Compatibilidad multiplataforma | Aprobado | Definir dispositivos y no añadir una aplicación nativa sin necesidad aprobada. | Mismos flujos críticos en la matriz acordada. |
| M8-HU06 | Confidencialidad | Aprobado | Mínimo privilegio, autorización por recurso y protección de secretos. | Solicitudes cruzadas de usuarios/roles y ausencia de datos sensibles en logs. |
| M8-HU07 | Soporte técnico | Aprobado | Tickets con estado, responsable y seguimiento; ayuda fuera de horario sin prometer un chatbot inexistente. | Ticket ajeno inaccesible; validación, seguimiento y cierre verificables. |
| M8-HU08 | Accesibilidad e inclusión | Aprobado | Evaluar WCAG 2.2 AA como objetivo propuesto y corregir barreras de toda la plataforma. | Chequeos automáticos más teclado/lector de pantalla manual. |
| M8-HU09 | Panel docente | Aprobado | Orquestar navegación y permisos; datos académicos provistos por sus dueños. | Docente solo ve grupos autorizados; exportaciones protegen datos. |
| M8-HU10 | Vista del estudiante | Aprobado | Ocultar controles ajenos y mantener prohibición equivalente en backend. | Invocar directamente una ruta docente no funciona. |
| M8-HU11 | Privacidad y términos | Aprobado | Textos revisados institucionalmente, versión y constancia de aceptación cuando corresponda. | Cambio de versión; rechazo/aceptación; información completa legible. |
| M8-HU12 | Validación de formularios | Aprobado | Convención compartida; backend valida aunque se omita la UI. | Campos vacíos, tipos/límites erróneos y texto malicioso. |
| M8-HU13 | TLS | Aprobado | HTTPS válido y WSS, redirección segura y configuración para el entorno público. | Sin contenido mixto; llamadas de datos sensibles nunca por HTTP público. |
| M8-HU14 | Navegadores | Aprobado | Definir versiones soportadas de Chrome, Edge, Firefox y Safari. | Pruebas reales de flujos principales, no solo compilar. |
| M8-HU15 | Seguridad de datos | Aprobado | Secretos externos al repositorio, permisos de DB, análisis de dependencias y mitigación de hallazgos. | Sin secretos publicados; controles de acceso y validación con evidencias. |
| M8-HU16 | Protección de datos | Aprobado | Inventario, finalidad, retención y flujo de solicitudes de derechos; revisión competente para menores. | Solicitud autenticada, seguimiento y propagación acordada de eliminación/anonimización. |
| M8-HU17 | Gestión docente eficiente | Aprobado | Patrones de carga, edición y recuperación de borradores; Juan/Amelia implementan el negocio. | Interrupción de red no publica contenido incompleto ni duplica acciones. |
| M8-HU18 | Escala para cientos de usuarios | Aprobado | Acordar carga, datos, recursos y umbrales; coordinar pruebas graduales. | Usuarios distintos, latencias p95, errores y consistencia; informe reproducible. |
| M8-HU19 | Carga menor a diez segundos | Aprobado | Conciliar HU aprobada con RQ27 congelado antes de fijar compromiso; medir línea base. | Métrica, dispositivo y red definidos; no afirmar cumplimiento por observar una carga. |
| M8-HU20 | Múltiples dispositivos | Aprobado | Sesiones y preferencias según política sin copiar tokens de un equipo a otro. | Continuidad permitida, revocación y cambios de preferencia. |
| M8-HU21 | Uso sin experiencia tecnológica | Aprobado | Validar onboarding opcional y tareas con participantes representativos. | Resultado observado y barreras registradas, no valoración subjetiva del equipo. |
| M8-HU22 | Opciones de accesibilidad | Aprobado | Persistir contraste, movimiento reducido y legibilidad. | Preferencias aplicadas a diálogos, gráficos, temporizadores y juegos. |
| M8-HU23 | Concurrencia multiusuario | Aprobado | Aislar sesiones/datos y asegurar operaciones atómicas con los demás dueños. | Cambios concurrentes no pierden datos ni cruzan identidades. |
| M8-HU24 | Respaldo diario | Aprobado | Programar copia de DB y archivos, cifrado externo, alertas y restauración probada. | Recuperación aislada; cotejo de filas/archivos; RPO/RTO medidos y acordados. |

## Anexo B. Correspondencia con «Historias de usuario completo»

30 entradas asignadas. El prefijo HUC distingue la fuente alternativa. Para M6, B01…B09 es el orden de sus bloques, porque repiten EPIC/IDs; no son IDs originales nuevos. Los estados contradictorios no se resuelven automáticamente. Las extensiones señaladas forman parte del backlog futuro condicionado a aprobación.

| Alias de fuente | Título original | Estado alternativo | Correspondencia y alcance que no debe perderse |
| --- | --- | --- | --- |
| HUC-M1-HU01 | Inicio de sesión con correo y contraseña | Aprobado | M1-HU01 — Conservar RQ alternativos como alias; no sustituir el catálogo principal. |
| HUC-M1-HU02 | Recuperación de contraseña y cambio de clave | Aprobado | M1-HU02 — Conservar RQ alternativos como alias; no sustituir el catálogo principal. |
| HUC-M1-HU03 | Registro y rol automático de profesor | Aprobado | M1-HU03 — RQ99 aquí indica registro docente; en catálogo principal significa onboarding. Conciliar por significado, no por número. |
| HUC-M1-HU04 | Gestión y cierre de sesiones activas | Aprobado | M1-HU04 — Conservar RQ alternativos como alias; no sustituir el catálogo principal. |
| HUC-M1-HU05 | Login rápido | Aprobado | M1-HU05 — Aprobado aquí versus en análisis en especificación: requiere conciliación y OAuth/OIDC real. |
| HUC-M1-HU06 | Auditoría de actividades y actualización de perfil | Aprobado | M1-HU06 — Conservar RQ alternativos como alias; no sustituir el catálogo principal. |
| HUC-M8-HU01 | Acceso móvil optimizado | Aprobado | M8-HU01 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU02 | Interfaz intuitiva para jóvenes | Aprobado | M8-HU02 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU03 | Modo nocturno | Aprobado | M8-HU03 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU04 | Ajuste de fuente y tamaño de texto | Aprobado | M8-HU04 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU05 | Compatibilidad multiplataforma | Aprobado | M8-HU05 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU06 | Seguridad y confidencialidad de datos | Aprobado | M8-HU06 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU07 | Soporte técnico y asistencia | Aprobado | M8-HU07 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU08 | Accesibilidad e inclusión | Aprobado | M8-HU08 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU09 | Dashboard específico para profesores | Aprobado | M8-HU09 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU10 | Interfaz diferenciada para estudiantes | Aprobado | M8-HU10 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU11 | Políticas de privacidad y términos | Aprobado | M8-HU11 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU12 | Validación de entrada en formularios | Aprobado | M8-HU12 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU13 | Cifrado (SSL/TLS) | Aprobado | M8-HU13 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU14 | Compatibilidad con navegadores modernos | Aprobado | M8-HU14 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU15 | Seguridad de datos | Aprobado | M8-HU15 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU16 | Cumplimiento de normas de protección | Aprobado | M8-HU16 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU17 | Gestión eficiente de contenidos por docentes | Aprobado | M8-HU17 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU18 | Escalabilidad para cientos de usuarios | Aprobado | M8-HU18 — Fuente mezcla 100/500 usuarios; acordar escenario y métricas con RQ102 en análisis. |
| HUC-M8-HU19 | Carga en menos de 10 segundos | Aprobado | M8-HU19 — Historia aprobada frente a RQ27 congelado; medir baseline y conciliar compromiso. |
| HUC-M8-HU20 | Accesibilidad desde múltiples dispositivos | Aprobado | M8-HU20 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU21 | Facilidad de uso sin experiencia tecnológica | Aprobado | M8-HU21 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU22 | Opciones de accesibilidad | Aprobado | M8-HU22 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU23 | Acceso multiusuario simultáneo | Aprobado | M8-HU23 — Validación transversal con dueño de cada pantalla/dominio. |
| HUC-M8-HU24 | Respaldo automático diario | Aprobado | M8-HU24 — Historia aprobada frente a RQ33 propuesto; acordar respaldo y probar restauración. |

## Anexo C. Correspondencia con las 18 historias del primer avance

La presentación resumida selecciona estas historias de las anteriores; no limita el resto del plan.

| HU normalizada | Historia(s) de origen o responsabilidad |
| --- | --- |
| HU-PAE-01 | M1-HU01 |
| HU-PAE-02 | M1-HU02 |
| HU-PAE-03 | M1-HU04 |
| HU-PAE-04 | M1-HU03 |
| HU-PAE-18 | M8-HU01/06/08/13/14/16/20/22 |

## Anexo D. Requisitos con responsabilidad principal

37 registros asignados de los 109 del catálogo. CAT conserva posición para distinguir duplicados. Estado/prioridad se mantienen literalmente. El responsable puede necesitar a otro dominio (por ejemplo RQ12: José autoriza grupo y Juan almacena el recurso); asignación principal no autoriza modificar tablas ajenas. Vincular cada fila a HU/ticket, prueba y evidencia en H0–H1. Si un requisito no tiene HU propia, crear historia derivada para aprobación, sin fabricar un estado aprobado.

| Registro | RQ | Tipo | Estado | Prioridad | HU/tarea de enlace | Descripción de la fuente |
| --- | --- | --- | --- | --- | --- | --- |
| CAT-001 | RQ01 | Funcional | Aprobado | Alta | M1-HU03/06 | Asignar un identificar único para cada usuario registrado en la plataforma. |
| CAT-002 | RQ02 | Funcional | Aprobado | Alta | M1-HU06 | Mostrar el identificar único en el perfil del usuario y que pueda ser copiado de forma rápida. |
| CAT-027 | RQ45 | Funcional | Aprobado | Alta | M8-HU01 | El sistema debe permitir una vista optimizada para navegadores web en celulares. |
| CAT-031 | RQ50 | Funcional | Aprobado | Media | M1-HU03/06 | El sistema debe permitir crear perfiles de usuario personalizados (nombre, carrera de interés, etc.). |
| CAT-047 | RQ73 | Funcional | Aprobado | Baja | M8-HU04 | El sistema debe ofrecer opción de ajuste de fuente y tamaño de texto. |
| CAT-057 | RQ88 | Funcional | Aprobado | Media | M8-HU06/15 | Implementar medidas de seguridad y confidencialidad de datos de los usuarios. |
| CAT-058 | RQ90 | Funcional | Aprobado | Media | M8-HU07 | Proporcionar soporte técnico y asistencia al usuario en caso de inconvenientes. |
| CAT-060 | RQ92 | Funcional | Aprobado | Alta | M8-HU08/22 | Diseñar la plataforma considerando accesibilidad e inclusión para todos los estudiantes. |
| CAT-062 | RQ94 | Funcional | Aprobado | Alta | M1-HU01 | El sistema debe permitir a los usuarios iniciar sesión usando correo y contraseña. |
| CAT-063 | RQ95 | Funcional | Aprobado | Media | M1-HU01 | El sistema debe permitir autenticación de dos factores para cuentas. |
| CAT-064 | RQ96 | Funcional | Aprobado | Alta | M1-HU02 | El sistema debe permitir recuperar contraseña vía correo. |
| CAT-065 | RQ97 | Funcional | Aprobado | Alta | M1-HU03 | El sistema debe asignar automáticamente el rol de profesor tras validación de credenciales. |
| CAT-066 | RQ98 | Funcional | Aprobado | Alta | M8-HU09 | El sistema debe permitir al profesor visualizar un dashboard específico al ingresar y permitir cambiar entre uno y otro. |
| CAT-067 | RQ99 | Funcional | Aprobado | Alta | M1-HU03; HUC-M7-HU01 | El sistema debe redirigir al estudiante a un onboarding guiado tras el primer ingreso. |
| CAT-068 | RQ100 | Funcional | Aprobado | Media | M1-HU02/06 | El sistema debe permitir cambiar la contraseña y datos en general desde las configuraciones en el panel del estudiante. |
| CAT-069 | RQ101 | Funcional | Aprobado | Media | M1-HU04/06 | El sistema debe guardar el historial de sesiones del usuario por seguridad. |
| CAT-070 | RQ103 | Funcional | Aprobado | Alta | M8-HU11 | El sistema debe incluir políticas de privacidad y términos de uso Aprobados al registrarse. |
| CAT-071 | RQ104 | Funcional | Aprobado | Media | M1-HU04 | El sistema debe registrar y gestionar sesiones activas por usuario para mayor seguridad. |
| CAT-072 | RQ105 | Funcional | Aprobado | Alta | M8-HU12 | El sistema debe contar con validación de entrada en formularios (campos requeridos, formato de email, etc.). |
| CAT-073 | RQ107 | Funcional | Aprobado | Alta | M1-HU04 | El sistema debe permitir cerrar sesión de forma segura en todos los dispositivos. |
| CAT-074 | RQ108 | Funcional | Aprobado | Media | M1-HU06 | El sistema debe auditar accesos y cambios realizados por los usuarios. |
| CAT-075 | RQ109 | Funcional | Aprobado | Baja | M1-HU01 | El sistema debe enviar notificación en caso de inicio de sesión desde un nuevo dispositivo. |
| CAT-079 | RQ58 | Funcional | En análisis | Media | M1-HU05 | El sistema debe ofrecer login rápido (por Google, correo, o redes sociales). |
| CAT-096 | RQ28 | No funcional | Aprobado | Alta | M8-HU14 | Compatibilidad con navegadores modernos. |
| CAT-097 | RQ30 | No funcional | Aprobado | Alta | M8-HU06/15 | Seguridad de los datos de usuarios. |
| CAT-098 | RQ31 | No funcional | Aprobado | Alta | M8-HU16 | Cumplimiento de normas de protección de datos. |
| CAT-099 | RQ57 | No funcional | Aprobado | Alta | M8-HU02/21 | El sistema debe tener una interfaz intuitiva para usuarios jóvenes. |
| CAT-100 | RQ66 | No funcional | Aprobado | Baja | M8-HU03 | El sistema debe tener un modo nocturno (dark mode). |
| CAT-101 | RQ88 | No funcional | Aprobado | Media | M8-HU06/15 (no funcional) | Implementar medidas de seguridad y confidencialidad de datos de los usuarios. |
| CAT-102 | RQ106 | No funcional | Aprobado | Alta | M8-HU13 | El sistema debe utilizar cifrado (SSL/TLS) para proteger los datos durante el inicio de sesión. |
| CAT-103 | RQ102 | No funcional | En análisis | Alta | M8-HU18/23 | El sistema debe garantizar la escalabilidad para soportar cientos de usuarios simultáneos. |
| CAT-104 | RQ27 | No funcional | Congelado | Media | M8-HU19 (congelado: conciliar estado) | Carga en menos de 10 segundos. |
| CAT-105 | RQ25 | No funcional | Propuesto | Alta | M8-HU01/05/20 | Accesibilidad desde navegadores web de escritorio y teléfono. |
| CAT-106 | RQ26 | No funcional | Propuesto | Alta | M8-HU02/21 | Facilidad de uso para usuarios sin experiencia tecnológica. |
| CAT-107 | RQ29 | No funcional | Propuesto | Alta | M8-HU08/22 | Opciones de accesibilidad (lectores de pantalla, contraste alto). |
| CAT-108 | RQ32 | No funcional | Propuesto | Alta | M8-HU23 | Acceso multiusuario simultáneo. |
| CAT-109 | RQ33 | No funcional | Propuesto | Media | M8-HU24 | Respaldo automático diario de datos. |

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

Guía adjunta: `01_Richar_Usuarios_Infraestructura.md`, de 5 de octubre de 2026. SHA-256 del archivo recibido: `cdfb82444786f94b4c4b6daed6936e3647a1f8f8298f290326652b4adfa956f7`. Se incorporan secciones 2–6 y anexos A–E; el marco común repetido se sustituye por la guía central actualizada. No se requieren archivos temporales de extracción para continuar.
