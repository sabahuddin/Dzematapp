import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { useAuth } from '../services/auth';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  pointsRequired: number;
}

interface UserBadge {
  id: string;
  badgeId: string;
  earnedAt: string;
  badge: Badge;
}

export default function BadgesScreen() {
  const { user } = useAuth();
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [myBadges, badges] = await Promise.all([
        apiClient.get<UserBadge[]>('/api/user-badges/my').catch(() => []),
        apiClient.get<Badge[]>('/api/badges').catch(() => []),
      ]);
      setUserBadges(myBadges || []);
      setAllBadges(badges || []);
    } catch (error) {
      console.error('Failed to load badges:', error);
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

  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId));

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Značke', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Značke', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />}
      >
        <View style={styles.pointsCard}>
          <Ionicons name="star" size={40} color="#FFA726" />
          <View style={styles.pointsInfo}>
            <Text style={styles.pointsLabel}>Vaši bodovi</Text>
            <Text style={styles.pointsValue}>{user?.totalPoints || 0}</Text>
          </View>
        </View>

        {userBadges.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Osvojene značke</Text>
            <View style={styles.badgesGrid}>
              {userBadges.map(ub => (
                <View key={ub.id} style={styles.badgeCard}>
                  <View style={styles.badgeIcon}>
                    <Text style={styles.badgeEmoji}>{ub.badge.icon || '🏆'}</Text>
                  </View>
                  <Text style={styles.badgeName}>{ub.badge.name}</Text>
                  <Text style={styles.badgeDate}>
                    {new Date(ub.earnedAt).toLocaleDateString('bs-BA')}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {allBadges.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Sve značke</Text>
            {allBadges.map(badge => {
              const isEarned = earnedBadgeIds.has(badge.id);
              const progress = user?.totalPoints ? Math.min(100, (user.totalPoints / badge.pointsRequired) * 100) : 0;
              return (
                <View key={badge.id} style={[styles.badgeRow, isEarned && styles.badgeRowEarned]}>
                  <View style={[styles.badgeRowIcon, isEarned && styles.badgeRowIconEarned]}>
                    <Text style={styles.badgeEmoji}>{badge.icon || '🏆'}</Text>
                  </View>
                  <View style={styles.badgeRowContent}>
                    <Text style={styles.badgeRowName}>{badge.name}</Text>
                    <Text style={styles.badgeRowDescription}>{badge.description}</Text>
                    {!isEarned && (
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${progress}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{user?.totalPoints || 0}/{badge.pointsRequired}</Text>
                      </View>
                    )}
                  </View>
                  {isEarned && <Ionicons name="checkmark-circle" size={24} color={AppColors.accent} />}
                </View>
              );
            })}
          </>
        )}

        {allBadges.length === 0 && userBadges.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="ribbon-outline" size={64} color={AppColors.navInactive} />
            <Text style={styles.emptyText}>Nema znački</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: Spacing.md },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: AppColors.background },
  pointsCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.card },
  pointsInfo: { marginLeft: Spacing.md },
  pointsLabel: { fontSize: Typography.fontSize.sm, color: AppColors.textSecondary },
  pointsValue: { fontSize: Typography.fontSize.xxxl, fontWeight: Typography.fontWeight.bold, color: AppColors.textPrimary },
  sectionTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: AppColors.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.md },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  badgeCard: { width: '31%', backgroundColor: AppColors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.md, ...Shadows.card },
  badgeIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: `#FFA72620`, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xs },
  badgeEmoji: { fontSize: 24 },
  badgeName: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: AppColors.textPrimary, textAlign: 'center' },
  badgeDate: { fontSize: Typography.fontSize.xs, color: AppColors.textSecondary, marginTop: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.card },
  badgeRowEarned: { borderWidth: 2, borderColor: AppColors.accent },
  badgeRowIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: AppColors.background, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  badgeRowIconEarned: { backgroundColor: `${AppColors.accent}20` },
  badgeRowContent: { flex: 1 },
  badgeRowName: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: AppColors.textPrimary },
  badgeRowDescription: { fontSize: Typography.fontSize.sm, color: AppColors.textSecondary, marginTop: 2 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm },
  progressBar: { flex: 1, height: 6, backgroundColor: AppColors.background, borderRadius: 3, marginRight: Spacing.sm },
  progressFill: { height: '100%', backgroundColor: AppColors.secondary, borderRadius: 3 },
  progressText: { fontSize: Typography.fontSize.xs, color: AppColors.textSecondary },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: Typography.fontSize.md, color: AppColors.textSecondary, marginTop: Spacing.md },
});
