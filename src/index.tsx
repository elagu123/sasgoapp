import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
// Fix: Import QueryClient directly from @tanstack/query-core to resolve the export issue.
// QueryClientProvider is a React-specific component and remains imported from @tanstack/react-query.
import { QueryClientProvider } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/query-core';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { ToastProvider } from './contexts/ToastContext.tsx';
import { TripProvider } from './contexts/TripContext.tsx';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const queryClient = new QueryClient();

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <TripProvider>
                <App />
              </TripProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </HashRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
