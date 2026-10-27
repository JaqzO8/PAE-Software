# Reporte de calidad y evidencia

Revisión: 26 de octubre de 2026. Las ejecuciones conservan fecha UTC en test-results. Los casos adversos aprueban cuando el rechazo, aislamiento o recuperación coincide con la especificación.

## Ejecuciones verificadas

| Comprobación | Resultado local |
|---|---|
| Matriz QA | 64/64: 32 óptimos y 32 pésimos |
| Regresiones de seguridad con Redis/PostgreSQL reales | 3/3: consumo MFA concurrente, presupuesto de intentos y rotación de sesión |
| Auth | 24 pruebas aprobadas |
| Plataforma M8 | 22 pruebas aprobadas |
| Evaluación | 14 pruebas aprobadas |
| Contenido (regresiones existentes) | 25 pruebas aprobadas |
| Quality | 6 pruebas aprobadas |
| Arquitectura | 6 pruebas aprobadas; check de fronteras nuevas aprobado |
| Learning unitario | 2 pruebas aprobadas |
| Integración PostgreSQL | 22 pruebas aprobadas |
| Compilación frontend | Aprobada |
| Lint frontend global | No aprobado; deuda heredada aún presente |

Las suites auxiliares no se suman para cambiar el compromiso de 64 casos. Las evidencias locales están en test-results/*.log, test-results/qa/results.json y capturas PNG; CI adjunta qa-evidence para consulta remota. No se versionan secretos, bases de datos ni archivos subidos.

La primera ejecución QA obtuvo 61/64: PR-O04 usaba una sintaxis no soportada de docker compose stats; PI-P03 apuntaba a una ruta inexistente; PS-P02 descubrió el error real de redirección tras contraseña incorrecta. Corregidos el arnés y el producto, la repetición obtuvo 64/64. Se conserva first-run-results.json para distinguir corrección de producto y de prueba.

Ejemplos de resultados locales: p95 86 ms para 40 lecturas de preferencias con diez sesiones; 116 ms para 60 lecturas de mensajes; 211 ms para 120 consultas con concurrencia 30; 176 ms con Auth limitado a 0,5 CPU. Son mediciones de este equipo y carga acotada, no un SLA productivo.

## Cobertura y SonarQube

La ejecución HTTP/BD de QA midió 54,45% de líneas del backend en su reporte individual. La medición unitaria se conserva por separado; no se suman porcentajes. La cobertura del frontend y el porcentaje de código nuevo deben medirse explícitamente; **no se declara alcanzado el objetivo de 80%**.

El análisis remoto inicial de main (33647f6e) fallaba por seguridad C, con 27 incidencias nuevas y sin cobertura importada. Se repararon instalación con scripts, entradas de log, extracción de dispositivo, resolución de Docker y complejidad localizada. Las migraciones checksummed ya aplicadas no se reescribieron por estilo. Se eliminaron exclusiones funcionales de sonar-project.properties.

El usuario configuró en GitHub el secreto PAESOFTK. El workflow admite SONAR_TOKEN o ese nombre y utiliza únicamente el secreto en el runner. La transición al análisis CI mantiene las reglas del gate y añade LCOV; el resultado remoto debe registrarse después de ejecutar el PR.

Referencia de configuración: [documentación oficial de SonarQube para GitHub Actions](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/ci-based-analysis/github-actions-for-sonarcloud/).

## Dependencias

Después de npm audit fix sin force: ningún aviso crítico ni alto en los ocho manifiestos auditados. Persisten avisos moderados: uuid transitivo de Sequelize (y dependencia directa Auth), qs en Content y postcss-selector-parser en la cadena de Tailwind. No se fuerza un downgrade de Sequelize ni una migración mayor de Tailwind para ocultarlos. Corregir con versiones compatibles y volver a validar; auditorías JSON conservadas localmente.
