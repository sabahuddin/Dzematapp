import { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthContext, AuthContextType, User } from '../services/auth';
import { apiClient } from '../services/api';
import { AppColors } from '../constants/theme';

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const initialize = useCallback(async () => {
    setIsLoading(true);
    try {
      const state = await apiClient.initialize();
      setUser(state.user);
      setTenantId(state.tenantId);
      setIsAuthenticated(state.isAuthenticated);
    } catch (error) {
      console.error('Failed to initialize:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const login = useCallback(async (username: string, password: string) => {
    const result = await apiClient.login(username, password);
    if (result.success && result.user) {
      setUser(result.user);
      setIsAuthenticated(true);
    }
    return { success: result.success, error: result.error };
  }, []);

  const logout = useCallback(async () => {
    await apiClient.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const verifyTenant = useCallback(async (tenantCode: string) => {
    const result = await apiClient.verifyTenant(tenantCode);
    if (result.success) {
      setTenantId(result.tenantId || null);
    }
    return { success: result.success, tenantName: result.tenantName };
  }, []);

  const clearTenant = useCallback(async () => {
    await apiClient.clearTenant();
    setTenantId(null);
  }, []);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser((prev) => prev ? { ...prev, ...userData } : null);
  }, []);

  const authContext: AuthContextType = {
    user,
    tenantId,
    isAuthenticated,
    isLoading,
    login,
    logout,
    verifyTenant,
    clearTenant,
    initialize,
    updateUser,
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <StatusBar style="light" backgroundColor={AppColors.primary} />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authContext}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="light" backgroundColor={AppColors.primary} />
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.background,
  },
});
