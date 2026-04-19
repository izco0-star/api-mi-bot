import { createClient } from '@vercel/kv';

// Helper para inicializar KV con soporte para prefijos (como STORAGE_)
const getKVClient = () => {
  const url = process.env.KV_REST_API_URL || process.env.STORAGE_KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.STORAGE_KV_REST_API_TOKEN;
  
  if (!url || !token) {
    throw new Error('Configuración de base de datos ausente. Asegúrate de haber conectado KV en el panel de Storage de Vercel.');
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

  if (req.method === 'GET') {
    try {
      const kv = getKVClient();
      const config = await kv.get('bot_config') || {
        announce: null,
        s: false,
        m: "",
        v: null,
        license_days: 365
      };
      return res.status(200).json(config);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Error al conectar con la base de datos: ' + e.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const kv = getKVClient();
      const newConfig = req.body;
      await kv.set('bot_config', newConfig);
      return res.status(200).json({ success: true, config: newConfig });
    } catch (e) {
      return res.status(500).json({ error: 'No se pudo guardar: ' + e.message });
    }
  }

  return res.status(404).end();
}
