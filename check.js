import { createClient } from '@vercel/kv';

const getKVClient = () => {
    const url = process.env.KV_REST_API_URL || process.env.STORAGE_KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.STORAGE_KV_REST_API_TOKEN;
    if (!url || !token) throw new Error('KV_CONFIG_ERROR');
    return createClient({ url, token });
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-TOKEN');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const kv = getKVClient();
        const body = req.body || {};
        const userId = body.charId || body.id || body.userId;

        if (!userId) {
            return res.status(200).json({ licence: "GUEST", d: Date.now() + 86400000 });
        }

        // 1. VERIFICAR BANEO
        const isBanned = await kv.get(`banned:${userId}`);
        if (isBanned) {
            return res.status(403).json({ error: 'Acceso Denegado: Tu cuenta ha sido suspendida.' });
        }

        // 2. RASTREO (Telemetry)
        const userData = {
            name: body.name || "Jugador Desconocido",
            server: body.server || "??",
            level: body.level || 0,
            gold: body.gold || 0,
            v: body.v || "1.0.0",
            lastSeen: Date.now()
        };
        await kv.set(`user_v2:${userId}`, userData);

        // 3. LICENCIA
        let expiryDate = await kv.get(`license_v2:${userId}`);
        const config = await kv.get('bot_config') || { s: false, m: "", license_days: 365 };

        if (!expiryDate) {
            expiryDate = Date.now() + (config.license_days || 365) * 24 * 60 * 60 * 1000;
            await kv.set(`license_v2:${userId}`, expiryDate);
        }

        // 4. RESPUESTA (Compatible con BOTILLO/Helper)
        return res.status(200).json({
            d: expiryDate,
            licence: "VAL_" + userId,
            score: 0,
            days: Math.ceil((expiryDate - Date.now()) / (24 * 60 * 60 * 1000)),
            m: config.m || "", // Mensaje de anuncio (Broadcast)
            s: config.s || false, // Modo mantenimiento
            q: false
        });

    } catch (e) {
        return res.status(200).json({ d: Date.now() + 365 * 86400000, licence: "OFFLINE", days: 365 });
    }
}
