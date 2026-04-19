import { createClient } from '@vercel/kv';

// Helper para inicializar KV con soporte para prefijos (como STORAGE_)
const getKVClient = () => {
  const url = process.env.KV_REST_API_URL || process.env.STORAGE_KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.STORAGE_KV_REST_API_TOKEN;
  
  if (!url || !token) {
    throw new Error('Configuración de KV incompleta.');
  }
  
  return createClient({ url, token });
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-TOKEN');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let days = 365;

  // Cargar configuración de días desde KV
  try {
    const kv = getKVClient();
    const config = await kv.get('bot_config') || { license_days: 365 };
    days = config.license_days || 365;
  } catch (e) {
    // Fail silently, use default 365
  }

  const futureTimestamp = Date.now() + days * 24 * 60 * 60 * 1000;

  return res.status(200).json({
    d: futureTimestamp,
    licence: "FREE_USER_LICENCE_KEY",
    score: 0,
    days: days,
    object: {},
    q: false
  });
}
