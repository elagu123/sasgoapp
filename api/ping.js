export default function handler(req, res) {
  res.status(200).json({
    message: 'PONG - API funcionando',
    timestamp: new Date().toISOString()
  });
}