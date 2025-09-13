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
      // Get all expenses for the trip
      const expenses = await prisma.expense.findMany({
        where: { tripId },
        orderBy: { date: 'desc' }
      });

      return res.json({ expenses });

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

      const { amount, description, category, date } = req.body;

      if (!amount || !description || !category || !date) {
        return res.status(400).json({
          error: 'Amount, description, category, and date are required'
        });
      }

      const expense = await prisma.expense.create({
        data: {
          amount: parseFloat(amount),
          description,
          category,
          date: new Date(date),
          tripId
        }
      });

      return res.status(201).json({ expense });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Expenses error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid access token' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}