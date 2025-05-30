const Redis = require('ioredis');
const { initAuthCreds, BufferJSON } = require('baileys');
const crypto = require('crypto');

const ENV_PREFIX = process.env.BOT_ENV || 'dev'; // 'prod' for production
const CREDS_KEY = `${ENV_PREFIX}:wa:session:creds`;
const KEYS_PREFIX = `${ENV_PREFIX}:wa:session:keys`;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_SECRET = process.env.REDIS_SECRET_KEY || 'supersecret';

const redis = new Redis(REDIS_URL, {
    retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        console.log(`Redis reconnect in ${delay}ms...`);
        return delay;
    },
    reconnectOnError(err) {
        const triggers = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
        return triggers.some(e => err.message.includes(e));
    }
});

// Logging Redis events
redis.on('connect', () => console.log('✅ Redis connected.'));
redis.on('error', err => console.error(`❌ Redis error: ${err.message}`));
redis.on('reconnecting', () => console.warn('🔄 Reconnecting to Redis...'));
redis.on('end', () => console.warn('🔌 Redis connection closed.'));

// --- Encryption Utilities ---
const AES_KEY = crypto.createHash('sha256').update(REDIS_SECRET).digest();

function encrypt(dataBuffer) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', AES_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);
    return Buffer.concat([iv, encrypted]); // Prepend IV for decryption
}

function decrypt(dataBuffer) {
    const iv = dataBuffer.slice(0, 16);
    const encrypted = dataBuffer.slice(16);
    const decipher = crypto.createDecipheriv('aes-256-cbc', AES_KEY, iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

// --- Main Redis Auth State ---
async function useRedisAuthState() {
    let creds = initAuthCreds();

    try {
        const stored = await redis.getBuffer(CREDS_KEY);
        if (stored) {
            creds = BufferJSON.decode(decrypt(stored));
            console.log('✅ Loaded WA credentials from Redis.');
        }
    } catch (err) {
        console.error('⚠️ Failed to load WA creds from Redis, using in-memory fallback.');
    }

    const saveCreds = async () => {
        try {
            const encoded = BufferJSON.encode(creds);
            const encrypted = encrypt(encoded);
            await redis.set(CREDS_KEY, encrypted, 'EX', 86400); // 1 day TTL
            console.log('✅ WA credentials saved to Redis.');
        } catch (err) {
            console.error('❌ Failed to save WA creds to Redis:', err.message);
        }
    };

    const keyStore = {
        get: async (type, ids) => {
            const data = {};
            const pipeline = redis.pipeline();
            ids.forEach(id => pipeline.getBuffer(`${KEYS_PREFIX}:${type}:${id}`));
            const results = await pipeline.exec();

            ids.forEach((id, i) => {
                const [err, value] = results[i];
                if (!err && value) {
                    data[id] = value;
                }
            });

            return data;
        },

        set: async (keyData) => {
            const pipeline = redis.pipeline();
            for (const category in keyData) {
                for (const id in keyData[category]) {
                    const key = `${KEYS_PREFIX}:${category}:${id}`;
                    const buffer = keyData[category][id];
                    pipeline.set(key, buffer, 'EX', 604800); // 7 days TTL
                }
            }
            await pipeline.exec();
        }
    };

    return { state: { creds, keys: keyStore }, saveCreds };
}

module.exports = { useRedisAuthState };
