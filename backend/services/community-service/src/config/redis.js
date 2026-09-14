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
    console.log('✅ Conexión a Redis establecida (Community Service)');
});

redis.on('error', (err) => {
    console.error('❌ Error de Redis:', err.message);
});

// Utilidades para comunidades
const redisUtils = {
    // Cache de comunidades
    cacheCommunity: async (communityId, data, ttl = 3600) => {
        try {
            await redis.setex(`community:${communityId}`, ttl, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error caching community:', error);
            return false;
        }
    },

    getCachedCommunity: async (communityId) => {
        try {
            const data = await redis.get(`community:${communityId}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting cached community:', error);
            return null;
        }
    },

    invalidateCommunityCache: async (communityId) => {
        try {
            await redis.del(`community:${communityId}`);
            return true;
        } catch (error) {
            console.error('Error invalidating cache:', error);
            return false;
        }
    },

    // Presencia en tiempo real
    setUserOnline: async (userId, communityId) => {
        try {
            await redis.sadd(`community:${communityId}:online`, userId);
            await redis.expire(`community:${communityId}:online`, 300); // 5 min
            return true;
        } catch (error) {
            console.error('Error setting user online:', error);
            return false;
        }
    },

    getOnlineUsers: async (communityId) => {
        try {
            return await redis.smembers(`community:${communityId}:online`);
        } catch (error) {
            console.error('Error getting online users:', error);
            return [];
        }
    },
};

module.exports = {
    redis,
    ...redisUtils,
};