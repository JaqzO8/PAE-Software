const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');

for (const [service, health] of [['auth', '/api/auth/health'], ['content', '/api/content/health'], ['exam', '/api/learning/health'], ['community', '/api/community/health'], ['learning', '/health']]) {
    test(`${service}: factory serves real health route without starting databases or sockets`, () => {
        const appPath = path.join(root, `backend/services/${service}-service/src/app.js`);
        const supertest = require.resolve('supertest');
        const script = `const { createApp } = require(${JSON.stringify(appPath)});
            const assert = require('node:assert/strict');
            assert.notEqual(createApp(), createApp());
            require(${JSON.stringify(supertest)})(createApp()).get(${JSON.stringify(health)}).expect(200).then(() => {}, err => { console.error(err.message); process.exitCode = 1; });`;
        const child = spawnSync(process.execPath, ['-e', script], {
            cwd: root, encoding: 'utf8', timeout: 20000,
            env: { ...process.env, NODE_ENV: 'test', DB_HOST: '127.0.0.1', DB_PORT: '1', REDIS_URL: 'redis://127.0.0.1:1' },
        });
        assert.equal(child.status, 0, `${child.error || ''}\n${child.stdout}\n${child.stderr}`);
    });
}

test('published event fixture is accepted by the real gamification domain', () => {
    const event = require('../../backend/contracts/events/fixtures/ResultadoConfirmado.v1.json');
    const { validateConfirmedResult } = require('../../backend/services/learning-service/src/modules/gamification/domain/confirmedResult');
    assert.equal(validateConfirmedResult(event), event);
});
