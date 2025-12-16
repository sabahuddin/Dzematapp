import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';

interface Notification {
  type: 'announcements' | 'events' | 'messages' | 'tasks';
  count: number;
  lastUpdated: string;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await apiClient.get<{ counts: Record<string, number> }>('/api/notifications/counts');
      const counts = data?.counts || {};
      const notifs: Notification[] = [];
      if (counts.announcements > 0) notifs.push({ type: 'announcements', count: counts.announcements, lastUpdated: '' });
      if (counts.events > 0) notifs.push({ type: 'events', count: counts.events, lastUpdated: '' });
      if (counts.messages > 0) notifs.push({ type: 'messages', count: counts.messages, lastUpdated: '' });
      if (counts.tasks > 0) notifs.push({ type: 'tasks', count: counts.tasks, lastUpdated: '' });
      setNotifications(notifs);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getNotificationInfo = (type: string) => {
    switch (type) {
      case 'announcements': return { icon: 'megaphone', label: 'Nove objave', color: AppColors.secondary, route: '/(tabs)/announcements' };
      case 'events': return { icon: 'calendar', label: 'Novi događaji', color: '#9C27B0', route: '/(tabs)/events' };
      case 'messages': return { icon: 'chatbubbles', label: 'Nepročitane poruke', color: AppColors.primary, route: '/(tabs)/messages' };
      case 'tasks': return { icon: 'checkmark-circle', label: 'Novi zadaci', color: AppColors.accent, route: '/sections' };
      default: return { icon: 'notifications', label: 'Obavještenje', color: AppColors.primary, route: '/' };
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Obavještenja', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Obavještenja', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color={AppColors.navInactive} />
            <Text style={styles.emptyText}>Nema novih obavještenja</Text>
          </View>
        ) : (
          notifications.map((notif, i) => {
            const info = getNotificationInfo(notif.type);
            return (
              <TouchableOpacity 
                key={i} 
                style={styles.notificationCard}
                onPress={() => router.push(info.route as any)}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${info.color}20` }]}>
                  <Ionicons name={info.icon as any} size={24} color={info.color} />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationLabel}>{info.label}</Text>
                  <Text style={styles.notificationCount}>{notif.count} {notif.count === 1 ? 'novo' : 'novih'}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notif.count}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: Spacing.md },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: AppColors.background },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: Typography.fontSize.md, color: AppColors.textSecondary, marginTop: Spacing.md },
  notificationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.card },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  notificationContent: { flex: 1 },
  notificationLabel: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: AppColors.textPrimary },
  notificationCount: { fontSize: Typography.fontSize.sm, color: AppColors.textSecondary },
  badge: { backgroundColor: AppColors.error, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  badgeText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold, color: AppColors.white },
});
