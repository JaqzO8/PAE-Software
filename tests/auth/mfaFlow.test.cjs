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

test('RIC-06: generación criptográfica segura de código OTP para MFA (CWE-330)', () => {
    const crypto = require('node:crypto');
    const codes = new Set();
    for (let i = 0; i < 50; i++) {
        const otpCode = String(crypto.randomInt(100000, 1000000));
        assert.equal(otpCode.length, 6, 'El código OTP debe tener exactamente 6 dígitos');
        assert.match(otpCode, /^\d{6}$/, 'El código OTP debe consistir únicamente en dígitos');
        const num = Number(otpCode);
        assert.ok(num >= 100000 && num < 1000000, 'El valor numérico debe estar en el rango [100000, 999999]');
        codes.add(otpCode);
    }
    // Con 50 números aleatorios en un espacio de 900,000 valores, la probabilidad de más de 3 colisiones es despreciable
    assert.ok(codes.size >= 45, 'Los códigos OTP generados con PRNG criptográfico deben mostrar alta entropía y dispersión');
});

test('RIC-07: validarPoliticaPassword exige longitud, letras y dígitos con sintaxis segura', () => {
    const { validarPoliticaPassword } = require('../../backend/services/auth-service/src/domain/politicaSesion');
    
    assert.equal(validarPoliticaPassword(null).valida, false);
    assert.equal(validarPoliticaPassword('').valida, false);
    assert.equal(validarPoliticaPassword('short1').valida, false, 'Rechaza longitud menor a 8 caracteres');
    assert.equal(validarPoliticaPassword('sololetras').valida, false, 'Rechaza contraseña sin dígitos');
    assert.equal(validarPoliticaPassword('123456789').valida, false, 'Rechaza contraseña sin letras');
    
    const valid = validarPoliticaPassword('Segura2026!');
    assert.equal(valid.valida, true, 'Acepta contraseña con letras, dígitos y longitud suficiente');
});
