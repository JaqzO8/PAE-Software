import { existsSync } from 'node:fs';
import path from 'node:path';

// Do not search the working directory or PATH for an executable to run.
export function dockerExecutable(platform = process.platform) {
    const candidates = platform === 'win32'
        ? ['C:/Program Files/Docker/Docker/resources/bin/docker.exe']
        : ['/usr/bin/docker', '/usr/local/bin/docker'];
    const executable = candidates.find(candidate => existsSync(candidate));
    if (!executable) throw new Error('Docker CLI was not found in a standard installation directory');
    return path.resolve(executable);
}
