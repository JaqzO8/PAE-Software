function createApp() {
    // backend/services/content-service/src/index.js

    const express = require('express');
    const cors = require('cors');
    const helmet = require('helmet');
    const rateLimit = require('express-rate-limit');
    const config = require('./config/env');
    const { sequelize } = require('./config/database');
    const { errorHandler, notFound } = require('./middlewares/errorMiddleware');

    // Importar rutas
    const statsRoutes = require('./routes/statsRoutes');
    const repositoryRoutes = require('./routes/repositoryRoutes');
    const resourceRoutes = require('./routes/resourceRoutes');
    const favoriteRoutes = require('./routes/favoriteRoutes');
    const categoryRoutes = require('./routes/categoryRoutes');
    const lessonRoutes = require('./routes/lessonRoutes');

    const app = express();
    app.set('trust proxy', 1);

    const allowedOrigins = [
        config.FRONTEND_URL,
        config.FRONTEND_URL.replace('localhost', '127.0.0.1'),
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ];

    // =================================================
    // MIDDLEWARES BÁSICOS
    // =================================================
    app.use(helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" } // ✅ Permite cargar recursos de otros orígenes
    }));

    app.use(cors({
        origin: allowedOrigins,
        credentials: true,
    }));

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // =================================================
    // ACCESO CONTROLADO Y SEGURO A ARCHIVOS - UPLOADS (JUA-02)
    // =================================================
    const { secureUploadsMiddleware } = require('./middlewares/secureUploadsMiddleware');
    app.use('/uploads', secureUploadsMiddleware);

    // =================================================
    // RATE LIMITING
    // =================================================
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: Number(process.env.CONTENT_RATE_LIMIT_MAX || 3000),
    });
    app.use('/api/content', limiter);

    // =================================================
    // RUTAS DE LA API
    // =================================================
    // IMPORTANTE: Stats debe ir primero
    app.use('/api/content/stats', statsRoutes);
    app.use('/api/content/repositories', repositoryRoutes);
    app.use('/api/content/resources', resourceRoutes);
    app.use('/api/content/lessons', lessonRoutes);
    app.use('/api/content/favorites', favoriteRoutes);
    app.use('/api/content/categories', categoryRoutes);
    app.use('/api/content/tags', categoryRoutes);

    // Health check
    app.get('/api/content/health', (req, res) => {
        res.status(200).json({
            success: true,
            message: 'Content Service is healthy',
            timestamp: new Date().toISOString(),
        });
    });

    app.get('/api/content/ready', async (req, res) => {
        try {
            await sequelize.authenticate();
            return res.status(200).json({ success: true, status: 'ready', timestamp: new Date().toISOString() });
        } catch (error) {
            return res.status(503).json({ success: false, status: 'not-ready', timestamp: new Date().toISOString() });
        }
    });

    // =================================================
    // MANEJO DE ERRORES
    // =================================================
    app.use(notFound);
    app.use(errorHandler);


    return app;
}

module.exports = { createApp };
