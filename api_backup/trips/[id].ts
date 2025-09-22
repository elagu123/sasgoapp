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
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        sharedWith: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        packingList: {
          include: {
            items: true
          }
        },
        expenses: true,
        reservations: true
      }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or access denied' });
    }

    if (req.method === 'GET') {
      return res.json({ trip });

    } else if (req.method === 'PUT') {
      // Check if user owns the trip or has editor access
      const hasEditAccess = trip.userId === decoded.userId ||
        trip.sharedWith.some(shared =>
          shared.userId === decoded.userId && shared.permissionLevel === 'EDITOR'
        );

      if (!hasEditAccess) {
        return res.status(403).json({ error: 'No edit permission for this trip' });
      }

      const {
        title,
        destination,
        startDate,
        endDate,
        budget,
        itinerary,
        privacy,
        travelers,
        pace,
        interests,
        weather,
        itineraryCompletion,
        packingProgress,
        imageUrl
      } = req.body;

      const updatedTrip = await prisma.trip.update({
        where: { id: tripId },
        data: {
          ...(title && { title }),
          ...(destination && { destination }),
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate && { endDate: new Date(endDate) }),
          ...(budget !== undefined && { budget: budget ? parseFloat(budget) : null }),
          ...(itinerary && { itinerary }),
          ...(privacy && { privacy }),
          ...(travelers && { travelers: parseInt(travelers) }),
          ...(pace && { pace }),
          ...(interests && { interests }),
          ...(weather && { weather }),
          ...(itineraryCompletion !== undefined && { itineraryCompletion }),
          ...(packingProgress && { packingProgress }),
          ...(imageUrl && { imageUrl })
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          sharedWith: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        }
      });

      return res.json({ trip: updatedTrip });

    } else if (req.method === 'DELETE') {
      // Only trip owner can delete
      if (trip.userId !== decoded.userId) {
        return res.status(403).json({ error: 'Only trip owner can delete' });
      }

      await prisma.trip.delete({
        where: { id: tripId }
      });

      return res.json({ message: 'Trip deleted successfully' });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Trip detail error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid access token' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}