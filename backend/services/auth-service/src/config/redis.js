const Redis = require('ioredis');
const config = require('./env');

const redis = new Redis(config.REDIS_URL, {
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
    console.log('✅ Conexión a Redis establecida');
});

redis.on('error', (err) => {
    console.error('❌ Error de Redis:', err.message);
});

// Funciones de utilidad para tokens en blacklist
const redisUtils = {
    /**
     * Añade un token a la blacklist
     */
    addToBlacklist: async (token, expiresIn) => {
        try {
            await redis.setex(`blacklist:${token}`, expiresIn, 'true');
            return true;
        } catch (error) {
            console.error('Error añadiendo token a blacklist:', error);
            return false;
        }
    },

    /**
     * Verifica si un token está en la blacklist
     */
    isBlacklisted: async (token) => {
        try {
            const result = await redis.get(`blacklist:${token}`);
            return result !== null;
        } catch (error) {
            console.error('Error verificando blacklist:', error);
            return false;
        }
    },

    /**
     * Guarda contador de intentos de login fallidos
     */
    setLoginAttempts: async (email, attempts, expiresIn = 900) => {
        try {
            await redis.setex(`login_attempts:${email}`, expiresIn, attempts);
            return true;
        } catch (error) {
            console.error('Error guardando intentos de login:', error);
            return false;
        }
    },

    /**
     * Obtiene contador de intentos de login fallidos
     */
    getLoginAttempts: async (email) => {
        try {
            const attempts = await redis.get(`login_attempts:${email}`);
            return attempts ? parseInt(attempts) : 0;
        } catch (error) {
            console.error('Error obteniendo intentos de login:', error);
            return 0;
        }
    },

    /**
     * Limpia intentos de login después de un login exitoso
     */
    clearLoginAttempts: async (email) => {
        try {
            await redis.del(`login_attempts:${email}`);
            return true;
        } catch (error) {
            console.error('Error limpiando intentos de login:', error);
            return false;
        }
    },
};

module.exports = {
    redis,
    ...redisUtils,
};