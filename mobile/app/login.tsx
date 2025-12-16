import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../services/auth';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';

export default function LoginScreen() {
  const { verifyTenant, login, tenantId, isAuthenticated } = useAuth();
  
  const [step, setStep] = useState<'tenant' | 'login'>(tenantId ? 'login' : 'tenant');
  const [tenantCode, setTenantCode] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tenantId) {
      setStep('login');
    }
  }, [tenantId]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  const handleVerifyTenant = async () => {
    if (!tenantCode.trim()) {
      setError('Unesite kod organizacije');
      return;
    }

    setLoading(true);
    setError('');

    const result = await verifyTenant(tenantCode);
    
    if (result.success) {
      setTenantName(result.tenantName || '');
      setStep('login');
    } else {
      setError('Kod organizacije nije pronađen');
    }
    
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Unesite korisničko ime i lozinku');
      return;
    }

    setLoading(true);
    setError('');

    const result = await login(username, password);
    
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      setError(result.error || 'Prijava neuspješna');
    }
    
    setLoading(false);
  };

  const handleChangeTenant = async () => {
    const { clearTenant } = useAuth();
    await clearTenant();
    setStep('tenant');
    setTenantCode('');
    setTenantName('');
    setUsername('');
    setPassword('');
    setError('');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>🕌</Text>
          </View>
          <Text style={styles.appName}>DžematApp</Text>
          <Text style={styles.tagline}>Vaša zajednica na dlanu</Text>
        </View>

        <View style={styles.formCard}>
          {step === 'tenant' ? (
            <>
              <Text style={styles.formTitle}>Unesite kod organizacije</Text>
              <Text style={styles.formSubtitle}>
                Unesite kod koji ste dobili od vaše džematske organizacije
              </Text>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TextInput
                style={styles.input}
                placeholder="Kod organizacije (npr. DEMO)"
                placeholderTextColor={AppColors.textSecondary}
                value={tenantCode}
                onChangeText={(text) => {
                  setTenantCode(text.toUpperCase());
                  setError('');
                }}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!loading}
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyTenant}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={AppColors.white} />
                ) : (
                  <Text style={styles.buttonText}>Nastavi</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.formTitle}>Prijava</Text>
              {tenantName ? (
                <Text style={styles.tenantBadge}>{tenantName}</Text>
              ) : null}

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TextInput
                style={styles.input}
                placeholder="Korisničko ime"
                placeholderTextColor={AppColors.textSecondary}
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  setError('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />

              <TextInput
                style={styles.input}
                placeholder="Lozinka"
                placeholderTextColor={AppColors.textSecondary}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
                secureTextEntry
                editable={!loading}
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={AppColors.white} />
                ) : (
                  <Text style={styles.buttonText}>Prijavi se</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.changeTenantButton}
                onPress={handleChangeTenant}
                disabled={loading}
              >
                <Text style={styles.changeTenantText}>Promijeni organizaciju</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AppColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  logoText: {
    fontSize: 48,
  },
  appName: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.white,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: Typography.fontSize.md,
    color: 'rgba(255,255,255,0.8)',
  },
  formCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  formTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  tenantBadge: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.primary,
    backgroundColor: `${AppColors.primary}15`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.error,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  input: {
    backgroundColor: AppColors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: AppColors.textPrimary,
    marginBottom: Spacing.md,
  },
  button: {
    backgroundColor: AppColors.secondary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
    ...Shadows.button,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.white,
  },
  changeTenantButton: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  changeTenantText: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.secondary,
  },
});
