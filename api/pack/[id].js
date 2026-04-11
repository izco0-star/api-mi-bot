const { setCors, handleOptions } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'DELETE')  return res.status(405).json({ error: 'Método no permitido' });

  const id = req.query.id;
  return res.status(200).json({ ok: true, deleted: id || 'unknown' });
};
