import { verifyLicense, setCors, handleOptions } from '../../../lib/auth.js';

/**
 * GET /pack/ready/{userId}?e={timestamp}
 *
 * La extensión llama a este endpoint para saber si el usuario tiene licencia activa.
 * - Con licencia activa  → devuelve un array con el pack (el bot arranca).
 * - Sin licencia         → devuelve [] (el bot no arranca).
 */
export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'GET')     return res.status(405).json({ error: 'Método no permitido' });

  const { userId } = req.query;
  const auth = await verifyLicense(req);

  if (!auth.valid) {
    // Sin licencia válida → array vacío
    return res.status(200).json([]);
  }

  const { license } = auth;

  // Formato de pack que espera la extensión
  const pack = {
    id:        `license_${userId}`,
    clientId:  userId,
    state:     'active',
    expiresAt: license.expiresAt,
    duration:  license.duration || 30,
    createdAt: license.createdAt,
    note:      license.note || '',
  };

  return res.status(200).json([pack]);
}
