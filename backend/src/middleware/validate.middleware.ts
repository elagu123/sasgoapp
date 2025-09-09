// Archivo: src/middleware/validate.middleware.ts
// Propósito: Middleware genérico para validar peticiones usando un esquema de Zod.

// FIX: Changed `import type` to a value import to resolve type errors with Express.
import { Request, Response, NextFunction } from 'express';
// FIX: Replaced AnyZodObject with z.Schema for broader version compatibility.
import { z } from 'zod';

const validate = (schema: z.Schema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (e: any) {
    return res.status(400).send(e.errors);
  }
};

export default validate;