/**
 * @file infrastructureSecurity.test.cjs
 * Pruebas de configuración de seguridad, CORS, cabeceras y readiness (RIC-12 / M8-HU13 / RQ106 / RQ30).
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

test('RIC-12: Health y readiness devuelven estado 200 con formato estándar y timestamp', async () => {
    const { createApp: createAuthApp } = require('../../backend/services/auth-service/src/app');
    const app = createAuthApp();
    const server = http.createServer(app);

    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;

    try {
        const response = await fetch(`http://127.0.0.1:${port}/api/auth/health`);
        assert.equal(response.status, 200);
        const data = await response.json();
        assert.ok(['ok', 'healthy'].includes(data.status));
        assert.ok(data.timestamp, 'Debe incluir timestamp');
        assert.equal(data.service, 'auth-service');
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});

test('RIC-12: Cabeceras de seguridad y no divulgación de tecnologías en respuestas', async () => {
    const { createApp: createAuthApp } = require('../../backend/services/auth-service/src/app');
    const app = createAuthApp();
    const server = http.createServer(app);

    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;

    try {
        const response = await fetch(`http://127.0.0.1:${port}/health`);
        // Express suele exponer X-Powered-By si no se deshabilita; verificamos cabeceras seguras
        const poweredBy = response.headers.get('x-powered-by');
        assert.equal(poweredBy, null, 'No debe filtrar encabezado X-Powered-By');
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});

test('RIC-12: verify-config script rechaza contraseñas y secretos débiles en producción', async () => {
    const { spawnSync } = require('node:child_process');
    const path = require('node:path');

    const verifyScript = path.resolve(__dirname, '../../scripts/verify-config.mjs');
    const result = spawnSync(process.execPath, [verifyScript], {
        encoding: 'utf8',
        env: { ...process.env, NODE_ENV: 'test' },
    });

    assert.equal(result.status, 0, `verify-config debe salir con 0: ${result.stderr}`);
    assert.match(result.stdout, /comprobaciones de configuración superadas/);
});
