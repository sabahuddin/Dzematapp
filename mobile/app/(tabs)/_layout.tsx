import { Tabs, Redirect, router } from 'expo-router';
import { TouchableOpacity, View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../services/auth';
import { AppColors, Spacing } from '../../constants/theme';

const logoImage = require('../../assets/logo.png');

function HeaderLeft() {
  return (
    <View style={styles.headerLeft}>
      <Image source={logoImage} style={styles.headerLogo} resizeMode="contain" />
    </View>
  );
}

function HeaderRight() {
  return (
    <TouchableOpacity 
      style={styles.headerRight} 
      onPress={() => router.push('/(tabs)/profile')}
    >
      <Ionicons name="person-circle-outline" size={28} color={AppColors.white} />
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const { isAuthenticated, tenantId } = useAuth();

  if (!tenantId || !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: AppColors.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: AppColors.white,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerLeft: () => <HeaderLeft />,
        headerRight: () => <HeaderRight />,
        tabBarStyle: {
          backgroundColor: AppColors.white,
          borderTopColor: AppColors.navBorder,
          borderTopWidth: 1,
          height: 88,
          paddingBottom: 24,
          paddingTop: 8,
        },
        tabBarActiveTintColor: AppColors.primary,
        tabBarInactiveTintColor: AppColors.navInactive,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Početna',
          headerTitle: 'DžematApp',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          title: 'Objave',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'megaphone' : 'megaphone-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Događaji',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Poruke',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="modules"
        options={{
          title: 'Više',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          headerLeft: () => null,
          headerRight: () => null,
          headerTitle: 'Moj profil',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerLeft: {
    marginLeft: Spacing.md,
  },
  headerLogo: {
    width: 32,
    height: 32,
  },
  headerRight: {
    marginRight: Spacing.md,
  },
});
