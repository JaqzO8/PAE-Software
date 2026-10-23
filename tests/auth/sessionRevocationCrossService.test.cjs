const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('../../backend/services/auth-service/node_modules/jsonwebtoken');

// TokenService del auth-service
const TokenService = require('../../backend/services/auth-service/src/services/tokenService');
const { inMemoryFallback } = require('../../backend/services/auth-service/src/config/redis');

// Middlewares de los servicios consumidores
const authServiceMiddleware = require('../../backend/services/auth-service/src/middlewares/authMiddleware');
const communityServiceMiddleware = require('../../backend/services/community-service/src/middlewares/authMiddleware');
const contentServiceMiddleware = require('../../backend/services/content-service/src/middlewares/authMiddleware');
const examServiceMiddleware = require('../../backend/services/exam-service/src/middlewares/authMiddleware');

test('RIC-11 / RIC-AC-04: token revocado en auth-service es rechazado en auth-service y servicios consumidores', async () => {
    const payload = { id_usuario: 88, id: 88, email: 'estudiante@pae.edu', rol: 'estudiante' };
    const token = TokenService.generateToken(payload);

    // 1. Antes de revocar: token válido en authServiceMiddleware
    let authReq = { headers: { authorization: `Bearer ${token}` } };
    let authRes = {
        status: (code) => ({ json: (body) => ({ code, body }) }),
    };
    let authNextCalled = false;
    await authServiceMiddleware.verifyToken(authReq, authRes, () => {
        authNextCalled = true;
    });
    assert.equal(authNextCalled, true, 'Token activo debe ser aceptado en auth-service');

    // 2. Revocación a través de TokenService (agrega a blacklist)
    const revoked = await TokenService.revokeToken(token);
    assert.equal(revoked, true);

    // 3. Comprobación en auth-service: debe rechazar con 401
    let authRejected = false;
    let authStatusCode = null;
    let authResponseBody = null;
    const mockResAuth = {
        status: (code) => {
            authStatusCode = code;
            return {
                json: (body) => {
                    authResponseBody = body;
                    authRejected = true;
                },
            };
        },
    };
    await authServiceMiddleware.verifyToken(authReq, mockResAuth, () => {});
    assert.equal(authRejected, true);
    assert.equal(authStatusCode, 401);
    assert.match(authResponseBody.message, /revocado/i);

    // 4. Comprobación en exam-service (simulando cache de revocación distribuida)
    examServiceMiddleware.localRevocationCache.add(token);
    let examRejected = false;
    let examStatusCode = null;
    const mockResExam = {
        status: (code) => {
            examStatusCode = code;
            return {
                json: (body) => {
                    examRejected = true;
                },
            };
        },
    };
    examServiceMiddleware.verifyToken({ headers: { authorization: `Bearer ${token}` } }, mockResExam, () => {});
    assert.equal(examRejected, true);
    assert.equal(examStatusCode, 401);

    // 5. Comprobación en content-service
    contentServiceMiddleware.localRevocationCache.add(token);
    let contentRejected = false;
    let contentStatusCode = null;
    const mockResContent = {
        status: (code) => {
            contentStatusCode = code;
            return {
                json: (body) => {
                    contentRejected = true;
                },
            };
        },
    };
    contentServiceMiddleware.verifyToken({ headers: { authorization: `Bearer ${token}` } }, mockResContent, () => {});
    assert.equal(contentRejected, true);
    assert.equal(contentStatusCode, 401);
});

test('RIC-AC-02 / RIC-06: tokens de alcance restringido (mfa_challenge) son rechazados por todos los servicios de negocio', async () => {
    const challengeToken = TokenService.generateChallengeToken({ id_usuario: 99, email: 'reto@pae.edu' });

    // En auth-service normal
    let authCode = 0;
    await authServiceMiddleware.verifyToken(
        { headers: { authorization: `Bearer ${challengeToken}` } },
        { status: (c) => ({ json: () => { authCode = c; } }) },
        () => {}
    );
    assert.equal(authCode, 401);

    // En content-service
    let contentCode = 0;
    await contentServiceMiddleware.verifyToken(
        { headers: { authorization: `Bearer ${challengeToken}` } },
        { status: (c) => ({ json: () => { contentCode = c; } }) },
        () => {}
    );
    assert.equal(contentCode, 401);

    // En exam-service
    let examCode = 0;
    await examServiceMiddleware.verifyToken(
        { headers: { authorization: `Bearer ${challengeToken}` } },
        { status: (c) => ({ json: () => { examCode = c; } }) },
        () => {}
    );
    assert.equal(examCode, 401);
});
