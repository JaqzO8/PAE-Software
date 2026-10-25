const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

async function migrate(sequelize) {
    await sequelize.transaction(async transaction => {
        await sequelize.query("SELECT pg_advisory_xact_lock(hashtext('community_schema_migrations'))", { transaction });
        await sequelize.query('CREATE TABLE IF NOT EXISTS community_schema_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())', { transaction });
        const directory = path.join(__dirname, '../migrations');
        const migrationFiles = fs.readdirSync(directory).filter(name => /^\d+_.+\.sql$/.test(name)).sort();
        await migrationFiles.reduce(async (previousPromise, name) => {
            await previousPromise;
            const sql = fs.readFileSync(path.join(directory, name), 'utf8');
            const checksum = createHash('sha256').update(sql).digest('hex');
            const [rows] = await sequelize.query('SELECT checksum FROM community_schema_migrations WHERE name = :name', { replacements: { name }, transaction });
            if (rows.length) {
                if (rows[0].checksum !== checksum) throw new Error(`Migration changed: ${name}`);
                return;
            }
            await sequelize.query(sql, { transaction });
            await sequelize.query('INSERT INTO community_schema_migrations(name, checksum) VALUES (:name, :checksum)', { replacements: { name, checksum }, transaction });
        }, Promise.resolve());
    });
}
if (require.main === module) {
    const { sequelize } = require('../src/config/database');
    migrate(sequelize).then(() => console.log('Community migrations applied')).catch(() => { console.error('Community migration failed'); process.exitCode = 1; }).finally(() => sequelize.close());
}
module.exports = { migrate };
