# Seguridad y manejo de configuración

El repositorio está preparado para compartir código y documentación sin incorporar credenciales reales ni datos operativos. La aplicación actual es una base de desarrollo y demostración local; deben resolverse sus brechas antes de exponerla con usuarios reales.

## Secretos y archivos privados

`.gitignore` excluye `.env` y variantes, salvo `.env.example`; claves, archivos habituales de credenciales, dependencias, uploads, backups y reportes temporales. Cada contexto Docker también excluye archivos de entorno y datos locales. No se deben pasar secretos como argumentos de construcción ni guardarlos bajo prefijos `VITE_`, que forman parte del frontend público.

`node scripts/setup-local.mjs` genera secretos nuevos por copia. El script de revisión inspecciona archivos preparados con `--staged`, o todos los versionados sin esa opción, y detecta rutas privadas y patrones comunes sin imprimir el valor encontrado. No reemplaza una inspección humana ni un escáner especializado.

Antes de subir:

```sh
git status --short
git check-ignore .env
node scripts/check-repository-safety.mjs --staged
git diff --cached --stat
```

Un `.gitignore` no elimina archivos ya versionados ni secretos del historial. Si se expone un secreto, revócalo/rotalo primero, identifica su alcance y realiza una limpieza coordinada. Véase la [guía oficial sobre datos sensibles](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository). El historial nuevo de PAE-Software no modifica ni limpia repositorios o clones anteriores.

## Bloqueantes conocidos antes de producción

| Riesgo observado | Acción necesaria |
| --- | --- |
| `quickLogin` acepta identidad por correo sin validar proveedor | Integrar OAuth verificable o retirar el acceso rápido; no tratarlo como autenticación Google real |
| Registro acepta `isTeacher` proporcionado por el cliente | Implementar aprobación o invitación docente verificada en backend |
| Endpoints 2FA separados del proceso de login | Exigir y validar segundo factor antes de emitir una sesión completa |
| Revocación central en auth y validadores JWT por servicio | Verificar revocación uniforme, cierre global y caducidad de sesiones en todos los dominios |
| Recuperación y alertas sin proveedor de correo | Completar entrega verificada, expiración, límites y respuesta que no revele cuentas |
| Configuración de desarrollo y HTTP local | Usar TLS, secretos gestionados, orígenes concretos y red privada para bases/Redis |
| Sin aceptación integral de permisos y cargas | Validar pertenencia, propiedad, revisión docente, archivos y escenarios de abuso |
| Dependencias heredadas y avisos de paquetes obsoletos | Analizar auditorías, actualizar cambios compatibles y probar migraciones necesarias |
| Respaldo manual y esquema sincronizado al inicio | Añadir programación, cifrado, restauración probada y migraciones versionadas |

El repositorio no declara certificación de seguridad ni cumplimiento normativo. Las páginas de políticas necesitan validación del responsable institucional y evidencia del tratamiento real de los datos.

## Reportar un problema

Si encuentras un secreto o vulnerabilidad, comunícate de forma privada con el propietario del repositorio mediante un canal acordado. No pegues contraseñas, tokens, datos de estudiantes ni pruebas con información real en issues o pull requests. Usa ejemplos ficticios y describe el impacto y la ruta afectada.
