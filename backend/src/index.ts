// Archivo: src/index.ts
// Propósito: Punto de entrada principal del servidor backend.
// Configura Express, aplica middleware de seguridad y carga las rutas de la API.

import express from 'express';
// FIX: Use aliased imports for express types to avoid conflicts with other global types.
// FIX: Changed from type-only import to value import to resolve module resolution errors.
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import apiRouter from './routes';
import http from 'http';
import { WebSocketServer } from 'ws';
const { setupWSConnection } = require('y-websocket/bin/utils');
import prisma from './lib/prisma';
import * as Y from 'yjs';
import { csrfProtection } from './middleware/csrf.middleware';
import { verifyAccessToken } from './utils/jwt';
import { parse as parseUrl } from 'url';
import { parse as parseQuery } from 'querystring';
import { validateEnvironmentVariables, type EnvConfig } from './utils/env-validation';

// Cargar variables de entorno
dotenv.config();

// Validar variables de entorno antes de continuar
const env: EnvConfig = validateEnvironmentVariables();

const app = express();
const PORT = env.PORT;

// --- Rate Limiting (General) ---
const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 150, // Limit each IP to 150 requests per `window`
	standardHeaders: true,
	legacyHeaders: false,
    message: { error: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo en 15 minutos.' },
});

// Apply to all API routes
app.use('/api', apiLimiter);


// --- Middleware Esenciales ---
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Only log requests in development mode
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// --- Rutas de la API (con protección CSRF) ---
app.use('/api', csrfProtection); // Aplicar protección CSRF a todas las rutas de /api
app.use('/api', apiRouter);

