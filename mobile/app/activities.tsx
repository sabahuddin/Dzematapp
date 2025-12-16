import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';

interface Activity {
  id: string;
  activityType: string;
  description: string;
  points: number;
  createdAt: string;
}

export default function ActivitiesScreen() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await apiClient.get<Activity[]>('/api/activity-log/my');
      setActivities(data || []);
    } catch (error) {
      console.error('Failed to load activities:', error);
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

  const getActivityIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'event_attendance': return 'calendar';
      case 'task_completion': return 'checkmark-circle';
      case 'message_sent': return 'chatbubble';
      case 'contribution': return 'wallet';
      default: return 'star';
    }
  };

  const getActivityColor = (type: string): string => {
    switch (type) {
      case 'event_attendance': return '#9C27B0';
      case 'task_completion': return AppColors.accent;
      case 'message_sent': return AppColors.secondary;
      case 'contribution': return '#FFA726';
      default: return AppColors.primary;
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Moje aktivnosti', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Moje aktivnosti', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />}
      >
        {activities.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="pulse-outline" size={64} color={AppColors.navInactive} />
            <Text style={styles.emptyText}>Nema aktivnosti</Text>
          </View>
        ) : (
          activities.map((activity, index) => {
            const color = getActivityColor(activity.activityType);
            return (
              <View key={activity.id} style={styles.activityCard}>
                <View style={styles.timeline}>
                  <View style={[styles.timelineDot, { backgroundColor: color }]}>
                    <Ionicons name={getActivityIcon(activity.activityType)} size={16} color={AppColors.white} />
                  </View>
                  {index < activities.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityDescription}>{activity.description}</Text>
                  <View style={styles.activityMeta}>
                    <Text style={styles.activityDate}>
                      {new Date(activity.createdAt).toLocaleDateString('bs-BA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {activity.points > 0 && (
                      <View style={styles.pointsBadge}>
                        <Ionicons name="star" size={12} color="#FFA726" />
                        <Text style={styles.pointsText}>+{activity.points}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
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
  activityCard: { flexDirection: 'row', marginBottom: Spacing.sm },
  timeline: { width: 40, alignItems: 'center' },
  timelineDot: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  timelineLine: { width: 2, flex: 1, backgroundColor: AppColors.navBorder, marginTop: Spacing.xs },
  activityContent: { flex: 1, backgroundColor: AppColors.white, borderRadius: BorderRadius.md, padding: Spacing.md, marginLeft: Spacing.sm, ...Shadows.card },
  activityDescription: { fontSize: Typography.fontSize.md, color: AppColors.textPrimary, marginBottom: Spacing.xs },
  activityMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  activityDate: { fontSize: Typography.fontSize.sm, color: AppColors.textSecondary },
  pointsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFA72620', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  pointsText: { fontSize: Typography.fontSize.sm, color: '#FFA726', fontWeight: Typography.fontWeight.medium, marginLeft: 2 },
});
