const CryptoJS = require('crypto-js');
const { decodeToken, setCors, handleOptions } = require('../../../lib/auth');
const { kv } = require('../../../lib/kv');

/**
 * POST /check-licence/v2/free
 *
 * La UI llama a este endpoint cuando NO tiene una clave de licencia guardada.
 * Comprueba si el usuario (X-TOKEN) tiene licencia activa en Redis.
 * Si sí → devuelve una clave de licencia encriptada con AES key "sugi".
 * Si no → 403 (la UI no carga).
 *
 * Respuesta esperada por la UI: AES.decrypt(body, "sugi") = JSON({ licence: "key" })
 */
module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'POST') return res.status(405).end();

  var xToken  = req.headers['x-token'];
  var decoded = decodeToken(xToken);
  var userId  = decoded && decoded.userId ? String(decoded.userId) : null;

  if (userId) {
    var license = await kv.getLicense(userId);
    if (license && license.active && Date.now() < license.expiresAt) {
      var key       = 'personal_' + userId;
      var payload   = JSON.stringify({ licence: key });
      var encrypted = CryptoJS.AES.encrypt(payload, 'sugi').toString();
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(encrypted);
    }
  }

  return res.status(403).json({ error: 'Sin licencia activa' });
};
