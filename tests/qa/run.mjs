import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import './cases.mjs';
import { cases, compose, request, saveResults } from './harness.mjs';
const categories = { PU: 'Unitarias', PC: 'Carga', PR: 'Rendimiento', PN: 'Concurrencia', PE: 'Estrés', PS: 'Sistema', PI: 'Integración', PG: 'Regresión', PA: 'Aceptación' };
assert.equal(cases.length,64);
for(const mode of ['O','P']) assert.equal(cases.filter(item=>item.mode===mode).length,32);
assert.equal(new Set(cases.map(item=>item.id)).size,64);
const selected = process.env.QA_CASES ? new Set(process.env.QA_CASES.split(',')) : null;
const docs = new URL('../../docs/estabilizacion/', import.meta.url);
await mkdir(docs,{recursive:true});
const matrix = cases.map(item => `## ${item.id} — ${item.title}\n\n- Categoría: ${categories[item.category]}; escenario: ${item.mode==='O'?'óptimo':'pésimo'}.\n- Objetivo/funcionalidad: ${item.title}.\n- Precondiciones: entorno aislado pae_qa iniciado con código de la rama; PostgreSQL y Redis disponibles, excepto durante el fallo inducido descrito. Datos sintéticos nuevos por caso, sin uso de cuentas reales.\n- Entrada: ${item.input}.\n- Procedimiento: ejecutar \`QA_CASES=${item.id} node tests/qa/run.mjs\` (PowerShell: \`$env:QA_CASES='${item.id}'; node tests/qa/run.mjs\`). La implementación exacta está en \`tests/qa/cases.mjs\`.\n- Resultado esperado/criterio de aprobación: ${item.expected}. Se comprueba mediante assertions; cualquier discrepancia falla el caso.\n- Resultado real, estado, evidencia y defecto: véase fila ${item.id} en RESULTADOS_PRUEBAS.md y test-results/qa/results.json.\n`).join('\n');
await writeFile(new URL('MATRIZ_PRUEBAS.md',docs),`# Matriz ejecutable: 32 óptimos + 32 pésimos\n\nLos 64 casos cubren nueve categorías. Cargas locales acotadas; los umbrales son presupuestos de ingeniería para esta ejecución, no una certificación de producción. Un caso adverso aprueba cuando se observa el rechazo o recuperación especificado. Las pruebas de interfaz usan navegador real; PI-P01 y PR-P03 inducen fallo de transporte en el navegador y no prueban una caída real del servicio. PE-P03 sí detiene Redis aislado.\n\nLos fixtures quedan únicamente en el volumen qa-db y se crean con identificadores únicos; nunca se borran datos de pruebas_pae. Los límites de CPU se restauran en finally.\n\n${matrix}`);
if(process.argv.includes('--spec-only')) process.exit(0);
// Assert isolation from Compose's own resolved project, not from a caller-supplied URL.
assert.equal(JSON.parse(compose('config','--format','json')).name,'pae_qa');
await request('/auth/health'); await request('/community/health');
const revision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const results=[];
for(const item of cases) {
    if(selected&&!selected.has(item.id)){results.push({id:item.id,title:item.title,status:'no ejecutado'});continue;}
    const start=performance.now();
    try {
        const evidence=await item.execute();
        results.push({id:item.id,title:item.title,status:'aprobado',durationMs:performance.now()-start,evidence:evidence??{assertions:'completadas'},revision});
        console.log(`PASS ${item.id} ${item.title}`);
    } catch(error) {
        results.push({id:item.id,title:item.title,status:'fallido',durationMs:performance.now()-start,actual:error.message,defect:`DEF-${item.id}`,revision});
        console.error(`FAIL ${item.id}: ${error.message}`);
    }
    await saveResults(results);
}
await saveResults(results);
await writeFile(new URL('RESULTADOS_PRUEBAS.md',docs),`# Resultados de la ejecución QA\n\nFecha UTC: ${new Date().toISOString()}. Revisión Git: ${revision}. Ejecución: ${process.env.GITHUB_ACTIONS === "true" ? "GitHub Actions" : "local; puede incluir cambios sin commit"}. Ambiente: pae_qa, puertos 13000 y 15173. Evidencia detallada: test-results/qa/results.json, capturas por ID y logs de ejecución.\n\n| ID | Caso | Estado real | Duración ms | Resultado / defecto |\n|---|---|---|---:|---|\n${results.map(r=>`| ${r.id} | ${r.title} | ${r.status} | ${Math.round(r.durationMs||0)} | ${r.status==='aprobado'?'Assertions satisfechas; ver evidencia JSON':(r.actual||'Fuera del filtro de esta ejecución').replaceAll('|','/').replaceAll('\n',' ')} ${r.defect||''} |`).join('\n')}\n\nAprobados: ${results.filter(r=>r.status==='aprobado').length}/64. Fallidos: ${results.filter(r=>r.status==='fallido').length}. La aceptación de producto requiere revisión del equipo.\n`);
process.exitCode=results.some(item=>item.status==='fallido')?1:0;

