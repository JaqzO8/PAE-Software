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
    PORT: process.env.PORT || 3004,
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || 5436,
    DB_NAME: process.env.DB_NAME || 'exam_db',
    DB_USER: process.env.DB_USER || 'exam_user',
    DB_PASSWORD: process.env.DB_PASSWORD || process.env.EXAM_DB_PASSWORD || '',
    JWT_SECRET: process.env.JWT_SECRET || '',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    SOCKET_MAX_CONNECTIONS: parseNumber(process.env.SOCKET_MAX_CONNECTIONS, 500),
    SOCKET_PING_TIMEOUT_MS: parseNumber(process.env.SOCKET_PING_TIMEOUT_MS, 20000),
    SOCKET_PING_INTERVAL_MS: parseNumber(process.env.SOCKET_PING_INTERVAL_MS, 25000),
    SOCKET_MAX_HTTP_BUFFER_BYTES: parseNumber(process.env.SOCKET_MAX_HTTP_BUFFER_BYTES, 32768),
    LOG_SQL: process.env.LOG_SQL === 'true',
    DB_POOL_MAX: parseNumber(process.env.EXAM_DB_POOL_MAX || process.env.DB_POOL_MAX, 25),
    DB_POOL_MIN: parseNumber(process.env.EXAM_DB_POOL_MIN || process.env.DB_POOL_MIN, 0),
    DB_POOL_ACQUIRE_MS: parseNumber(process.env.DB_POOL_ACQUIRE_MS, 30000),
    DB_POOL_IDLE_MS: parseNumber(process.env.DB_POOL_IDLE_MS, 10000),
    GAMIFICATION_SUMMARY_CACHE_TTL_SECONDS: parseNumber(process.env.GAMIFICATION_SUMMARY_CACHE_TTL_SECONDS, 15),
    GAMIFICATION_LEADERBOARD_CACHE_TTL_SECONDS: parseNumber(process.env.GAMIFICATION_LEADERBOARD_CACHE_TTL_SECONDS, 15),
};

const weakJwtSecrets = ['default_jwt_secret', 'dev_secret_no_importa', 'change-me'];

if (config.NODE_ENV === 'production' && (weakJwtSecrets.includes(config.JWT_SECRET) || config.JWT_SECRET.length < 32)) {
    throw new Error('JWT_SECRET seguro es requerido en produccion');
}

if (config.NODE_ENV === 'production' && !config.DB_PASSWORD) {
    throw new Error('DB_PASSWORD es requerido en produccion');
}

module.exports = config;
