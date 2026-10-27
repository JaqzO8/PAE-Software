const { Pool } = require('pg');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

async function migrate(pool) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock(7102027)');
        await client.query('CREATE TABLE IF NOT EXISTS content_migrations (version integer PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
        const migrations = [
            [1, 'publication_integrity'],
            [2, 'legacy_planning_timezone'],
        ];
        for (const [version, name] of migrations) {
            const sql = readFileSync(path.join(__dirname, `../migrations/${String(version).padStart(3, '0')}_${name}.sql`), 'utf8');
            const checksum = createHash('sha256').update(sql.replaceAll('\r\n', '\n')).digest('hex');
            const existing = await client.query('SELECT checksum FROM content_migrations WHERE version=$1', [version]);
            if (existing.rowCount && existing.rows[0].checksum !== checksum) throw new Error(`Migration checksum mismatch for version ${version}`);
            if (!existing.rowCount) {
                await client.query(sql);
                await client.query('INSERT INTO content_migrations(version, checksum) VALUES ($1,$2)', [version, checksum]);
            }
        }
        await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
}

async function main() {
    const hasConnection = process.env.CONTENT_DATABASE_URL || process.env.PGDATABASE || process.env.DB_NAME || process.env.CONTENT_DB_NAME;
    if (!hasConnection) throw new Error('Set CONTENT_DATABASE_URL or DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD for the content database');
    const pool = new Pool({
        connectionString: process.env.CONTENT_DATABASE_URL,
        host: process.env.DB_HOST || process.env.CONTENT_DB_HOST,
        port: process.env.DB_PORT || process.env.CONTENT_DB_PORT,
        database: process.env.DB_NAME || process.env.CONTENT_DB_NAME,
        user: process.env.DB_USER || process.env.CONTENT_DB_USER,
        password: process.env.DB_PASSWORD || process.env.CONTENT_DB_PASSWORD,
    });
    try { await migrate(pool); console.log('Content migrations applied'); }
    finally { await pool.end(); }
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { migrate, runMigrations: main };
