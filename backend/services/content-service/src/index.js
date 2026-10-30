const { createApp } = require('./app');
const config = require('./config/env');
const { testConnection, syncDatabase } = require('./config/database');
const { initializeCategories, initializeStudySettings } = require('./models');
const { createSequelizeContentRepository } = require('./infrastructure/sequelizeContentRepository');
const { createOutboxPublisher } = require('./application/outboxPublisher');
const { startOutboxWorker } = require('./application/outboxWorker');
const { createHttpOutboxTransport } = require('./infrastructure/httpOutboxTransport');
const { runMigrations } = require('../scripts/migrate');

const startServer = async () => {
    const app = createApp();
    try {
        console.log('🚀 Iniciando Content Service...');

        // Verificar conexión a la base de datos
        await testConnection();
        const [tables] = await require('./config/database').sequelize.query("SELECT to_regclass('public.recursos') AS existing_resources");
        // Existing databases need new columns before Sequelize creates their indexes.
        if (tables[0].existing_resources) await runMigrations();
        await syncDatabase();
        if (!tables[0].existing_resources) await runMigrations();
        console.log('✅ Conexión a la base de datos exitosa');

        // Inicializar categorías por defecto
        await initializeCategories();
        await initializeStudySettings();
        console.log('✅ Categorías inicializadas');

        // Iniciar servidor
        const server = app.listen(config.PORT, () => {
            console.log(`✅ Content Service escuchando en puerto ${config.PORT}`);
            console.log(`📁 Archivos estáticos en: ${config.UPLOAD_PATH}`);
            console.log(`🔗 URL base: http://localhost:${config.PORT}`);
            console.log(`🖼️ Uploads: http://localhost:${config.PORT}/uploads/`);
        });
        if (config.OUTBOX_TRANSPORT_URL) {
            const stopWorker = startOutboxWorker({
                publisher: createOutboxPublisher({
                    repo: createSequelizeContentRepository(),
                    transport: createHttpOutboxTransport({ url: config.OUTBOX_TRANSPORT_URL }),
                }),
                intervalMs: config.OUTBOX_POLL_MS,
            });
            server.once('close', stopWorker);
        } else {
            console.warn('OUTBOX_TRANSPORT_URL no configurado; Outbox queda persistido para el worker compartido.');
        }
        return server;
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    // Manejo de errores no capturados
    process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ Promesa rechazada no manejada:', reason);
    });

    process.on('uncaughtException', (error) => {
        console.error('❌ Excepción no capturada:', error);
        process.exit(1);
    });

    startServer();
}

module.exports = { startServer };
