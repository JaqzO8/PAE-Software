import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const frontend = path.join(root, 'frontend');
const env = { ...process.env };
delete env.NODE_V8_COVERAGE;
const result = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', '--coverage'], {
    cwd: frontend, env, stdio: 'inherit',
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
const reportPath = path.join(root, 'coverage/frontend/lcov.info');
const report = readFileSync(reportPath, 'utf8').replace(/^SF:(.+)$/gm, (_, source) =>
    `SF:${path.relative(root, path.resolve(frontend, source.trim())).replaceAll('\\', '/')}`);
writeFileSync(reportPath, report);
