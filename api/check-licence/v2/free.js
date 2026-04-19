// POST /api/v1/check-licence/v2/free
// La extensión llama aquí para obtener la clave de licencia del usuario
// Responde con { licence: "CLAVE_LICENCIA" }
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-TOKEN');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // La extensión hace POST con X-TOKEN header
  // Devuelve la licencia en formato texto que será guardada en storage
  return res.status(200).json({
    licence: "FREE_USER_LICENCE_KEY"
  });
}
