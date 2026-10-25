function createApp() {
    const express = require('express');
    const cors = require('cors');
    const helmet = require('helmet');
    const rateLimit = require('express-rate-limit');
    const config = require('./config/env');
    const routes = require('./routes');
    const { errorHandler, notFound } = require('./middlewares/errorMiddleware');

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

    // Downloads require current membership; there is no public uploads directory.

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
            const cleanMethod = String(req.method || '').replace(/[\r\n]/g, '');
            const cleanPath = String(req.path || '').replace(/[\r\n]/g, '');
            console.log(`${new Date().toISOString()} - ${cleanMethod} ${cleanPath}`);
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


    return app;
}

module.exports = { createApp };
