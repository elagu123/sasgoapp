// Archivo: src/utils/env-validation.ts
// Propósito: Validar variables de entorno requeridas al inicio del servidor

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3001'),
  
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  
  // JWT Secrets (required, no defaults)
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  
  // CORS
  CORS_ORIGIN: z.string().optional().default('http://localhost:5173'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnvironmentVariables(): EnvConfig {
  try {
    const result = envSchema.parse(process.env);
    
    console.log('✅ Environment variables validated successfully');
    console.log(`📝 NODE_ENV: ${result.NODE_ENV}`);
    console.log(`🚀 PORT: ${result.PORT}`);
    console.log(`🌐 CORS_ORIGIN: ${result.CORS_ORIGIN}`);
    console.log('🔒 JWT secrets configured');
    console.log('🗄️  Database URL configured');
    
    return result;
  } catch (error) {
    console.error('❌ Environment variable validation failed:');
    
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`   - ${err.path.join('.')}: ${err.message}`);
      });
      
      console.error('\n💡 Please check your .env file and ensure all required variables are set.');
      console.error('📋 See backend/.env.example for reference');
    } else {
      console.error(error);
    }
    
    process.exit(1);
  }
}