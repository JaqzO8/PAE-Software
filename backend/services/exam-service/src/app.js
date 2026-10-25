function createApp() {
    const express = require('express');
    const cors = require('cors');
    const helmet = require('helmet');
    const config = require('./config/env');
    const learningRoutes = require('./routes/learningRoutes');
    const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

    const app = express();
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


    return app;
}

module.exports = { createApp };
