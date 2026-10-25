/**
 * @file backupRestore.test.cjs
 * Pruebas para generación de manifiesto SHA-256 e integridad de respaldos (RIC-15 / RQ33 / M8-HU24).
 */

const test = require('node:test');
const assert = require('node:assert/strict');

test('RIC-15: createBackupManifest genera manifiesto con SHA-256 y metadatos RPO/RTO', async () => {
    const { createBackupManifest, calculateChecksum } = await import('../../scripts/backup-restore.mjs');

    const authSql = 'CREATE TABLE usuarios (id INT, email VARCHAR); INSERT INTO usuarios VALUES (1, "a@b.c");';
    const contentSql = 'CREATE TABLE recursos (id INT, titulo VARCHAR);';

    const backups = [
        { name: 'auth_db-20261022.sql', database: 'auth_db', content: authSql },
        { name: 'content_db-20261022.sql', database: 'content_db', content: contentSql },
    ];

    const manifest = createBackupManifest(backups, {
        timestamp: '2026-10-22T20:00:00.000Z',
        retentionDays: 14,
    });

    assert.equal(manifest.schemaVersion, '1.0.0');
    assert.equal(manifest.rpoTargetHours, 24);
    assert.equal(manifest.rtoTargetHours, 2);
    assert.equal(manifest.retentionDays, 14);
    assert.equal(manifest.totalFiles, 2);

    const authFile = manifest.files.find(f => f.database === 'auth_db');
    assert.ok(authFile);
    assert.equal(authFile.checksum, calculateChecksum(authSql));
});

test('RIC-15: verifyBackupIntegrity detecta archivo faltante o corrupción de bytes', async () => {
    const { createBackupManifest, verifyBackupIntegrity } = await import('../../scripts/backup-restore.mjs');

    const goodSql = 'CREATE TABLE usuarios (id INT);';
    const backups = [
        { name: 'auth_db.sql', database: 'auth_db', content: goodSql },
    ];
    const manifest = createBackupManifest(backups);

    // Verificación exitosa
    const okCheck = verifyBackupIntegrity(manifest, { 'auth_db.sql': goodSql });
    assert.equal(okCheck.valid, true);
    assert.equal(okCheck.errors.length, 0);

    // Archivo corrupto (modificado)
    const corruptCheck = verifyBackupIntegrity(manifest, { 'auth_db.sql': goodSql + ' -- corrupted' });
    assert.equal(corruptCheck.valid, false);
    assert.match(corruptCheck.errors[0], /Checksum corrupto/);

    // Archivo ausente
    const missingCheck = verifyBackupIntegrity(manifest, {});
    assert.equal(missingCheck.valid, false);
    assert.match(missingCheck.errors[0], /Archivo ausente/);
});

test('RIC-15: validateDatabaseDump valida presencia de tablas requeridas antes del restore', async () => {
    const { validateDatabaseDump } = await import('../../scripts/backup-restore.mjs');

    const sampleDump = `
        CREATE TABLE "usuarios" (id INT PRIMARY KEY);
        CREATE TABLE IF NOT EXISTS preferencias (user_id INT);
        CREATE TABLE support_tickets (id INT);
    `;

    const validResult = validateDatabaseDump(sampleDump, ['usuarios', 'preferencias', 'support_tickets']);
    assert.equal(validResult.restorable, true);
    assert.equal(validResult.missingTables.length, 0);

    const invalidResult = validateDatabaseDump(sampleDump, ['usuarios', 'solicitudes_docentes']);
    assert.equal(invalidResult.restorable, false);
    assert.deepEqual(invalidResult.missingTables, ['solicitudes_docentes']);
});
