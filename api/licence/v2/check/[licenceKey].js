const CryptoJS = require('crypto-js');
const { decodeToken, setCors, handleOptions } = require('../../../../lib/auth');
const { kv } = require('../../../../lib/kv');

/**
 * PUT /check-licence/v2/check/{licenceKey}?_dc={random}
 *
 * La UI llama a este endpoint en cada carga para validar la clave de licencia almacenada.
 * Comprueba la licencia del usuario en Redis (via X-TOKEN).
 * Si activa → devuelve respuesta encriptada con AES key "sugi" que la UI espera:
 *   { d: expiresAt, licence: key, days: daysLeft, object: {}, score: 9999, q: 9999 }
 * Si no → 403 (la UI cierra el panel).
 *
 * Respuesta: AES.decrypt(body, "sugi") = JSON con los campos de arriba.
 */
module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'PUT') return res.status(405).end();

  var xToken  = req.headers['x-token'];
  var decoded = decodeToken(xToken);
  var userId  = decoded && decoded.userId ? String(decoded.userId) : null;

  if (!userId) return res.status(401).json({ error: 'Sin token' });

  var license = await kv.getLicense(userId);
  if (!license || !license.active || Date.now() >= license.expiresAt) {
    return res.status(403).json({ error: 'Sin licencia activa' });
  }

  var licenceKey = 'personal_' + userId;
  var daysLeft   = Math.max(1, Math.ceil((license.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)));

  var payload = JSON.stringify({
    d:       license.expiresAt,   // timestamp de expiración (la UI compara con Date.now())
    licence: licenceKey,           // clave de licencia
    days:    daysLeft,             // días restantes
    object:  {},                   // objeto de configuración adicional
    score:   9999,                 // puntuación (la UI puede mostrarla)
    q:       9999,                 // quota restante
  });

  var encrypted = CryptoJS.AES.encrypt(payload, 'sugi').toString();
  res.setHeader('Content-Type', 'text/plain');
  return res.status(200).send(encrypted);
};
