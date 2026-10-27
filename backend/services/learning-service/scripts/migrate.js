const { Pool } = require('pg');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

async function migrate(pool) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock(7102026)');
        await client.query('CREATE TABLE IF NOT EXISTS learning_migrations (version integer PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
        const migrations = [1, 2, 3];
        for (const version of migrations) {
            const migrationName = version === 1 ? 'gamification' : version === 2 ? 'planning' : 'pomodoro_history';
            const sql = readFileSync(path.join(__dirname, `../migrations/${String(version).padStart(3, '0')}_${migrationName}.sql`), 'utf8');
            const checksum = createHash('sha256').update(sql.replaceAll('\r\n', '\n')).digest('hex');
            const existing = await client.query('SELECT checksum FROM learning_migrations WHERE version=$1', [version]);
            if (existing.rowCount && existing.rows[0].checksum !== checksum) throw new Error(`Migration checksum mismatch for version ${version}`);
            if (!existing.rowCount) {
                await client.query(sql);
                await client.query('INSERT INTO learning_migrations(version, checksum) VALUES ($1,$2)', [version, checksum]);
            }
        }
        await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
}
async function main() {
    if (!process.env.LEARNING_DATABASE_URL && !process.env.PGDATABASE) throw new Error('Set LEARNING_DATABASE_URL or explicit PG connection variables for the pilot database');
    const pool = new Pool({ connectionString: process.env.LEARNING_DATABASE_URL });
    try { await migrate(pool); console.log('Learning migrations applied'); }
    finally { await pool.end(); }
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { migrate };
