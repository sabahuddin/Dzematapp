import { Tabs, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_STORAGE_KEY = 'dzematapp_user';

export default function TabLayout() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => { checkLoginStatus(); }, []);

  const checkLoginStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (!userData) {
        router.replace('/login');
        return;
      }
      setChecking(false);
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/login');
    }
  };

  if (checking) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ECEFF1' }}><ActivityIndicator size="large" color="#3949AB" /></View>;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3949AB',
        tabBarInactiveTintColor: '#B0BEC5',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#ECEFF1',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 80 : 60,
          paddingBottom: Platform.OS === 'ios' ? 20 : 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Početna', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="announcements" options={{ title: 'Objave', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="bullhorn" size={size} color={color} /> }} />
      <Tabs.Screen name="events" options={{ title: 'Događaji', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="calendar" size={size} color={color} /> }} />
      <Tabs.Screen name="shop" options={{ title: 'Shop', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="store" size={size} color={color} /> }} />
      <Tabs.Screen name="modules" options={{ title: 'Više', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="view-grid" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="vaktija" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="activities" options={{ href: null }} />
      <Tabs.Screen name="membership" options={{ href: null }} />
      <Tabs.Screen name="sections" options={{ href: null }} />
      <Tabs.Screen name="imam-qa" options={{ href: null }} />
      <Tabs.Screen name="documents" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="certificates" options={{ href: null }} />
      <Tabs.Screen name="applications" options={{ href: null }} />
      <Tabs.Screen name="badges" options={{ href: null }} />
      <Tabs.Screen name="guide" options={{ href: null }} />
      <Tabs.Screen name="livestream" options={{ href: null }} />
      <Tabs.Screen name="sponsors" options={{ href: null }} />
      <Tabs.Screen name="feed" options={{ href: null }} />
      <Tabs.Screen name="projects" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
