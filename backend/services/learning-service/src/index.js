const { createApp } = require('./app');
const { Pool } = require('pg');
const { createPlanningUseCases } = require('./modules/planning/application/planningUseCases');
const { createPostgresPlanningRepository } = require('./modules/planning/infrastructure/postgresPlanningRepository');
const { authenticate } = require('./middlewares/jwtAuth');
const { migrate } = require('../scripts/migrate');

async function startServer() {
    const pool = new Pool({ connectionString: process.env.LEARNING_DATABASE_URL, connectionTimeoutMillis: 3000 });
    try { await migrate(pool); } catch (error) { await pool.end(); throw error; }
    const planningUseCases = createPlanningUseCases({
        unitOfWork: async (work) => {
            const client = await pool.connect();
            try { await client.query('BEGIN'); const result = await work(createPostgresPlanningRepository(client)); await client.query('COMMIT'); return result; }
            catch (error) { await client.query('ROLLBACK'); throw error; }
            finally { client.release(); }
        },
    });
    const server = createApp({ planningUseCases, authenticate, checkReady: async () => {
        const result = await pool.query('SELECT 1 FROM learning_migrations WHERE version IN (1,2,3)');
        if (result.rowCount !== 3) throw new Error('Migrations not applied');
    } })
        .listen(Number(process.env.LEARNING_PORT || 3006), process.env.LEARNING_HOST || '127.0.0.1');
    const shutdown = () => server.close(() => pool.end());
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
    return server;
}
if (require.main?.filename === __filename) startServer().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { startServer };
