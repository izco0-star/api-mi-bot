import { kv } from '@vercel/kv';

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
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (req.method === 'GET') {
    try {
      // Obtener configuración actual
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
      return res.status(500).json({ error: 'Error de base de datos. ¿Has conectado Vercel KV en el panel de Storage?' });
    }
  }

  if (req.method === 'POST') {
    try {
      // Actualizar configuración
      const newConfig = req.body;
      await kv.set('bot_config', newConfig);
      return res.status(200).json({ success: true, config: newConfig });
    } catch (e) {
      return res.status(500).json({ error: 'No se pudo guardar en la base de datos.' });
    }
  }

  return res.status(404).end();
}
