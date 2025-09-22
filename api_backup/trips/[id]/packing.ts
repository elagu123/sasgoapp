import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const tripId = req.query.id as string;

    if (!tripId) {
      return res.status(400).json({ error: 'Trip ID required' });
    }

    // Check if user has access to this trip
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        OR: [
          { userId: decoded.userId },
          {
            sharedWith: {
              some: { userId: decoded.userId }
            }
          }
        ]
      }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or access denied' });
    }

    if (req.method === 'GET') {
      // Get packing list for the trip
      const packingList = await prisma.packingList.findUnique({
        where: { tripId },
        include: {
          items: {
            orderBy: { order: 'asc' }
          }
        }
      });

      return res.json({ packingList });

    } else if (req.method === 'POST') {
      // Check if user has edit access
      const hasEditAccess = trip.userId === decoded.userId ||
        await prisma.sharedTrip.findFirst({
          where: {
            tripId,
            userId: decoded.userId,
            permissionLevel: 'EDITOR'
          }
        });

      if (!hasEditAccess) {
        return res.status(403).json({ error: 'No edit permission for this trip' });
      }

      // Create packing list if it doesn't exist
      let packingList = await prisma.packingList.findUnique({
        where: { tripId }
      });

      if (!packingList) {
        packingList = await prisma.packingList.create({
          data: {
            title: `${trip.title} Packing List`,
            tripId
          }
        });
      }

      const { name, category, qty = 1, notes } = req.body;

      if (!name || !category) {
        return res.status(400).json({
          error: 'Name and category are required'
        });
      }

      const item = await prisma.packingListItem.create({
        data: {
          name,
          category,
          qty: parseInt(qty),
          notes,
          packingListId: packingList.id
        }
      });

      return res.status(201).json({ item });

    } else if (req.method === 'PUT') {
      // Update packing list item
      const hasEditAccess = trip.userId === decoded.userId ||
        await prisma.sharedTrip.findFirst({
          where: {
            tripId,
            userId: decoded.userId,
            permissionLevel: 'EDITOR'
          }
        });

      if (!hasEditAccess) {
        return res.status(403).json({ error: 'No edit permission for this trip' });
      }

      const { itemId, packed, name, category, qty, notes, order } = req.body;

      if (!itemId) {
        return res.status(400).json({ error: 'Item ID required' });
      }

      const updatedItem = await prisma.packingListItem.update({
        where: { id: itemId },
        data: {
          ...(packed !== undefined && { packed }),
          ...(name && { name }),
          ...(category && { category }),
          ...(qty !== undefined && { qty: parseInt(qty) }),
          ...(notes !== undefined && { notes }),
          ...(order !== undefined && { order: parseInt(order) })
        }
      });

      return res.json({ item: updatedItem });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Packing error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid access token' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}