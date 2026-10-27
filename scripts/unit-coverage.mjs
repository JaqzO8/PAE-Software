import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

function run(args, cwd = process.cwd(), env = process.env) {
    const result = spawnSync(process.execPath, args, { cwd, env, stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status || 1);
}
const files = ['auth', 'm8', 'architecture'].flatMap(dir =>
    readdirSync(`tests/${dir}`).filter(file => file.endsWith('.test.cjs')).map(file => `tests/${dir}/${file}`));
run(['--import', './tests/unit-environment.mjs', '--test', ...files]);
// Jest transforms source in a VM. Its own coverage provider maps those lines correctly.
// Do not also collect the transformed VM source through the parent c8 process.
const jestEnv = { ...process.env };
delete jestEnv.NODE_V8_COVERAGE;
for (const service of ['exam', 'content', 'quality']) {
    const root = process.cwd();
    const cwd = service === 'exam' ? root : path.join(root, `backend/services/${service}-service`);
    const sources = service === 'exam' ? 'backend/services/exam-service/src/**/*.js' : 'src/**/*.js';
    const targets = service === 'exam' ? ['backend/services/exam-service/src/tests'] : [];
    run(['node_modules/jest/bin/jest.js', ...targets, '--runInBand', '--ci', '--coverage', '--coverageProvider=v8',
        '--coverageReporters=lcov', '--coverageReporters=json-summary',
        `--coverageDirectory=${path.join(root, 'coverage/jest', service)}`,
        `--collectCoverageFrom=${sources}`, '--collectCoverageFrom=!**/tests/**'], cwd, jestEnv);
    const reportPath = path.join(root, 'coverage/jest', service, 'lcov.info');
    const report = readFileSync(reportPath, 'utf8').replace(/^SF:(.+)$/gm, (_, source) =>
        `SF:${path.relative(root, path.resolve(cwd, source.trim())).replaceAll('\\', '/')}`);
    writeFileSync(reportPath, report);
}
run(['--test', 'test/*.test.js'], 'backend/services/learning-service');
