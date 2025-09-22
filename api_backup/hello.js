module.exports = (req, res) => {
  res.status(200).json({
    message: '¡SASGOAPP API funcionando!',
    timestamp: new Date().toISOString(),
    method: req.method,
    database_configured: !!process.env.DATABASE_URL,
    jwt_configured: !!process.env.JWT_SECRET
  });
};