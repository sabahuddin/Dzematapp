import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, ActivityIndicator, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/services/api';
import { AppColors, BorderRadius, Spacing, Typography, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteriaType: string;
  criteriaValue: number;
}

interface UserBadge {
  id: string;
  badgeId: string;
  earnedAt: string;
}

interface ActivityLog {
  id: string;
  pointsEarned: number;
  description: string;
  createdAt: string;
}

const USER_STORAGE_KEY = 'dzematapp_user';

export default function BadgesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const loadUserId = async () => {
    try {
      const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userJson) {
        const user = JSON.parse(userJson);
        setUserId(user.id);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [badgesRes, userBadgesRes] = await Promise.allSettled([
        apiClient.get<Badge[]>('/api/badges'),
        apiClient.get<UserBadge[]>(`/api/user-badges/${userId}`)
      ]);
      
      if (badgesRes.status === 'fulfilled') {
        setBadges(badgesRes.value.data || []);
      }
      if (userBadgesRes.status === 'fulfilled') {
        setUserBadges(userBadgesRes.value.data || []);
      }
      
      try {
        const activityRes = await apiClient.get<ActivityLog[]>(`/api/activity-logs/user/${userId}`);
        const points = (activityRes.data || []).reduce((sum, log) => sum + (log.pointsEarned || 0), 0);
        setTotalPoints(points);
      } catch {
        setTotalPoints(0);
      }
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const isEarned = (badgeId: string) => userBadges.some(ub => ub.badgeId === badgeId);

  const getEarnedDate = (badgeId: string) => {
    const ub = userBadges.find(ub => ub.badgeId === badgeId);
    if (ub) {
      return new Date(ub.earnedAt).toLocaleDateString('hr-HR');
    }
    return null;
  };

  const getBadgeColor = (criteriaType: string) => {
    switch (criteriaType) {
      case 'points_total': return '#FFC107';
      case 'contributions_amount': return AppColors.success;
      case 'tasks_completed': return AppColors.info;
      case 'events_attended': return AppColors.primary;
      default: return AppColors.textSecondary;
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  const earnedBadges = badges.filter(b => isEarned(b.id));
  const availableBadges = badges.filter(b => !isEarned(b.id));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />
      }
    >
      {/* Points Summary */}
      <View style={[styles.pointsCard, { backgroundColor: AppColors.primary }]}>
        <Text style={styles.pointsLabel}>Ukupno bodova</Text>
        <Text style={styles.pointsValue}>{totalPoints}</Text>
        <Text style={styles.badgesCount}>{earnedBadges.length} / {badges.length} značaka osvojeno</Text>
      </View>

      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Osvojene značke</Text>
          <View style={styles.badgesGrid}>
            {earnedBadges.map((badge) => (
              <View 
                key={badge.id} 
                style={[styles.badgeCard, { backgroundColor: colors.surface, borderColor: getBadgeColor(badge.criteriaType) }]}
              >
                <Text style={styles.badgeIcon}>{badge.icon || '🏆'}</Text>
                <Text style={[styles.badgeName, { color: colors.text }]}>{badge.name}</Text>
                <Text style={[styles.badgeDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                  {badge.description}
                </Text>
                <Text style={[styles.earnedDate, { color: AppColors.success }]}>
                  Osvojeno: {getEarnedDate(badge.id)}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Available Badges */}
      {availableBadges.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Dostupne značke</Text>
          <View style={styles.badgesGrid}>
            {availableBadges.map((badge) => (
              <View 
                key={badge.id} 
                style={[styles.badgeCard, styles.lockedBadge, { backgroundColor: colors.surface }]}
              >
                <Text style={[styles.badgeIcon, styles.lockedIcon]}>{badge.icon || '🏆'}</Text>
                <Text style={[styles.badgeName, { color: colors.textSecondary }]}>{badge.name}</Text>
                <Text style={[styles.badgeDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                  {badge.description}
                </Text>
                <Text style={[styles.criteriaText, { color: colors.textSecondary }]}>
                  Potrebno: {badge.criteriaValue} {badge.criteriaType === 'points_total' ? 'bodova' : ''}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {badges.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={styles.emptyIcon}>🏅</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Nema dostupnih značaka
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl * 2 },
  pointsCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  pointsLabel: { ...Typography.body, color: 'rgba(255,255,255,0.8)' },
  pointsValue: { fontSize: 48, fontWeight: '700', color: '#fff', marginVertical: Spacing.xs },
  badgesCount: { ...Typography.bodySmall, color: 'rgba(255,255,255,0.8)' },
  sectionTitle: { ...Typography.h3, marginBottom: Spacing.md, marginTop: Spacing.sm },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  badgeCard: {
    width: '48%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  lockedBadge: { opacity: 0.6 },
  badgeIcon: { fontSize: 40, marginBottom: Spacing.sm },
  lockedIcon: { opacity: 0.5 },
  badgeName: { ...Typography.body, fontWeight: '600', textAlign: 'center', marginBottom: Spacing.xs },
  badgeDesc: { ...Typography.caption, textAlign: 'center', marginBottom: Spacing.xs },
  earnedDate: { ...Typography.caption, fontWeight: '600' },
  criteriaText: { ...Typography.caption },
  emptyState: { alignItems: 'center', padding: Spacing.xl, borderRadius: BorderRadius.lg },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyText: { ...Typography.body, textAlign: 'center' },
});
