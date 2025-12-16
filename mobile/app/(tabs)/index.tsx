import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../services/auth';
import { apiClient } from '../../services/api';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';

interface PrayerTime {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  juma?: string;
}

interface Stats {
  userCount: number;
  newAnnouncementsCount: number;
  upcomingEventsCount: number;
  activeTasksCount: number;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [prayerData, statsData] = await Promise.all([
        apiClient.get<PrayerTime>('/api/prayer-times/today').catch(() => null),
        apiClient.get<Stats>('/api/statistics').catch(() => null),
      ]);
      setPrayerTimes(prayerData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load data:', error);
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

  const getCurrentPrayer = (): string => {
    if (!prayerTimes) return '';
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const parseTime = (time: string): number => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const prayers = [
      { name: 'Fajr', time: prayerTimes.fajr },
      { name: 'Izlazak', time: prayerTimes.sunrise },
      { name: 'Podne', time: prayerTimes.dhuhr },
      { name: 'Ikindija', time: prayerTimes.asr },
      { name: 'Akšam', time: prayerTimes.maghrib },
      { name: 'Jacija', time: prayerTimes.isha },
    ];

    for (let i = prayers.length - 1; i >= 0; i--) {
      if (currentTime >= parseTime(prayers[i].time)) {
        return prayers[i].name;
      }
    }
    return 'Jacija';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />
      }
    >
      <View style={styles.welcomeSection}>
        <Text style={styles.greeting}>Selam alejkum,</Text>
        <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
      </View>

      {prayerTimes && (
        <View style={styles.prayerCard}>
          <View style={styles.prayerHeader}>
            <Ionicons name="moon" size={24} color={AppColors.white} />
            <Text style={styles.prayerTitle}>Vaktija</Text>
            <Text style={styles.currentPrayer}>{getCurrentPrayer()}</Text>
          </View>
          <View style={styles.prayerTimes}>
            <PrayerTimeItem name="Sabah" time={prayerTimes.fajr} />
            <PrayerTimeItem name="Izlazak" time={prayerTimes.sunrise} />
            <PrayerTimeItem name="Podne" time={prayerTimes.dhuhr} />
            <PrayerTimeItem name="Ikindija" time={prayerTimes.asr} />
            <PrayerTimeItem name="Akšam" time={prayerTimes.maghrib} />
            <PrayerTimeItem name="Jacija" time={prayerTimes.isha} />
          </View>
        </View>
      )}

      {stats && (
        <View style={styles.statsGrid}>
          <StatCard
            icon="people"
            label="Članovi"
            value={stats.userCount}
            color={AppColors.primary}
          />
          <StatCard
            icon="megaphone"
            label="Objave"
            value={stats.newAnnouncementsCount}
            color={AppColors.secondary}
          />
          <StatCard
            icon="calendar"
            label="Događaji"
            value={stats.upcomingEventsCount}
            color={AppColors.accent}
          />
          <StatCard
            icon="checkmark-circle"
            label="Zadaci"
            value={stats.activeTasksCount}
            color="#9C27B0"
          />
        </View>
      )}

      {user?.totalPoints !== undefined && (
        <View style={styles.pointsCard}>
          <View style={styles.pointsContent}>
            <Ionicons name="star" size={32} color="#FFA726" />
            <View style={styles.pointsInfo}>
              <Text style={styles.pointsLabel}>Vaši bodovi</Text>
              <Text style={styles.pointsValue}>{user.totalPoints}</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function PrayerTimeItem({ name, time }: { name: string; time: string }) {
  return (
    <View style={styles.prayerTimeItem}>
      <Text style={styles.prayerName}>{name}</Text>
      <Text style={styles.prayerTime}>{time}</Text>
    </View>
  );
}

function StatCard({ icon, label, value, color }: { 
  icon: keyof typeof Ionicons.glyphMap; 
  label: string; 
  value: number; 
  color: string 
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.background,
  },
  welcomeSection: {
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: Typography.fontSize.md,
    color: AppColors.textSecondary,
  },
  userName: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.textPrimary,
  },
  prayerCard: {
    backgroundColor: AppColors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  prayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  prayerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.white,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  currentPrayer: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  prayerTimes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  prayerTimeItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  prayerName: {
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  prayerTime: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.white,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: '48%',
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.textPrimary,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.textSecondary,
  },
  pointsCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  pointsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsInfo: {
    marginLeft: Spacing.md,
  },
  pointsLabel: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.textSecondary,
  },
  pointsValue: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.textPrimary,
  },
});
