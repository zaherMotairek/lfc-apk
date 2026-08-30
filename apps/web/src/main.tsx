import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './app/router';
import { AuthProvider } from './features/auth/auth-context';
import { LiveGoalProvider } from './components/live/live-goal-provider';
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

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <LiveGoalProvider>
            <AppRouter />
          </LiveGoalProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
