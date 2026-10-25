import { execFileSync, spawnSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const container = process.env.PAE_TEST_DB_CONTAINER || 'pae-community-db';
const info = JSON.parse(execFileSync('docker', ['inspect', container], { encoding: 'utf8' }))[0];
if (info.Config.Labels?.['com.docker.compose.project'] !== 'pruebas_pae') throw new Error('The selected database must belong to pruebas_pae');
const settings = Object.fromEntries(info.Config.Env.map(item => { const pos = item.indexOf('='); return [item.slice(0, pos), item.slice(pos + 1)]; }));
const port = info.NetworkSettings.Ports['5432/tcp']?.[0]?.HostPort;
if (!port) throw new Error('PostgreSQL must have a local published port');
const database = `pae_test_${randomUUID().replaceAll('-', '')}`;
if (!/^pae_test_[a-f0-9]{32}$/.test(database)) throw new Error('Invalid isolated database name');
const sql = (statement) => execFileSync('docker', ['exec', container, 'psql', '-U', settings.POSTGRES_USER, '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', statement], { stdio: ['ignore', 'pipe', 'pipe'] });
let created = false;
try {
    sql(`CREATE DATABASE ${database}`);
    created = true;
    const connection = new URL('postgresql://127.0.0.1');
    connection.username = settings.POSTGRES_USER;
    connection.password = settings.POSTGRES_PASSWORD;
    connection.port = port;
    connection.pathname = database;
    const env = {
        ...process.env, NODE_ENV: 'test', DB_HOST: '127.0.0.1', DB_PORT: port, DB_NAME: database,
        DB_USER: settings.POSTGRES_USER, DB_PASSWORD: settings.POSTGRES_PASSWORD,
        JWT_SECRET: randomBytes(48).toString('hex'),
        LEARNING_DATABASE_URL: connection.toString(),
    };
    const result = spawnSync(process.execPath, ['--test',
        'backend/services/community-service/test/integration/community.test.js',
        'backend/services/learning-service/test/integration/awards.test.js',
    ], { cwd: root, env, stdio: 'inherit' });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
} finally {
    // Only this run's freshly-created database is removed; existing application databases are never targeted.
    if (created) sql(`DROP DATABASE ${database} WITH (FORCE)`);
}
