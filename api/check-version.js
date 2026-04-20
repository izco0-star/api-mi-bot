export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Siempre devolvemos que estamos en la última versión
  // para evitar ventanas de "Actualiza el bot" que bloqueen la UI.
  return res.status(200).json({
    version: "10.0.0", 
    url: "https://github.com/izco0-star/api-mi-bot",
    mandatory: false,
    m: "Servidor Diamond Activo - Versión 10.0.0"
  });
}
