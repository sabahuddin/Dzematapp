import { Tabs, Redirect, router } from 'expo-router';
import { TouchableOpacity, View, Image, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../services/auth';
import { AppColors, Spacing, BorderRadius, Typography } from '../../constants/theme';

const logoImage = require('../../assets/logo.png');

function HeaderLeft() {
  return (
    <View style={styles.headerLeft}>
      <Image source={logoImage} style={styles.headerLogo} resizeMode="contain" />
    </View>
  );
}

function HeaderRight() {
  const { user } = useAuth();
  const unreadCount = 3;

  return (
    <View style={styles.headerRight}>
      <View style={styles.pointsBadge}>
        <Ionicons name="star" size={14} color="#FFA726" />
        <Text style={styles.pointsText}>{user?.totalPoints || 0}</Text>
      </View>
      
      <TouchableOpacity style={styles.notificationBtn} onPress={() => router.push('/notifications')}>
        <Ionicons name="notifications-outline" size={24} color={AppColors.white} />
        {unreadCount > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
        {user?.photoUrl ? (
          <Image source={{ uri: user.photoUrl }} style={styles.profilePhoto} />
        ) : (
          <View style={styles.profilePhotoPlaceholder}>
            <Text style={styles.profileInitial}>{user?.firstName?.[0] || 'U'}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
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
          backgroundColor: 'rgba(57, 73, 171, 0.85)',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: AppColors.white,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerTitle: '',
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
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          title: 'Obavijesti',
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
          headerStyle: { backgroundColor: AppColors.primary },
          headerTintColor: AppColors.white,
          headerLeft: () => (
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={AppColors.white} />
            </TouchableOpacity>
          ),
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
    width: 36,
    height: 36,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
    gap: Spacing.sm,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 167, 38, 0.25)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  pointsText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: '#FFA726',
    marginLeft: 4,
  },
  notificationBtn: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: AppColors.error,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.white,
  },
  profilePhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  profilePhotoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  profileInitial: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.white,
  },
  backButton: {
    marginLeft: Spacing.md,
  },
});
