const { setCors, handleOptions } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return handleOptions(res);
  return res.status(200).json({ access_token: "MOCK_TOKEN_123" });
};
