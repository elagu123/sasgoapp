
// Archivo: jest.config.js
// Propósito: Configuración para el framework de testing Jest.

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  setupFilesAfterEnv: ['./tests/setup.ts']
};
