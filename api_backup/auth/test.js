const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = async (req, res) => {
  try {
    // Test database connection
    const userCount = await prisma.user.count();

    res.status(200).json({
      message: '¡Backend funcionando!',
      database_connected: true,
      users_count: userCount,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error de base de datos',
      database_connected: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    await prisma.$disconnect();
  }
};