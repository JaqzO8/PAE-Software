const { createApp } = require('./app');
const config = require('./config/env');
const { testConnection, syncDatabase } = require('./config/database');
const {
    seedExamData,
    seedAnalyticsSettings,
    seedAchievementDefinitions,
    seedGamificationSettings,
} = require('./models');
const http = require('http');
const { attachLearningSocket } = require('./realtime/learningSocket');

const startServer = async () => {
    const app = createApp();
    const server = http.createServer(app);
    attachLearningSocket(server);
    try {
        console.log('Iniciando Exam Service...');
        await testConnection();
        await syncDatabase();
        await seedExamData();
        await seedAnalyticsSettings();
        await seedAchievementDefinitions();
        await seedGamificationSettings();
        return server.listen(config.PORT, () => {
            console.log(`Exam Service escuchando en puerto ${config.PORT}`);
        });
    } catch (error) {
        console.error('Error al iniciar Exam Service:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    startServer();
}

module.exports = { startServer };
