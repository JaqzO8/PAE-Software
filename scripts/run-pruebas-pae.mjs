import { execFileSync, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const info = JSON.parse(execFileSync('docker', ['inspect', 'pae-community-service'], { encoding: 'utf8' }))[0];
const labels = info.Config.Labels;
if (labels?.['com.docker.compose.project'] !== 'pruebas_pae') throw new Error('Expected the pruebas_pae project');
const original = labels['com.docker.compose.project.working_dir'];
if (!original || !existsSync(path.join(original, 'docker-compose.yml'))) throw new Error('Original Compose folder not found');
const secretFile = path.join(root, '.env.architecture');
if (!existsSync(secretFile)) writeFileSync(secretFile, `LEARNING_DB_PASSWORD=${randomBytes(32).toString('hex')}\n`, { mode: 0o600, flag: 'wx' });
const args = ['compose', '-p', 'pruebas_pae', '--project-directory', original,
    '--env-file', path.join(original, '.env'), '--env-file', secretFile,
    '-f', path.join(original, 'docker-compose.yml')];
if (existsSync(path.join(original, 'docker-compose.demo.yml'))) args.push('-f', path.join(original, 'docker-compose.demo.yml'));
args.push('-f', path.join(root, 'docker-compose.architecture.yml'));
const env = { ...process.env, PAE_SOURCE_ROOT: root.replaceAll('\\', '/') };
const commands = process.argv.slice(2);
if (!commands.length) commands.push('up', '-d', '--build', '--no-deps', 'auth-service', 'content-service', 'exam-service', 'community-service', 'frontend');
const result = spawnSync('docker', [...args, ...commands], { env, stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
