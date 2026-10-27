import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { compose } from '../tests/qa/harness.mjs';

const output = path.resolve('coverage/qa-v8');
await mkdir(output, { recursive: true });
for (const service of ['auth', 'community', 'exam', 'content', 'quality']) {
    compose('exec', '-T', `${service}-service`, 'env', '-u', 'NODE_V8_COVERAGE', 'node', '-e', `
        const fs = require('node:fs');
        const before = new Set(fs.readdirSync('/coverage'));
        let signalled = 0;
        for (const pid of fs.readdirSync('/proc').filter(value => /^\\d+$/.test(value))) {
            try {
                const args = fs.readFileSync('/proc/' + pid + '/cmdline', 'utf8').split('\\0');
                if (args[0] === 'node' && args[1] === 'src/index.js') {
                    process.kill(Number(pid), 'SIGUSR2'); signalled++;
                }
            } catch (error) { if (error.code !== 'ENOENT') throw error; }
        }
        if (signalled !== 1) throw new Error('Expected exactly one application process');
        (async () => {
            for (let attempt = 0; attempt < 50; attempt++) {
                const files = fs.readdirSync('/coverage').filter(name => name.endsWith('.json'));
                if (files.some(name => !before.has(name))) {
                    // V8 writes mode 0600 as the container user. Only QA coverage is shared.
                    for (const file of files) {
                        JSON.parse(fs.readFileSync('/coverage/' + file, 'utf8'));
                        fs.chmodSync('/coverage/' + file, 0o644);
                    }
                    return;
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            throw new Error('Application did not flush fresh coverage');
        })().catch(error => { console.error(error.message); process.exitCode = 1; });
    `);
    const rawDir = path.resolve(`coverage/qa/${service}`);
    const files = (await readdir(rawDir)).filter(name => name.endsWith('.json'));
    if (!files.length) throw new Error(`No coverage produced for ${service}`);
    for (const file of files) {
        const data = JSON.parse(await readFile(path.join(rawDir, file), 'utf8'));
        data.result = data.result.filter(entry => entry.url.startsWith('file:///app/src/'));
        for (const entry of data.result) {
            entry.url = pathToFileURL(path.resolve(`backend/services/${service}-service`, entry.url.slice('file:///app/'.length))).href;
        }
        await writeFile(path.join(output, `${service}-${file}`), JSON.stringify(data));
    }
}
console.log('Cobertura V8 de los cinco servicios exportada; incluye solo código ejecutado.');
