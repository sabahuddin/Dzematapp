import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  isAdmin: boolean;
  tenantId: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
}

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/login', {
        username,
        password,
      });
      
      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        apiClient.setToken(response.data.token);
      }
      
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      apiClient.clearToken();
    }
  }

  async getSession(): Promise<User | null> {
    try {
      const response = await apiClient.get<{ user: User }>('/api/auth/session');
      return response.data.user;
    } catch (error) {
      return null;
    }
  }

  async loadStoredAuth(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        apiClient.setToken(token);
      }
    } catch (error) {
      console.error('Load stored auth error:', error);
    }
  }
}

export const authService = AuthService.getInstance();
