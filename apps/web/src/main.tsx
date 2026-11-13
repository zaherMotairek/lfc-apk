import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './app/router';
import { AuthProvider } from './features/auth/auth-context';
import { LanguageProvider } from './features/content/language-provider';
import { ContentProvider } from './features/content/content-provider';
import { ConfirmProvider } from './components/ui/confirm-provider';
import { ToastProvider } from './components/ui/toast-provider';
import { BrandHead } from './components/ui/brand-head';
import { ApiError } from './lib/api';
import './styles.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Prevent stale UI chunks by removing old service workers and caches.
    void navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())));
    if ('caches' in window) {
      void caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
    }
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status === 401) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
          <ContentProvider>
            <ConfirmProvider>
              <ToastProvider>
                <BrandHead />
                <AppRouter />
              </ToastProvider>
            </ConfirmProvider>
          </ContentProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
