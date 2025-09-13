
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react({
        jsxRuntime: 'automatic',
        jsxImportSource: 'react'
      })
    ],
    mode: mode === 'production' ? 'production' : mode,
    define: {
      // Force production build
      'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : mode),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      __DEV__: mode !== 'production'
    },
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
      minifyIdentifiers: mode === 'production',
      minifySyntax: mode === 'production',
      minifyWhitespace: mode === 'production'
    },
    server: {
      proxy: {
        // Proxy /api requests to our backend server
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      }
    },
    build: {
      // Production optimizations
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            motion: ['framer-motion'],
            dnd: ['@dnd-kit/core', '@dnd-kit/sortable'],
            query: ['@tanstack/react-query']
          }
        }
      },
      chunkSizeWarningLimit: 1000,
      sourcemap: mode === 'production' ? false : true
    },
    preview: {
      port: 4173,
      strictPort: true
    }
  };
});
