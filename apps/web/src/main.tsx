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
import { registerAppServiceWorker } from './lib/register-service-worker';
import './styles.css';

registerAppServiceWorker();

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
