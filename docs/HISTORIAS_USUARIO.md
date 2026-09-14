# Historias de usuario y criterios de aceptación

Catálogo de la sección X de la especificación. Conserva historias, roles, finalidad, referencias RQ declaradas y tablas de aceptación. Los textos de las tablas son transcripciones; no son instrucciones de ejecución ni declaraciones de funcionalidad terminada. Los localizadores Mx-Syy se agregan para navegar y no sustituyen los IDs originales.

Cada historia debe validarse contra [la matriz principal](MATRIZ_REQUISITOS.md); la numeración original puede contener contradicciones. El resumen por módulo y las brechas se encuentran en [el resumen ejecutivo](RESUMEN_EJECUTIVO.md).

| Módulo | Secciones de historias o EPIC | Catálogo |
| --- | --- | --- |
| 1 Gestión de usuarios | 6 | [Historias y aceptación](historias/M1.md) |
| 2 Contenido educativo | 8 | [Historias y aceptación](historias/M2.md) |
| 3 Exámenes y simulacros | 17 | [Historias y aceptación](historias/M3.md) |
| 4 Análisis y seguimiento | 9 | [Historias y aceptación](historias/M4.md) |
| 5 Planificación y organización | 3 | [Historias y aceptación](historias/M5.md) |
| 6 Comunidad y colaboración | 8 | [Historias y aceptación](historias/M6.md) |
| 7 Gamificación y motivación | 3 | [Historias y aceptación](historias/M7.md) |
| 8 Infraestructura técnica e interfaz | 24 | [Historias y aceptación](historias/M8.md) |

Total: **78 secciones** (historias y EPIC), incluidas las historias embebidas detectadas. Algunas tablas contienen más de un ID; se conservan todas sus filas.

## Cierre de una historia

1. Conciliar los RQ vinculados y resolver ambigüedades con el responsable funcional.
2. Validar los escenarios originales con datos ficticios, incluidos errores, permisos y persistencia.
3. Adjuntar evidencia reproducible al pull request, con entorno, resultado y limitaciones.
4. Integrar en develop tras revisión; promover a main cuando la entrega esté aceptada.

## Cruce de historias con el catálogo principal

El siguiente cruce es una propuesta de conciliación elaborada por significado, no una modificación de los vínculos originales ni una aprobación del Product Owner. Las tablas de cada historia conservan las referencias de origen. Cuando una historia exige algo más específico que el RQ relacionado, su criterio conserva ese alcance adicional.

