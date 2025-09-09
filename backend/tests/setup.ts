
// Archivo: tests/setup.ts
// Propósito: Archivo de configuración que se ejecuta antes de las pruebas de Jest.

import dotenv from 'dotenv';
dotenv.config({ path: './.env.example' }); // Usar el example para consistencia en tests
