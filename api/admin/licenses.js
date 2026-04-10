import { verifyAdmin, setCors, handleOptions } from '../../lib/auth.js';
import { kv } from '../../lib/kv.js';

/**
 * GET /api/admin/licenses
 *
 * Devuelve la lista completa de todos los usuarios en Redis:
 * activos, expirados y solicitudes pendientes.
 *
 * Requiere cabecera: X-Admin-Password: {tu contraseña}
 */
export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'GET')     return res.status(405).json({ error: 'Método no permitido' });

  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const all = await kv.getAllLicenses();

  const now = Date.now();
  const enriched = all.map(l => ({
    ...l,
    status:    !l.active ? 'pending'
             : l.expiresAt < now ? 'expired'
             : 'active',
    daysLeft:  l.expiresAt ? Math.max(0, Math.ceil((l.expiresAt - now) / (24 * 60 * 60 * 1000))) : 0,
    expiresAtHuman: l.expiresAt ? new Date(l.expiresAt).toISOString() : null,
  }));

  // Ordenar: activos primero, luego pendientes, luego expirados
  enriched.sort((a, b) => {
    const order = { active: 0, pending: 1, expired: 2 };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });

  return res.status(200).json(enriched);
}
