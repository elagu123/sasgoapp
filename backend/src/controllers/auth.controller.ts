// Archivo: src/controllers/auth.controller.ts
// Propósito: Maneja la lógica de las peticiones HTTP para el registro, login y otras operaciones de autenticación.

// FIX: Changed `import type` to a value import to resolve type errors with Express.
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail } from '../services/user.service';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { setCsrfCookie } from '../middleware/csrf.middleware';

export const registerHandler = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'El email ya está en uso' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await createUser({ name, email, password: hashedPassword });

    const { password: _, ...userWithoutPassword } = newUser;
    return res.status(201).json({ user: userWithoutPassword });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const loginHandler = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const accessToken = generateAccessToken({ id: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ id: user.id, email: user.email });
    
    // Establecer la cookie CSRF
    setCsrfCookie(res);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });
    
    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json({ accessToken, user: userWithoutPassword });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const refreshHandler = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }
    
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
        return res.status(403).json({ message: 'Invalid refresh token' });
    }

    const accessToken = generateAccessToken({ id: payload.id, email: payload.email });
    
    // Renovar también la cookie CSRF con el refresh
    setCsrfCookie(res);

    return res.json({ accessToken });
};

export const logoutHandler = (req: Request, res: Response) => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.cookie('csrf-token', '', {
    expires: new Date(0),
  });
  return res.status(200).json({ message: 'Logout exitoso' });
};

export const meHandler = (req: Request, res: Response) => {
    // El usuario es adjuntado a la request por el middleware `protect`
    const user = (req as any).user;
    if (user) {
        const { password: _, ...userWithoutPassword } = user;
        return res.status(200).json({ user: userWithoutPassword });
    }
    return res.status(404).json({ message: "Usuario no encontrado en la request" });
};