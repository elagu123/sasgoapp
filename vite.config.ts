
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Only expose specific environment variables that are safe for the frontend
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  },
  server: {
    proxy: {
      // Proxy /api requests to our backend server
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    }
  }
});
