import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://app.dzematapp.com';

const STORAGE_KEYS = {
  SESSION: 'dzematapp_session',
  TENANT_ID: 'dzematapp_tenant_id',
  USER: 'dzematapp_user',
};

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isAdmin: boolean;
  tenantId: string;
  photoUrl?: string;
  gender?: string;
  dateOfBirth?: string;
  city?: string;
  streetAddress?: string;
  postalCode?: string;
  occupation?: string;
  registryNumber?: string;
  totalPoints?: number;
}

interface AuthState {
  user: User | null;
  tenantId: string | null;
  isAuthenticated: boolean;
}

class ApiClient {
  private sessionCookie: string | null = null;
  private tenantId: string | null = null;

  async initialize(): Promise<AuthState> {
    try {
      this.sessionCookie = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
      this.tenantId = await AsyncStorage.getItem(STORAGE_KEYS.TENANT_ID);
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      const user = userJson ? JSON.parse(userJson) : null;
      
      if (this.sessionCookie && user) {
        const isValid = await this.verifySession();
        if (isValid) {
          return { user, tenantId: this.tenantId, isAuthenticated: true };
        }
      }
      
      return { user: null, tenantId: this.tenantId, isAuthenticated: false };
    } catch (error) {
      console.error('Failed to initialize API client:', error);
      return { user: null, tenantId: null, isAuthenticated: false };
    }
  }

  async verifyTenant(tenantCode: string): Promise<{ success: boolean; tenantId?: string; tenantName?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tenants/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantCode: tenantCode.trim().toUpperCase() }),
      });

      if (response.ok) {
        const data = await response.json();
        this.tenantId = data.tenantId;
        await AsyncStorage.setItem(STORAGE_KEYS.TENANT_ID, data.tenantId);
        return { success: true, tenantId: data.tenantId, tenantName: data.tenantName };
      }
      return { success: false };
    } catch (error) {
      console.error('Failed to verify tenant:', error);
      return { success: false };
    }
  }

  async login(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      if (!this.tenantId) {
        return { success: false, error: 'Tenant nije postavljen' };
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Tenant-ID': this.tenantId,
        },
        body: JSON.stringify({ username, password, tenantId: this.tenantId }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
          this.sessionCookie = setCookie;
          await AsyncStorage.setItem(STORAGE_KEYS.SESSION, setCookie);
        }
        
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
        
        return { success: true, user: data.user };
      } else {
        const error = await response.json().catch(() => ({ message: 'Prijava neuspješna' }));
        return { success: false, error: error.message || 'Pogrešno korisničko ime ili lozinka' };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Greška pri povezivanju sa serverom' };
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders(),
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    }
    
    this.sessionCookie = null;
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  }

  async clearTenant(): Promise<void> {
    this.tenantId = null;
    await AsyncStorage.removeItem(STORAGE_KEYS.TENANT_ID);
  }

  private async verifySession(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
        method: 'GET',
        headers: this.getHeaders(),
        credentials: 'include',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.tenantId) {
      headers['X-Tenant-ID'] = this.tenantId;
    }
    if (this.sessionCookie) {
      headers['Cookie'] = this.sessionCookie;
    }
    return headers;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }

  getTenantId(): string | null {
    return this.tenantId;
  }
}

export const apiClient = new ApiClient();
export type { User, AuthState };
