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

  try {
    const kv = getKVClient();
    const body = req.body || {};
    
    // Identificar al usuario (usamos charId o id como identificador principal)
    const userId = body.charId || body.id || body.userId;
    
    if (userId) {
      // 1. RASTREO (Heartbeat): Guardar stats del usuario si vienen en la petición
      const userData = {
          name: body.name || "Jugador Desconocido",
          server: body.server || "??",
          level: body.level || 0,
          gold: body.gold || 0,
          lastSeen: Date.now()
      };
      await kv.set(`user_v2:${userId}`, userData);
      
      // 2. LÓGICA DE LICENCIA INDIVIDUAL
      let expiryDate = await kv.get(`license_v2:${userId}`);
      
      if (!expiryDate) {
          // No tiene licencia específica, le damos el "Regalo Inicial"
          const config = await kv.get('bot_config') || { license_days: 365 };
          const giftDays = config.license_days || 365;
          expiryDate = Date.now() + giftDays * 24 * 60 * 60 * 1000;
          
          // Guardamos la licencia inicial para que sea persistente
          await kv.set(`license_v2:${userId}`, expiryDate);
      }

      return res.status(200).json({
          d: expiryDate, // Timestamp de expiración
          licence: "VAL_LIC_" + userId,
          score: 0,
          days: Math.ceil((expiryDate - Date.now()) / (24 * 60 * 60 * 1000)),
          object: {},
          q: false
      });
    } else {
        // Petición genérica sin ID (posible verificación inicial)
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
  } catch (e) {
    console.error(e);
    // Fallback silencioso para no bloquear el bot si KV falla
    return res.status(200).json({
      d: Date.now() + 365 * 24 * 60 * 60 * 1000,
      licence: "OFFLINE_MODE",
      score: 0,
      days: 365,
      object: {},
      q: false
    });
  }
}
