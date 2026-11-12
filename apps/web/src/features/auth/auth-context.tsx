import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiRequest } from '../../lib/api';

type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username?: string | null;
  roles: string[];
  permissions: string[];
};

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  login: (username: string, password: string) => Promise<AuthUser>;
  setSession: (accessToken: string, user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'kop_access_token';
const USER_KEY = 'kop_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY),
  );
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  });

  const login = useCallback(async (username: string, password: string) => {
    const result = await apiRequest<{
      accessToken: string;
      user: AuthUser;
    }>('/auth/login', {
      method: 'POST',
      body: { username, password },
    });

    localStorage.setItem(TOKEN_KEY, result.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    setAccessToken(result.accessToken);
    setUser(result.user);
    return result.user;
  }, []);

  const setSession = useCallback((token: string, nextUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setAccessToken(token);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener('kop:unauthorized', onUnauthorized);
    return () => window.removeEventListener('kop:unauthorized', onUnauthorized);
  }, [logout]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let cancelled = false;

    apiRequest<AuthUser>('/auth/profile', { token: accessToken })
      .then((profile) => {
        if (cancelled) {
          return;
        }
        localStorage.setItem(USER_KEY, JSON.stringify(profile));
        setUser(profile);
      })
      .catch(() => {
        if (!cancelled) {
          logout();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, logout]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      login,
      setSession,
      logout,
      isAuthenticated: Boolean(accessToken && user),
    }),
    [accessToken, login, logout, setSession, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
