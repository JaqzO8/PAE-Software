require('dotenv').config();

const parseNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const config = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || process.env.COMMUNITY_PORT || 3002,
    
    // Database
    DB_HOST: process.env.DB_HOST || process.env.COMMUNITY_DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || process.env.COMMUNITY_DB_PORT || 5432,
    DB_NAME: process.env.DB_NAME || process.env.COMMUNITY_DB_NAME || 'community_db',
    DB_USER: process.env.DB_USER || process.env.COMMUNITY_DB_USER || 'community_user',
    DB_PASSWORD: process.env.DB_PASSWORD || process.env.COMMUNITY_DB_PASSWORD || '',
    
    // Redis
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    
    // JWT (mismo secret que auth-service para validar tokens)
    JWT_SECRET: process.env.JWT_SECRET || '',
    
    // Auth Service URL (para validar usuarios)
    AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    
    // Uploads
    MAX_FILE_SIZE: parseNumber(process.env.MAX_FILE_SIZE, 10 * 1024 * 1024),
    ALLOWED_FILE_TYPES: (process.env.COMMUNITY_ALLOWED_FILE_TYPES || 'application/pdf').split(',').map((type) => type.trim()).filter(Boolean),
    UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',

    // Community throttling/cache
    MESSAGE_RATE_LIMIT_MAX: parseNumber(process.env.COMMUNITY_MESSAGE_RATE_LIMIT_MAX, 12),
    MESSAGE_RATE_LIMIT_WINDOW_SECONDS: parseNumber(process.env.COMMUNITY_MESSAGE_RATE_LIMIT_WINDOW_SECONDS, 10),
    USER_CACHE_TTL_SECONDS: parseNumber(process.env.COMMUNITY_USER_CACHE_TTL_SECONDS, 300),

    // Observability and performance
    LOG_SQL: process.env.LOG_SQL === 'true',
    DB_POOL_MAX: parseNumber(process.env.COMMUNITY_DB_POOL_MAX || process.env.DB_POOL_MAX, 20),
    DB_POOL_MIN: parseNumber(process.env.COMMUNITY_DB_POOL_MIN || process.env.DB_POOL_MIN, 0),
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
