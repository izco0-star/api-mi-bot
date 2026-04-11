const { verifyLicense, setCors, handleOptions } = require('../../../lib/auth');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'GET')     return res.status(405).json({ error: 'Método no permitido' });

  const { userId } = req.query;
  const auth = await verifyLicense(req);

  if (!auth.valid) {
    return res.status(200).json([]);
  }

  const { license } = auth;

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
};
