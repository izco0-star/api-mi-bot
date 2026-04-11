const { verifyAdmin, setCors, handleOptions } = require('../../lib/auth');
const { kv } = require('../../lib/kv');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'GET')     return res.status(405).json({ error: 'Método no permitido' });

  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const all = await kv.getAllLicenses();
  const now = Date.now();

  const enriched = all.map(function(l) {
    var status;
    if (!l.active) {
      status = 'pending';
    } else if (l.expiresAt < now) {
      status = 'expired';
    } else {
      status = 'active';
    }

    return Object.assign({}, l, {
      status:         status,
      daysLeft:       l.expiresAt ? Math.max(0, Math.ceil((l.expiresAt - now) / (24 * 60 * 60 * 1000))) : 0,
      expiresAtHuman: l.expiresAt ? new Date(l.expiresAt).toISOString() : null,
    });
  });

  enriched.sort(function(a, b) {
    var order = { active: 0, pending: 1, expired: 2 };
    return (order[a.status] || 3) - (order[b.status] || 3);
  });

  return res.status(200).json(enriched);
};
