import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { account, apiOrigin, compose } from './harness.mjs';

assert.equal(JSON.parse(compose('config', '--format', 'json')).name, 'pae_qa');
const student = await account(), teacher = await account('docente');
const env = {
    ...process.env,
    PAE_TEST_BASE_URL: `${apiOrigin}/api`,
    PAE_STUDENT_EMAIL: student.email,
    PAE_STUDENT_PASSWORD: student.password,
    PAE_TEACHER_EMAIL: teacher.email,
    PAE_TEACHER_PASSWORD: teacher.password,
    PAE_LEARNING_EVIDENCE_OUTPUT: path.resolve('test-results/qa/learning-regressions.json'),
};
delete env.NODE_V8_COVERAGE;
const result = spawnSync(process.execPath, ['node_modules/jest/bin/jest.js',
    'tests/dynamic/pae.learning.guide.e2e.test.js', '--runInBand', '--ci',
    '--json', '--outputFile=test-results/qa/learning-jest-results.json'], { env, stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status || 0;
