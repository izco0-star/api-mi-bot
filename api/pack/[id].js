import { setCors, handleOptions } from '../../lib/auth.js';

/**
 * DELETE /pack/{id}
 *
 * La extensión llama a esto para eliminar un pack de su lista interna.
 * En nuestro servidor personal no hacemos nada destructivo aquí —
 * la gestión de licencias se hace exclusivamente desde el panel de admin.
 *
 * Respondemos OK para que la extensión no falle.
 */
export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'DELETE')  return res.status(405).json({ error: 'Método no permitido' });

  const { id } = req.query;
  return res.status(200).json({ ok: true, deleted: id || 'unknown' });
}
