const { verifyLicense, setCors, handleOptions } = require('../../lib/auth');
const { kv } = require('../../lib/kv');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'PATCH')   return res.status(405).json({ error: 'Método no permitido' });

  const { valid, userId } = await verifyLicense(req);
  if (!valid) return res.status(200).json({ ok: true });

  const body    = req.body || {};
  const packId  = body.packId;
  const state   = body.state;
  const metaData = body.metaData;

  if (packId && state) {
    const license = await kv.getLicense(userId);
    if (license) {
      await kv.setLicense(userId, Object.assign({}, license, {
        lastKnownState: state,
        lastMetaData:   metaData || null,
        updatedAt:      Date.now(),
      }));
    }
  }

  return res.status(200).json({ ok: true, packId: packId, state: state });
};
