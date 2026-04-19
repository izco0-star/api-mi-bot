// GET /api/check-version
// La extensión comprueba si hay una versión nueva disponible
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-TOKEN');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Devuelve null para que no muestre ningún aviso de actualización
  return res.status(200).json(null);
}
