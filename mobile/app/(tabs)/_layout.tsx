import { Tabs } from 'expo-router';
import React from 'react';
import { Colors, AppColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: AppColors.navInactive,
        headerShown: true,
        headerStyle: {
          backgroundColor: AppColors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '600',
        },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          height: 88,
          paddingBottom: 24,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      {/* Main tab screens */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Početna',
          headerTitle: 'DžematApp',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          title: 'Objave',
          headerTitle: 'Objave',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bullhorn" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Događaji',
          headerTitle: 'Događaji',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="modules"
        options={{
          title: 'Više',
          headerTitle: 'Moduli',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-grid" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          headerTitle: 'Moj profil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
      
      {/* Hidden screens - accessible from modules */}
      <Tabs.Screen
        name="vaktija"
        options={{
          href: null,
          headerTitle: 'Vaktija',
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          href: null,
          headerTitle: 'Poruke',
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          href: null,
          headerTitle: 'Moje aktivnosti',
        }}
      />
      <Tabs.Screen
        name="membership"
        options={{
          href: null,
          headerTitle: 'Članarina',
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          href: null,
          headerTitle: 'Shop',
        }}
      />
      <Tabs.Screen
        name="sections"
        options={{
          href: null,
          headerTitle: 'Sekcije',
        }}
      />
      <Tabs.Screen
        name="imam-qa"
        options={{
          href: null,
          headerTitle: 'Pitaj imama',
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          href: null,
          headerTitle: 'Dokumenti',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
