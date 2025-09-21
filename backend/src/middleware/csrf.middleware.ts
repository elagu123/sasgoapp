// Archivo: src/middleware/csrf.middleware.ts
// Propósito: Implementa la protección CSRF usando el patrón "Double Submit Cookie".

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Genera un token CSRF y lo establece en una cookie no-HttpOnly.
 * @param res - El objeto de respuesta de Express.
 */
export const setCsrfCookie = (res: Response) => {
    const csrfToken = crypto.randomBytes(16).toString('hex');
    res.cookie('csrf-token', csrfToken, {
        // httpOnly: false es REQUERIDO para que el JS del cliente pueda leerlo.
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
    });
};

/**
 * Middleware para validar el token CSRF en peticiones que modifican estado.
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
    // Saltamos la verificación para métodos seguros que no modifican estado.
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Skip CSRF protection in development and test modes
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.log(`⚠️ CSRF protection disabled in ${process.env.NODE_ENV} mode`);
        return next();
    }

    const csrfTokenFromHeader = req.headers['x-csrf-token'];
    const csrfTokenFromCookie = req.cookies['csrf-token'];

    if (!csrfTokenFromHeader || !csrfTokenFromCookie || csrfTokenFromHeader !== csrfTokenFromCookie) {
        console.warn('CSRF token validation failed: Mismatch or missing token.');
        return res.status(403).json({ message: 'Validación de token CSRF fallida.' });
    }

    next();
};