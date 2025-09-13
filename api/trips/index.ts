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

    if (req.method === 'GET') {
      // Get all trips for the user
      const trips = await prisma.trip.findMany({
        where: {
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
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.json({ trips });

    } else if (req.method === 'POST') {
      // Create a new trip
      const {
        title,
        destination,
        startDate,
        endDate,
        budget,
        itinerary,
        privacy = 'private',
        travelers = 1,
        pace,
        interests,
        weather
      } = req.body;

      if (!title || !destination || !startDate || !endDate) {
        return res.status(400).json({
          error: 'Title, destination, start date, and end date are required'
        });
      }

      const trip = await prisma.trip.create({
        data: {
          title,
          destination,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          budget: budget ? parseFloat(budget) : null,
          itinerary,
          privacy,
          travelers: parseInt(travelers),
          pace,
          interests,
          weather,
          userId: decoded.userId
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      return res.status(201).json({ trip });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Trips error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid access token' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}