import { verifyLicense, setCors, handleOptions } from '../../lib/auth.js';
import { kv } from '../../lib/kv.js';

/**
 * PATCH /pack/state
 *
 * La extensión usa esto para actualizar el estado interno de un pack
 * (p.ej. marcar que lo procesó). Body: { packId, state, metaData }
 *
 * En nuestro servidor: actualizamos el campo state de la licencia en Redis
 * y respondemos OK siempre (no bloqueamos aunque no haya licencia).
 */
export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'PATCH')   return res.status(405).json({ error: 'Método no permitido' });

  const { valid, userId } = await verifyLicense(req);

  // Responder OK aunque no tenga licencia (no queremos que el bot falle aquí)
  if (!valid) return res.status(200).json({ ok: true });

  const { packId, state, metaData } = req.body || {};

  if (packId && state) {
    const license = await kv.getLicense(userId);
    if (license) {
      await kv.setLicense(userId, {
        ...license,
        lastKnownState: state,
        lastMetaData:   metaData || null,
        updatedAt:      Date.now(),
      });
    }
  }

  return res.status(200).json({ ok: true, packId, state });
}
