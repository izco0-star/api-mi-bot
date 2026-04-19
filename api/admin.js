import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-ADMIN-TOKEN');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const adminToken = req.headers['x-admin-token'];
  const expectedToken = process.env.ADMIN_TOKEN || 'admin123'; // Default for safety, should be changed

  if (adminToken !== expectedToken) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (req.method === 'GET') {
    // Obtener configuración actual
    const config = await kv.get('bot_config') || {
      announce: null,
      s: false,
      m: "",
      v: null,
      license_days: 365
    };
    return res.status(200).json(config);
  }

  if (req.method === 'POST') {
    // Actualizar configuración
    const newConfig = req.body;
    await kv.set('bot_config', newConfig);
    return res.status(200).json({ success: true, config: newConfig });
  }

  return res.status(404).end();
}
