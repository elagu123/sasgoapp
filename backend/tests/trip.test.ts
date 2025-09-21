// Archivo: tests/trip.test.ts
// Propósito: Pruebas de integración para los endpoints de viajes.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/index';
import prisma from '../src/lib/prisma';
import { generateAccessToken } from '../src/utils/jwt';
// FIX: Changed from namespace import to a named type import for User.
import type { User } from '@prisma/client';

describe('Trip API', () => {
    let userA: User;
    let userB: User;
    let tokenA: string;
    let tokenB: string;

    // Crear usuarios de prueba antes de todas las pruebas
    beforeAll(async () => {
        await prisma.user.deleteMany(); // Limpieza inicial
        userA = await prisma.user.create({
            data: { name: 'User A', email: 'usera@test.com', password: 'passwordA' }
        });
        userB = await prisma.user.create({
            data: { name: 'User B', email: 'userb@test.com', password: 'passwordB' }
        });
        tokenA = generateAccessToken({ id: userA.id, email: userA.email });
        tokenB = generateAccessToken({ id: userB.id, email: userB.email });
    });
    
    // Limpiar viajes antes de cada prueba
    beforeEach(async () => {
        await prisma.sharedTrip.deleteMany();
        await prisma.trip.deleteMany();
    });

    afterAll(async () => {
        await prisma.user.deleteMany();
        await prisma.$disconnect();
    });

    describe('POST /api/trips', () => {
        it('should create a new trip for the authenticated user', async () => {
            const res = await request(app)
                .post('/api/trips')
                .set('Authorization', `Bearer ${tokenA}`)
                .send({
                    title: 'Trip to Paris',
                    destination: ['Paris, France'],
                    startDate: '2025-01-01',
                    endDate: '2025-01-10'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.title).toBe('Trip to Paris');
            expect(res.body.members.find((m: any) => m.id === userA.id)).toBeTruthy();
        });
    });

    describe('GET /api/trips', () => {
        it('should return only trips owned by or shared with the user', async () => {
            // Viaje de User A
            await prisma.trip.create({
                data: { title: 'User A Trip', destination: 'Paris', userId: userA.id, startDate: new Date(), endDate: new Date() }
            });
            // Viaje de User B
            await prisma.trip.create({
                data: { title: 'User B Trip', destination: 'London', userId: userB.id, startDate: new Date(), endDate: new Date() }
            });

            const resA = await request(app)
                .get('/api/trips')
                .set('Authorization', `Bearer ${tokenA}`);
            
            expect(resA.statusCode).toBe(200);
            expect(resA.body).toHaveLength(1);
            expect(resA.body[0].title).toBe('User A Trip');
        });
    });

    describe('GET /api/trips/:id', () => {
        it('should not allow a user to see another user\'s trip', async () => {
            const tripB = await prisma.trip.create({
                data: { title: 'User B Secret Trip', destination: 'Tokyo', userId: userB.id, startDate: new Date(), endDate: new Date() }
            });

            const resA = await request(app)
                .get(`/api/trips/${tripB.id}`)
                .set('Authorization', `Bearer ${tokenA}`);

            expect(resA.statusCode).toBe(404); // 404 porque no lo encuentra para ese usuario
        });
    });
    
    describe('PUT /api/trips/:id', () => {
        it('should not allow a user to update another user\'s trip', async () => {
             const tripB = await prisma.trip.create({
                data: { title: 'User B\'s Uneditable Trip', destination: 'Berlin', userId: userB.id, startDate: new Date(), endDate: new Date() }
            });

            const resA = await request(app)
                .put(`/api/trips/${tripB.id}`)
                .set('Authorization', `Bearer ${tokenA}`)
                .send({ title: 'New Title by A' });

            expect(resA.statusCode).toBe(403);
        });
    });
    
    describe('DELETE /api/trips/:id', () => {
        it('should not allow a user to delete another user\'s trip', async () => {
            const tripB = await prisma.trip.create({
                data: { title: 'User B\'s Indeletable Trip', destination: 'Rome', userId: userB.id, startDate: new Date(), endDate: new Date() }
            });

            const resA = await request(app)
                .delete(`/api/trips/${tripB.id}`)
                .set('Authorization', `Bearer ${tokenA}`);

            expect(resA.statusCode).toBe(403);
        });
    });

    describe('POST /api/trips/:id/share', () => {
        let tripA: any;
        beforeEach(async () => {
            tripA = await prisma.trip.create({
                data: { title: 'Shared Trip', destination: 'Barcelona', userId: userA.id, startDate: new Date(), endDate: new Date() }
            });
        });

        it('should allow the owner to share a trip', async () => {
            const res = await request(app)
                .post(`/api/trips/${tripA.id}/share`)
                .set('Authorization', `Bearer ${tokenA}`)
                .send({ email: userB.email, permissionLevel: 'VIEWER' });
            
            expect(res.statusCode).toBe(200);

            // Verificar que userB ahora puede ver el viaje
            const resB = await request(app)
                .get(`/api/trips/${tripA.id}`)
                .set('Authorization', `Bearer ${tokenB}`);
            
            expect(resB.statusCode).toBe(200);
            expect(resB.body.title).toBe('Shared Trip');
        });

        it('should not allow a non-owner to share a trip', async () => {
             const res = await request(app)
                .post(`/api/trips/${tripA.id}/share`)
                .set('Authorization', `Bearer ${tokenB}`) // User B intenta compartir el viaje de User A
                .send({ email: 'anotheruser@test.com', permissionLevel: 'VIEWER' });

            expect(res.statusCode).toBe(404); // 404 porque B no es el dueño
        });
    });
});