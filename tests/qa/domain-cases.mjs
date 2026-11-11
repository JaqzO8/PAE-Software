import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { pair, scenario as s, require } from './harness.mjs';
const session = require('../../backend/services/auth-service/src/domain/politicaSesion');
const roles = require('../../backend/services/auth-service/src/domain/politicaRoles');
const { autenticar } = require('../../backend/services/auth-service/src/application/useCases/autenticar');
const { evaluateRule } = require('../../backend/services/learning-service/src/modules/gamification/domain/confirmedResult');
const { createAwardConfirmedResult } = require('../../backend/services/learning-service/src/modules/gamification/application/awardConfirmedResult');
const event = () => ({ eventId: randomUUID(), correlationId: randomUUID(), type: 'ResultadoConfirmado.v1', schemaVersion: 1,
    producer: 'evaluation', occurredAt: new Date().toISOString(), data: { attemptId: '1', userId: '2', resultVersion: 1, status: 'confirmed' } });
const rule = { id: 'qa.completed', version: 1, points: 15, enabled: true };

function authenticationFixture(mode) {
    const calls = [], challenges = [];
    const user = { id_usuario: 7, activo: mode !== 'disabled', mfa_enabled: mode === 'user-mfa',
        validarPassword: async () => { calls.push('password'); return mode !== 'wrong'; } };
    const input = { email: ' QA@EXAMPLE.TEST ', password: 'Test1234', deviceInfo: {}, mfaEnforced: ['policy-mfa', 'store-failure'].includes(mode),
        userRepository: { findByEmail: async email => { assert.equal(email, 'qa@example.test'); calls.push('lookup');
            if (mode === 'lookup-failure') throw new Error('Storage unavailable'); return mode === 'unknown' ? null : user; } },
        rateLimiter: { getAttempts: async () => { calls.push('limit'); return mode === 'locked' ? 5 : 0; },
            clearAttempts: async () => { calls.push('clear'); }, recordFailedAttempt: async () => { calls.push('failed'); } },
        sessionRepository: { logHistory: async () => { calls.push('history'); }, storeMfaChallenge: async challenge => {
            calls.push('challenge'); if (mode === 'store-failure') throw new Error('Storage unavailable'); challenges.push(challenge);
        } }, cryptoProvider: { randomUUID: () => 'qa-challenge', generateNumericOtp: () => '123456', isTestEnv: false } };
    return { input, calls, challenges, user };
}

