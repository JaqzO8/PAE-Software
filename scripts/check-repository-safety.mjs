import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const staged = process.argv.includes('--staged');
const args = staged ? ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'] : ['ls-files', '-z'];
const files = execFileSync('git', args, { encoding: 'utf8' }).split('\0').filter(Boolean);
const problems = [];
const forbidden = /(^|\/)(?:node_modules|uploads|backups|coverage|\.scannerwork|\.agents|tmp|dist|sonar-evidence)(\/|$)|\.(?:pem|key|p12|pfx|dump)$/i;
const detectors = [
  ['token de proveedor', /(?:gh[pousr]_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]{30,}|squ_[A-Za-z0-9]{30,}|AKIA[A-Z0-9]{16})/g],
  ['clave privada', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ['credenciales en URL', /(?:https?|postgres(?:ql)?|redis):\/\/[^\s:/"'<>]+:[^\s/@"'<>]+@/g],
  ['secreto de respaldo en configuración', /(?:DB_PASSWORD|JWT_SECRET)\s*:.*\|\|\s*['"][^'"]+['"]/g],
];
for (const file of files) {
  if (forbidden.test(file) || (/(^|\/)\.env(?:\.|$)/.test(file) && !file.endsWith('.env.example')) || /(^|\/)(?:\.npmrc|\.netrc|credentials[^/]*\.json|service-account[^/]*\.json)$/.test(file)) {
    problems.push(`${file}: archivo privado o generado`);
  }
  const buffer = staged ? execFileSync('git', ['show', `:${file}`], { maxBuffer: 20 * 1024 * 1024 }) : readFileSync(file);
  if (buffer.includes(0)) continue;
  const content = buffer.toString('utf8');
  for (const [label, pattern] of detectors) {
    for (const match of content.matchAll(pattern)) {
      problems.push(`${file}:${content.slice(0, match.index).split('\n').length}: ${label}`);
    }
  }
}
if (problems.length) {
  console.error(problems.join('\n'));
  console.error('Revisión fallida. No se imprimen los valores detectados.');
  process.exit(1);
}
console.log(`Revisión preventiva superada: ${files.length} archivos ${staged ? 'preparados' : 'versionados'}.`);
console.log('Esta comprobación de patrones complementa la revisión humana; no garantiza ausencia de todo secreto.');
