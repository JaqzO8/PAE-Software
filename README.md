# PAE Software

Plataforma de apoyo académico para estudiantes de quinto de secundaria y preuniversitarios, con herramientas para docentes. Integra repositorios educativos, lecciones, banco de preguntas, simulacros, comunidades, planificación y gamificación educativa.

Este repositorio reúne el código disponible y la documentación de su estado real. Existe una base funcional amplia para desarrollo y demostración local. **La aceptación integral de todos los requisitos y la preparación para producción siguen pendientes.**

## Documentación

| Documento | Contenido |
| --- | --- |
| [Resumen ejecutivo](docs/RESUMEN_EJECUTIVO.md) | Objetivo, alcance, interesados, ocho módulos, flujo completo, avances y pendientes |
| [Matriz de requisitos](docs/MATRIZ_REQUISITOS.md) | RQ01–RQ114, estado documental, evidencia del código y brechas |
| [Historias de usuario](docs/HISTORIAS_USUARIO.md) | 78 secciones de historias o épicas y sus tablas de aceptación, distribuidas por módulo |
| [Instalación local](docs/INSTALACION_LOCAL.md) | Preparación, arranque Docker, desarrollo, datos y solución de problemas |
| [Configuración](docs/CONFIGURACION.md) | Variables, puertos, secretos, SonarQube y entornos |
| [Arquitectura](docs/ARQUITECTURA.md) | Servicios, almacenamiento, API, flujo de datos e inventario |
| [Validación](docs/VALIDACION.md) | Comprobaciones realizadas, resultados y límites de la evidencia |
| [Contribución y ramas](CONTRIBUTING.md) | Trabajo personal, pull requests a develop y entregas a main |
| [Seguridad](SECURITY.md) | Exclusiones, revisión de secretos y pendientes antes de desplegar |

## Inicio local

Requiere Git, Node.js 24 con npm y Docker Desktop iniciado en modo contenedores Linux. Desde PowerShell, Bash o una terminal equivalente:

```sh
git clone https://github.com/JaqzO8/PAE-Software.git
cd PAE-Software
node scripts/setup-local.mjs
docker compose config --quiet
docker compose up --build -d
docker compose ps
```

Abre [PAE local](http://localhost:5173). El generador crea `.env` con secretos aleatorios y no sobrescribe una configuración existente. Docker instala las dependencias de cada aplicación. La guía completa explica el primer registro y la configuración opcional de calidad.

La configuración inicial es de **desarrollo local**; los puertos publicados se limitan a `127.0.0.1`. El panel de calidad requiere una instancia y un token propio de SonarQube para consultar métricas.

## Ramas del equipo

| Rama | Uso |
| --- | --- |
| `main` | Entregas revisadas; rama predeterminada |
| `develop` | Integración del equipo |
| `Jose_Queshyac` | Trabajo de José |
| `Amelia_Mauricio` | Trabajo de Amelia |
| `Richard_Estela` | Trabajo de Richard |
| `Juan_Rengifo` | Trabajo de Juan |

Las ramas personales nacen de la misma base que `develop`. Conserva exactamente el acento de `Jose_Queshyac` y los guiones bajos. La creación de una rama no concede acceso a GitHub: los colaboradores necesitan una invitación independiente del propietario.

## Publicación segura

El repositorio empieza con un historial nuevo para no trasladar secretos o residuos de commits anteriores. La carpeta original y su remoto se conservan. No se publica automáticamente una aplicación al hacer push: GitHub Pages se ejecuta de forma manual y solo aloja el frontend.

## Estado de la entrega

Los documentos nuevos usan como fuente principal un archivo de "Documentación de Requisitos" y contrastan sus objetivos con el código disponible. Las auditorías anteriores se conservan como antecedentes y no sustituyen esta evaluación. Los términos «aprobado» o «completo» que aparecen en esos antecedentes no certifican aceptación ni seguridad de producción.

El nombre del producto es **PAE (Plataforma de Apoyo Estudiantil)**; el identificador del repositorio es `PAE-Software`. No se añade una licencia global nueva sin una decisión del equipo; las licencias de dependencias y los metadatos existentes de paquetes deben revisarse antes de distribuir el producto a terceros.
