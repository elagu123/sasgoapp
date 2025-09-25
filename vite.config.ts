
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react({
        jsxRuntime: 'automatic'
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
          manualChunks: (id) => {
            // Vendor libraries
            if (id.includes('node_modules')) {
              // React ecosystem
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              // Routing
              if (id.includes('react-router')) {
                return 'vendor-router';
              }
              // Animation
              if (id.includes('framer-motion')) {
                return 'vendor-motion';
              }
              // DnD
              if (id.includes('@dnd-kit')) {
                return 'vendor-dnd';
              }
              // Query/State
              if (id.includes('@tanstack')) {
                return 'vendor-query';
              }
              // Icons
              if (id.includes('@heroicons')) {
                return 'vendor-icons';
              }
              // Form handling
              if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
                return 'vendor-forms';
              }
              // Heavy libraries
              if (id.includes('html2canvas') || id.includes('jspdf')) {
                return 'vendor-pdf';
              }
              // Google/Maps
              if (id.includes('@googlemaps') || id.includes('@google/genai')) {
                return 'vendor-google';
              }
              // Other vendor
              return 'vendor-other';
            }

            // App code chunking by feature
            if (id.includes('src/pages/')) {
              if (id.includes('Dashboard')) return 'pages-dashboard';
              if (id.includes('Trip') || id.includes('Enhanced')) return 'pages-trip';
              if (id.includes('Gear')) return 'pages-gear';
              if (id.includes('Getaway')) return 'pages-getaway';
              return 'pages-other';
            }

            if (id.includes('src/components/')) {
              if (id.includes('dashboard')) return 'components-dashboard';
              if (id.includes('itinerary') || id.includes('timeline')) return 'components-trip';
              if (id.includes('maps')) return 'components-maps';
              if (id.includes('gear')) return 'components-gear';
              return 'components-common';
            }

            if (id.includes('src/services/')) {
              return 'services';
            }
          }
        }
      },
      chunkSizeWarningLimit: 800,
      sourcemap: mode === 'production' ? false : true
    },
    preview: {
      port: 4173,
      strictPort: true
    }
  };
});
