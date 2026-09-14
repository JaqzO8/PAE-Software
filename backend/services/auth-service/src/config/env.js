require('dotenv').config();

const parseNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const config = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 3001,
    
    // Database
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || 5432,
    DB_NAME: process.env.DB_NAME || 'auth_db',
    DB_USER: process.env.DB_USER || 'auth_user',
    DB_PASSWORD: process.env.DB_PASSWORD || process.env.AUTH_DB_PASSWORD || '',
    
    // JWT
    JWT_SECRET: process.env.JWT_SECRET || '',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    
    // Redis
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    
    // Security
    BCRYPT_ROUNDS: parseNumber(process.env.BCRYPT_ROUNDS, 10),
    MAX_LOGIN_ATTEMPTS: parseNumber(process.env.MAX_LOGIN_ATTEMPTS, 5),
    LOCKOUT_TIME: parseNumber(process.env.LOCKOUT_TIME, 900000),

    // Observability and performance
    LOG_SQL: process.env.LOG_SQL === 'true',
    DB_POOL_MAX: parseNumber(process.env.AUTH_DB_POOL_MAX || process.env.DB_POOL_MAX, 20),
    DB_POOL_MIN: parseNumber(process.env.AUTH_DB_POOL_MIN || process.env.DB_POOL_MIN, 0),
    DB_POOL_ACQUIRE_MS: parseNumber(process.env.DB_POOL_ACQUIRE_MS, 30000),
    DB_POOL_IDLE_MS: parseNumber(process.env.DB_POOL_IDLE_MS, 10000),
    PREFERENCES_CACHE_TTL_SECONDS: parseNumber(process.env.AUTH_PREFERENCES_CACHE_TTL_SECONDS, 120),
};

const weakJwtSecrets = ['default_jwt_secret', 'dev_secret_no_importa', 'change-me'];

if (config.NODE_ENV === 'production' && (weakJwtSecrets.includes(config.JWT_SECRET) || config.JWT_SECRET.length < 32)) {
    throw new Error('JWT_SECRET seguro es requerido en produccion');
}

if (config.NODE_ENV === 'production' && !config.DB_PASSWORD) {
    throw new Error('DB_PASSWORD es requerido en produccion');
}

module.exports = config;
