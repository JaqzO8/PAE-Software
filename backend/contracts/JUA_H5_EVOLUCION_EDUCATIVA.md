# H5: Especificación de Evolución Educativa Aprobada (JUA-19 a JUA-24)

**Responsable:** Juan Rengifo (M2: Contenido Educativo / M5: Planificación de Aprendizaje)  
**Fecha:** 25 de octubre de 2026  
**Rama:** `Juan_Rengifo`  

---

## 1. Microcursos y Ruta por Temas con Secuencia (JUA-19 / RQ64)
- **Estructura Pedagógica:** Cada repositorio organiza sus lecciones con un campo `orden` secuencial (0, 1, 2...).
- **Prerequisitos y Evaluación:** Una lección posterior recomienda la finalización de la anterior (`LessonProgress.completada === true`). La ruta articula lecciones teóricas y evaluaciones diagnósticas coordinadas con el módulo de Evaluación de Amelia.
- **Acceso Autorizado:** Solo lecciones con `publicado: true` son visibles para estudiantes en cursos activos.

---

## 2. Multimedia, Mapas Conceptuales y Accesibilidad (JUA-20 / RQ38, RQ111)
- **Mapas Conceptuales Accesibles:** La estructura de `mapa_conceptual` no depende únicamente de diagramas visuales en imagen; se modela como grafos semánticos con descripción textual alternativa:
  ```json
  [
    { "concepto": "Límite", "relacion": "Aproximación a un valor", "descripcion_accesible": "El límite describe el comportamiento de una función cerca de un punto." }
  ]
  ```
- **Recursos Multimedia:** Soporte para enlaces de video, audio y transcripciones textuales para garantizar accesibilidad según criterios WCAG.
- **Asistencia IA:** Cualquier contenido asistido por IA requiere revisión editorial y no se publica automáticamente sin aprobación docente.

---

## 3. Guía de Lectura Rápida vs Juego Multijugador (JUA-21 / RQ65)
- **Experiencia Individual (Juan):** Enfoque en lectura concentrada, tiempo estimado y resúmenes teóricos sin presión innecesaria.
- **Dinámica Multijugador (M2-HU07b):** Se concilia formalmente que las salas multijugador y premios pertenecen a la coordinación entre Amelia (motor de puntaje) y José (WebSockets en comunidad y gamificación). Juan suministra el catálogo de lecturas validadas.

---

## 4. Lectura Offline y Aislamiento por Cuenta (JUA-22 / RQ43)
- **Aislamiento en Dispositivo:** El almacenamiento local para lectura offline está indexado por ID de cuenta de usuario (`pae_offline_<userId>`).
- **Limpieza en Cierre de Sesión:** Al cerrar sesión (`logout`), se purgan las copias locales de material privado para evitar fuga de información en dispositivos compartidos.
- **Sin Descarga Automática Silenciosa:** Los materiales privados no se descargan sin confirmación explícita del estudiante.

---

## 5. Importación / Exportación PDF y DOC (JUA-23 / RQ24)
- **Alcance Editorial:** Aplicable a guías, apuntes y solucionarios teóricos en formato PDF y DOCX.
- **Fidelidad y Seguridad:** Validación obligatoria de extensiones permitidas y magic bytes (`%PDF-`, `PK\x03\x04`).
- **Delimitación:** Los bancos de preguntas para exámenes (JSON, CSV, XLSX) corresponden a Evaluación (Amelia) y no se mezclan con el almacenamiento de materiales de Contenido.

---

## 6. Bienestar, Pausas y Manejo de Ansiedad Pre-Examen (JUA-24 / RQ77, RQ86)
- **Pausas Saludables:** El sistema detecta sesiones prolongadas de estudio (>30 minutos sin pausa) y emite un recordatorio de pausa breve (`shouldRest`).
- **Tips de Manejo de Ansiedad:** Mensajes breves de respiración consciente, preparación emocional y hábitos saludables presentados en pantallas de carga.
- **Minimización de Datos:** No se recopila información médica, diagnóstica ni sensible del estudiante; son contenidos educativos y motivacionales revisados.
