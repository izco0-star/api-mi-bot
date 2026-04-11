const { Redis } = require('@upstash/redis');

// Compatible con Vercel KV (Upstash) y con Upstash Marketplace directo
const redis = new Redis({
  url:   process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

const kv = {

  // ─── LICENCIAS ────────────────────────────────────────────────────────────────

  async getLicense(userId) {
    return await redis.get(`license:${userId}`);
  },

  async setLicense(userId, data) {
    return await redis.set(`license:${userId}`, data);
  },

  async deleteLicense(userId) {
    return await redis.del(`license:${userId}`);
  },

  async getAllLicenses() {
    const keys = await redis.keys('license:*');
    if (!keys.length) return [];
    const values = await redis.mget(...keys);
    return keys.map((key, i) => ({
      userId: key.replace('license:', ''),
      ...(values[i] || {}),
    }));
  },

  // ─── COLA DE COMANDOS TELEGRAM → JUEGO ───────────────────────────────────────

  async getTelegramQueue(userId) {
    return await redis.lrange(`tg:queue:${userId}`, 0, -1);
  },

  async pushTelegramCommand(userId, item) {
    await redis.rpush(`tg:queue:${userId}`, item);
  },

  async clearTelegramQueue(userId) {
    return await redis.del(`tg:queue:${userId}`);
  },

  // ─── NOTIFICACIONES BOT → TELEGRAM ───────────────────────────────────────────

  async pushNotification(userId, payload) {
    await redis.lpush(`tg:notif:${userId}`, payload);
    await redis.ltrim(`tg:notif:${userId}`, 0, 99);
  },

  async getAndClearNotifications(userId) {
    const items = await redis.lrange(`tg:notif:${userId}`, 0, -1);
    if (items.length) await redis.del(`tg:notif:${userId}`);
    return items;
  },
};

module.exports = { kv };
