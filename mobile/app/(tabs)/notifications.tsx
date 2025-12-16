import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { apiClient } from '@/services/api';
import { AppColors, BorderRadius, Spacing, Typography, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedEntityId: string | null;
  relatedEntityType: string | null;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await apiClient.get<Notification[]>('/api/notifications/unread');
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'announcement': return '📢';
      case 'event': return '📅';
      case 'message': return '💬';
      case 'task': return '✅';
      case 'badge': return '🏆';
      case 'certificate': return '🎖️';
      case 'payment': return '💳';
      default: return '🔔';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Sada';
    if (hours < 24) return `Prije ${hours}h`;
    if (days < 7) return `Prije ${days}d`;
    return date.toLocaleDateString('bs-BA');
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />}
    >
      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Nemate novih obavještenja
          </Text>
        </View>
      ) : (
        notifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[
              styles.notificationCard, 
              { backgroundColor: colors.surface },
              !notification.isRead && styles.unreadCard
            ]}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{getNotificationIcon(notification.type)}</Text>
            </View>
            <View style={styles.notificationContent}>
              <Text style={[styles.notificationTitle, { color: colors.text }]}>
                {notification.title}
              </Text>
              <Text style={[styles.notificationMessage, { color: colors.textSecondary }]} numberOfLines={2}>
                {notification.message}
              </Text>
              <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
                {formatTime(notification.createdAt)}
              </Text>
            </View>
            {!notification.isRead && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.md },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl * 2 },
  emptyIcon: { fontSize: 60, marginBottom: Spacing.md },
  emptyText: { ...Typography.body },
  notificationCard: { 
    flexDirection: 'row', 
    alignItems: 'flex-start',
    borderRadius: BorderRadius.lg, 
    padding: Spacing.md, 
    marginBottom: Spacing.sm, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2 
  },
  unreadCard: { borderLeftWidth: 3, borderLeftColor: AppColors.primary },
  iconContainer: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: AppColors.background, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: Spacing.md 
  },
  icon: { fontSize: 22 },
  notificationContent: { flex: 1 },
  notificationTitle: { ...Typography.body, fontWeight: '600', marginBottom: Spacing.xs },
  notificationMessage: { ...Typography.bodySmall, marginBottom: Spacing.xs },
  notificationTime: { ...Typography.caption },
  unreadDot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    backgroundColor: AppColors.primary, 
    marginLeft: Spacing.sm 
  },
});
