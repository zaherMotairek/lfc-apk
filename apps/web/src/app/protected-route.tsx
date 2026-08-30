import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';

export function ProtectedRoute({
  requireAdmin = false,
}: {
  requireAdmin?: boolean;
}) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireAdmin) {
    const isAdmin = user?.roles.some((role) =>
      ['SUPER_ADMIN', 'COMMITTEE_ADMIN', 'CONTENT_MANAGER', 'GAME_MANAGER', 'EVENT_MANAGER'].includes(
        role,
      ),
    );
    if (!isAdmin) {
      return <Navigate to="/app" replace />;
    }
  }

  return <Outlet />;
}
