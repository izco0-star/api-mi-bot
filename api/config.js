import { createClient } from '@vercel/kv';

// Helper para inicializar KV con soporte para prefijos (como STORAGE_)
const getKVClient = () => {
  const url = process.env.KV_REST_API_URL || process.env.STORAGE_KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.STORAGE_KV_REST_API_TOKEN;
  
  if (!url || !token) {
    throw new Error('KV_NOT_FOUND');
  }
  
  return createClient({ url, token });
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-TOKEN');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const kv = getKVClient();
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
  } catch (e) {
    // Si falla KV, devolver valores hardcodeados de respaldo
    return res.status(200).json({
      announce: null,
      s: false,
      m: "", // Mensaje vacío para no asustar al usuario si KV no está listo
      v: null
    });
  }
}
