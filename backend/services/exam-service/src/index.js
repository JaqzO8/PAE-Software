const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/env');
const { testConnection, syncDatabase } = require('./config/database');
const {
    seedExamData,
    seedAnalyticsSettings,
    seedAchievementDefinitions,
    seedGamificationSettings,
} = require('./models');
const learningRoutes = require('./routes/learningRoutes');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const { attachLearningSocket } = require('./realtime/learningSocket');

const app = express();
const server = http.createServer(app);
attachLearningSocket(server);
app.set('trust proxy', 1);

const allowedOrigins = [
    config.FRONTEND_URL,
    config.FRONTEND_URL.replace('localhost', '127.0.0.1'),
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

app.use(helmet());
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/learning', learningRoutes);

app.get('/api/learning/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Exam Service is healthy',
        timestamp: new Date().toISOString(),
    });
});

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
    try {
        console.log('Iniciando Exam Service...');
        await testConnection();
        await syncDatabase();
        await seedExamData();
        await seedAnalyticsSettings();
        await seedAchievementDefinitions();
        await seedGamificationSettings();
        server.listen(config.PORT, () => {
            console.log(`Exam Service escuchando en puerto ${config.PORT}`);
        });
    } catch (error) {
        console.error('Error al iniciar Exam Service:', error);
        process.exit(1);
    }
};

startServer();
