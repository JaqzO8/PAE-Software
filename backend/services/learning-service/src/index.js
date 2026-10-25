const { createApp } = require('./app');
const { Pool } = require('pg');

function startServer() {
    const pool = new Pool({ connectionString: process.env.LEARNING_DATABASE_URL, connectionTimeoutMillis: 3000 });
    const server = createApp({ checkReady: async () => {
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
