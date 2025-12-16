import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiClient } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3949AB',
    });
  }

  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token - permission denied');
    return null;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    
    if (!projectId) {
      console.log('No project ID found for push notifications');
      return null;
    }

    const pushTokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    
    token = pushTokenData.data;
    console.log('Push token:', token);
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }

  return token;
}

export async function registerPushTokenWithServer(token: string): Promise<boolean> {
  try {
    await apiClient.post('/api/push/register', { pushToken: token });
    return true;
  } catch (error) {
    console.error('Error registering push token with server:', error);
    return false;
  }
}

export async function unregisterPushToken(): Promise<boolean> {
  try {
    await apiClient.post('/api/push/unregister');
    return true;
  } catch (error) {
    console.error('Error unregistering push token:', error);
    return false;
  }
}

export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
