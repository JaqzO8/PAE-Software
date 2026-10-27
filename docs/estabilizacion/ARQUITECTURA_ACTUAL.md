# Arquitectura actual comprobada

Revisión: 26 de octubre de 2026. React 18 y TypeScript se compilan con Vite; Nginx sirve la SPA y enruta HTTP y Socket.IO hacia servicios Node.js 24. PostgreSQL mantiene los datos; Redis mantiene revocaciones, desafíos y límites de autenticación.

| Componente | Responsabilidad y frontera |
|---|---|
| Auth :3001 | Usuarios, roles, sesiones, preferencias y servicios de plataforma. Autoridad de estado vigente; JWT firmado y fingerprint SHA-256 persistido |
| Community :3002 | Comunidades, membresías, invitaciones, mensajes, foros, amistad y recursos. Transacciones bloquean comunidad para conflictos; claves de idempotencia y versiones |
| Content :3003 | Repositorios, recursos, lecciones, publicación y Outbox. Archivos privados y enlaces temporales exigen identidad activa |
| Exam :3004 | Evaluación, resultados, revisión y funciones de juego existentes. Consulta Auth antes de autorizar HTTP y cada entrega privada en vivo |
| Quality :3005 | Traducción de métricas Sonar; disponibilidad depende de credenciales y servicio externo |
| Learning :3006 | Planificación operativa en /api/learning/planning, persistencia PostgreSQL propia y autenticación centralizada. La migración total de seguimiento/gamificación sigue pendiente |

En QA se crean bases qa_auth, qa_community, qa_exam, qa_content y qa_learning en PostgreSQL aislado. El gateway usa 127.0.0.1:13000 y la SPA 127.0.0.1:15173. El proyecto Compose pae_qa tiene su propio volumen y Redis. No sustituye ni elimina pruebas_pae. Las credenciales aleatorias se guardan únicamente en .env.qa ignorado por Git.

Auth verifica firma HS256, revocación Redis, usuario activo y sesión activa en BD. Los consumidores consultan /api/auth/verify con timeout y propagan 401/503; no continúan con roles obsoletos ni inventan sesiones durante una caída. La renovación reemplaza el fingerprint bajo transacción. MFA consume el desafío y su presupuesto de intentos en una sola operación Redis.

La instrumentación V8 se monta exclusivamente en Compose QA y se vacía mediante SIGUSR2 al proceso de aplicación, sin interrumpir peticiones. Las suites Node/Jest y los flujos HTTP/navegador publican reportes LCOV separados, sin exclusiones de código funcional en Sonar.

No se migran a una arquitectura distinta los módulos heredados: check:architecture valida solamente las fronteras nuevas que declara su script. El resto conserva controladores/servicios Sequelize; esta limitación es explícita.
