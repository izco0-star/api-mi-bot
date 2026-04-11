const { setCors, handleOptions } = require('../lib/auth');

/**
 * GET /config
 *
 * La UI pide la configuración del servidor al arrancar.
 * Devolvemos una configuración mínima que no bloquea nada.
 */
module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'GET') return res.status(405).end();

  return res.status(200).json({
    maintenance:  false,
    version:      '2.3.13',
    minVersion:   '2.0.0',
    announcement: '',
    features:     {},
  });
};
