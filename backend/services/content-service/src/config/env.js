require('dotenv').config();

const parseNumber = (value, fallback) => {
    if (value === undefined || value === null || String(value).trim() === '') {
        return fallback;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const config = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 3003,
    
    // Database
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || 5434,
    DB_NAME: process.env.DB_NAME || 'content_db',
    DB_USER: process.env.DB_USER || 'content_user',
    DB_PASSWORD: process.env.DB_PASSWORD || process.env.CONTENT_DB_PASSWORD || '',
    
    // Auth Service (para validar tokens)
    AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    JWT_SECRET: process.env.JWT_SECRET || '',
    
    // File Upload
    UPLOAD_PATH: process.env.UPLOAD_PATH || '/app/uploads',
    MAX_FILE_SIZE: parseNumber(process.env.MAX_FILE_SIZE, 52428800),
    ALLOWED_FILE_TYPES: {
        pdf: ['application/pdf'],
        video: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'],
        audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    },
    
    // Frontend
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

    // Observability and performance
    LOG_SQL: process.env.LOG_SQL === 'true',
    DB_POOL_MAX: parseNumber(process.env.CONTENT_DB_POOL_MAX || process.env.DB_POOL_MAX, 20),
    DB_POOL_MIN: parseNumber(process.env.CONTENT_DB_POOL_MIN || process.env.DB_POOL_MIN, 0),
    DB_POOL_ACQUIRE_MS: parseNumber(process.env.DB_POOL_ACQUIRE_MS, 30000),
    DB_POOL_IDLE_MS: parseNumber(process.env.DB_POOL_IDLE_MS, 10000),
};

const weakJwtSecrets = ['default_jwt_secret', 'dev_secret_no_importa', 'change-me'];

if (config.NODE_ENV === 'production' && (weakJwtSecrets.includes(config.JWT_SECRET) || config.JWT_SECRET.length < 32)) {
    throw new Error('JWT_SECRET seguro es requerido en produccion');
}

if (config.NODE_ENV === 'production' && !config.DB_PASSWORD) {
    throw new Error('DB_PASSWORD es requerido en produccion');
}

module.exports = config;
