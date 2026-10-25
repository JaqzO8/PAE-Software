/**
 * @file backup-restore.mjs
 * Script de respaldo, generación de manifiesto SHA-256 y verificación de restauración (RIC-15 / RQ33 / M8-HU24).
 */

import crypto from 'node:crypto';

/**
 * Calcula el hash SHA-256 de un archivo o buffer.
 * @param {string|Buffer} content
 * @returns {string}
 */
export function calculateChecksum(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Genera un manifiesto de respaldo con metadatos, timestamp y checksums.
 * @param {Array<{ name: string, content: string|Buffer, database: string }>} backups
 * @param {Object} [options]
 * @returns {Object}
 */
export function createBackupManifest(backups, options = {}) {
    const timestamp = options.timestamp || new Date().toISOString();
    const retentionDays = options.retentionDays || 14;

    const files = backups.map(b => {
        const checksum = calculateChecksum(b.content);
        const sizeBytes = Buffer.byteLength(b.content);
        return {
            filename: b.name,
            database: b.database,
            checksum,
            sizeBytes,
        };
    });

    return {
        schemaVersion: '1.0.0',
        generatedAt: timestamp,
        retentionDays,
        rpoTargetHours: 24,
        rtoTargetHours: 2,
        totalFiles: files.length,
        files,
    };
}

/**
 * Verifica la integridad de un manifiesto y sus archivos de respaldo.
 * @param {Object} manifest
 * @param {Map<string, string|Buffer>|Record<string, string|Buffer>} fileContents
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function verifyBackupIntegrity(manifest, fileContents) {
    const errors = [];
    if (!manifest || !Array.isArray(manifest.files)) {
        return { valid: false, errors: ['Manifiesto inválido o sin archivos'] };
    }

    const getContent = (name) => {
        if (fileContents instanceof Map) return fileContents.get(name);
        return fileContents[name];
    };

    for (const file of manifest.files) {
        const content = getContent(file.filename);
        if (content === undefined || content === null) {
            errors.push(`Archivo ausente en respaldo: ${file.filename}`);
            continue;
        }
        const currentChecksum = calculateChecksum(content);
        if (currentChecksum !== file.checksum) {
            errors.push(`Checksum corrupto para ${file.filename}: esperado ${file.checksum}, obtenido ${currentChecksum}`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Valida que un dump de base de datos contenga las tablas y estructura esperadas
 * antes de proceder a la restauración en un entorno aislado.
 * @param {string} dumpContent
 * @param {string[]} requiredTables
 * @returns {{ restorable: boolean, missingTables: string[] }}
 */
export function validateDatabaseDump(dumpContent, requiredTables = []) {
    const missingTables = [];
    for (const table of requiredTables) {
        const tablePattern = new RegExp(`CREATE TABLE (?:IF NOT EXISTS )?(?:["\`]?\\w+["\`]?\\.)?["\`]?${table}["\`]?`, 'i');
        if (!tablePattern.test(dumpContent)) {
            missingTables.push(table);
        }
    }
    return {
        restorable: missingTables.length === 0,
        missingTables,
    };
}
