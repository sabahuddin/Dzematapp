import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { authService } from '@/services/auth';
import { 
  registerForPushNotificationsAsync, 
  registerPushTokenWithServer,
  addNotificationReceivedListener,
  addNotificationResponseListener
} from '@/services/notifications';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      setupPushNotifications();
    }
    
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isLoggedIn]);

  const setupPushNotifications = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await registerPushTokenWithServer(token);
      }
      
      notificationListener.current = addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
      });

      responseListener.current = addNotificationResponseListener(response => {
        console.log('Notification response:', response);
      });
    } catch (error) {
      console.error('Error setting up push notifications:', error);
    }
  };

  const checkAuth = async () => {
    await authService.loadStoredAuth();
    const session = await authService.getSession();
    setIsLoggedIn(!!session);
  };

  if (isLoggedIn === null) {
    return null; // Loading state
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {!isLoggedIn ? (
          <Stack.Screen name="login" options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </>
        )}
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
