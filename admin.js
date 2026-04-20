import { createClient } from '@vercel/kv';

// Helper para inicializar KV con soporte para prefijos (como STORAGE_)
const getKVClient = () => {
  const url = process.env.KV_REST_API_URL || process.env.STORAGE_KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.STORAGE_KV_REST_API_TOKEN;
  
  if (!url || !token) {
    throw new Error('Configuración de base de datos ausente.');
  }
  
  return createClient({ url, token });
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-ADMIN-TOKEN');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const adminToken = req.headers['x-admin-token'];
  const expectedToken = process.env.ADMIN_TOKEN || 'TagleSuances2030';

  if (adminToken !== expectedToken) {
    return res.status(401).json({ error: 'Token de acceso incorrecto.' });
  }

  const { action } = req.query;

  try {
    const kv = getKVClient();

    // --- ACCIONES DE LECTURA (GET) ---
    if (req.method === 'GET') {
      
      // 1. Obtener Usuarios Rastreados
      if (action === 'getUsers') {
        const keys = await kv.keys('user_v2:*');
        if (keys.length === 0) return res.status(200).json([]);
        
        const users = [];
        for (const key of keys) {
            const data = await kv.get(key);
            if (data) {
                users.push({ id: key.split(':')[1], ...data });
            }
        }
        // Ordenar por última conexión (más recientes primero)
        users.sort((a, b) => b.lastSeen - a.lastSeen);
        return res.status(200).json(users);
      }

      // 2. Obtener Licencias Individuales
      if (action === 'getLicenses') {
        const keys = await kv.keys('license_v2:*');
        const licenses = [];
        for (const key of keys) {
            const expiry = await kv.get(key);
            licenses.push({ id: key.split(':')[1], expiry });
        }
        return res.status(200).json(licenses);
      }

      // 3. Obtener Configuración Global (Legacy / Default)
      const config = await kv.get('bot_config') || {
        announce: null,
        s: false,
        m: "",
        v: null,
        license_days: 365
      };
      return res.status(200).json(config);
    }

    // --- ACCIONES DE ESCRITURA (POST) ---
    if (req.method === 'POST') {
      
      // 1. Configurar Licencia Individual
      if (action === 'setLicense') {
        const { id, expiry } = req.body;
        if (!id) return res.status(400).json({ error: 'ID de usuario requerido' });
        
        if (expiry === 0) {
            await kv.del(`license_v2:${id}`);
            return res.status(200).json({ success: true, message: 'Licencia eliminada (usará la global)' });
        } else {
            await kv.set(`license_v2:${id}`, expiry);
            return res.status(200).json({ success: true, message: 'Licencia actualizada' });
        }
      }

      // 2. Eliminar Usuario del Rastreo
      if (action === 'deleteUser') {
        const { id } = req.body;
        await kv.del(`user_v2:${id}`);
        return res.status(200).json({ success: true });
      }

      // 3. Guardar Configuración Global (Legacy)
      const newConfig = req.body;
      await kv.set('bot_config', newConfig);
      return res.status(200).json({ success: true, config: newConfig });
    }

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error del servidor: ' + e.message });
  }

  return res.status(404).end();
}
