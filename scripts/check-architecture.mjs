import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const services = path.join(root, 'backend/services');
const failures = [];
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(filename) : filename.endsWith('.js') ? [filename] : [];
});
let checked = 0;
for (const entry of readdirSync(services, { withFileTypes: true }).filter(entry => entry.isDirectory())) {
    const source = path.join(services, entry.name, 'src');
    if (!existsSync(source)) continue;
    for (const file of walk(source)) {
        const relative = path.relative(source, file).replaceAll('\\', '/');
        const layer = relative.split('/').find(part => ['domain', 'application'].includes(part));
        if (!layer) continue; // Legacy controllers are migrated vertically, not moved cosmetically.
        checked++;
        const code = readFileSync(file, 'utf8');
        for (const match of code.matchAll(/(?:require\s*\(\s*|from\s+)['"]([^'"]+)['"]/g)) {
            const dependency = match[1];
            const resolved = path.resolve(path.dirname(file), dependency);
            const inside = path.relative(source, resolved).replaceAll('\\', '/');
            if (!dependency.startsWith('.') || inside.startsWith('../') || /(^|\/)(infrastructure|interfaces|bootstrap|models|config|controllers|routes)(\/|$)/.test(inside) || (layer === 'domain' && !inside.split('/').includes('domain'))) {
                failures.push(`${entry.name}/${relative}: forbidden dependency ${dependency}`);
            }
        }
    }
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`Architecture boundaries passed for ${checked} new domain/application files. Legacy code is explicitly outside this check.`);
