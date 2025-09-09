import prisma from '../lib/prisma';
import type { PackingList } from '@prisma/client';
import type { PatchOp, PackingListItem } from '../../../src/types';

const packingListWithIncludes = {
    include: {
        items: {
            orderBy: {
                order: 'asc'
            }
        },
        trip: {
            select: {
                destination: true,
            }
        }
    }
};

export const findPackingListsByUserId = async (userId: string): Promise<PackingList[]> => {
    return prisma.packingList.findMany({
        where: {
            trip: {
                OR: [
                    { userId: userId },
                    { sharedWith: { some: { userId: userId } } },
                ],
            },
        },
        ...packingListWithIncludes,
    });
};

export const findPackingListById = async (listId: string, userId: string): Promise<PackingList | null> => {
    return prisma.packingList.findFirst({
        where: {
            id: listId,
            trip: {
                OR: [
                    { userId: userId },
                    { sharedWith: { some: { userId: userId } } },
                ],
            },
        },
        ...packingListWithIncludes,
    });
};

export const createPackingList = async (data: { tripId: string, title: string, items: Omit<PackingListItem, 'id' | 'packed'>[] }, userId: string): Promise<PackingList | null> => {
    // Verify user owns the trip
    const trip = await prisma.trip.findFirst({
        where: { id: data.tripId, userId: userId }
    });
    if (!trip) return null;

    return prisma.packingList.create({
        data: {
            title: data.title,
            tripId: data.tripId,
            items: {
                create: data.items.map((item, index) => ({ ...item, order: index }))
            }
        },
        ...packingListWithIncludes,
    });
};

export const patchPackingList = async (listId: string, op: PatchOp, payload: any, userId: string): Promise<PackingList | null> => {
    // IDOR Fix: Perform a write-permission check first.
    // User must be the trip OWNER or an EDITOR to modify the packing list.
    const listWithTripAccess = await prisma.packingList.findFirst({
        where: {
            id: listId,
            trip: {
                OR: [
                    { userId: userId }, // Is Owner
                    { sharedWith: { some: { userId: userId, permissionLevel: 'EDITOR' } } } // Is Editor
                ]
            }
        }
    });

    if (!listWithTripAccess) {
        // User does not have write access or list does not exist
        return null;
    }

    switch (op) {
        case 'add_item': {
            const { item } = payload as { item: Omit<PackingListItem, 'id'> };
            return prisma.packingList.update({
                where: { id: listId },
                data: {
                    items: {
                        create: { ...item }
                    }
                },
                ...packingListWithIncludes
            });
        }
        case 'update_item': {
            const { itemId, fields } = payload as { itemId: string, fields: Partial<PackingListItem> };
            await prisma.packingListItem.updateMany({
                where: { id: itemId, listId: listId },
                data: fields,
            });
            break;
        }
        case 'remove_item': {
            const { itemId } = payload as { itemId: string };
            await prisma.packingListItem.deleteMany({
                where: { id: itemId, listId: listId },
            });
            break;
        }
        case 'reorder_items': {
            const { itemIds } = payload as { itemIds: string[] };
            const updates = itemIds.map((id, index) => 
                prisma.packingListItem.update({
                    where: { id },
                    data: { order: index },
                })
            );
            await prisma.$transaction(updates);
            break;
        }
        default:
            throw new Error(`Unsupported patch operation: ${op}`);
    }
    
    // Refetch the list to return the updated state
    return findPackingListById(listId, userId);
};