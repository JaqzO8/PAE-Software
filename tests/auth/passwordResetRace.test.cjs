// tests/auth/passwordResetRace.test.cjs
// Pruebas de recuperación de contraseña y carreras concurrentes (RIC-07, RIC-AC-03)

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
    solicitarRecuperacion,
    restablecerClave,
} = require('../../backend/services/auth-service/src/application/useCases/recuperarClave');
const { atomicConsumeResetToken } = require('../../backend/services/auth-service/src/config/redis');

test('RIC-07: solicitarRecuperacion devuelve respuesta neutra siempre para evitar enumeración', async () => {
    let tokenCreated = null;
    const fakeTokenStorage = {
        setResetToken: async (token) => { tokenCreated = token; },
    };
    const fakeCrypto = {
        randomHex: () => 'token-hex-12345',
        isTestEnv: true,
    };
    const fakeUserRepo = {
        findByEmail: async (email) => email === 'existe@pae.edu' ? { id_usuario: 50, activo: true } : null,
    };

    // Caso 1: Usuario que existe
    const resExistente = await solicitarRecuperacion({
        email: 'existe@pae.edu',
        userRepository: fakeUserRepo,
        tokenStorage: fakeTokenStorage,
        cryptoProvider: fakeCrypto,
    });
    assert.equal(resExistente.success, true);
    assert.equal(resExistente.message, 'Si el correo existe, se enviaron instrucciones para recuperar la cuenta');
    assert.equal(resExistente.resetToken, 'token-hex-12345');

    // Caso 2: Usuario que NO existe
    const resNoExiste = await solicitarRecuperacion({
        email: 'noexiste@pae.edu',
        userRepository: fakeUserRepo,
        tokenStorage: fakeTokenStorage,
        cryptoProvider: fakeCrypto,
    });
    assert.equal(resNoExiste.success, true);
    assert.equal(resNoExiste.message, 'Si el correo existe, se enviaron instrucciones para recuperar la cuenta');
    assert.equal(resNoExiste.resetToken, undefined);
});

test('RIC-AC-03: dos solicitudes concurrentes consumen el mismo token -> una sola modifica la clave', async () => {
    let tokenActive = true;
    let passwordUpdatesCount = 0;
    let sessionsRevoked = false;

    // Simulación de almacenamiento atómico (como atomicConsumeResetToken de Redis)
    const atomicStorage = {
        consumeResetToken: async (token) => {
            // Operación atómica: si existe, se consume y se retorna. Si ya no existe, retorna null.
            if (token === 'one-time-token-xyz' && tokenActive) {
                tokenActive = false;
                return 50; // userId
            }
            return null;
        },
    };

    const fakeUserRepo = {
        findById: async (id) => ({ id_usuario: id, email: 'user@pae.edu' }),
        updatePassword: async (id, newPassword) => {
            passwordUpdatesCount++;
        },
    };

    const fakeSessionRepo = {
        deactivateAllUserSessions: async (id) => {
            sessionsRevoked = true;
        },
    };

    // Ejecución estrictamente concurrente de ambas solicitudes
    const [req1, req2] = await Promise.allSettled([
        restablecerClave({
            token: 'one-time-token-xyz',
            newPassword: 'NuevaPassword2026!',
            tokenStorage: atomicStorage,
            userRepository: fakeUserRepo,
            sessionRepository: fakeSessionRepo,
        }),
        restablecerClave({
            token: 'one-time-token-xyz',
            newPassword: 'NuevaPassword2026!',
            tokenStorage: atomicStorage,
            userRepository: fakeUserRepo,
            sessionRepository: fakeSessionRepo,
        }),
    ]);

    const exitosos = [req1, req2].filter(r => r.status === 'fulfilled');
    const rechazados = [req1, req2].filter(r => r.status === 'rejected');

    assert.equal(exitosos.length, 1, 'Exactamente una de las dos solicitudes debe tener éxito');
    assert.equal(rechazados.length, 1, 'Exactamente una debe ser rechazada por condición de carrera');
    assert.equal(passwordUpdatesCount, 1, 'La contraseña solo debe actualizarse una sola vez');
    assert.equal(sessionsRevoked, true, 'Todas las sesiones activas deben haber sido revocadas');
    assert.equal(rechazados[0].reason.statusCode, 400);
});
