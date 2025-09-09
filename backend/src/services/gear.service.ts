import prisma from '../lib/prisma';
import type { Gear } from '@prisma/client';

const gearWithIncludes = {
    include: {
        tickets: {
            orderBy: {
                createdAt: 'desc'
            }
        }
    }
};

export const findGearByUserId = async (userId: string): Promise<Gear[]> => {
    return prisma.gear.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: 'desc' },
        ...gearWithIncludes
    });
};

export const findGearById = async (gearId: string, userId: string): Promise<Gear | null> => {
    return prisma.gear.findFirst({
        where: {
            id: gearId,
            ownerId: userId
        },
        ...gearWithIncludes
    });
};

export const createGear = async (data: Omit<Gear, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>, userId: string): Promise<Gear> => {
    return prisma.gear.create({
        data: {
            ...data,
            ownerId: userId
        },
        ...gearWithIncludes
    });
};