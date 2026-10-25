const Redis = require('ioredis');
const config = require('./env');

const isTest = config.NODE_ENV === 'test' || process.env.NODE_ENV === 'test';
const inMemoryFallback = new Map();

// Si estamos en entorno de test, evitamos conectar a la red para pruebas ultra-rápidas y limpias
const redis = isTest
    ? {
          status: 'end',
          on: () => {},
          once: () => {},
          disconnect: () => {},
          quit: async () => 'OK',
      }
    : new Redis(config.REDIS_URL, {
          lazyConnect: true,
          enableOfflineQueue: false,
          connectTimeout: 5000,
          retryStrategy: (times) => Math.min(times * 50, 2000),
          maxRetriesPerRequest: 3,
      });

if (!isTest && typeof redis.on === 'function') {
    redis.on('connect', () => {
        console.log('✅ Conexión a Redis establecida');
    });

    redis.on('error', (err) => {
        console.error('❌ Error de Redis:', err.message);
    });
}

// Funciones de utilidad para tokens en blacklist y estado seguro
const redisUtils = {
    addToBlacklist: async (token, expiresIn) => {
        inMemoryFallback.set(`blacklist:${token}`, true);
        if (redis.status === 'ready') {
            try {
                await redis.setex(`blacklist:${token}`, expiresIn, 'true');
            } catch (err) {
                if (!isTest) console.error('Error añadiendo token a blacklist:', err);
            }
        }
        return true;
    },

    isBlacklisted: async (token) => {
        if (inMemoryFallback.has(`blacklist:${token}`)) {
            return true;
        }
        if (redis.status === 'ready') {
            try {
                const result = await redis.get(`blacklist:${token}`);
                return result !== null;
            } catch (err) {
                if (!isTest) console.error('Error verificando blacklist:', err);
            }
        }
        return false;
    },

    setLoginAttempts: async (email, attempts, expiresIn = 900) => {
        inMemoryFallback.set(`login_attempts:${email}`, attempts);
        if (redis.status === 'ready') {
            try {
                await redis.setex(`login_attempts:${email}`, expiresIn, attempts);
            } catch (err) {
                if (!isTest) console.error('Error guardando intentos de login:', err);
            }
        }
        return true;
    },

    getLoginAttempts: async (email) => {
        if (redis.status === 'ready') {
            try {
                const attempts = await redis.get(`login_attempts:${email}`);
                if (attempts) return parseInt(attempts, 10);
            } catch {}
        }
        return inMemoryFallback.get(`login_attempts:${email}`) || 0;
    },

    clearLoginAttempts: async (email) => {
        inMemoryFallback.delete(`login_attempts:${email}`);
        if (redis.status === 'ready') {
            try {
                await redis.del(`login_attempts:${email}`);
            } catch {}
        }
        return true;
    },

    atomicConsumeResetToken: async (token) => {
        const key = `password_reset:${token}`;
        if (inMemoryFallback.has(key)) {
            const val = inMemoryFallback.get(key);
            inMemoryFallback.delete(key);
            return val;
        }
        if (redis.status === 'ready') {
            try {
                const luaScript = `
                    local val = redis.call('GET', KEYS[1])
                    if val then
                        redis.call('DEL', KEYS[1])
                        return val
                    else
                        return nil
                    end
                `;
                return await redis.eval(luaScript, 1, key);
            } catch (err) {
                if (!isTest) console.error('Error consumiendo reset token:', err);
            }
        }
        return null;
    },

    storeResetToken: async (token, userId, ttlSeconds = 900) => {
        const key = `password_reset:${token}`;
        inMemoryFallback.set(key, userId);
        if (redis.status === 'ready') {
            try {
                await redis.setex(key, ttlSeconds, userId);
            } catch {}
        }
        return true;
    },

    storeMfaChallenge: async (challengeId, data, ttlSeconds = 300) => {
        const key = `mfa_challenge:${challengeId}`;
        inMemoryFallback.set(key, JSON.stringify(data));
        if (redis.status === 'ready') {
            try {
                await redis.setex(key, ttlSeconds, JSON.stringify(data));
            } catch {}
        }
        return true;
    },

    getMfaChallenge: async (challengeId) => {
        const key = `mfa_challenge:${challengeId}`;
        if (redis.status === 'ready') {
            try {
                const raw = await redis.get(key);
                if (raw) return JSON.parse(raw);
            } catch {}
        }
        const fallback = inMemoryFallback.get(key);
        return fallback ? JSON.parse(fallback) : null;
    },

    incrementMfaAttempts: async (challengeId) => {
        const key = `mfa_challenge:${challengeId}`;
        const raw = inMemoryFallback.get(key);
        if (raw) {
            const data = JSON.parse(raw);
            data.attempts = (data.attempts || 0) + 1;
            inMemoryFallback.set(key, JSON.stringify(data));
            return data.attempts;
        }
        return 0;
    },

    atomicConsumeMfaChallenge: async (challengeId) => {
        const key = `mfa_challenge:${challengeId}`;
        if (inMemoryFallback.has(key)) {
            const raw = inMemoryFallback.get(key);
            inMemoryFallback.delete(key);
            return JSON.parse(raw);
        }
        if (redis.status === 'ready') {
            try {
                const luaScript = `
                    local val = redis.call('GET', KEYS[1])
                    if val then
                        redis.call('DEL', KEYS[1])
                        return val
                    else
                        return nil
                    end
                `;
                const result = await redis.eval(luaScript, 1, key);
                return result ? JSON.parse(result) : null;
            } catch {}
        }
        return null;
    },
};

module.exports = {
    redis,
    inMemoryFallback,
    ...redisUtils,
};