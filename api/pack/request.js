const { decodeToken, setCors, handleOptions } = require('../../lib/auth');
const { kv } = require('../../lib/kv');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Método no permitido' });

  const xToken  = req.headers['x-token'];
  const decoded = decodeToken(xToken);
  const body    = req.body || {};
  const userId  = decoded && decoded.userId ? String(decoded.userId) : String(body.clientId || '');

  if (!userId) return res.status(400).json({ error: 'userId no encontrado' });

  const existing = await kv.getLicense(userId);
  if (existing && existing.active && Date.now() < existing.expiresAt) {
    return res.status(200).json({
      id:        `license_${userId}`,
      clientId:  userId,
      state:     'active',
      expiresAt: existing.expiresAt,
      duration:  existing.duration || 30,
    });
  }

  const request = {
    id:          `req_${userId}_${Date.now()}`,
    clientId:    userId,
    serverId:    (decoded && decoded.serverId) || body.bankId || 'unknown',
    language:    (decoded && decoded.language) || 'unknown',
    state:       'pending',
    active:      false,
    requestedAt: Date.now(),
    duration:    body.duration || 30,
  };

  if (!existing || existing.state === 'pending') {
    await kv.setLicense(userId, request);
  }

  return res.status(200).json(request);
};
