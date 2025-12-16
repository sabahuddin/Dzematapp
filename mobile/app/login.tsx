import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '@/services/auth';
import { AppColors, BorderRadius, Spacing, Typography } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TENANT_STORAGE_KEY = 'dzematapp_tenant_id';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tenantCode, setTenantCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyingTenant, setVerifyingTenant] = useState(false);
  const [showTenantSetup, setShowTenantSetup] = useState(true);
  const [storedTenantId, setStoredTenantId] = useState<string | null>(null);

  useEffect(() => {
    checkStoredTenant();
  }, []);

  const checkStoredTenant = async () => {
    try {
      const savedTenantId = await AsyncStorage.getItem(TENANT_STORAGE_KEY);
      if (savedTenantId) {
        setStoredTenantId(savedTenantId);
        setShowTenantSetup(false);
      }
    } catch (error) {
      console.error('Error checking tenant:', error);
    }
  };

  const handleVerifyTenant = async () => {
    if (!tenantCode.trim()) {
      Alert.alert('Greška', 'Molimo unesite kod organizacije');
      return;
    }

    setVerifyingTenant(true);
    try {
      const response = await fetch(`${authService.getBaseUrl()}/api/tenants/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantCode: tenantCode.trim().toUpperCase() })
      });

      if (response.ok) {
        const data = await response.json();
        await AsyncStorage.setItem(TENANT_STORAGE_KEY, data.tenantId);
        setStoredTenantId(data.tenantId);
        setShowTenantSetup(false);
        setTenantCode('');
      } else {
        const errorData = await response.json();
        Alert.alert('Greška', errorData.message || 'Nevažeći kod organizacije');
      }
    } catch (error) {
      Alert.alert('Greška', 'Greška pri provjeri koda. Pokušajte ponovo.');
    } finally {
      setVerifyingTenant(false);
    }
  };

  const handleChangeTenant = async () => {
    await AsyncStorage.removeItem(TENANT_STORAGE_KEY);
    setStoredTenantId(null);
    setShowTenantSetup(true);
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Greška', 'Molimo unesite korisničko ime i lozinku');
      return;
    }

    setLoading(true);
    try {
      await authService.login(username, password, storedTenantId);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Greška pri prijavi', error.response?.data?.message || 'Molimo pokušajte ponovo');
    } finally {
      setLoading(false);
    }
  };

  if (showTenantSetup) {
    return (
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>🕌</Text>
            </View>
            <Text style={styles.title}>DžematApp</Text>
            <Text style={styles.subtitle}>Vaša zajednica na dlanu</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dobrodošli</Text>
            <Text style={styles.cardDescription}>
              Unesite kod vaše organizacije da biste se povezali
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Kod organizacije (npr. DEMO)"
              value={tenantCode}
              onChangeText={setTenantCode}
              autoCapitalize="characters"
              editable={!verifyingTenant}
              placeholderTextColor={AppColors.textSecondary}
            />

            <TouchableOpacity
              style={[styles.button, verifyingTenant && styles.buttonDisabled]}
              onPress={handleVerifyTenant}
              disabled={verifyingTenant}
            >
              {verifyingTenant ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Nastavi</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🕌</Text>
          </View>
          <Text style={styles.title}>DžematApp</Text>
          <Text style={styles.subtitle}>Prijavite se na svoj račun</Text>
        </View>

        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Korisničko ime"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            editable={!loading}
            placeholderTextColor={AppColors.textSecondary}
          />

          <TextInput
            style={styles.input}
            placeholder="Lozinka"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
            placeholderTextColor={AppColors.textSecondary}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Prijavi se</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={handleChangeTenant}
          >
            <Text style={styles.linkText}>Promijeni organizaciju</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    ...Typography.h1,
    color: AppColors.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: AppColors.textSecondary,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    ...Typography.h2,
    color: AppColors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    ...Typography.body,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    backgroundColor: AppColors.background,
    marginBottom: Spacing.md,
    color: AppColors.textPrimary,
  },
  button: {
    backgroundColor: AppColors.secondary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    ...Typography.button,
    color: '#FFFFFF',
  },
  linkButton: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  linkText: {
    ...Typography.bodySmall,
    color: AppColors.secondary,
  },
});
