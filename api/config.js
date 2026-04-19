import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-TOKEN');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Intentar cargar configuración desde KV, si no existe usar defaults
  const config = await kv.get('bot_config') || {
    announce: null,
    s: false,
    m: "",
    v: null
  };

  return res.status(200).json({
    announce: config.announce,
    s: config.s,
    m: config.m,
    v: config.v
  });
}
