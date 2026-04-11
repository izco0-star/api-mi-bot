const { verifyAdmin, setCors, handleOptions } = require('../../lib/auth');
const { kv } = require('../../lib/kv');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return handleOptions(res);

  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  // ── POST: crear o extender licencia ──────────────────────────────────────────
  if (req.method === 'POST') {
    const body   = req.body || {};
    const userId = body.userId;
    const days   = body.days;
    const note   = body.note || '';

    if (!userId)            return res.status(400).json({ error: 'userId requerido' });
    if (!days || days <= 0) return res.status(400).json({ error: 'days debe ser mayor que 0' });

    const existing = await kv.getLicense(userId);
    const baseTime = (existing && existing.active && existing.expiresAt > Date.now())
      ? existing.expiresAt
      : Date.now();

    const expiresAt = baseTime + days * 24 * 60 * 60 * 1000;

    const license = {
      userId:    userId,
      active:    true,
      state:     'active',
      createdAt: (existing && existing.createdAt) || Date.now(),
      updatedAt: Date.now(),
      expiresAt: expiresAt,
      duration:  days,
      note:      note,
    };

    await kv.setLicense(userId, license);

    return res.status(200).json({
      ok:             true,
      license:        license,
      expiresAtHuman: new Date(expiresAt).toISOString(),
    });
  }

  // ── DELETE: revocar licencia ──────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const body   = req.body || {};
    const userId = body.userId;
    if (!userId) return res.status(400).json({ error: 'userId requerido' });

    await kv.deleteLicense(userId);
    return res.status(200).json({ ok: true, revoked: userId });
  }

  return res.status(405).json({ error: 'Método no permitido' });
};