export function unitChecks(deps = {}) {
    const policy = deps.session ?? session, rolePolicy = deps.roles ?? roles, evaluate = deps.evaluateRule ?? evaluateRule;
    return {
        'PU-O01': async () => {
            for (const password of ['Abcdefg1', '1abcdefg', `A${'x'.repeat(62)}9`]) assert.equal(policy.validarPoliticaPassword(password).valida, true);
            for (const attempts of [0, 1, 2]) {
                assert.deepEqual(policy.validarCodigoMfa(' 012345 ', '012345', attempts), { valido: true, bloqueado: false });
            }
            assert.equal(policy.tokenPermiteAccesoRegular('mfa_challenge'), false);
            assert.equal(policy.tokenPermiteAccesoRegular('access'), true);
        },
        'PU-P01': async () => {
            for (const password of [null, {}, 12345678, '', 'Abcdef1', '12345678', 'abcdefgh']) assert.equal(policy.validarPoliticaPassword(password).valida, false);
            for (const attempts of [0, 1, 2]) {
                const result = policy.validarCodigoMfa('000000', '012345', attempts);
                assert.equal(result.valido, false); assert.equal(result.intentosRestantes, 2 - attempts);
                assert.equal(result.bloqueado, attempts === 2);
            }
            for (const attempts of [3, 4, 100]) {
                const result = policy.validarCodigoMfa('012345', '012345', attempts);
                assert.equal(result.valido, false); assert.equal(result.bloqueado, true);
            }
            for (const code of ['', '12345', '1234567', 'abcdef', null]) assert.equal(policy.validarCodigoMfa(code, '012345', 0).valido, false);
        },
        'PU-O02': async () => {
            for (const mode of ['normal', 'policy-mfa', 'user-mfa']) {
                const f = authenticationFixture(mode), result = await autenticar(f.input);
                assert.deepEqual(f.calls, mode === 'normal' ? ['limit', 'lookup', 'password', 'clear'] : ['limit', 'lookup', 'password', 'clear', 'challenge']);
                if (mode === 'normal') { assert.equal(result.estado, 'sesion_completa'); assert.equal(result.user, f.user); }
                else {
                    assert.equal(result.estado, 'desafio_mfa_pendiente'); assert.equal(result.user, undefined); assert.equal(result.testOtp, undefined);
                    assert.deepEqual(f.challenges, [{ challengeId: 'qa-challenge', userId: 7, otpCode: '123456', attempts: 0, expiresInSeconds: 300 }]);
                }
            }
        },
        'PU-P02': async () => {
            for (const [mode, status] of [['locked', 429], ['unknown', 401], ['wrong', 401], ['disabled', 403], ['lookup-failure', undefined], ['store-failure', undefined]]) {
                const f = authenticationFixture(mode);
                await assert.rejects(autenticar(f.input), error => {
                    assert.equal(error.statusCode, status);
                    if (['unknown', 'wrong'].includes(mode)) assert.equal(error.message, 'Credenciales incorrectas');
                    if (mode.endsWith('failure')) assert.equal(error.message, 'Storage unavailable');
                    return true;
                });
                assert.equal(f.challenges.length, 0);
                if (!['wrong', 'store-failure'].includes(mode)) assert.ok(!f.calls.includes('password'));
                if (['unknown', 'wrong'].includes(mode)) assert.ok(f.calls.includes('failed') && !f.calls.includes('clear'));
            }
        },
        'PU-O03': async () => {
            for (const points of [0, 15, 10000]) {
                const source = event(), snapshot = structuredClone(source), config = { ...rule, points }, grants = [];
                const consume = createAwardConfirmedResult({ rule: config, awards: { grantOnce: async value => { grants.push(value); return 'persisted'; } } });
                config.points = 99999; config.version = 99;
                assert.equal(await consume(source), 'persisted');
                assert.equal(grants.length, 1);
                assert.deepEqual(grants[0].award, { userId: '2', sourceId: '1', sourceType: 'confirmed-result', ruleId: rule.id, ruleVersion: 1, points });
                assert.deepEqual(source, snapshot);
                assert.deepEqual(evaluate(source, { ...rule, points }), grants[0].award);
            }
        },
        'PU-P03': async () => {
            const mutations = [e => e.data.points = 99999, e => e.data.status = 'pending', e => e.producer = 'client',
                e => e.data.resultVersion = 2, e => e.schemaVersion = 2, e => e.data.userId = 2, e => e.data.attemptId = '0',
                e => e.eventId = 'invalid', e => e.correlationId = 'invalid', e => e.occurredAt = 'not-a-date', e => e.role = 'admin'];
            for (const mutate of mutations) { const source = event(); mutate(source); assert.throws(() => evaluate(source, rule)); }
            for (const invalid of [{ points: -1 }, { points: 10001 }, { points: 1.5 }, { enabled: false }, { version: 0 }, { id: '' }]) {
                assert.throws(() => evaluate(event(), { ...rule, ...invalid }));
            }
            let persisted = false;
            const consume = createAwardConfirmedResult({ rule, awards: { grantOnce: async () => { persisted = true; } } });
            const source = event(); source.data.status = 'pending';
            await assert.rejects(consume(source)); assert.equal(persisted, false);
        },
        'PU-O04': async () => {
            for (const target of ['estudiante', 'docente', 'admin']) assert.equal(rolePolicy.puedeAsignarRol('admin', target), true);
            assert.equal(rolePolicy.determinarRolInicial(), 'estudiante');
            assert.equal(rolePolicy.validarSolicitudDocente({ institucion: '  UNI  ' }).valida, true);
            assert.equal(rolePolicy.esRolPrivilegiado('estudiante'), false);
        },
        'PU-P04': async () => {
            for (const actor of ['estudiante', 'docente', 'ADMIN', '', null, undefined]) {
                for (const target of ['estudiante', 'docente', 'admin']) assert.equal(rolePolicy.puedeAsignarRol(actor, target), false);
            }
            for (const target of ['owner', 'ADMIN', '', null, undefined]) assert.equal(rolePolicy.puedeAsignarRol('admin', target), false);
            for (const payload of [null, {}, { institucion: '  ' }, { institucion: 'ab' }]) assert.equal(rolePolicy.validarSolicitudDocente(payload).valida, false);
        },
    };
}

export function registerDomainCases() {
    const checks = unitChecks();
    const specs = [
        ['Límites y alcance de MFA', 'Contraseñas límite, OTP con cero inicial e intentos 0–2', 'Código válido aceptado; desafío nunca autoriza acceso regular', 'Bloqueo irrevocable del desafío', 'Contraseñas malformadas, secuencia de tres errores y código correcto tras agotamiento', 'Intentos restantes 2/1/0; ningún código elude el bloqueo'],
        ['Autenticación y emisión condicionada de MFA', 'Tres configuraciones: sesión normal, MFA por política o por cuenta; adaptadores aislados', 'Orden de validación correcto; desafío persistido antes de responder y OTP ausente en producción', 'Autenticación ante denegación y fallo de dependencias', 'Cuenta bloqueada/desactivada, usuario inexistente, clave incorrecta y fallos de lectura/escritura', 'Error correcto, respuesta neutra y ninguna sesión completa emitida'],
        ['Premio con configuración inmutable', 'Reglas de 0/15/10000 puntos; configuración externa alterada después de crear consumidor', 'Beneficiario, origen y versión exactos; la configuración aprobada no cambia ni muta el evento', 'Contrato antifraude de resultados y reglas', 'Once alteraciones del evento, seis reglas inválidas y resultado pendiente', 'Todos rechazados; ningún premio persistido para evidencia inválida'],
        ['Política administrativa y solicitud docente válida', 'Tres destinos de rol y solicitud institucional normalizada', 'Solo admin asigna roles; registro siempre estudiante y solicitud válida admisible', 'Matriz completa de escalada y roles desconocidos', 'Seis actores no administrativos, tres destinos y entradas inválidas', 'Toda asignación no autorizada y solicitud incompleta se rechaza'],
    ];
    specs.forEach((v, i) => pair('PU', i + 1, s(v[0], v[1], v[2], checks[`PU-O0${i + 1}`]), s(v[3], v[4], v[5], checks[`PU-P0${i + 1}`])));
}
