// Archivo: src/services/user.service.ts
// Propósito: Abstrae las operaciones de la base de datos para el modelo User.

import prisma from '../lib/prisma';
// FIX: Changed from namespace import to a named type import for User.
import type { User } from '@prisma/client';

export const findUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { email },
  });
};

export const findUserById = async (id: string): Promise<User | null> => {
    return prisma.user.findUnique({
        where: { id },
    });
};

export const createUser = async (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
  return prisma.user.create({
    data,
  });
};