const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const { autenticar } = require('../../backend/services/auth-service/src/application/useCases/autenticar');
const { revocarSesionActual, revocarTodasLasSesiones } = require('../../backend/services/auth-service/src/application/useCases/revocarSesion');

function fixture() {
    const user = { id_usuario: 7, activo: true, validarPassword: mock.fn(async () => true) };
    return { user, email: ' QA@EXAMPLE.TEST ', password: 'test-password', deviceInfo: { device: 'QA' },
        userRepository: { findByEmail: mock.fn(async () => user) },
        sessionRepository: { logHistory: mock.fn(), storeMfaChallenge: mock.fn() },
        rateLimiter: { getAttempts: mock.fn(async () => 0), recordFailedAttempt: mock.fn(), clearAttempts: mock.fn() },
        cryptoProvider: { randomUUID: () => 'challenge-id', generateNumericOtp: () => '123456', isTestEnv: false } };
}
test('authentication normalizes identity, checks the password and clears failed attempts', async () => {
    const input = fixture(); const result = await autenticar(input);
    assert.equal(result.estado, 'sesion_completa'); assert.equal(result.user, input.user);
    assert.deepEqual(input.userRepository.findByEmail.mock.calls[0].arguments, ['qa@example.test']);
    assert.equal(input.rateLimiter.clearAttempts.mock.callCount(), 1);
    assert.equal(input.sessionRepository.storeMfaChallenge.mock.callCount(), 0);
});
test('missing credentials never query persistence or create a session', async () => {
    for (const values of [{ email: '' }, { password: '' }]) {
        const input = { ...fixture(), ...values };
        await assert.rejects(autenticar(input), { statusCode: 401, message: 'Credenciales incorrectas' });
        assert.equal(input.userRepository.findByEmail.mock.callCount(), 0);
    }
});
test('rate-limited credentials cannot trigger password verification', async () => {
    const input = fixture(); input.rateLimiter.getAttempts = async () => 5;
    await assert.rejects(autenticar(input), { statusCode: 429 });
    assert.equal(input.user.validarPassword.mock.callCount(), 0);
});
test('unknown users and incorrect passwords share a neutral response and count failures', async () => {
    for (const exists of [true, false]) {
        const input = fixture();
        if (exists) input.user.validarPassword = async () => false;
        else input.userRepository.findByEmail = async () => null;
        await assert.rejects(autenticar(input), { statusCode: 401, message: 'Credenciales incorrectas' });
        assert.equal(input.rateLimiter.recordFailedAttempt.mock.callCount(), 1);
        assert.equal(input.rateLimiter.clearAttempts.mock.callCount(), 0);
        assert.equal(input.sessionRepository.logHistory.mock.callCount(), exists ? 1 : 0);
    }
});
test('disabled accounts are rejected before password verification', async () => {
    const input = fixture(); input.user.activo = false;
    await assert.rejects(autenticar(input), { statusCode: 403 });
    assert.equal(input.user.validarPassword.mock.callCount(), 0);
});
test('MFA yields only a restricted challenge and keeps the OTP out of production responses', async () => {
    for (const enforced of [true, false]) {
        const input = fixture(); input.mfaEnforced = enforced; input.user.mfa_enabled = !enforced;
        const result = await autenticar(input);
        assert.equal(result.estado, 'desafio_mfa_pendiente'); assert.equal(result.user, undefined);
        assert.equal(result.testOtp, undefined); assert.equal(result.challengeToken, 'challenge-id');
        assert.deepEqual(input.sessionRepository.storeMfaChallenge.mock.calls[0].arguments[0], {
            challengeId: 'challenge-id', userId: 7, otpCode: '123456', attempts: 0, expiresInSeconds: 300 });
        input.cryptoProvider.isTestEnv = true;
        assert.equal((await autenticar(input)).testOtp, '123456');
    }
});
test('optional telemetry adapters do not change the credential decision', async () => {
    const input = fixture(); input.rateLimiter = null; input.sessionRepository = null;
    assert.equal((await autenticar(input)).estado, 'sesion_completa');
    input.user.validarPassword = async () => false;
    await assert.rejects(autenticar(input), { statusCode: 401 });
    input.userRepository.findByEmail = async () => null;
    await assert.rejects(autenticar(input), { statusCode: 401 });
});
test('revoking a session blacklists before deactivating persistence and propagates failure', async () => {
    const events = []; const deviceInfo = { device: 'QA' };
    const input = { token: 'synthetic-token', userId: 7, deviceInfo,
        tokenService: { revokeToken: async token => events.push(['blacklist', token]) },
        sessionService: { deactivateSession: async (token, device) => events.push(['deactivate', token, device]) } };
    assert.equal((await revocarSesionActual(input)).success, true);
    assert.deepEqual(events, [['blacklist', 'synthetic-token'], ['deactivate', 'synthetic-token', deviceInfo]]);
    await assert.rejects(revocarSesionActual({ ...input, token: '' }), { statusCode: 400 });
    input.tokenService.revokeToken = async () => { throw new Error('blacklist unavailable'); };
    await assert.rejects(revocarSesionActual(input), /blacklist unavailable/);
    assert.equal(events.length, 2);
});
test('logout-all revokes every active session before closing the user session set', async () => {
    const tokens = [], events = [];
    const input = { userId: 7, deviceInfo: { device: 'QA' },
        tokenService: { revokeToken: async token => tokens.push(token) },
        sessionService: { getUserActiveSessions: async id => { assert.equal(id, 7); return [{ token_sesion: 'a' }, { token_sesion: 'b' }]; },
            deactivateAllUserSessions: async id => events.push(id) } };
    assert.equal((await revocarTodasLasSesiones(input)).success, true);
    assert.deepEqual(tokens.sort(), ['a', 'b']); assert.deepEqual(events, [7]);
    await assert.rejects(revocarTodasLasSesiones({ ...input, userId: null }), { statusCode: 400 });
});
