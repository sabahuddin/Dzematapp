import { createContext, useContext } from 'react';
import { apiClient, User, AuthState } from './api';

export interface AuthContextType {
  user: User | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  verifyTenant: (tenantCode: string) => Promise<{ success: boolean; tenantName?: string }>;
  clearTenant: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export { apiClient };
export type { User, AuthState };
