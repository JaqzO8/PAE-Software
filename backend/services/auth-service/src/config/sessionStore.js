const Redis = require('ioredis');
const config = require('./env');
const isTest = config.NODE_ENV === 'test';
// Unit tests explicitly use this adapter; running services always use Redis.
const inMemoryFallback = new Map();
const expirations = new Map();
function memoryGet(key) {
    if ((expirations.get(key) ?? Infinity) <= Date.now()) { inMemoryFallback.delete(key); expirations.delete(key); }
    return inMemoryFallback.get(key) ?? null;
}
const redis = isTest ? {
    status: 'ready', on() {}, once() {}, disconnect() {}, quit: async () => 'OK',
    get: async key => memoryGet(key),
    setex: async (key, seconds, value) => { inMemoryFallback.set(key, String(value)); expirations.set(key, Date.now() + seconds * 1000); return 'OK'; },
    del: async key => { expirations.delete(key); return Number(inMemoryFallback.delete(key)); },
    getdel: async key => { const value = memoryGet(key); inMemoryFallback.delete(key); expirations.delete(key); return value; },
} : new Redis(config.REDIS_URL, {
    enableOfflineQueue: false, connectTimeout: 2500, commandTimeout: 2500,
    retryStrategy: times => Math.min(times * 100, 2000), maxRetriesPerRequest: 1,
});
if (!isTest) redis.on('error', () => console.error('Session store unavailable'));
function requireStore() {
    if (redis.status !== 'ready') throw Object.assign(new Error('Servicio de sesiones temporalmente no disponible'), { status: 503 });
}
async function read(key) { requireStore(); return redis.get(key); }
async function write(key, value, ttl) { requireStore(); return redis.setex(key, ttl, value); }
async function consume(key) { requireStore(); return redis.getdel(key); }
async function verifyMfaChallenge(id, code, userId) {
    if (!/^\d{6}$/.test(String(code))) return { status: 'invalid' };
    const key = `mfa_challenge:${id}`;
    requireStore();
    if (isTest) {
        const raw = memoryGet(key);
        if (!raw) return { status: 'expired' };
        const data = JSON.parse(raw);
        if (String(data.userId) !== String(userId)) return { status: 'invalid' };
        if (data.attempts >= 3) return { status: 'blocked' };
        if (String(code) === data.otpCode) {
            inMemoryFallback.delete(key); expirations.delete(key);
            return { status: 'accepted' };
        }
        data.attempts = (data.attempts || 0) + 1;
        inMemoryFallback.set(key, JSON.stringify(data));
        return { status: data.attempts >= 3 ? 'blocked' : 'invalid' };
    }
    const status = await redis.eval(`
        local raw=redis.call('GET',KEYS[1]); if not raw then return 'expired' end
        local data=cjson.decode(raw)
        if tostring(data.userId)~=ARGV[2] then return 'invalid' end
        if (data.attempts or 0)>=3 then return 'blocked' end
        if data.otpCode==ARGV[1] then redis.call('DEL',KEYS[1]); return 'accepted' end
        data.attempts=(data.attempts or 0)+1
        redis.call('SET',KEYS[1],cjson.encode(data),'KEEPTTL')
        if data.attempts>=3 then return 'blocked' end
        return 'invalid'
    `, 1, key, String(code), String(userId));
    return { status };
}
const redisUtils = {
    verifyMfaChallenge,
    addToBlacklist: (token, seconds) => write(`blacklist:${token}`, 'true', seconds),
    isBlacklisted: async token => (await read(`blacklist:${token}`)) !== null,
    setLoginAttempts: (email, attempts, ttl = 900) => write(`login_attempts:${email}`, attempts, ttl),
    getLoginAttempts: async email => Number(await read(`login_attempts:${email}`)) || 0,
    clearLoginAttempts: async email => { requireStore(); return redis.del(`login_attempts:${email}`); },
    storeResetToken: (token, userId, ttl = 900) => write(`password_reset:${token}`, userId, ttl),
    atomicConsumeResetToken: token => consume(`password_reset:${token}`),
    storeMfaChallenge: (id, data, ttl = 300) => write(`mfa_challenge:${id}`, JSON.stringify(data), ttl),
    getMfaChallenge: async id => JSON.parse(await read(`mfa_challenge:${id}`)),
    atomicConsumeMfaChallenge: async id => JSON.parse(await consume(`mfa_challenge:${id}`)),
    incrementMfaAttempts: async id => {
        const key = `mfa_challenge:${id}`;
        requireStore();
        if (isTest) {
            const raw = memoryGet(key);
            if (!raw) return 0;
            const data = JSON.parse(raw); data.attempts = (data.attempts || 0) + 1;
            inMemoryFallback.set(key, JSON.stringify(data)); return data.attempts;
        }
        return redis.eval(`local raw=redis.call('GET',KEYS[1]); if not raw then return 0 end;
            local data=cjson.decode(raw); data.attempts=(data.attempts or 0)+1;
            redis.call('SET',KEYS[1],cjson.encode(data),'KEEPTTL'); return data.attempts;`, 1, key);
    },
};
module.exports = { redis, inMemoryFallback, ...redisUtils };
