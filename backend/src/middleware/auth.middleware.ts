// Archivo: src/middleware/auth.middleware.ts
// Propósito: Middleware para proteger rutas, verificando el JWT de acceso.

// FIX: Changed `import type` to a value import to resolve type errors with Express.
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { findUserById } from '../services/user.service';

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  const bearer = req.headers.authorization;

  if (!bearer || !bearer.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acceso no autorizado' });
  }

  const token = bearer.split(' ')[1];
  const payload = verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json({ message: 'Acceso no autorizado: token inválido o expirado' });
  }

  const user = await findUserById(payload.id);

  if (!user) {
    return res.status(401).json({ message: 'Usuario no encontrado' });
  }
  
  // Adjuntar usuario a la request para uso en los controllers
  (req as any).user = user;
  next();
};