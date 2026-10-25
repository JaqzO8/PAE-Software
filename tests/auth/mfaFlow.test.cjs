// tests/auth/mfaFlow.test.cjs
// Pruebas automatizadas de desafío MFA de alcance restringido y consumo atómico (RIC-06, RIC-AC-02)

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validarCodigoMfa, MFA_CONFIG } = require('../../backend/services/auth-service/src/domain/politicaSesion');
const { completarMfa } = require('../../backend/services/auth-service/src/application/useCases/completarMfa');
const TokenService = require('../../backend/services/auth-service/src/services/tokenService');

test('RIC-06 / RIC-AC-02: generación y verificación de token de desafío MFA', async () => {
    // 1. Token de desafío con scope mfa_challenge
    const challengeToken = TokenService.generateChallengeToken({ id: 101, challengeId: 'ch-test-123' });
    assert.ok(challengeToken, 'El token de desafío debe generarse');

    // 2. Comprobar que verifyToken estándar rechaza el token de desafío para rutas normales
    const regularCheck = await TokenService.verifyToken(challengeToken);
    assert.equal(regularCheck.valid, false, 'verifyToken normal debe rechazar un token de desafío');
    assert.match(regularCheck.error, /Token de alcance restringido/);

    // 3. Comprobar que verifyToken con allowChallenge: true lo acepta para completar MFA
    const challengeCheck = await TokenService.verifyToken(challengeToken, { allowChallenge: true });
    assert.equal(challengeCheck.valid, true, 'verifyToken con allowChallenge debe ser válido');
    assert.equal(challengeCheck.decoded.scope, 'mfa_challenge');
    assert.equal(challengeCheck.decoded.id, 101);
});

test('RIC-06: validarCodigoMfa valida formato, correspondencia e intentos', () => {
    // Código de formato inválido
    const f1 = validarCodigoMfa('123', '654321', 0);
    assert.equal(f1.valido, false);
    assert.match(f1.motivo, /6 dígitos/);

    // Código incorrecto
    const f2 = validarCodigoMfa('111111', '654321', 1);
    assert.equal(f2.valido, false);
    assert.equal(f2.intentosRestantes, 1);
    assert.equal(f2.bloqueado, false);

    // Tercer intento fallido -> bloqueado
    const f3 = validarCodigoMfa('111111', '654321', 2);
    assert.equal(f3.valido, false);
    assert.equal(f3.bloqueado, true);

    // Código correcto
    const ok = validarCodigoMfa('654321', '654321', 0);
    assert.equal(ok.valido, true);
    assert.equal(ok.bloqueado, false);
});

test('RIC-AC-02: completarMfa consume el desafío atómicamente y rechaza repetición', async () => {
    let challengeInStorage = {
        userId: 101,
        otpCode: '482910',
        attempts: 0,
    };

    const fakeSessionRepo = {
        getMfaChallenge: async (token) => challengeInStorage ? { ...challengeInStorage } : null,
        incrementMfaAttempts: async () => { challengeInStorage.attempts++; },
        deleteMfaChallenge: async () => {
            if (challengeInStorage) {
                challengeInStorage = null;
                return true; // consumido exitosamente
            }
            return false; // ya consumido
        },
    };

    const fakeUserRepo = {
        findById: async (id) => ({ id_usuario: id, email: 'user@pae.edu', activo: true }),
    };

    // 1. Intento con código erróneo
    await assert.rejects(async () => {
        await completarMfa({
            challengeToken: 'valid-token',
            code: '000000',
            sessionRepository: fakeSessionRepo,
            userRepository: fakeUserRepo,
        });
    }, { statusCode: 400 });

    assert.equal(challengeInStorage.attempts, 1, 'Se incrementa el contador de intentos fallidos');

    // 2. Consumo exitoso con código correcto
    const result = await completarMfa({
        challengeToken: 'valid-token',
        code: '482910',
        sessionRepository: fakeSessionRepo,
        userRepository: fakeUserRepo,
    });
    assert.equal(result.success, true);
    assert.equal(result.user.id_usuario, 101);

    // 3. Intento de reusar el mismo token de desafío en carrera -> rechazado inmediatamente
    await assert.rejects(async () => {
        await completarMfa({
            challengeToken: 'valid-token',
            code: '482910',
            sessionRepository: fakeSessionRepo,
            userRepository: fakeUserRepo,
        });
    }, { statusCode: 400 });
});
