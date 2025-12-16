import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { apiClient } from '@/services/api';
import { AppColors, BorderRadius, Spacing, Typography, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  points: number;
  createdAt: string;
}

interface PointsSummary {
  tasks: number;
  events: number;
  contributions: number;
  badges: number;
  total: number;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  earnedAt: string;
}

export default function ActivitiesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [pointsSummary, setPointsSummary] = useState<PointsSummary>({
    tasks: 0, events: 0, contributions: 0, badges: 0, total: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const userJson = await AsyncStorage.getItem('dzematapp_user');
      if (!userJson) {
        setLoading(false);
        return;
      }
      const user = JSON.parse(userJson);

      const [activitiesResponse, badgesResponse, userBadgesResponse] = await Promise.all([
        apiClient.get<ActivityLog[]>(`/api/activity-logs/user/${user.id}`).catch(() => ({ data: [] })),
        apiClient.get<any[]>('/api/badges').catch(() => ({ data: [] })),
        apiClient.get<any[]>(`/api/user-badges/${user.id}`).catch(() => ({ data: [] }))
      ]);

      const logs = activitiesResponse.data;
      setActivities(logs);

      // Calculate points by category
      const summary: PointsSummary = { tasks: 0, events: 0, contributions: 0, badges: 0, total: 0 };
      logs.forEach(log => {
        if (log.entityType === 'task') summary.tasks += log.points || 0;
        else if (log.entityType === 'event') summary.events += log.points || 0;
        else if (log.entityType === 'contribution') summary.contributions += log.points || 0;
        else if (log.entityType === 'badge') summary.badges += log.points || 0;
      });
      summary.total = summary.tasks + summary.events + summary.contributions + summary.badges;
      setPointsSummary(summary);

      // Map earned badges
      const allBadges = badgesResponse.data;
      const userBadges = userBadgesResponse.data;
      const earned = userBadges.map((ub: any) => {
        const badge = allBadges.find((b: any) => b.id === ub.badgeId);
        return badge ? { ...badge, earnedAt: ub.earnedAt } : null;
      }).filter(Boolean);
      setBadges(earned);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadActivities();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('hr-HR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getActivityIcon = (type: string): IconName => {
    switch (type) {
      case 'task': return 'checkbox-marked-circle-outline';
      case 'event': return 'calendar-check-outline';
      case 'contribution': return 'hand-heart-outline';
      case 'badge': return 'medal-outline';
      default: return 'star-outline';
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />
      }
    >
      {/* Points Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: AppColors.primary }]}>
        <Text style={styles.summaryTitle}>Ukupno bodova</Text>
        <Text style={styles.totalPoints}>{pointsSummary.total}</Text>
        
        <View style={styles.pointsGrid}>
          <View style={styles.pointsItem}>
            <Text style={styles.pointsValue}>{pointsSummary.tasks}</Text>
            <Text style={styles.pointsLabel}>Zadaci</Text>
          </View>
          <View style={styles.pointsItem}>
            <Text style={styles.pointsValue}>{pointsSummary.events}</Text>
            <Text style={styles.pointsLabel}>Događaji</Text>
          </View>
          <View style={styles.pointsItem}>
            <Text style={styles.pointsValue}>{pointsSummary.contributions}</Text>
            <Text style={styles.pointsLabel}>Donacije</Text>
          </View>
          <View style={styles.pointsItem}>
            <Text style={styles.pointsValue}>{pointsSummary.badges}</Text>
            <Text style={styles.pointsLabel}>Značke</Text>
          </View>
        </View>
      </View>

      {/* Earned Badges */}
      {badges.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Osvojene značke</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesScroll}>
            {badges.map((badge) => (
              <View key={badge.id} style={[styles.badgeCard, { backgroundColor: colors.surface }]}>
                <View style={styles.badgeIconContainer}>
                  <MaterialCommunityIcons name="medal" size={28} color={AppColors.primary} />
                </View>
                <Text style={[styles.badgeName, { color: colors.text }]}>{badge.name}</Text>
                <Text style={[styles.badgeDate, { color: colors.textSecondary }]}>
                  {formatDate(badge.earnedAt)}
                </Text>
              </View>
            ))}
          </ScrollView>
        </>
      )}

      {/* Recent Activities */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Nedavne aktivnosti</Text>
      {activities.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="star-outline" size={48} color={AppColors.primary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Nema zabilježenih aktivnosti
          </Text>
        </View>
      ) : (
        activities.slice(0, 20).map((activity) => (
          <View key={activity.id} style={[styles.activityCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.activityIcon, { backgroundColor: 'rgba(57, 73, 171, 0.1)' }]}>
              <MaterialCommunityIcons name={getActivityIcon(activity.entityType)} size={20} color={AppColors.primary} />
            </View>
            <View style={styles.activityContent}>
              <Text style={[styles.activityAction, { color: colors.text }]}>{activity.action}</Text>
              <Text style={[styles.activityDate, { color: colors.textSecondary }]}>
                {formatDate(activity.createdAt)}
              </Text>
            </View>
            {activity.points > 0 && (
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsBadgeText}>+{activity.points}</Text>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Spacing.md,
  },
  summaryCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  summaryTitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.xs,
  },
  totalPoints: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
    marginBottom: Spacing.lg,
  },
  pointsGrid: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
  },
  pointsItem: {
    alignItems: 'center',
  },
  pointsValue: {
    ...Typography.h3,
    color: '#fff',
  },
  pointsLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.7)',
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  badgesScroll: {
    marginBottom: Spacing.lg,
  },
  badgeCard: {
    width: 100,
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(57, 73, 171, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  badgeName: {
    ...Typography.caption,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  badgeDate: {
    fontSize: 10,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  emptyIcon: {
    marginBottom: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  activityIconText: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    ...Typography.body,
    marginBottom: 2,
  },
  activityDate: {
    ...Typography.caption,
  },
  pointsBadge: {
    backgroundColor: AppColors.accent + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  pointsBadgeText: {
    ...Typography.caption,
    color: AppColors.accent,
    fontWeight: '600',
  },
});
