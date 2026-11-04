import { createRequire } from 'node:module';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const frontendRequire = createRequire(new URL('../frontend/package.json', import.meta.url));
const { default: convert } = await import(pathToFileURL(frontendRequire.resolve('ast-v8-to-istanbul')).href);
const { parseAstAsync } = await import(pathToFileURL(frontendRequire.resolve('vite')).href);
const sourceMaps = require('convert-source-map');
const { createCoverageMap } = require('istanbul-lib-coverage');
const { createContext } = require('istanbul-lib-report');
const reports = require('istanbul-reports');
const root = process.cwd(), frontend = path.join(root, 'frontend');
const isApplication = file => path.relative(frontend, file).startsWith(`src${path.sep}`);
const coverage = createCoverageMap({});
let entriesConverted = 0;
for (const file of await readdir('coverage/browser-v8')) {
    if (!file.endsWith('.json')) continue;
    const entries = JSON.parse(await readFile(path.join('coverage/browser-v8', file), 'utf8'));
    for (const entry of entries) {
        const pathname = decodeURIComponent(new URL(entry.url).pathname);
        const built = pathname.startsWith('/assets/');
        const local = path.resolve(frontend, built ? `dist${pathname}` : `.${pathname}`);
        const map = sourceMaps.fromSource(entry.source);
        assert.ok(map, `Missing source map for ${pathname}`);
        // Resolve Rollup production maps and Vite development maps against the
        // checked-out source, verifying each application source belongs to this revision.
        let hasApplicationSource = false;
        for (let index = 0; index < map.sourcemap.sources.length; index++) {
            const source = map.sourcemap.sources[index].replaceAll('\\', '/');
            const original = built ? path.resolve(path.dirname(local), source)
                : path.resolve(frontend, source.includes('/src/') ? source.slice(source.indexOf('/src/') + 1)
                    : path.relative(frontend, path.resolve(path.dirname(local), source)));
            map.sourcemap.sources[index] = original;
            if (isApplication(original)) {
                const text = await readFile(original, 'utf8');
                assert.equal(map.sourcemap.sourcesContent[index].replaceAll('\r\n', '\n'), text.replaceAll('\r\n', '\n'));
                hasApplicationSource = true;
            }
        }
        if (!hasApplicationSource) continue;
        // Match Vitest's AST-aware remapping: comments, whitespace and type-only
        // declarations are not executable statements and must not inflate hits.
        const converted = await convert({ code: entry.source, ast: await parseAstAsync(entry.source),
            sourceMap: map.sourcemap, wrapperLength: 0, coverage: { url: pathToFileURL(local).href, functions: entry.functions } });
        for (const [file, data] of Object.entries(converted)) if (isApplication(file)) coverage.addFileCoverage(data);
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
