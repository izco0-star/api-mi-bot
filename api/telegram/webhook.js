import { verifyLicense, decodeToken, setCors, handleOptions } from '../../lib/auth.js';
import { kv } from '../../lib/kv.js';

/**
 * GET  /telegram/webhook  → El bot pregunta si hay comandos pendientes de Telegram.
 *                           Devuelve array de comandos o [] si no hay.
 *
 * POST /telegram/webhook  → El bot envía notificaciones del juego (mensajes, eventos).
 *                           Las guardamos en Redis para que Telegram las reenvíe.
 *                           Body: { pm: [...], gm: [...], bt: [...], ge: [...] }
 *
 * (El reenvío real a Telegram Bot API se implementará en la fase 2,
 *  cuando tengamos el token del bot de Telegram configurado.)
 */
export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return handleOptions(res);

  const xToken  = req.headers['x-token'];
  const decoded = decodeToken(xToken);
  const userId  = decoded?.userId ? String(decoded.userId) : null;

  // ── GET: el bot pregunta si hay comandos pendientes ──────────────────────────
  if (req.method === 'GET') {
    if (!userId) return res.status(200).json([]);

    // Verificar licencia antes de devolver comandos
    const auth = await verifyLicense(req);
    if (!auth.valid) return res.status(200).json([]);

    // Obtener comandos pendientes de la cola y limpiarla
    const queue = await kv.getTelegramQueue(userId);
    if (queue.length) await kv.clearTelegramQueue(userId);

    // Devolver en el formato que espera la extensión: [{ to, content }, ...]
    return res.status(200).json(queue.map(item => {
      try { return typeof item === 'string' ? JSON.parse(item) : item; }
      catch { return item; }
    }));
  }

  // ── POST: el bot envía notificaciones del juego ──────────────────────────────
  if (req.method === 'POST') {
    if (!userId) return res.status(401).json({ error: 'Sin token' });

    const auth = await verifyLicense(req);
    if (!auth.valid) return res.status(401).json({ error: 'Sin licencia activa' });

    const body = req.body || {};
    // body puede tener: pm (mensajes privados), gm (mensajes de gremio),
    //                   bt (notificaciones del bot), ge (eventos del juego)

    const payload = {
      userId,
      receivedAt: Date.now(),
      pm: body.pm || [],   // mensajes privados
      gm: body.gm || [],   // mensajes de gremio
      bt: body.bt || [],   // notificaciones del bot
      ge: body.ge || [],   // eventos del juego
    };

    // Guardar notificación en Redis
    await kv.pushNotification(userId, JSON.stringify(payload));

    // ── FASE 2: aquí se enviará a Telegram Bot API ──────────────────────────
    // Por ahora solo guardamos. Cuando tengas el token de Telegram,
    // añadiremos aquí el envío real al chat de Telegram.
    // ────────────────────────────────────────────────────────────────────────

    return res.status(200).json({ ok: true, received: Object.keys(body).filter(k => body[k]?.length) });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
