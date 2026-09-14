const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./config/env');
const { testConnection, syncDatabase } = require('./config/database');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middlewares/errorMiddleware');
const { seedCommunityDefaults } = require('./services/communitySeedService');
const { repairCommunityDatabase } = require('./services/communityMaintenanceService');

const app = express();

app.set('trust proxy', 1);

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = [
    frontendUrl,
    frontendUrl.replace('localhost', '127.0.0.1'),
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

// Middlewares globales
app.use(helmet());
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (PDFs)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.COMMUNITY_RATE_LIMIT_MAX || 3000),
    message: 'Demasiadas peticiones',
});
app.use('/api/community', limiter);

// Logging en desarrollo
if (config.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// Rutas
app.get('/', (req, res) => {
    res.json({
        service: 'PAE Community Service',
        version: '1.0.0',
        status: 'running',
    });
});

app.use('/api/community', routes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

// Iniciar servidor
const startServer = async () => {
    try {
        console.log('🚀 Iniciando Community Service...');

        const dbConnected = await testConnection();
        if (!dbConnected) throw new Error('DB connection failed');

        await syncDatabase();
        await repairCommunityDatabase();
        await seedCommunityDefaults();

        app.listen(config.PORT, () => {
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

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
    process.exit(1);
});

startServer();
