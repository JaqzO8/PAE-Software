const { createApp } = require('./app');
const { Pool } = require('pg');
const { createPlanningUseCases } = require('./modules/planning/application/planningUseCases');
const { createPostgresPlanningRepository } = require('./modules/planning/infrastructure/postgresPlanningRepository');
const { authenticate } = require('./middlewares/jwtAuth');

function startServer() {
    const pool = new Pool({ connectionString: process.env.LEARNING_DATABASE_URL, connectionTimeoutMillis: 3000 });
    const planningUseCases = createPlanningUseCases({
        unitOfWork: async (work) => {
            const client = await pool.connect();
            try { await client.query('BEGIN'); const result = await work(createPostgresPlanningRepository(client)); await client.query('COMMIT'); return result; }
            catch (error) { await client.query('ROLLBACK'); throw error; }
            finally { client.release(); }
        },
    });
    const server = createApp({ planningUseCases, authenticate, checkReady: async () => {
        const result = await pool.query('SELECT 1 FROM learning_migrations WHERE version=1');
        if (!result.rowCount) throw new Error('Migration not applied');
    } })
        .listen(Number(process.env.LEARNING_PORT || 3006), process.env.LEARNING_HOST || '127.0.0.1');
    const shutdown = () => server.close(() => pool.end());
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
    return server;
}
if (require.main === module) startServer();
module.exports = { startServer };
