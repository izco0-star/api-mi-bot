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
        
        // Identificadores de usuario comunes en Gladiatus Helper / BOTILLO
        const userId = body.charId || body.id || body.userId;

        if (!userId) {
            // Petición de invitado / inicial
            return res.status(200).json({ licence: "GUEST", d: Date.now() + 86400000 });
        }

        // 1. VERIFICAR BANEO (LISTA NEGRA)
        const isBanned = await kv.get(`banned:${userId}`);
        if (isBanned) {
            return res.status(403).json({ 
                error: 'ACCESO DENEGADO',
                m: 'Tu cuenta ha sido suspendida permanentemente.' 
            });
        }

        // 2. RASTREO (TELEMETRÍA ELITE)
        const userData = {
            name: body.name || "Sin Nombre",
            server: body.server || "??",
            level: body.level || 0,
            gold: body.gold || 0,
            v: body.v || "Unknown",
            lastSeen: Date.now()
        };
        await kv.set(`user_v2:${userId}`, userData);

        // 3. LÓGICA DE LICENCIA (VIP vs GLOBAL)
        let expiryDate = await kv.get(`license_v2:${userId}`);
        const config = await kv.get('bot_config') || { s: false, m: "", license_days: 365 };

        if (!expiryDate) {
            // Usuario nuevo o sin licencia manual, aplicamos el regalo global
            const giftDays = config.license_days || 365;
            expiryDate = Date.now() + giftDays * 24 * 60 * 60 * 1000;
            await kv.set(`license_v2:${userId}`, expiryDate);
        }

        // 4. CONFIGURACIÓN REMOTA (El famoso "Object" de ingeniería inversa)
        const remoteConfig = await kv.get('remote_config') || {};

        // 5. RESPUESTA TOTAL (Compatible con todas las versiones)
        return res.status(200).json({
            d: parseInt(expiryDate), // Timestamp de expiración
            licence: "VAL_" + userId,
            score: 0,
            days: Math.ceil((expiryDate - Date.now()) / (24 * 60 * 60 * 1000)),
            m: config.m || "", // Mensaje de anuncio / Broadcast
            s: config.s || false, // Modo mantenimiento (Killswitch global)
            object: remoteConfig, // Configuración remota para la lógica del bot
            q: false
        });

    } catch (e) {
        console.error("Critical Error:", e);
        // Fail-safe: Si la DB falla, no bloqueamos al usuario (Modo Offline)
        return res.status(200).json({
            d: Date.now() + 365 * 86400000,
            licence: "OFFLINE_MODE",
            days: 365,
            s: false,
            m: "Servidor en mantenimiento temporal."
        });
    }
}
