import { decodeToken, setCors, handleOptions } from '../../lib/auth.js';
import { kv } from '../../lib/kv.js';

/**
 * POST /pack/request
 *
 * La extensión llama a esto cuando el usuario no tiene licencia y solicita acceso.
 * Body que envía: { clientId, bankId, goldAmount, duration }
 *
 * En nuestro sistema:
 *   - Si ya tiene licencia activa → la devolvemos directamente.
 *   - Si no tiene → guardamos la solicitud en Redis como "pending"
 *     y aparecerá en tu panel de admin para que la apruebes o rechaces.
 */
export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Método no permitido' });

  // Extraer userId del token o del body
  const xToken  = req.headers['x-token'];
  const decoded = decodeToken(xToken);
  const body    = req.body || {};
  const userId  = decoded?.userId ? String(decoded.userId) : String(body.clientId || '');

  if (!userId) return res.status(400).json({ error: 'userId no encontrado en el token ni en el body' });

  // Si ya tiene licencia activa, devolvemos el pack existente
  const existing = await kv.getLicense(userId);
  if (existing?.active && Date.now() < existing.expiresAt) {
    return res.status(200).json({
      id:        `license_${userId}`,
      clientId:  userId,
      state:     'active',
      expiresAt: existing.expiresAt,
      duration:  existing.duration || 30,
    });
  }

  // Guardar solicitud pendiente en Redis para que el admin la vea
  const request = {
    id:          `req_${userId}_${Date.now()}`,
    clientId:    userId,
    serverId:    decoded?.serverId || body.bankId || 'unknown',
    language:    decoded?.language || 'unknown',
    state:       'pending',
    active:      false,
    requestedAt: Date.now(),
    duration:    body.duration || 30,
  };

  // Solo sobreescribir si no hay ya una solicitud pendiente o licencia activa
  if (!existing || existing.state === 'pending') {
    await kv.setLicense(userId, request);
  }

  return res.status(200).json(request);
}
