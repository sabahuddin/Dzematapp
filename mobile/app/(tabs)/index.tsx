import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { apiClient } from '@/services/api';
import { AppColors, BorderRadius, Spacing, Typography, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface DashboardStats {
  userCount: number;
  newAnnouncementsCount: number;
  upcomingEventsCount: number;
  tasksCount: number;
}

interface PrayerTime {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [prayerTime, setPrayerTime] = useState<PrayerTime | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsResponse, prayerResponse] = await Promise.all([
        apiClient.get<DashboardStats>('/api/statistics').catch(() => ({ data: null })),
        apiClient.get<PrayerTime>('/api/prayer-times/today').catch(() => ({ data: null }))
      ]);
      if (statsResponse?.data) {
        setStats(statsResponse.data);
      }
      if (prayerResponse?.data) {
        setPrayerTime(prayerResponse.data);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
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
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={[styles.greeting, { color: colors.text }]}>Dobrodošli</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Vaša zajednica na dlanu
        </Text>
      </View>

      {/* Prayer Times Card */}
      {prayerTime && (
        <View style={[styles.prayerCard, { backgroundColor: colors.surface }]}>
          <View style={styles.prayerHeader}>
            <View style={styles.prayerIconContainer}>
              <MaterialCommunityIcons name="mosque" size={24} color={AppColors.primary} />
            </View>
            <Text style={[styles.prayerTitle, { color: colors.text }]}>Današnja vaktija</Text>
          </View>
          <View style={styles.prayerGrid}>
            <PrayerTimeItem name="Sabah" time={prayerTime.fajr} colors={colors} />
            <PrayerTimeItem name="Izlazak" time={prayerTime.sunrise} colors={colors} />
            <PrayerTimeItem name="Podne" time={prayerTime.dhuhr} colors={colors} />
            <PrayerTimeItem name="Ikindija" time={prayerTime.asr} colors={colors} />
            <PrayerTimeItem name="Akšam" time={prayerTime.maghrib} colors={colors} />
            <PrayerTimeItem name="Jacija" time={prayerTime.isha} colors={colors} />
          </View>
        </View>
      )}

      {/* Stats Grid */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Pregled</Text>
      <View style={styles.statsGrid}>
        <StatCard
          title="Članovi"
          value={stats?.userCount?.toString() || '0'}
          icon="account-group-outline"
          color={AppColors.primary}
          bgColor={colors.surface}
          textColor={colors.text}
        />
        <StatCard
          title="Obavijesti"
          value={stats?.newAnnouncementsCount?.toString() || '0'}
          icon="bullhorn-outline"
          color={AppColors.secondary}
          bgColor={colors.surface}
          textColor={colors.text}
        />
        <StatCard
          title="Događaji"
          value={stats?.upcomingEventsCount?.toString() || '0'}
          icon="calendar-outline"
          color={AppColors.primary}
          bgColor={colors.surface}
          textColor={colors.text}
        />
        <StatCard
          title="Zadaci"
          value={stats?.tasksCount?.toString() || '0'}
          icon="checkbox-marked-circle-outline"
          color={AppColors.accent}
          bgColor={colors.surface}
          textColor={colors.text}
        />
      </View>
    </ScrollView>
  );
}

function PrayerTimeItem({ name, time, colors }: { name: string; time: string; colors: any }) {
  return (
    <View style={styles.prayerItem}>
      <Text style={[styles.prayerName, { color: colors.textSecondary }]}>{name}</Text>
      <Text style={[styles.prayerValue, { color: colors.text }]}>{time}</Text>
    </View>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  bgColor,
  textColor,
}: {
  title: string;
  value: string;
  icon: IconName;
  color: string;
  bgColor: string;
  textColor: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: bgColor }]}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
        <MaterialCommunityIcons name={icon} size={28} color={color} />
      </View>
      <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: AppColors.textSecondary }]}>{title}</Text>
    </View>
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
  welcomeSection: {
    marginBottom: Spacing.lg,
  },
  greeting: {
    ...Typography.h1,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  // Prayer Card
  prayerCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  prayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  prayerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(57, 73, 171, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  prayerTitle: {
    ...Typography.h3,
  },
  prayerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  prayerItem: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  prayerName: {
    ...Typography.caption,
    marginBottom: 2,
  },
  prayerValue: {
    ...Typography.body,
    fontWeight: '600',
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statCard: {
    width: '48%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statTitle: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
});
