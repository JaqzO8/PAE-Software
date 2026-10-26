const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { authenticate } = require('../src/middlewares/jwtAuth');

const tokenFor = (payload, secret = 'test-secret') => {
    const enc = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const header = enc({ alg: 'HS256', typ: 'JWT' });
    const body = enc(payload);
    const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${sig}`;
};

test('jwtAuth: acepta token normal y rechaza token de desafío MFA', () => {
    process.env.JWT_SECRET = 'test-secret';
    const request = { headers: { authorization: `Bearer ${tokenFor({ id: 7 })}` } };
    const response = { status: () => response, json: () => response };
    let user;
    authenticate(request, response, () => { user = request.user; });
    assert.equal(user.id, 7);

    const challenge = { headers: { authorization: `Bearer ${tokenFor({ id: 7, scope: 'mfa_challenge' })}` } };
    let status;
    authenticate(challenge, { status: (code) => ({ json: () => { status = code; } }) }, () => {});
    assert.equal(status, 401);
});
