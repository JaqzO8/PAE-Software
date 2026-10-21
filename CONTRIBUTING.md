# Contribuir a PAE Software

El equipo integra cambios mediante pull requests a `develop` y prepara entregas revisadas en `main`. Cada cambio debe relacionarse con un RQ o una historia, explicar el comportamiento que aporta y adjuntar validación relevante.

## Ramas

| Rama | Propósito |
| --- | --- |
| main | Base de entregas revisadas, predeterminada |
| develop | Integración conjunta y pruebas |
| José_Queshyac | Desarrollo personal de José |
| Amelia_Mauricio | Desarrollo personal de Amelia |
| Richard_Estela | Desarrollo personal de Richard |
| Juan_Rengifo | Desarrollo personal de Juan |

Los nombres son exactos; el acento de José forma parte del nombre de la rama. Cada integrante necesita acceso al repositorio y su propia identidad de Git. No compartan cuentas ni tokens.

## Flujo de trabajo

Ejemplo para José; los demás sustituyen su rama:

```sh
git clone https://github.com/JaqzO8/PAE-Software.git
cd PAE-Software
git fetch origin
git switch --track origin/José_Queshyac
git merge origin/develop
```

Si la rama ya existe localmente, utiliza `git switch José_Queshyac`. Resuelve conflictos comprobando el comportamiento de ambos cambios; no sobrescribas archivos completos para evitarlos.

```sh
git status --short
git add <archivos-del-cambio>
node scripts/check-repository-safety.mjs --staged
git diff --cached
git commit -m "feat(contenido): permite compartir repositorios RQ15"
git push -u origin José_Queshyac
```

Crea un pull request con base `develop`, describe problema y resultado, RQ/HU por módulo, pruebas y limitaciones. Tras revisión y controles correctos, integra el cambio. Actualiza la rama personal con `origin/develop` antes del siguiente trabajo. Para una entrega, abre un pull request de `develop` a `main` y valida el recorrido integrado.

No uses push forzado ni borres ramas o datos compartidos para resolver conflictos. Evita commits directos a main/develop como práctica del equipo. Las protecciones de rama deben configurarse en GitHub si el plan y permisos lo permiten; este documento por sí solo no impone controles del servidor.

## Criterio de terminado

- El significado del requisito y los criterios de aceptación están conciliados con la matriz.
- El cambio funciona en los caminos correctos y de error; aplica permisos en backend y valida entradas.
- Las pruebas necesarias pasan y cubren un riesgo real del cambio; no basta una prueba que repita una implementación simulada.
- Se actualizan guías y `.env.example` si cambian contratos o configuración, sin valores privados.
- No quedan datos personales, credenciales ni artefactos de ejecución preparados para commit.
- Otra persona revisa el pull request; la historia no se marca aceptada solo por crear una pantalla.

## Diseño y mantenibilidad

Mantén controladores orientados a HTTP, reglas en servicios, persistencia en modelos y configuración centralizada. Reutiliza componentes por dominio y contratos tipados en el frontend. Aplica responsabilidad única, evita duplicación y favorece soluciones sencillas. Extrae dependencias para poder probar reglas sin levantar toda la infraestructura cuando sea apropiado. SOLID es una guía de diseño, no una etiqueta de cumplimiento automático.

Instala dependencias con `npm ci`. Si cambias un `package.json`, actualiza su `package-lock.json` mediante `npm install` en esa misma carpeta y revisa el diff. No ejecutes actualizaciones masivas con `--force` sin analizar compatibilidad y regresiones.

## Controles automáticos

El workflow `ci.yml` compila el frontend, ejecuta las suites locales disponibles y revisa archivos sensibles. Las pruebas dinámicas, de carga y de aceptación requieren un entorno adicional y se documentan por separado. Una ejecución verde de CI no afirma que se hayan cerrado todos los RQ.
