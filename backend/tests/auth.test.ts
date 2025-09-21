import { describe, it, expect, beforeEach, afterAll } from 'vitest';
// Archivo: tests/auth.test.ts
// Propósito: Pruebas de integración para los endpoints de autenticación.

import request from 'supertest';
import app from '../src/index'; // Importa la app de express
import prisma from '../src/lib/prisma';

// Limpiar la base de datos antes de cada prueba
beforeEach(async () => {
  await prisma.user.deleteMany();
});

// Desconectar Prisma después de todas las pruebas
afterAll(async () => {
  await prisma.$disconnect();
});

describe('Auth API', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should return 409 if email already exists', async () => {
      // Primero, registrar el usuario
      await request(app).post('/api/auth/register').send(testUser);
      
      // Intentar registrar de nuevo con el mismo email
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.statusCode).toEqual(409);
      expect(res.body.message).toBe('El email ya está en uso');
    });

    it('should return 400 for invalid data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid', password: '123' }); // Faltan campos, datos inválidos

      expect(res.statusCode).toEqual(400);
    });
  });

  describe('POST /api/auth/login', () => {
    // Registrar el usuario antes de las pruebas de login
    beforeEach(async () => {
        await request(app).post('/api/auth/register').send(testUser);
    });

    it('should login an existing user and return tokens', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: testUser.password });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body.user.email).toBe(testUser.email);
        expect(res.headers['set-cookie']).toBeDefined();
        expect(res.headers['set-cookie'].some((cookie: string) => cookie.includes('refreshToken'))).toBe(true);
    });

    it('should return 401 for wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: 'wrongpassword' });
        
        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toBe('Credenciales inválidas');
    });

    it('should return 401 for non-existent user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nouser@example.com', password: 'password123' });

        expect(res.statusCode).toEqual(401);
    });
  });
});