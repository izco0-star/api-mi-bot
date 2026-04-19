import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-TOKEN');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Cargar configuración de días desde KV
  const config = await kv.get('bot_config') || { license_days: 365 };
  const days = config.license_days || 365;

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
