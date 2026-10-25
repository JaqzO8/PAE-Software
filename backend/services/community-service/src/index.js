const { createApp } = require('./app');
const config = require('./config/env');
const { testConnection, syncDatabase } = require('./config/database');
const { seedCommunityDefaults } = require('./services/communitySeedService');
const { repairCommunityDatabase } = require('./services/communityMaintenanceService');

const startServer = async () => {
    const app = createApp();
    try {
        console.log('🚀 Iniciando Community Service...');

        const dbConnected = await testConnection();
        if (!dbConnected) throw new Error('DB connection failed');

        await syncDatabase();
        await repairCommunityDatabase();
        await seedCommunityDefaults();

        return app.listen(config.PORT, () => {
            console.log('✅ ========================================');
            console.log(`✅ Community Service en puerto ${config.PORT}`);
            console.log(`✅ Ambiente: ${config.NODE_ENV}`);
            console.log('✅ ========================================');
        });
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    process.on('unhandledRejection', (err) => {
        console.error('❌ Unhandled Rejection:', err);
        process.exit(1);
    });

    startServer();
}

module.exports = { startServer };
