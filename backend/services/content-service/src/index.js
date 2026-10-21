const { createApp } = require('./app');
const config = require('./config/env');
const { testConnection, syncDatabase } = require('./config/database');
const { initializeCategories, initializeStudySettings, initializePlanningSettings } = require('./models');

const startServer = async () => {
    const app = createApp();
    try {
        console.log('🚀 Iniciando Content Service...');

        // Verificar conexión a la base de datos
        await testConnection();
        await syncDatabase();
        console.log('✅ Conexión a la base de datos exitosa');

        // Inicializar categorías por defecto
        await initializeCategories();
        await initializeStudySettings();
        await initializePlanningSettings();
        console.log('✅ Categorías inicializadas');

        // Iniciar servidor
        return app.listen(config.PORT, () => {
            console.log(`✅ Content Service escuchando en puerto ${config.PORT}`);
            console.log(`📁 Archivos estáticos en: ${config.UPLOAD_PATH}`);
            console.log(`🔗 URL base: http://localhost:${config.PORT}`);
            console.log(`🖼️ Uploads: http://localhost:${config.PORT}/uploads/`);
        });
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
