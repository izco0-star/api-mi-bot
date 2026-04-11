const { verifyLicense, decodeToken, setCors, handleOptions } = require('../../lib/auth');
const { kv } = require('../../lib/kv');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return handleOptions(res);

  const xToken  = req.headers['x-token'];
  const decoded = decodeToken(xToken);
  const userId  = decoded && decoded.userId ? String(decoded.userId) : null;

  // ── GET: el bot pregunta si hay comandos pendientes de Telegram ──────────────
  if (req.method === 'GET') {
    if (!userId) return res.status(200).json([]);

    const auth = await verifyLicense(req);
    if (!auth.valid) return res.status(200).json([]);

    const queue = await kv.getTelegramQueue(userId);
    if (queue.length) await kv.clearTelegramQueue(userId);

    const commands = queue.map(function(item) {
      try { return typeof item === 'string' ? JSON.parse(item) : item; }
      catch (e) { return item; }
    });

    return res.status(200).json(commands);
  }

  // ── POST: el bot envía notificaciones del juego ──────────────────────────────
  if (req.method === 'POST') {
    if (!userId) return res.status(401).json({ error: 'Sin token' });

    const auth = await verifyLicense(req);
    if (!auth.valid) return res.status(401).json({ error: 'Sin licencia activa' });

    const body = req.body || {};

    const payload = {
      userId:     userId,
      receivedAt: Date.now(),
      pm: body.pm || [],
      gm: body.gm || [],
      bt: body.bt || [],
      ge: body.ge || [],
    };

    await kv.pushNotification(userId, JSON.stringify(payload));

    const received = Object.keys(body).filter(function(k) {
      return Array.isArray(body[k]) && body[k].length > 0;
    });

    return res.status(200).json({ ok: true, received: received });
  }

  return res.status(405).json({ error: 'Método no permitido' });
};
