import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cwd = mkdtempSync(path.join(tmpdir(), 'pae-config-check-'));
const cleanEnv = { ...process.env };
for (const key of Object.keys(cleanEnv)) {
  if (/PASSWORD|SECRET|^NODE_ENV$|^DOTENV_|^DB_|^AUTH_DB_|^COMMUNITY_DB_/.test(key)) delete cleanEnv[key];
}
let checks = 0;
try {
  for (const service of ['auth-service', 'community-service']) {
    const filename = path.join(root, 'backend', 'services', service, 'src/config/env.js');
    const secret = randomBytes(48).toString('hex');
    const password = randomBytes(24).toString('hex');
    const run = (environment, assertion = '') => spawnSync(process.execPath,
      ['-e', `const config = require(${JSON.stringify(filename)}); ${assertion}`],
      { cwd, env: { ...cleanEnv, ...environment }, encoding: 'utf8' });
    const missingPassword = run({ NODE_ENV: 'production', JWT_SECRET: secret });
    assert.notEqual(missingPassword.status, 0, `${service}: debe rechazar contraseña ausente`);
    assert.match(missingPassword.stderr, /DB_PASSWORD es requerido/);
    checks++;
    const missingJwt = run({ NODE_ENV: 'production', DB_PASSWORD: password });
    assert.notEqual(missingJwt.status, 0, `${service}: debe rechazar JWT ausente`);
    assert.match(missingJwt.stderr, /JWT_SECRET seguro/);
    checks++;
    const weakJwt = run({ NODE_ENV: 'production', DB_PASSWORD: password, JWT_SECRET: 'change-me' });
    assert.notEqual(weakJwt.status, 0, `${service}: debe rechazar JWT débil`);
    assert.match(weakJwt.stderr, /JWT_SECRET seguro/);
    checks++;
    const valid = run({ NODE_ENV: 'production', DB_PASSWORD: password, JWT_SECRET: secret },
      `if (config.DB_PASSWORD !== ${JSON.stringify(password)}) process.exit(2);`);
    assert.equal(valid.status, 0, `${service}: debe admitir configuración explícita válida`);
    checks++;
  }
  console.log(`${checks} comprobaciones de configuración superadas; ningún secreto de entorno se muestra.`);
} finally {
  rmdirSync(cwd);
}
