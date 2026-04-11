const CryptoJS = require('crypto-js');
const { kv }   = require('./kv');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-TOKEN, X-Admin-Password, Cache-Control',
};

function setCors(res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
}

function handleOptions(res) {
  setCors(res);
  res.status(200).end();
}

/**
 * Descifra el X-TOKEN que envía la extensión.
 * La extensión genera: CryptoJS.AES.encrypt(JSON.stringify({userId, serverId, language}), "")
 * Devuelve { userId, serverId, language } o null.
 */
function decodeToken(xToken) {
  if (!xToken) return null;
  try {
    const bytes     = CryptoJS.AES.decrypt(xToken, '');
    const plaintext = bytes.toString(CryptoJS.enc.Utf8);
    if (!plaintext) return null;
    return JSON.parse(plaintext);
  } catch {
    return null;
  }
}

/**
 * Verifica si hay licencia activa para la petición.
 * Devuelve { valid, userId, license, reason }
 */
async function verifyLicense(req) {
  const xToken = req.headers['x-token'];
  if (!xToken) return { valid: false, reason: 'Sin token' };

  const decoded = decodeToken(xToken);
  if (!decoded || !decoded.userId) return { valid: false, reason: 'Token inválido' };

  const userId  = String(decoded.userId);
  const license = await kv.getLicense(userId);

  if (!license)           return { valid: false, userId, reason: 'Sin licencia' };
  if (!license.active)    return { valid: false, userId, reason: 'Licencia inactiva' };
  if (Date.now() > license.expiresAt) return { valid: false, userId, reason: 'Licencia expirada' };

  return { valid: true, userId, license };
}

/**
 * Verifica si la petición viene del panel de administración.
 */
function verifyAdmin(req) {
  const pwd = req.headers['x-admin-password'];
  if (!pwd) return false;
  return pwd === process.env.ADMIN_PASSWORD;
}

module.exports = { setCors, handleOptions, decodeToken, verifyLicense, verifyAdmin, CORS_HEADERS };