// --- Manejo de Errores ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error details for debugging (server-side only)
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : 'Stack trace hidden in production',
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Send sanitized error response to client
  const status = (err as any).status || 500;
  const message = status < 500 ? err.message : 'Error interno del servidor';
  
  res.status(status).json({ 
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// --- Configuración del Servidor HTTP y WebSocket ---
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// --- Lógica de Colaboración (Yjs) ---

// Helper para debounce
function debounce(func: (...args: any[]) => void, wait: number) {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const writeDebounced = new Map<string, () => void>();

// Helper para poblar un Y.Doc desde JSON
const populateYdoc = (yItinerary: Y.Array<Y.Map<any>>, itineraryJson: any[]) => {
    itineraryJson.forEach((day: any) => {
        const yDay = new Y.Map<any>();
        Object.entries(day).forEach(([key, value]) => {
            if (key !== 'blocks') {
                yDay.set(key, value);
            }
        });
        // FIX: Explicitly type Y.Array to prevent type mismatch errors.
        const yBlocks: Y.Array<Y.Map<any>> = new Y.Array<Y.Map<any>>();
        (day.blocks || []).forEach((block: any) => {
            const yBlock = new Y.Map<any>();
            Object.entries(block).forEach(([key, value]) => {
                yBlock.set(key, value);
            });
            yBlocks.push([yBlock]);
        });
        yDay.set('blocks', yBlocks);
        yItinerary.push([yDay]);
    });
};

const persistence = {
  bindState: async (docName: string, ydoc: Y.Doc) => {
    console.log(`[Yjs] bindState for doc: ${docName}`);
    try {
        const trip = await prisma.trip.findUnique({ where: { id: docName } });
        if (trip && trip.itinerary) {
            const itineraryJson = JSON.parse(trip.itinerary);
            // FIX: Explicitly type the Y.Array to resolve type mismatch errors downstream.
            const yItinerary: Y.Array<Y.Map<any>> = ydoc.getArray<Y.Map<any>>('itinerary');
            if (yItinerary.length === 0 && itineraryJson.length > 0) {
                console.log(`[Yjs] Populating doc ${docName} from DB.`);
                ydoc.transact(() => {
                    populateYdoc(yItinerary, itineraryJson);
                });
            }
        }
    } catch (e) {
        console.error(`[Yjs] Error fetching initial state for ${docName}`, e);
    }

    const debouncedSave = debounce(async () => {
        try {
            const itineraryJSON = ydoc.getArray('itinerary').toJSON();
            await prisma.trip.update({
                where: { id: docName },
                data: { itinerary: JSON.stringify(itineraryJSON) },
            });
            console.log(`[Yjs] Persisted doc: ${docName}`);
        } catch (e) {
            console.error(`[Yjs] Error persisting doc ${docName}`, e);
        }
    }, 2000);

    writeDebounced.set(docName, debouncedSave);

    ydoc.on('update', (update, origin) => {
        if (origin !== 'db') { // Evitar bucles si alguna vez cargamos desde un origen de DB
            debouncedSave();
        }
    });
  },
  writeState: async (docName: string, ydoc: Y.Doc) => {
    console.log(`[Yjs] writeState for doc: ${docName}`);
    const save = writeDebounced.get(docName);
    if (save) {
        save();
        writeDebounced.delete(docName);
    }
  },
};

// WebSocket rate limiting
const wsConnections = new Map<string, { count: number; lastReset: number }>();
const WS_RATE_LIMIT = 10; // connections per minute per IP
const WS_RATE_WINDOW = 60 * 1000; // 1 minute

// WebSocket authentication middleware
const authenticateWebSocket = (req: any): { authorized: boolean; userId?: string; tripId?: string } => {
  try {
    const parsedUrl = parseUrl(req.url, true);
    const { token, tripId } = parsedUrl.query;
    
    if (!token || !tripId) {
      console.warn('[WebSocket] Missing token or tripId in connection');
      return { authorized: false };
    }
    
    const payload = verifyAccessToken(token as string);
    if (!payload) {
      console.warn('[WebSocket] Invalid or expired token');
      return { authorized: false };
    }
    
    return { authorized: true, userId: payload.id, tripId: tripId as string };
  } catch (error) {
    console.error('[WebSocket] Authentication error:', error);
    return { authorized: false };
  }
};

// Rate limiting for WebSocket connections
const checkWebSocketRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const clientData = wsConnections.get(ip);
  
  if (!clientData || now - clientData.lastReset > WS_RATE_WINDOW) {
    wsConnections.set(ip, { count: 1, lastReset: now });
    return true;
  }
  
  if (clientData.count >= WS_RATE_LIMIT) {
    return false;
  }
  
  clientData.count++;
  return true;
};

// WebSocket connection handler with authentication and rate limiting
wss.on('connection', async (conn, req) => {
  const clientIp = req.socket.remoteAddress || 'unknown';
  
  // Rate limiting
  if (!checkWebSocketRateLimit(clientIp)) {
    console.warn(`[WebSocket] Rate limit exceeded for IP: ${clientIp}`);
    conn.close(1008, 'Rate limit exceeded');
    return;
  }

  // Authentication
  const auth = authenticateWebSocket(req);
  if (!auth.authorized) {
    console.warn(`[WebSocket] Unauthorized connection attempt from IP: ${clientIp}`);
    conn.close(1008, 'Unauthorized');
    return;
  }

  const { userId, tripId } = auth;
  console.log(`[WebSocket] New authenticated connection - User: ${userId}, Trip: ${tripId}, IP: ${clientIp}`);

  // Verify user has access to this trip
  try {
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        OR: [
          { userId: userId }, // Owner
          { 
            sharedWith: {
              some: { userId: userId }
            }
          } // Member
        ]
      }
    });

    if (!trip) {
      console.warn(`[WebSocket] User ${userId} doesn't have access to trip ${tripId}`);
      conn.close(1008, 'Access denied');
      return;
    }

    // Setup Y.js WebSocket connection with custom persistence
    const utils = require('y-websocket/bin/utils.cjs');
    
    // Set up persistence for this document
    const docName = tripId!;
    if (!writeDebounced.has(docName)) {
      // Create a Y.Doc and bind persistence
      const ydoc = new Y.Doc();
      await persistence.bindState(docName, ydoc);
      
      // Store the document for reuse
      utils.docs.set(docName, ydoc);
    }
    
    setupWSConnection(conn, req, tripId);

    console.log(`[WebSocket] Successfully connected user ${userId} to trip ${tripId}`);

  } catch (error) {
    console.error(`[WebSocket] Error verifying trip access:`, error);
    conn.close(1011, 'Server error');
  }
});

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
  console.log(`🔗 WebSocket server enabled for real-time collaboration`);
});

export default app;