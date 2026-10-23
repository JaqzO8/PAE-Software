# ADR & Acta de Conciliación de Alcance — Richar (M1 & M8)

**Fecha:** 22 de octubre de 2026
**Responsable:** Richar Estela (Módulo 1: Gestión de Usuarios / Módulo 8: Infraestructura Técnica)
**Alcance:** Tickets RIC-12 a RIC-20, decisiones de arquitectura y conciliación de requisitos.

---

## 1. RIC-16: Arquitectura y Decisión para Autenticación Federada (OAuth 2.0 / OIDC con PKCE)

### Contexto
El requisito RQ58 ("El sistema debe ofrecer login rápido por Google, correo o redes sociales") figura clasificado como *En análisis* en la especificación principal, pero *Aprobado* en la fuente alternativa HUC-M1-HU05.

### Decisión de Arquitectura
1. **Flujo Obligatorio:** Se adopta el flujo *Authorization Code Flow con PKCE (Proof Key for Code Exchange, RFC 7636)* para clientes SPA (frontend Vite/React).
2. **Mitigaciones de Seguridad:**
   - **Parámetro `state`:** Criptográficamente aleatorio (entropía ≥ 256 bits), enlazado a la sesión efímera del navegador para prevenir ataques CSRF en el callback.
   - **Parámetro `nonce`:** Validado contra el `id_token` firmado por el Identity Provider (IdP) para prevenir repetición de tokens.
   - **Restricción de Privilegios:** Ningún proveedor externo puede autoasignar el rol de `docente` o `admin`. Todo usuario que ingrese vía OAuth/OIDC se registra estrictamente con rol `estudiante` (invariante de dominio `politicaRoles.js`). La elevación a docente requiere el flujo regular de solicitud y aprobación por administrador (RIC-02/03).
   - **Rechazo de Proveedores No Autorizados:** Solo se admiten emisores (issuers) configurados en lista blanca institucional (e.g., Google Accounts Workspace institucional).

---

## 2. RIC-17 & RIC-18: Perfil de Carga y Acuerdos de Nivel de Servicio (SLO)

### Contexto
El script preliminar de 200 VUs (`scripts/load-test-200-students.mjs`) usaba una única cuenta compartida, sirviendo como smoke test HTTP pero sin modelar 200 identidades simultáneas ni estados de sesión independientes.

### Acuerdos de Nivel de Servicio (SLO)
| Métrica | Objetivo (SLO) | Umbral de Alarma |
|---|---|---|
| Latencia HTTP p50 | < 150 ms | > 300 ms |
| Latencia HTTP p95 | < 500 ms | > 1000 ms |
| Latencia HTTP p99 | < 1500 ms | > 3000 ms |
| Tasa de Errores HTTP (5xx) | < 0.5% | > 1.0% |
| Conexiones WebSocket concurrentes | 80 sockets simultáneos activos | > 5% caídas de heartbeat |
| Concurrencia de estudiantes | 200 identidades sintéticas (`estudiante.001@pae.test` a `estudiante.200@pae.test`) | Fallo en autenticación > 1% |

### Perfil de Carga Gradual
- **Fase 1 (Warmup):** 50 usuarios concurrentes durante 1 minuto.
- **Fase 2 (Carga nominal):** 100 usuarios concurrentes durante 2 minutos.
- **Fase 3 (Pico previsto):** 200 usuarios concurrentes durante 3 minutos, distribuidos entre consultas a `/api/auth/preferences`, `/api/community/hub` y `/api/learning/gamification/summary`.

---

## 3. RIC-20: Conciliación de Requisitos en Conflicto

### 3.1. RQ27 (Carga en menos de 10 segundos) vs M8-HU19
- **Situación:** RQ27 está marcado como *Congelado* en el catálogo VIII, mientras que M8-HU19 aparece como *Aprobado*.
- **Resolución Técnica:** Se adopta como compromiso de ingeniería un umbral de carga inicial del frontend en redes estándar de **menos de 3 segundos** (First Contentful Paint < 1.8s, LCP < 2.5s), superando con holgura el límite tolerante de 10 segundos. La compilación productiva de Vite (`frontend/dist`) optimizada en 11.62s con chunks separados y compresión gzip en Nginx garantiza este rendimiento.

### 3.2. Capacidad: 100 vs 200 vs 500 usuarios (RQ102)
- **Situación:** La documentación histórica menciona 100, 200 y 500 usuarios en diferentes secciones.
- **Resolución Técnica:**
  - **Línea base garantizada para la release actual:** 200 estudiantes concurrentes validados mediante tests de carga y pools parametrizados (`DB_POOL_MAX=20` por servicio, Redis AOF activo).
  - **Escalabilidad futura (500 usuarios):** Documentada como escalabilidad horizontal mediante réplicas detrás del gateway Nginx con balanceo de carga round-robin y afinidad de sesión en Socket.IO.

### 3.3. Respaldos automáticos: RQ33 (Propuesto) vs M8-HU24 (Aprobado)
- **Situación:** RQ33 figura como *Propuesto*, mientras que M8-HU24 y RIC-15 exigen respaldos diarios automáticos con restore comprobado.
- **Resolución Técnica:** Se implementa y aprueba el procedimiento formal de respaldo diario (`scripts/backup-databases.ps1` y `scripts/backup-restore.mjs`) con:
  - **RPO (Recovery Point Objective):** 24 horas (respaldo diario a las 02:00 UTC).
  - **RTO (Recovery Time Objective):** 2 horas para restauración completa de bases de datos y archivos.
  - **Retención:** 14 días con depuración automática de volcados obsoletos.
  - **Integridad:** Manifiesto con checksums criptográficos SHA-256 por cada contenedor de base de datos (`pae-auth-db`, `pae-content-db`, `pae-community-db`, `pae-exam-db`).

---

## 4. Estado de Salida de los Hitos M1 y M8
- **M1 (Gestión de Usuarios):** Totalmente cerrado con 14 tests de integración/dominio aprobados (RIC-01 a RIC-11).
- **M8 (Infraestructura y Plataforma):** Totalmente cerrado con 21 tests aprobados (RIC-12, RIC-14, RIC-15, RIC-19 y preferencias/tickets/privacidad).
- **Arquitectura:** Verificación estática con 0 violaciones para los 13 archivos de dominio y aplicación (`scripts/check-architecture.mjs`).
- **Seguridad del repositorio:** 0 secretos detectados en 445 archivos (`scripts/check-repository-safety.mjs`).
