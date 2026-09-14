require('dotenv').config();

const parsePositiveInteger = (value, fallback) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const stripTrailingSlash = (value) => value.replace(/\/+$/, '');

const config = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parsePositiveInteger(process.env.PORT, 3005),
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    JWT_SECRET: process.env.JWT_SECRET || '',
    SONARQUBE_URL: stripTrailingSlash(
        process.env.SONARQUBE_URL || 'http://host.docker.internal:9010',
    ),
    SONARQUBE_PUBLIC_URL: stripTrailingSlash(
        process.env.SONARQUBE_PUBLIC_URL || 'http://localhost:9010',
    ),
    SONAR_PROJECT_KEY: process.env.SONAR_PROJECT_KEY || 'pae-software',
    SONAR_TOKEN: process.env.SONAR_TOKEN || '',
    CACHE_TTL_SECONDS: parsePositiveInteger(process.env.SONAR_CACHE_TTL_SECONDS, 60),
    REQUEST_TIMEOUT_MS: parsePositiveInteger(process.env.SONAR_REQUEST_TIMEOUT_MS, 8000),
    RATE_LIMIT_MAX: parsePositiveInteger(process.env.QUALITY_RATE_LIMIT_MAX, 120),
};

if (config.NODE_ENV === 'production' && config.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET seguro es requerido en produccion');
}

if (config.NODE_ENV === 'production' && !config.SONAR_TOKEN) {
    throw new Error('SONAR_TOKEN es requerido en produccion');
}

module.exports = config;
