export default function handler(req, res) {
  res.status(200).json({ 
    estado: "OK", 
    mensaje: "¡Mi servidor propio está vivo y funcionando!" 
  });
}
