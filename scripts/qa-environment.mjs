import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dockerExecutable } from './lib/docker-executable.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const secrets = path.join(root, '.env.qa');
if (!existsSync(secrets)) writeFileSync(secrets, `QA_DB_PASSWORD=${randomBytes(32).toString('hex')}\nQA_JWT_SECRET=${randomBytes(48).toString('hex')}\n`, { mode: 0o600, flag: 'wx' });
const command = process.argv[2] || 'up';
const commands = { up: ['up', '-d', '--build'], stop: ['stop'], status: ['ps'], logs: ['logs', '--tail', '30'] };
if (!commands[command]) throw new Error('Allowed actions: up, stop, status, logs');
mkdirSync(path.join(root, 'test-results/qa'), { recursive: true });
// Create the report parent as the host user before Docker creates bind mounts as root.
for (const service of ['auth', 'community', 'content', 'exam', 'quality', 'learning']) {
    mkdirSync(path.join(root, 'coverage/qa', service), { recursive: true });
}
const result = spawnSync(dockerExecutable(), ['compose', '-p', 'pae_qa', '--env-file', secrets, '-f', path.join(root, 'docker-compose.qa.yml'), ...commands[command]], { cwd: root, stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
if (command === 'up' && result.status === 0) {
    // These two images run as node (UID 1000). Docker creates bind directories as root.
    // Change ownership of the QA coverage directories only, keeping the service unprivileged.
    for (const service of ['quality-service', 'learning-service']) {
        const permissions = spawnSync(dockerExecutable(), ['compose', '-p', 'pae_qa', '--env-file', secrets, '-f', path.join(root, 'docker-compose.qa.yml'), 'exec', '-T', '--user', 'root', service, 'env', '-u', 'NODE_V8_COVERAGE', 'node', '-e', 'require("node:fs").chownSync("/coverage", 1000, 1000)'], { cwd: root, stdio: 'inherit' });
        if (permissions.error) throw permissions.error;
        if (permissions.status !== 0) throw new Error(`Cannot prepare QA coverage for ${service}`);
    }
    // Nginx resolves upstream container addresses at startup. Recreate after service builds.
    const proxy = spawnSync(dockerExecutable(), ['compose', '-p', 'pae_qa', '--env-file', secrets, '-f', path.join(root, 'docker-compose.qa.yml'), 'up', '-d', '--force-recreate', '--no-deps', 'nginx-gateway', 'frontend'], { cwd: root, stdio: 'inherit' });
    if (proxy.error) throw proxy.error;
    process.exitCode = proxy.status ?? 1;
}
