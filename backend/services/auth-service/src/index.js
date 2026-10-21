const { createApp } = require('./app');
const config = require('./config/env');
const { testConnection, syncDatabase } = require('./config/database');
const { initializeRoles } = require('./models');

const startServer = async () => {
    const app = createApp();
    try {
        console.log('🚀 Iniciando Auth Service...');

        // 1. Probar conexión a la base de datos
        console.log('📦 Conectando a PostgreSQL...');
        const dbConnected = await testConnection();
        if (!dbConnected) {
            throw new Error('No se pudo conectar a la base de datos');
        }

        // 2. Crear tablas nuevas declaradas por modelos sin modificar datos existentes.
        console.log('ðŸ§± Sincronizando modelos transversales...');
        await syncDatabase();

        // 3. Inicializar roles por defecto
        console.log('👥 Inicializando roles...');
        await initializeRoles();

        // 4. Iniciar servidor
        return app.listen(config.PORT, () => {
            console.log('');
            console.log('✅ ========================================');
            console.log(`✅ Auth Service corriendo en puerto ${config.PORT}`);
            console.log(`✅ Ambiente: ${config.NODE_ENV}`);
            console.log(`✅ Database: ${config.DB_NAME}`);
            console.log('✅ ========================================');
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    // Manejo de errores no capturados
    process.on('unhandledRejection', (err) => {
        console.error('❌ Unhandled Rejection:', err);
        process.exit(1);
    });

    process.on('uncaughtException', (err) => {
        console.error('❌ Uncaught Exception:', err);
        process.exit(1);
    });

    // Iniciar servidor
    startServer();
}

module.exports = { startServer };
