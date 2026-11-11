const { test } = require('node:test');
const assert = require('node:assert/strict');
const { deviceName } = require('../../backend/services/auth-service/src/utils/deviceInfo');

test('device metadata keeps the label and fallback without trusting malformed input', () => {
    assert.equal(deviceName('Mozilla/5.0 (Windows NT 10.0)'), 'Windows NT 10.0');
    for (const input of [null, undefined, {}, 123, '', 'Mozilla/5.0 ()']) {
        assert.equal(deviceName(input, 'Unknown QA device'), 'Unknown QA device');
    }
});

test('device metadata inspects only the bounded prefix of hostile headers', () => {
    const start = performance.now();
    assert.equal(deviceName('('.repeat(1000000)), 'Desconocido');
    assert.ok(performance.now() - start < 100, 'Hostile metadata must not block authentication');
    assert.equal(deviceName(`${'x'.repeat(512)}(Untrusted suffix)`), 'Desconocido');
    assert.equal(deviceName(`(${ 'x'.repeat(511) })`), 'Desconocido');
    assert.equal(deviceName(`(Known device)${'('.repeat(1000000)}`), 'Known device');
});
