# H0: Inventario de Recursos, Visibilidad y Conciliación de Criterios (JUA-01, JUA-03, JUA-04)

**Responsable:** Juan Rengifo (Módulo 2: Contenido Educativo & Módulo 5: Planificación de Aprendizaje)  
**Fecha:** 25 de octubre de 2026  
**Rama:** `Juan_Rengifo`  

---

## 1. Inventario de Visibilidad y Propiedad de Recursos (JUA-01)

| Tipo de Recurso | Almacenamiento / Ruta | Visibilidad | Propietario / Autoridad | Regla de Acceso y Autorización |
|---|---|---|---|---|
| **Portada de Repositorio** | `/uploads/resources/images/*` | **Pública** (si el repositorio es público y activo) | Docente creador del repositorio (`Repository.id_profesor`) | Acceso de solo lectura anónimo/público permitido para renderizado de tarjetas en catálogo y búsqueda. Prevención de path traversal obligatoria. |
| **Recurso de Repositorio Público** | `/uploads/resources/pdfs/*`, `audios/*`, `videos/*`, etc. | **Público Autenticado** | Docente creador del repositorio (`Repository.id_profesor`) | Metadatos visibles públicamente. Descarga requiere sesión válida (`verifyToken`). Registro de contador de descargas atómico. |
| **Recurso de Repositorio Privado** | `/uploads/resources/*` | **Privado** | Docente creador del repositorio (`Repository.id_profesor`) | Prohibido el acceso anónimo o por URL directa (401). Estudiantes ajenos o docentes sin relación reciben 403 Forbidden. Solo el docente dueño y administradores pueden descargar o editar. |
| **Material de Lección** | Generado on-demand o adjunto (`/api/content/lessons/:id/material`) | **Condicional / Privado** | Sistema / Docente | Requiere autenticación de estudiante y verificación de cumplimiento de la lección (`LessonProgress.completada === true`). Si no completó la lección, se deniega con 403. |
| **Recurso Compartido con Comunidad** | `/api/community/:id/resources/:resourceId/download` | **Restringido a Comunidad** | Docente / Comunidad (coordinación con José) | Exige membresía vigente verificada en la comunidad respectiva (`verifyMemberOfCommunity`). Ante expulsión o abandono del grupo, se revoca inmediatamente el acceso. |

---

## 2. Política de Protección contra Descarga Directa en `/uploads` (JUA-02)

1. **Eliminación del bypass de archivos privados:**  
   El directorio físico de subidas no debe exponer archivos confidenciales mediante `express.static` sin control.
2. **Middleware de control de acceso (`secureUploadsMiddleware`):**  
   - Intercepta solicitudes que apuntan a `/uploads/resources/*`.
   - Verifica existencia e integridad de la ruta (rechaza path traversal con `..`).
   - Verifica si el archivo corresponde a un recurso privado (`publico === false`).
   - Exige cabecera `Authorization: Bearer <token>` válida.
   - Si no hay token: responde `401 Unauthorized`.
   - Si el usuario no es el dueño ni administrador: responde `403 Forbidden`.
   - Solo los archivos deliberadamente públicos (como portadas activas) se entregan libremente.

---

## 3. Descomposición de M2-HU07 (JUA-03)

En la documentación original, **M2-HU07** mezclaba dos conceptos pedagógicos y técnicos distintos:

1. **M2-HU07a: Guía de lectura y estudio personalizado (Ámbito Juan - M2 Contenido):**  
   - **Objetivo:** Proveer guías estructuradas por tema/subtema, con tiempos sugeridos de lectura, resúmenes teóricos y alternativas accesibles.  
   - **Actor:** Estudiante (consulta) y Docente (publicación).  
   - **Dependencias:** Autonomía en `content-service`.

2. **M2-HU07b: Dinámica de lectura rápida / Juego multijugador interactivo:**  
   - **Objetivo:** Competencia o práctica en tiempo real con límite de tiempo.  
   - **Colaboración:**  
     * **Amelia (Evaluación):** Motor de cálculo de puntajes y límites de tiempo por pregunta.  
     * **José (Comunidad & Gamificación):** Salas WebSockets y asignación de recompensas/puntos.  
     * **Juan (Contenido):** Banco de textos y material de lectura validado.

---

## 4. Conciliación de Metadatos y Backlog (JUA-04)

- **M2-HU02 vs M2-HU01:** En fuentes anteriores figuraba el título duplicado *"Descarga de materiales de estudio - Repositorio"*. Se concilia a su función real: **"Gestión y funcionamiento de repositorios académicos (CRUD, categorías, tags, visibilidad, favoritos)"** cubriendo RQ13, RQ14, RQ15, RQ20, RQ55, RQ74.
- **M2-HU05:** Se concilia como **"Videos y recursos multimedia vinculados a temas"** (RQ38).
- **M2-HU08 / RQ47:** Marcado como *"En análisis"* en requisitos y *"Aceptado"* en anexos de HU. Se concilia que la emisión de notificaciones de nuevo contenido se soporta mediante la arquitectura de eventos durables (`RecursoPublicado.v1`) sin invadir el canal de transporte que corresponde a Richar/Amelia.