| Localizador | Historia o sección original | RQ principales por significado | Situación para aceptación |
| --- | --- | --- | --- |
| [M1-S01](historias/M1.md#m1-s01) | HU01: Inicio de sesión con correo y contraseña | RQ94, RQ95, RQ109 | Parcial o con brechas; revisar RQ y criterios |
| [M1-S02](historias/M1.md#m1-s02) | HU02: Recuperación de contraseña y cambio de clave | RQ96, RQ100, RQ101 | Parcial o con brechas; revisar RQ y criterios |
| [M1-S03](historias/M1.md#m1-s03) | HU03: Registro y rol automático de profesor | RQ97, RQ50 | Parcial o con brechas; revisar RQ y criterios |
| [M1-S04](historias/M1.md#m1-s04) | HU04: Gestión y cierre de sesiones activas | RQ104, RQ107, RQ101 | Código localizado; aceptación integral pendiente |
| [M1-S05](historias/M1.md#m1-s05) | HU05: Login rápido | RQ58 | Parcial o con brechas; revisar RQ y criterios |
| [M1-S06](historias/M1.md#m1-s06) | HU06: Auditoría de actividades y actualización de perfil | RQ108, RQ50, RQ100, RQ104 | Parcial o con brechas; revisar RQ y criterios |
| [M2-S01](historias/M2.md#m2-s01) | HU01: Descarga de recursos del repositorio académico | RQ43, RQ110 | Código localizado; aceptación integral pendiente |
| [M2-S02](historias/M2.md#m2-s02) | HU02: Gestión y funcionamiento de repositorios con materiales de estudio | RQ13, RQ14, RQ15, RQ20, RQ43, RQ55, RQ74 | Código localizado; aceptación integral pendiente |
| [M2-S03](historias/M2.md#m2-s03) | HU03: Visualización de preguntas y respuestas por lección | RQ110 | Código localizado; aceptación integral pendiente |
| [M2-S04](historias/M2.md#m2-s04) | HU04: Resumen teórico por lección. | RQ46 | Código localizado; aceptación integral pendiente |
| [M2-S05](historias/M2.md#m2-s05) | HU05: Historia de Usuario: Videos y recursos explicativos vinculadas a temas. | RQ38 | Código localizado; aceptación integral pendiente |
| [M2-S06](historias/M2.md#m2-s06) | HU06: Generación y visualización de mapas conceptuales. | RQ111 | Parcial o con brechas; revisar RQ y criterios |
| [M2-S07](historias/M2.md#m2-s07) | HU07 Guías de lectura y estudio personalizado | RQ65, RQ79, RQ114 | Parcial o con brechas; revisar RQ y criterios |
| [M2-S08](historias/M2.md#m2-s08) | HU08 Notificaciones de nuevo contenido y recordatorios de estudio | RQ47, RQ48, RQ112 | Parcial o con brechas; revisar RQ y criterios |
| [M3-S01](historias/M3.md#m3-s01) | HU01: Exámenes Generados en Grupos de Estudio. | RQ04, RQ09 | Parcial o con brechas; revisar RQ y criterios |
| [M3-S02](historias/M3.md#m3-s02) | HU02: Gestión completa de preguntas generadas. | RQ05, RQ06, RQ07, RQ08 | Código localizado; aceptación integral pendiente |
| [M3-S03](historias/M3.md#m3-s03) | HU03: Reportar preguntas mal generadas. | RQ23, RQ56 | Parcial o con brechas; revisar RQ y criterios |
| [M3-S04](historias/M3.md#m3-s04) | HU04: Realizar simulacros con temporizador. | RQ16 | Código localizado; aceptación integral pendiente |
| [M3-S05](historias/M3.md#m3-s05) | HU05: Información de tema y subtemas en exámenes. | RQ06, RQ34, RQ44 | Código localizado; aceptación integral pendiente |
| [M3-S06](historias/M3.md#m3-s06) | HU06: Niveles de dificultades en evaluaciones e información adyacente. | RQ07, RQ08, RQ52 | Código localizado; aceptación integral pendiente |
| [M3-S07](historias/M3.md#m3-s07) | HU07: Registro de resultados de evaluaciones | RQ17, RQ21 | Parcial o con brechas; revisar RQ y criterios |
| [M3-S08](historias/M3.md#m3-s08) | HU08: Banco de preguntas estructurado por cursos y áreas | RQ22, RQ34, RQ35, RQ37, RQ91 | Parcial o con brechas; revisar RQ y criterios |
| [M3-S09](historias/M3.md#m3-s09) | HU09: Retroalimentación inmediata y solucionarios | RQ68, RQ84 | Código localizado; aceptación integral pendiente |
| [M3-S10](historias/M3.md#m3-s10) | HU10: Simulacros automáticos de exámenes de admisión. | RQ36, RQ39, RQ52, RQ75 | Parcial o con brechas; revisar RQ y criterios |
| [M3-S11](historias/M3.md#m3-s11) | HU11: Examen de entrada y ruta de estudio personalizada. | RQ61, RQ62, RQ63, RQ64 | Parcial o con brechas; revisar RQ y criterios |
| [M3-S12](historias/M3.md#m3-s12) | HU12: Tipos de preguntas en evaluaciones | RQ60 | Código localizado; aceptación integral pendiente |
| [M3-S13](historias/M3.md#m3-s13) | HU13: Simulacros colaborativos en tiempo real | RQ67 | Código localizado; aceptación integral pendiente |
| [M3-S14](historias/M3.md#m3-s14) | HU14: Creación de exámenes personalizados | RQ09 | Parcial o con brechas; revisar RQ y criterios |
| [M3-S15](historias/M3.md#m3-s15) | HU15: Creación de desafíos académicos | RQ69 | Código localizado; aceptación integral pendiente |
| [M3-S16](historias/M3.md#m3-s16) | HU16: Guardar preguntas difíciles para después. | RQ72 | Código localizado; aceptación integral pendiente |
| [M3-S17](historias/M3.md#m3-s17) | HU17: Retroalimentación y solucionarios detallados | RQ84 | Código localizado; aceptación integral pendiente |
| [M4-S01](historias/M4.md#m4-s01) | HU01: Visualización de Estadísticas, Estudiantes. | RQ18, RQ40, RQ53, RQ87 | Parcial o con brechas; revisar RQ y criterios |
| [M4-S02](historias/M4.md#m4-s02) | HU02: Visualizacion de estadisticas, Estudiante – Administrador. | RQ81, RQ87 | Parcial o con brechas; revisar RQ y criterios |
| [M4-S03](historias/M4.md#m4-s03) | HU03: Sugerencia de Temas Relacionados. | RQ19, RQ41 | Parcial o con brechas; revisar RQ y criterios |
| [M4-S04](historias/M4.md#m4-s04) | HU04: Perzonalizacion de Temas Relacionados. | RQ19, RQ41, RQ54 | Parcial o con brechas; revisar RQ y criterios |
| [M4-S05](historias/M4.md#m4-s05) | HU05: Tiempo promedio por seccion. | RQ76 | Parcial o con brechas; revisar RQ y criterios |
| [M4-S06](historias/M4.md#m4-s06) | HU06: Detección de logros significativos | RQ70, RQ78 | Parcial o con brechas; revisar RQ y criterios |
| [M4-S07](historias/M4.md#m4-s07) | HU07: Notificacion de obtencion de logros significativos. | RQ78 | Parcial o con brechas; revisar RQ y criterios |
| [M4-S08](historias/M4.md#m4-s08) | HU08: Notificacion de obtencion de logros significativos a Tutores. | RQ78, RQ87 | Parcial o con brechas; revisar RQ y criterios |
| [M4-S09](historias/M4.md#m4-s09) | HU09: Notificacion de bajo rendimiento a Tutores. | RQ87 | Parcial o con brechas; revisar RQ y criterios |
| [M5-S01](historias/M5.md#m5-s01) | HU01: Planificación y Hábitos de Estudio | RQ48, RQ54, RQ59 | Parcial o con brechas; revisar RQ y criterios |
| [M5-S02](historias/M5.md#m5-s02) | HU02: Contenido de Apoyo y Preparación Emocional | RQ51, RQ77, RQ79, RQ86 | Parcial o con brechas; revisar RQ y criterios |
| [M5-S03](historias/M5.md#m5-s03) | HU03: Dinamismo y Constancia en el Aprendizaje | RQ80, RQ93 | Parcial o con brechas; revisar RQ y criterios |
| [M6-S01](historias/M6.md#m6-s01) | EPIC01: Creación y gestión de grupos de estudio virtuales | RQ10, RQ11 | Código localizado; aceptación integral pendiente |
| [M6-S02](historias/M6.md#m6-s02) | EPIC01: Foros públicos y dinámicas de las comunidades | RQ42, RQ85 | Parcial o con brechas; revisar RQ y criterios |
| [M6-S03](historias/M6.md#m6-s03) | HU02: Interfaz de comunidad y canal de texto en grupos. | RQ03, RQ12, RQ71, RQ113 | Código localizado; aceptación integral pendiente |
| [M6-S04](historias/M6.md#m6-s04) | EPIC02: Espacio virtual, “Zona de descanso”. | RQ79, RQ114 | Parcial o con brechas; revisar RQ y criterios |
| [M6-S05](historias/M6.md#m6-s05) | HU05: Desafíos semanales y generados | RQ65, RQ69, RQ79, RQ114 | Parcial o con brechas; revisar RQ y criterios |
| [M6-S06](historias/M6.md#m6-s06) | EPIC03: Privilegios de Profesor | RQ11, RQ89 | Parcial o con brechas; revisar RQ y criterios |
| [M6-S07](historias/M6.md#m6-s07) | EPIC03: Privilegios del Profesor | RQ53, RQ81, RQ89 | Parcial o con brechas; revisar RQ y criterios |
| [M6-S08](historias/M6.md#m6-s08) | EPIC03: Privilegios del Profesor | RQ69, RQ89 | Parcial o con brechas; revisar RQ y criterios |
| [M7-S01](historias/M7.md#m7-s01) | HU01: Retroalimentación y Calidad de la Experiencia | RQ49, RQ56 | Parcial o con brechas; revisar RQ y criterios |
| [M7-S02](historias/M7.md#m7-s02) | HU02: Reconocimiento y Logros Académicos | RQ70, RQ78 | Parcial o con brechas; revisar RQ y criterios |
| [M7-S03](historias/M7.md#m7-s03) | HU03: Gamificación Global del Aprendizaje | RQ80, RQ93 | Parcial o con brechas; revisar RQ y criterios |
| [M8-S01](historias/M8.md#m8-s01) | HU01: Acceso móvil optimizado | RQ45 | Implementación/validación pendiente según RQ |
| [M8-S02](historias/M8.md#m8-s02) | HU02: Interfaz intuitiva para jóvenes | RQ57 | Implementación/validación pendiente según RQ |
| [M8-S03](historias/M8.md#m8-s03) | HU03: Modo nocturno | RQ66 | Parcial o con brechas; revisar RQ y criterios |
| [M8-S04](historias/M8.md#m8-s04) | HU04: Ajuste de fuente y tamaño de texto | RQ73 | Parcial o con brechas; revisar RQ y criterios |
| [M8-S05](historias/M8.md#m8-s05) | HU05: Compatibilidad multiplataforma | RQ25, RQ28 | Implementación/validación pendiente según RQ |
| [M8-S06](historias/M8.md#m8-s06) | HU06: Seguridad y confidencialidad de datos | RQ30, RQ88 | Parcial o con brechas; revisar RQ y criterios |
| [M8-S07](historias/M8.md#m8-s07) | HU07: Soporte técnico y asistencia | RQ90 | Código localizado; aceptación integral pendiente |
| [M8-S08](historias/M8.md#m8-s08) | HU08: Accesibilidad e inclusión | RQ29, RQ92 | Implementación/validación pendiente según RQ |
| [M8-S09](historias/M8.md#m8-s09) | HU09: Dashboard específico para profesores | RQ98 | Código localizado; aceptación integral pendiente |
| [M8-S10](historias/M8.md#m8-s10) | HU10: Interfaz diferenciada para estudiantes | RQ99 | Parcial o con brechas; revisar RQ y criterios |
| [M8-S11](historias/M8.md#m8-s11) | HU11: Políticas de privacidad y términos | RQ103 | Parcial o con brechas; revisar RQ y criterios |
| [M8-S12](historias/M8.md#m8-s12) | HU12: Validación de entrada en formularios | RQ105 | Parcial o con brechas; revisar RQ y criterios |
| [M8-S13](historias/M8.md#m8-s13) | HU13: Cifrado (SSL/TLS) | RQ106 | Implementación/validación pendiente según RQ |
| [M8-S14](historias/M8.md#m8-s14) | HU14: Compatibilidad con navegadores modernos | RQ28 | Implementación/validación pendiente según RQ |
| [M8-S15](historias/M8.md#m8-s15) | HU15: Seguridad de datos | RQ30, RQ88 | Parcial o con brechas; revisar RQ y criterios |
| [M8-S16](historias/M8.md#m8-s16) | HU16: Cumplimiento de normas de protección | RQ31 | Implementación/validación pendiente según RQ |
| [M8-S17](historias/M8.md#m8-s17) | HU17: Gestión eficiente de contenidos por docentes | RQ13, RQ14, RQ91 | Parcial o con brechas; revisar RQ y criterios |
| [M8-S18](historias/M8.md#m8-s18) | HU18: Escalabilidad para cientos de usuarios | RQ102 | Implementación/validación pendiente según RQ |
| [M8-S19](historias/M8.md#m8-s19) | HU19: Carga en menos de 10 segundos | RQ27 | Implementación/validación pendiente según RQ |
| [M8-S20](historias/M8.md#m8-s20) | HU20: Accesibilidad desde múltiples dispositivos | RQ25 | Implementación/validación pendiente según RQ |
| [M8-S21](historias/M8.md#m8-s21) | HU21: Facilidad de uso sin experiencia tecnológica | RQ26 | Implementación/validación pendiente según RQ |
| [M8-S22](historias/M8.md#m8-s22) | HU22: Opciones de accesibilidad | RQ29, RQ73, RQ92 | Implementación/validación pendiente según RQ |
| [M8-S23](historias/M8.md#m8-s23) | HU23: Acceso multiusuario simultáneo | RQ32 | Implementación/validación pendiente según RQ |
| [M8-S24](historias/M8.md#m8-s24) | HU24: Respaldo automático diario | RQ33 | Parcial o con brechas; revisar RQ y criterios |
