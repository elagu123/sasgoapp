import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
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
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
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

    } else if (req.method === 'PUT') {
      const { name, email, currentPassword, newPassword } = req.body;

      // If changing password, verify current password
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password required to change password' });
        }

        const user = await prisma.user.findUnique({
          where: { id: decoded.userId }
        });

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        const isValidPassword = await bcryptjs.compare(currentPassword, user.password);
        if (!isValidPassword) {
          return res.status(400).json({ error: 'Current password is incorrect' });
        }
      }

      // Check if email is already taken by another user
      if (email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email,
            NOT: { id: decoded.userId }
          }
        });

        if (existingUser) {
          return res.status(409).json({ error: 'Email already taken by another user' });
        }
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (newPassword) {
        updateData.password = await bcryptjs.hash(newPassword, 12);
      }

      const updatedUser = await prisma.user.update({
        where: { id: decoded.userId },
        data: updateData
      });

      const { password: _, ...userWithoutPassword } = updatedUser;

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

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Profile error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid access token' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}