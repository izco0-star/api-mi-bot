import { createClient } from '@vercel/kv';

const getKVClient = () => {
  const url = process.env.KV_REST_API_URL || process.env.STORAGE_KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.STORAGE_KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('DB_CONFIG_MISSING');
  return createClient({ url, token });
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-ADMIN-TOKEN');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const adminToken = req.headers['x-admin-token'];
  const expectedToken = process.env.ADMIN_TOKEN || 'TagleSuances2030';

  if (adminToken !== expectedToken) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { action } = req.query;
  const kv = getKVClient();

  try {
    if (req.method === 'GET') {
      
      // 1. Estadísticas del Tablero
      if (action === 'getStats') {
        const userKeys = await kv.keys('user_v2:*');
        const licenseKeys = await kv.keys('license_v2:*');
        const banKeys = await kv.keys('banned:*');
        
        const now = Date.now();
        let activeToday = 0;
        for (const key of userKeys) {
            const u = await kv.get(key);
            if (u && (now - u.lastSeen) < 86400000) activeToday++;
        }

        return res.status(200).json({
            totalUsers: userKeys.length,
            activeToday,
            totalLicenses: licenseKeys.length,
            totalBans: banKeys.length
        });
      }

      // 2. Usuarios con filtros
      if (action === 'getUsers') {
        const keys = await kv.keys('user_v2:*');
        const users = [];
        for (const key of keys) {
            const id = key.split(':')[1];
            const data = await kv.get(key);
            const banned = await kv.get(`banned:${id}`);
            users.push({ id, ...data, banned: !!banned });
        }
        users.sort((a, b) => b.lastSeen - a.lastSeen);
        return res.status(200).json(users);
      }

      // 3. Licencias
      if (action === 'getLicenses') {
        const keys = await kv.keys('license_v2:*');
        const licenses = [];
        for (const key of keys) {
            const expiry = await kv.get(key);
            licenses.push({ id: key.split(':')[1], expiry });
        }
        return res.status(200).json(licenses);
      }

      // Default: Config
      const config = await kv.get('bot_config') || { s: false, m: "", license_days: 365, v: "1.0.0" };
      return res.status(200).json(config);
    }

    if (req.method === 'POST') {
      
      // 1. Banear/Desbanear
      if (action === 'banUser') {
        const { id, ban } = req.body;
        if (ban) await kv.set(`banned:${id}`, true);
        else await kv.del(`banned:${id}`);
        return res.status(200).json({ success: true });
      }

      // 2. Guardar Nota
      if (action === 'setUserNote') {
        const { id, note } = req.body;
        const userData = await kv.get(`user_v2:${id}`);
        if (userData) {
            userData.note = note;
            await kv.set(`user_v2:${id}`, userData);
        }
        return res.status(200).json({ success: true });
      }

      // 3. Licencia
      if (action === 'setLicense') {
        const { id, expiry } = req.body;
        if (expiry === 0) await kv.del(`license_v2:${id}`);
        else await kv.set(`license_v2:${id}`, expiry);
        return res.status(200).json({ success: true });
      }

      // 4. Config
      const newConfig = req.body;
      await kv.set('bot_config', newConfig);
      return res.status(200).json({ success: true, config: newConfig });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
