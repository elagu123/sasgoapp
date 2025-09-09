
// Archivo: src/utils/jwt.ts
// Propósito: Centraliza la lógica para firmar y verificar JSON Web Tokens.

import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT secrets must be provided via environment variables JWT_ACCESS_SECRET and JWT_REFRESH_SECRET');
}

interface UserPayload {
  id: string;
  email: string;
}

export const generateAccessToken = (user: UserPayload): string => {
  return jwt.sign(user, ACCESS_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (user: UserPayload): string => {
  return jwt.sign(user, REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string): UserPayload | null => {
  try {
    return jwt.verify(token, ACCESS_SECRET) as UserPayload;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): UserPayload | null => {
  try {
    return jwt.verify(token, REFRESH_SECRET) as UserPayload;
  } catch (error) {
    return null;
  }
};
