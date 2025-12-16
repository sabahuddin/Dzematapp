import { Redirect } from 'expo-router';
import { useAuth } from '../services/auth';

export default function Index() {
  const { isAuthenticated, tenantId } = useAuth();

  if (!tenantId || !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(tabs)" />;
}
