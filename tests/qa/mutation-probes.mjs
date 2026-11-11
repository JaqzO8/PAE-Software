import assert, { AssertionError } from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { unitChecks } from './domain-cases.mjs';

// Deliberate faults in isolated copies of pure domain code; never edit running services.
const probes = [
    { id: 'MFA-LOCK', file: 'backend/services/auth-service/src/domain/politicaSesion.js', dependency: 'session', check: 'PU-P01',
        before: 'if (intentosRealizados >= MFA_CONFIG.MAX_INTENTOS)', after: 'if (false)', defect: 'Código correcto aceptado después de agotar los intentos' },
    { id: 'PASSWORD-LENGTH', file: 'backend/services/auth-service/src/domain/politicaSesion.js', dependency: 'session', check: 'PU-P01',
        before: 'password.length < RECUPERACION_CONFIG.LONGITUD_MINIMA_PASSWORD', after: 'password.length < 0', defect: 'Contraseña inferior al mínimo aceptada' },
    { id: 'AWARD-PAYLOAD', file: 'backend/services/learning-service/src/modules/gamification/domain/confirmedResult.js', dependency: 'evaluateRule', check: 'PU-P03',
        before: "if (Object.keys(data).some(key => !allowed.has(key))) throw new Error('Unexpected result data');", after: '', defect: 'Puntos enviados por cliente admitidos en la evidencia' },
    { id: 'ROLE-ESCALATION', file: 'backend/services/auth-service/src/domain/politicaRoles.js', dependency: 'roles', check: 'PU-P04',
        before: "return actorRol === 'admin';", after: 'return true;', defect: 'Usuario no administrativo autorizado a asignar roles' },
];
const results = [];
for (const probe of probes) {
    await unitChecks()[probe.check]();
    const original = await readFile(new URL(`../../${probe.file}`, import.meta.url), 'utf8');
    assert.ok(original.includes(probe.before), `La mutación ${probe.id} ya no coincide con el código`);
    const isolatedModule = { exports: {} };
    runInNewContext(original.replace(probe.before, probe.after), { module: isolatedModule }, { timeout: 1000, filename: probe.file });
    const dependency = probe.dependency === 'evaluateRule' ? isolatedModule.exports.evaluateRule : isolatedModule.exports;
    let detected = false;
    try { await unitChecks({ [probe.dependency]: dependency })[probe.check](); }
    catch (error) { if (!(error instanceof AssertionError)) throw error; detected = true; }
    assert.ok(detected, `La prueba ${probe.check} no detectó ${probe.id}`);
    results.push({ id: probe.id, test: probe.check, defect: probe.defect, detected });
    console.log(`PASS MUTATION ${probe.id}: ${probe.check} detects the deliberate fault`);
}
const output = new URL('../../test-results/qa/', import.meta.url);
await mkdir(output, { recursive: true });
await writeFile(new URL('mutation-results.json', output), JSON.stringify({ executedAt: new Date().toISOString(), scope: 'Four targeted faults, not a full mutation score', results }, null, 2));
