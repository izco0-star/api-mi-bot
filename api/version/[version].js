const { setCors, handleOptions } = require('../../lib/auth');

/**
 * GET /check-version/{version}
 *
 * La UI comprueba si está actualizada. Respondemos siempre "versión válida"
 * para que no bloquee la carga ni pida actualizar.
 */
module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'GET') return res.status(405).end();

  return res.status(200).json({
    valid:   true,
    latest:  '2.3.13',
    update:  false,
    message: '',
  });
};
