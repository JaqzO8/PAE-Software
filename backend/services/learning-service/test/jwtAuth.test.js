const { test } = require('node:test');
const assert = require('node:assert/strict');
const { authenticate } = require('../src/middlewares/jwtAuth');
process.env.AUTH_SERVICE_URL = 'https://identity.example.test';

function response() { return { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }

test('identity authority supplies current active user and role', async t => {
    t.mock.method(globalThis, 'fetch', async (url, options) => {
        assert.ok(String(url).endsWith('/api/auth/verify'));
        assert.equal(options.headers.Authorization, 'Bearer synthetic-token');
        return { ok: true, json: async () => ({ valid: true, user: { id: 7, activo: true, rol: 'estudiante' } }) };
    });
    const req = { headers: { authorization: 'Bearer synthetic-token' } };
    let accepted = false;
    await authenticate(req, response(), () => { accepted = true; });
    assert.equal(accepted, true);
    assert.deepEqual(req.user, { id: 7, rol: 'estudiante' });
});

test('missing, revoked, malformed and restricted MFA sessions cannot reach planning', async t => {
    const mocked = t.mock.method(globalThis, 'fetch', async () => ({ ok: false, status: 401 }));
    for (const authorization of [undefined, 'Basic token', 'Bearer revoked', 'Bearer mfa-challenge']) {
        const res = response();
        await authenticate({ headers: { authorization } }, res, () => assert.fail('Unauthorized request reached route'));
        assert.equal(res.code, 401);
    }
    assert.equal(mocked.mock.callCount(), 2);
});

test('authority failures fail closed; inactive users are rejected', async t => {
    const mock = t.mock.method(globalThis, 'fetch', async () => { throw new Error('outage'); });
    const res = response();
    await authenticate({ headers: { authorization: 'Bearer test' } }, res, () => assert.fail('Accepted outage'));
    assert.equal(res.code, 503);
    mock.mock.mockImplementation(async () => ({ ok: true, json: async () => ({ valid: true, user: { id: 7, activo: false } }) }));
    await authenticate({ headers: { authorization: 'Bearer test' } }, res, () => assert.fail('Accepted inactive user'));
    assert.equal(res.code, 401);
});
