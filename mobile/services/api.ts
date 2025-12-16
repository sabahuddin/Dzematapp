import AsyncStorage from '@react-native-async-storage/async-storage';

// Use environment variable or default to production URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://dzematapp.replit.app';

class ApiClient {
  private baseUrl: string;
  private sessionCookie: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.loadSession();
  }

  private async loadSession() {
    try {
      this.sessionCookie = await AsyncStorage.getItem('session_cookie');
    } catch (error) {
      console.error('Error loading session:', error);
    }
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  setSessionCookie(cookie: string) {
    this.sessionCookie = cookie;
    AsyncStorage.setItem('session_cookie', cookie);
  }

  clearSession() {
    this.sessionCookie = null;
    AsyncStorage.removeItem('session_cookie');
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<{ data: T; headers: Headers }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.sessionCookie) {
      headers['Cookie'] = this.sessionCookie;
    }

    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    // Store session cookie from response
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      this.setSessionCookie(setCookie);
    }

    if (!response.ok) {
      if (response.status === 401) {
        this.clearSession();
      }
      const errorData = await response.json().catch(() => ({}));
      throw { response: { status: response.status, data: errorData } };
    }

    const data = await response.json();
    return { data, headers: response.headers };
  }

  async get<T>(url: string) {
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(url: string, body?: any) {
    return this.request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(url: string, body?: any) {
    return this.request<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(url: string, body?: any) {
    return this.request<T>(url, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(url: string) {
    return this.request<T>(url, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
