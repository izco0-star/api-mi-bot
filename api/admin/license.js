import { verifyAdmin, setCors, handleOptions } from '../../lib/auth.js';
import { kv } from '../../lib/kv.js';

/**
 * POST   /api/admin/license   → Crear o extender una licencia
 * DELETE /api/admin/license   → Revocar una licencia
 *
 * Requiere cabecera: X-Admin-Password: {tu contraseña}
 *
 * Body POST: { userId, days, note }
 * Body DELETE: { userId }
 */
export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return handleOptions(res);

  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  // ── POST: crear o extender licencia ──────────────────────────────────────────
  if (req.method === 'POST') {
    const { userId, days, note } = req.body || {};

    if (!userId) return res.status(400).json({ error: 'userId requerido' });
    if (!days || days <= 0) return res.status(400).json({ error: 'days debe ser mayor que 0' });

    // Si ya tiene una licencia activa, extendemos desde su fecha de expiración actual
    const existing  = await kv.getLicense(userId);
    const baseTime  = (existing?.active && existing?.expiresAt > Date.now())
      ? existing.expiresAt   // extender desde la fecha actual de expiración
      : Date.now();          // nueva licencia desde ahora

    const expiresAt = baseTime + days * 24 * 60 * 60 * 1000;

    const license = {
      userId,
      active:    true,
      state:     'active',
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
      expiresAt,
      duration:  days,
      note:      note || '',
    };

    await kv.setLicense(userId, license);

    return res.status(200).json({
      ok: true,
      license,
      expiresAtHuman: new Date(expiresAt).toISOString(),
    });
  }

  // ── DELETE: revocar licencia ──────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId requerido' });

    await kv.deleteLicense(userId);
    return res.status(200).json({ ok: true, revoked: userId });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
