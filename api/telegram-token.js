import { createClient } from '@vercel/kv';

const getKVClient = () => {
  const url = process.env.KV_REST_API_URL || process.env.STORAGE_KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.STORAGE_KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('DB_CONFIG_MISSING');
  return createClient({ url, token });
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-TOKEN');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const kv = getKVClient();
    const config = await kv.get('bot_config') || {};

    return res.status(200).json({
      token: config.tgToken || "",
      id: config.tgId || ""
    });

  } catch (e) {
    return res.status(200).json({ token: "", id: "" });
  }
}
