import { setCors, handleOptions } from '../../../lib/auth.js';

/**
 * GET /pack/pending/{userId}?e={timestamp}
 *
 * En el sistema original devolvía packs pendientes de pago.
 * En nuestro servidor personal sin pagos, siempre devuelve [] vacío.
 * Tú autorizas directamente desde el panel de administración.
 */
export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'GET')     return res.status(405).json({ error: 'Método no permitido' });

  return res.status(200).json([]);
}
