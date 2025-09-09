// FIX: Changed named import for defineConfig to default import to satisfy the compiler.
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  retries: 2,
  reporter: [['html',{ open: 'never' }],['junit',{ outputFile: 'results.xml' }]],
  projects: [
    { name:'Desktop Chromium', use:{ browserName:'chromium', viewport:{width:1280,height:800} } },
    { name:'Mobile Safari', use:{ browserName:'webkit', viewport:{width:375,height:812} } }
  ],
  use: { 
    baseURL: process.env.BASE_URL || 'http://localhost:5173', // Adjusted for Vite default port
    trace: 'on-first-retry' 
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});