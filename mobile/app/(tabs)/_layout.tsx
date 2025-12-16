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
          borderTopColor: '#E0E0E0',
          height: Platform.OS === 'ios' ? 84 : 60,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Početna', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home" size={24} color={color} /> }} />
      <Tabs.Screen name="announcements" options={{ title: 'Objave', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="bullhorn" size={24} color={color} /> }} />
      <Tabs.Screen name="events" options={{ title: 'Događaji', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="calendar" size={24} color={color} /> }} />
      <Tabs.Screen name="modules" options={{ title: 'Više', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="view-grid" size={24} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account" size={24} color={color} /> }} />
      <Tabs.Screen name="vaktija" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="activities" options={{ href: null }} />
      <Tabs.Screen name="membership" options={{ href: null }} />
      <Tabs.Screen name="shop" options={{ href: null }} />
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
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
