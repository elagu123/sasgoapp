
// Archivo: tests/setup.ts
// Propósito: Archivo de configuración que se ejecuta antes de las pruebas de Jest.

import dotenv from 'dotenv';

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters-long';
process.env.PORT = '3001';
process.env.CORS_ORIGIN = 'http://localhost:5173';

// Load any additional config from .env if it exists
dotenv.config();
