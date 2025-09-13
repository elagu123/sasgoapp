import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify the access token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid access token' });
    }

    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      user: {
        ...userWithoutPassword,
        preferences: {
          travelStyle: 'moderate',
          preferredCategories: ['sightseeing', 'food', 'culture'],
          budgetHistory: []
        }
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid access token' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}