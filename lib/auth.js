import CryptoJS from 'crypto-js';
import { kv } from './kv.js';

// Cabeceras CORS — necesarias porque el bot corre dentro de gladiatus.gameforge.com
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-TOKEN, X-Admin-Password, Cache-Control',
};

/**
 * Aplica cabeceras CORS y responde al preflight OPTIONS.
 */
export function setCors(res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
}

export function handleOptions(res) {
  setCors(res);
  res.status(200).end();
}

/**
 * Descifra el X-TOKEN que envía la extensión.
 *
 * La extensión genera el token así:
 *   CryptoJS.AES.encrypt(JSON.stringify({ userId, serverId, language }), "")
 *
 * Devuelve { userId, serverId, language } o null si falla.
 */
export function decodeToken(xToken) {
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
 * Verifica si la petición tiene un token válido y el usuario tiene licencia activa.
 * Devuelve { valid, userId, license, reason }
 */
export async function verifyLicense(req) {
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
 * El panel envía la contraseña en la cabecera X-Admin-Password.
 */
export function verifyAdmin(req) {
  const pwd = req.headers['x-admin-password'];
  if (!pwd) return false;
  return pwd === process.env.ADMIN_PASSWORD;
}
