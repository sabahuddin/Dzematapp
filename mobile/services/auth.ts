import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';

const USER_STORAGE_KEY = 'dzematapp_user';

export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  photo: string | null;
  isAdmin: boolean;
  roles: string[];
  tenantId: string;
}

export interface AuthResponse {
  user: User;
}

class AuthService {
  private user: User | null = null;

  async loadStoredAuth() {
    try {
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userData) {
        this.user = JSON.parse(userData);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }

  async getSession(): Promise<User | null> {
    try {
      const response = await apiClient.get<{ user: User }>('/api/auth/session');
      this.user = response.data.user;
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(this.user));
      return this.user;
    } catch (error) {
      return null;
    }
  }

  getBaseUrl() {
    return apiClient.getBaseUrl();
  }

  getUser() {
    return this.user;
  }

  async login(username: string, password: string, tenantId: string | null): Promise<User> {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', {
      username,
      password,
      tenantId,
    });

    this.user = response.data.user;
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(this.user));
    return this.user;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.user = null;
      apiClient.clearSession();
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
    }
  }

  isLoggedIn(): boolean {
    return this.user !== null;
  }
}

export const authService = new AuthService();
