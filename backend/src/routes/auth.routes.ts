

// Archivo: src/routes/auth.routes.ts
// Propósito: Define las rutas para la autenticación de usuarios.

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { registerHandler, loginHandler, refreshHandler, logoutHandler, meHandler } from '../controllers/auth.controller';
import validate from '../middleware/validate.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Stricter rate limit for auth routes to prevent brute-force attacks
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 20, // Limit each IP to 20 auth requests per window
	message: { error: 'Demasiados intentos de autenticación desde esta IP. Por favor intente de nuevo después de 15 minutos' },
	standardHeaders: true,
	legacyHeaders: false,
});


router.post('/register', authLimiter, validate(registerSchema), registerHandler);
router.post('/login', authLimiter, validate(loginSchema), loginHandler);
router.post('/refresh', authLimiter, refreshHandler);
router.post('/logout', logoutHandler);
router.get('/me', protect, meHandler);

export default router;