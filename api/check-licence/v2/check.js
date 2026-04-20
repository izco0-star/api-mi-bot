import { createClient } from '@vercel/kv';

const getKVClient = () => {
    const url = process.env.KV_REST_API_URL || process.env.STORAGE_KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.STORAGE_KV_REST_API_TOKEN;
    if (!url || !token) throw new Error('KV_CONFIG_ERROR');
    return createClient({ url, token });
};

// --- PLANTILLA MAESTRA (Ingeniería Inversa) ---
// Estos valores son los que espera la arquitectura de Gladiatus Helper
// para que la UI no se rompa y cargue todos los ajustes.
const MASTER_TEMPLATE = {
    settings: {
        attack_wait: 15,
        expedition_wait: 10,
        dungeon_wait: 10,
        auto_food: true,
        auto_heal: true,
        min_health: 30,
        buy_potions: false,
        sell_items: true,
        auto_active: true,
        ia_level: "diamond"
    },
    features: {
        event_bot: true,
        guild_medic: true,
        gold_saver: true,
        telegram_alerts: true
    },
    meta: {
        last_update: Date.now(),
        server_status: "stable"
    }
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
            return res.status(403).json({ error: 'BANNED', m: 'Cuenta suspendida.' });
        }

        // 2. RASTREO
        const userData = {
            name: body.name || "Jugador",
            server: body.server || "??",
            level: body.level || 0,
            gold: body.gold || 0,
            v: body.v || "1.0.0",
            lastSeen: Date.now()
        };
        await kv.set(`user_v2:${userId}`, userData);

        // 3. LICENCIA
        let expiryDate = await kv.get(`license_v2:${userId}`);
        const globalConfig = await kv.get('bot_config') || { s: false, m: "", license_days: 365 };

        if (!expiryDate) {
            expiryDate = Date.now() + (globalConfig.license_days || 365) * 86400000;
            await kv.set(`license_v2:${userId}`, expiryDate);
        }

        // 4. CONFIGURACIÓN REMOTA (El Core del Reverse Engineering)
        // Intentamos cargar la config específica, si no, usamos la Plantilla Maestra
        const customConfig = await kv.get('remote_config');
        const finalObject = customConfig && Object.keys(customConfig).length > 0 ? customConfig : MASTER_TEMPLATE;

        // 5. RESPUESTA PROFESIONAL
        return res.status(200).json({
            d: parseInt(expiryDate),
            licence: "VAL_" + userId,
            days: Math.ceil((expiryDate - Date.now()) / 86400000),
            m: globalConfig.m || "Servidor Diamond Activo",
            s: globalConfig.s || false,
            object: finalObject,
            q: false
        });

    } catch (e) {
        return res.status(200).json({ d: Date.now() + 86400000, licence: "FAILSAFE", days: 1, s: false, object: MASTER_TEMPLATE });
    }
}
