import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

function run(args, cwd = process.cwd()) {
    const result = spawnSync(process.execPath, args, { cwd, env: process.env, stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status || 1);
}
const files = ['auth', 'm8', 'architecture'].flatMap(dir =>
    readdirSync(`tests/${dir}`).filter(file => file.endsWith('.test.cjs')).map(file => `tests/${dir}/${file}`));
run(['--import', './tests/unit-environment.mjs', '--test', ...files]);
run(['node_modules/jest/bin/jest.js', 'backend/services/exam-service/src/tests', '--runInBand', '--ci', '--coverage=false']);
for (const service of ['content', 'quality']) {
    run(['node_modules/jest/bin/jest.js', '--runInBand', '--ci', '--coverage=false'], `backend/services/${service}-service`);
}
run(['--test', 'test/*.test.js'], 'backend/services/learning-service');
