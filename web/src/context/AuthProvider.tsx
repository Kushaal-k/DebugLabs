import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  AuthContext,
  type AuthUser,
  type OAuthProviders,
} from './AuthContext';

const AUTH_API_BASE = `${
  (import.meta.env.VITE_SERVER_URL as string | undefined)?.replace(/\/+$/, '') ||
  '/api'
}/v1/auth`;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Authentication request failed.';
}

async function fetchCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch(`${AUTH_API_BASE}/me`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error(`Could not verify the current session (${response.status}).`);
  }
  const payload: { user: AuthUser } = await response.json();
  return payload.user;
}

async function fetchOAuthProviders(): Promise<OAuthProviders> {
  const response = await fetch(`${AUTH_API_BASE}/config`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Could not load sign-in providers (${response.status}).`);
  }
  const payload: { providers: OAuthProviders } = await response.json();
  return payload.providers;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated' | 'unavailable'>('loading');
  const [providers, setProviders] = useState<OAuthProviders>({
    google: false,
    github: false,
  });
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
      setStatus(currentUser ? 'authenticated' : 'unauthenticated');
      setAuthError(null);
      return currentUser !== null;
    } catch (error) {
      setUser(null);
      setStatus('unavailable');
      setAuthError(getErrorMessage(error));
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthError(null);
    const response = await fetch(`${AUTH_API_BASE}/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      const message = `Could not end the session (${response.status}).`;
      setAuthError(message);
      throw new Error(message);
    }
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const currentUser = await fetchCurrentUser();
        if (!isMounted) return;
        setUser(currentUser);
        setStatus(currentUser ? 'authenticated' : 'unauthenticated');
      } catch (error) {
        if (!isMounted) return;
        setUser(null);
        setStatus('unavailable');
        setAuthError(getErrorMessage(error));
      }
    }

    async function loadProviders() {
      try {
        const availableProviders = await fetchOAuthProviders();
        if (isMounted) setProviders(availableProviders);
      } catch (error) {
        if (isMounted) setAuthError(getErrorMessage(error));
      } finally {
        if (isMounted) setIsLoadingProviders(false);
      }
    }

    void restoreSession();
    void loadProviders();
    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      providers,
      isLoadingProviders,
      authError,
      refreshUser,
      logout,
    }),
    [user, status, providers, isLoadingProviders, authError, refreshUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
