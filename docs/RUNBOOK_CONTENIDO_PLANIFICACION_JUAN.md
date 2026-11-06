# Runbook Operativo: Módulos M2 (Contenido) y M5 (Planificación) — Juan Rengifo

**Versión:** 1.0  
**Fecha:** 25 de octubre de 2026  
**Rama:** `Juan_Rengifo`  
**Repositorio:** PAE-Software  

---

## 1. Arquitectura y Componentes
- **Módulo 2 (Contenido Educativo):** Ubicado en `backend/services/content-service`. Responsable de repositorios académicos, recursos (PDF, multimedia), lecciones, solucionarios editoriales y control de acceso seguro a uploads.
- **Módulo 5 (Planificación de Estudio):** Ubicado en `backend/services/learning-service/src/modules/planning/`. Responsable de agenda de estudio, horas sugeridas, descansos saludables, Pomodoro y claim concurrente de recordatorios.
- Contenido ya no monta ni inicializa las rutas antiguas de planificación; `/api/learning/planning` es la única autoridad operativa.

---

## 2. Variables de Entorno Críticas

Para una base de Contenido existente, ejecutar `npm run migrate --prefix backend/services/content-service` antes de arrancar el servicio. El contenedor ejecuta el mismo paso antes de `npm start`. El migrador usa bloqueo advisory y registra el checksum de cada migración; si detecta una modificación posterior, detiene el proceso.

| Variable | Descripción | Valor por Defecto / Ejemplo |
|---|---|---|
| `PORT` | Puerto HTTP del servicio de contenido | `3003` |
| `UPLOAD_PATH` | Ruta absoluta/relativa al almacenamiento de archivos | `./uploads` |
| `MAX_FILE_SIZE` | Tamaño máximo por archivo (bytes) | `10485760` (10 MB) |
| `JWT_SECRET` | Secreto para validación de tokens Bearer | Secreto del entorno |
| `CONTENT_DATABASE_URL` o `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD` | Base PostgreSQL propietaria de Contenido | Solo entorno seguro |
| `LEARNING_DATABASE_URL` o `PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD` | Base PostgreSQL propietaria de Aprendizaje/Planificación | Solo entorno seguro |
| `LEARNING_PORT` | Puerto HTTP de Aprendizaje | `3006` |
| `OUTBOX_TRANSPORT_URL` | Endpoint autenticado del transporte compartido de eventos | Opcional en desarrollo; requerido para publicación operativa |
| `OUTBOX_POLL_MS` | Intervalo del worker Outbox | `5000` ms |
| `NODE_ENV` | Entorno de ejecución (`development`, `test`, `production`) | `development` |

---

## 3. Seguridad de Archivos y Almacenamiento Privado (JUA-01, JUA-02, JUA-06)
- **Bloqueo de Acceso Directo por URL:** Las peticiones a `/uploads/resources/pdfs/*` no se sirven de forma estática indiscriminada. El middleware `secureUploadsMiddleware` valida la autenticación del solicitante y la privacidad del repositorio padre (`publico: false`).
- **Prevención de Path Traversal:** Se valida que toda ruta canónica pertenezca estrictamente al subdirectorio `UPLOAD_PATH`. Intentos con `..` son rechazados con código `403 Forbidden`.
- **Inspección de Magic Bytes:** Los archivos PDF deben iniciar con el encabezado `%PDF-` para ser aceptados. Se rechazan extensiones ejecutables (`.exe`, `.sh`, `.php`, etc.).

## 3.1 Migración de Planificación a Aprendizaje

La planificación nueva se persiste en el esquema `planning` de `learning-service`; el cliente usa `/api/learning/planning`. El endpoint histórico de contenido se conserva únicamente durante la transición y no debe recibir nuevas escrituras.

Aplicar la migración desde el directorio del servicio, con la base de Aprendizaje aislada:

```bash
npm run migrate --prefix backend/services/learning-service
```

La migración es transaccional, usa bloqueo de advisory PostgreSQL, registra checksum por versión y aplica `002_planning.sql` y `003_pomodoro_history.sql` después de `001_gamification.sql`. Si el checksum de una versión cambia, el proceso se detiene para evitar una deriva silenciosa.

Para comparar y migrar datos históricos de Contenido, ejecutar primero el dry-run; solo aplicar después de revisar el reporte:

```bash
npm run reconcile:planning --prefix backend/services/learning-service
npm run reconcile:planning --prefix backend/services/learning-service -- --apply
```

El comando copia preferencias y recordatorios con `UPSERT`, conserva la fuente histórica intacta y es repetible. El rollback operativo consiste en no retirar el endpoint histórico hasta comparar conteos/fechas y restaurar el respaldo; no se ejecuta automáticamente.

---

## 4. Procedimiento de Respaldo y Restauración (Backup & Restore - JUA-26)

### Respaldo de Archivos Físicos y Metadatos:
1. Generar manifiesto de checksums SHA-256 de los archivos en `UPLOAD_PATH`:
   ```bash
   Get-FileHash -Algorithm SHA256 uploads/resources/*/* | Export-Csv -Path backup_manifest.csv
   ```
2. Archivar el directorio `uploads` conservando estructura de directorios.

### Restauración:
1. Descomprimir el archivo de respaldo en el directorio configurado en `UPLOAD_PATH`.
2. Verificar integridad contra el manifiesto:
   ```bash
   # Comprobar que ningún archivo esté corrupto o ausente
   ```
3. Reiniciar el servicio `content-service` y verificar health check en `/api/content/health`.

---

## 5. Demostración del Ciclo Completo (JUA-27)

```
[ Docente ]
    │
    ▼ (1) Crea Repositorio y publica Lección/Material
[ content-service ] ─── Registra hecho Outbox (RecursoPublicado.v1)
    │
    ▼ (2) Estudiante accede y estudia lección
[ StudentLessonDetail ] ─── Track de tiempo y aviso de descanso (>30 min)
    │
    ▼ (3) Estudiante completa la lección
[ content-service ] ─── Registra progreso (completada: true)
    │                  └── Emite evento durable (LeccionCompletada.v1)
    ▼
[ learning-service ] ─── Proyecta avance en módulo de Planificación
    │
    ▼ (4) Planificación agenda sesión de repaso
[ planningUseCases ] ─── Genera recordatorio en estado "pendiente"
    │
    ▼ (5) Workers concurrentes reclaman recordatorio (JUA-AC-04)
[ Worker Node ] ─── Claim atómico: solo 1 worker toma el lock; el 2do recibe false
    │
    ▼ (6) Estudiante cancela plan o desactiva recordatorios (JUA-AC-05)
                        [ planningUseCases ] ─── Invalida ocurrencias pendientes (estado: "omitido")
                        └── No se envían notificaciones obsoletas
```

---

## 6. Comandos de Validación Ejecutable

```bash
# 1. Verificación estricta de límites de arquitectura limpia
npm run check:architecture

# 2. Factorías y contratos de eventos
npm run test:architecture

# 3. Pruebas de Planificación y Aprendizaje
npm run test:learning

# 4. Pruebas de Contenido Educativo (suites unitarias e integradas)
npm run test:content

# 5. Comprobación de configuración y seguridad
npm run test:config
npm run check:safety

# 6. Compilación del Frontend (TypeScript & Vite)
npm run build --prefix frontend
```
