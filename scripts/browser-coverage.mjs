import { createRequire } from 'node:module';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const v8toIstanbul = require('v8-to-istanbul');
const sourceMaps = require('convert-source-map');
const { createCoverageMap } = require('istanbul-lib-coverage');
const { createContext } = require('istanbul-lib-report');
const reports = require('istanbul-reports');
const root = process.cwd(), frontend = path.join(root, 'frontend');
const coverage = createCoverageMap({});
let entriesConverted = 0;
for (const file of await readdir('coverage/browser-v8')) {
    if (!file.endsWith('.json')) continue;
    const entries = JSON.parse(await readFile(path.join('coverage/browser-v8', file), 'utf8'));
    for (const entry of entries) {
        const pathname = decodeURIComponent(new URL(entry.url).pathname);
        const local = path.resolve(frontend, `.${pathname}`);
        assert.ok(path.relative(frontend, local).startsWith(`src${path.sep}`), 'Application source must stay inside frontend/src');
        const map = sourceMaps.fromSource(entry.source);
        assert.ok(map, `Missing source map for ${pathname}`);
        // Vite's source maps use container paths. Resolve each original file in
        // the checked-out source tree and verify the map belongs to this revision.
        for (let index = 0; index < map.sourcemap.sources.length; index++) {
            const source = map.sourcemap.sources[index].replaceAll('\\', '/');
            const relative = source.includes('/src/') ? source.slice(source.indexOf('/src/') + 1)
                : path.relative(frontend, path.resolve(path.dirname(local), source));
            const original = path.resolve(frontend, relative);
            assert.ok(path.relative(frontend, original).startsWith(`src${path.sep}`));
            const text = await readFile(original, 'utf8');
            assert.equal(map.sourcemap.sourcesContent[index].replaceAll('\r\n', '\n'), text.replaceAll('\r\n', '\n'));
            map.sourcemap.sources[index] = original;
        }
        const converter = v8toIstanbul(local, 0, { source: entry.source, sourceMap: map });
        await converter.load();
        converter.applyCoverage(entry.functions);
        coverage.merge(converter.toIstanbul());
        entriesConverted++;
    }
}
assert.ok(entriesConverted > 0, 'Real browser executions must contribute coverage');
await mkdir('coverage/browser', { recursive: true });
const context = createContext({ dir: 'coverage/browser', coverageMap: coverage });
for (const name of ['lcovonly', 'json-summary']) reports.create(name).execute(context);
const report = 'coverage/browser/lcov.info';
await writeFile(report, (await readFile(report, 'utf8')).replace(/^SF:(.+)$/gm, (_, file) =>
    `SF:${path.relative(root, path.resolve(file.trim())).replaceAll('\\', '/')}`));
console.log(`Browser coverage: ${entriesConverted} executed scripts, ${coverage.files().length} original source files`);
