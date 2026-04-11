const { kv } = require('../lib/kv');

module.exports = async function handler(req, res) {
  // CORS provisional para debug
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const id = req.query.id || '10765580';
  const license = await kv.getLicense(id);
  const now = Date.now();
  
  if (!license) return res.status(200).json({ error: 'No license found for ' + id });
  
  return res.status(200).json({
    id: id,
    status: license.active ? 'active' : 'inactive',
    expiresAt: license.expiresAt,
    expiresString: new Date(license.expiresAt).toISOString(),
    isExpired: Date.now() >= license.expiresAt,
    fullData: license
  });
};
