import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, '.env');
if (existsSync(target)) {
  console.error('Ya existe .env. Se conserva sin cambios. Revisa .env.example para nuevos parámetros.');
  process.exit(1);
}
let content = readFileSync(path.join(root, '.env.example'), 'utf8');
for (const key of ['AUTH_DB_PASSWORD', 'CONTENT_DB_PASSWORD', 'COMMUNITY_DB_PASSWORD', 'EXAM_DB_PASSWORD', 'JWT_SECRET']) {
  content = content.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${randomBytes(48).toString('hex')}`);
}
writeFileSync(target, content, { flag: 'wx', mode: 0o600 });
mkdirSync(path.join(root, 'uploads', 'community'), { recursive: true });
console.log('Configuración local creada con secretos aleatorios. .env y uploads están excluidos de Git.');
console.log('Siguiente paso: docker compose config --quiet; después, docker compose up --build -d');
