import { createContext } from 'react';

export interface AuthUser {
  id: string;
  displayName: string;
  email: string | null;
  emailVerified: boolean;
  avatarUrl: string | null;
}

export interface OAuthProviders {
  google: boolean;
  github: boolean;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'unavailable';

export interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  providers: OAuthProviders;
  isLoadingProviders: boolean;
  authError: string | null;
  refreshUser: () => Promise<boolean>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
