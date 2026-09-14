const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');
const qualityRoutes = require('./routes/qualityRoutes');

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = [
    config.FRONTEND_URL,
    config.FRONTEND_URL.replace('localhost', '127.0.0.1'),
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '64kb' }));
app.use('/api/quality', rateLimit({ windowMs: 60 * 1000, max: config.RATE_LIMIT_MAX }));

app.get('/api/quality/health', (req, res) => {
    res.status(200).json({
        success: true,
        service: 'quality-service',
        projectKey: config.SONAR_PROJECT_KEY,
        sonarConfigured: Boolean(config.SONAR_TOKEN),
        timestamp: new Date().toISOString(),
    });
});

app.use('/api/quality', qualityRoutes);

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Recurso no encontrado' });
});

app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    console.error('Quality Service:', error.message);
    const status = error.statusCode >= 400 && error.statusCode < 600
        ? error.statusCode
        : 502;
    return res.status(status).json({
        success: false,
        message: status === 502
            ? 'No se pudieron consultar las metricas de calidad'
            : error.message,
    });
});

module.exports = app;
