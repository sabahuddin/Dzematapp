import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { apiClient } from '@/services/api';
import { AppColors, BorderRadius, Spacing, Typography, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface PrayerTime {
  id: string;
  date: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

const PRAYER_NAMES: { key: string; name: string; icon: IconName }[] = [
  { key: 'fajr', name: 'Sabah', icon: 'weather-night' },
  { key: 'sunrise', name: 'Izlazak sunca', icon: 'weather-sunset-up' },
  { key: 'dhuhr', name: 'Podne', icon: 'weather-sunny' },
  { key: 'asr', name: 'Ikindija', icon: 'white-balance-sunny' },
  { key: 'maghrib', name: 'Akšam', icon: 'weather-sunset-down' },
  { key: 'isha', name: 'Jacija', icon: 'moon-waning-crescent' },
];

export default function VaktijaScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [todayPrayer, setTodayPrayer] = useState<PrayerTime | null>(null);
  const [weekPrayers, setWeekPrayers] = useState<PrayerTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPrayerTimes();
  }, []);

  const loadPrayerTimes = async () => {
    try {
      const [todayResponse, allResponse] = await Promise.all([
        apiClient.get<PrayerTime>('/api/prayer-times/today').catch(() => ({ data: null })),
        apiClient.get<PrayerTime[]>('/api/prayer-times').catch(() => ({ data: [] }))
      ]);
      
      if (todayResponse?.data) {
        setTodayPrayer(todayResponse.data);
      }
      
      // Get next 7 days
      const today = new Date();
      const prayerData = allResponse?.data || [];
      const upcoming = prayerData
        .filter(p => new Date(p.date) >= today)
        .slice(0, 7);
      setWeekPrayers(upcoming);
    } catch (error) {
      console.error('Error loading prayer times:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPrayerTimes();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('hr-HR', { weekday: 'long', day: '2-digit', month: '2-digit' });
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
      {/* Today's Prayer Times */}
      {todayPrayer ? (
        <View style={[styles.todayCard, { backgroundColor: AppColors.primary }]}>
          <Text style={styles.todayTitle}>Danas</Text>
          <Text style={styles.todayDate}>{formatDate(todayPrayer.date)}</Text>
          
          <View style={styles.prayerGrid}>
            {PRAYER_NAMES.map(prayer => (
              <View key={prayer.key} style={styles.prayerItem}>
                <MaterialCommunityIcons name={prayer.icon} size={24} color="rgba(255,255,255,0.9)" />
                <Text style={styles.prayerName}>{prayer.name}</Text>
                <Text style={styles.prayerTime}>
                  {(todayPrayer as any)[prayer.key]}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="mosque" size={48} color={AppColors.primary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Vaktija nije dostupna
          </Text>
        </View>
      )}

      {/* Upcoming Days */}
      {weekPrayers.length > 1 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Naredni dani</Text>
          {weekPrayers.slice(1).map((prayer) => (
            <View key={prayer.id} style={[styles.dayCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.dayTitle, { color: colors.text }]}>
                {formatDate(prayer.date)}
              </Text>
              <View style={styles.dayPrayers}>
                {PRAYER_NAMES.filter(p => p.key !== 'sunrise').map(p => (
                  <View key={p.key} style={styles.dayPrayerItem}>
                    <Text style={[styles.dayPrayerName, { color: colors.textSecondary }]}>
                      {p.name}
                    </Text>
                    <Text style={[styles.dayPrayerTime, { color: colors.text }]}>
                      {(prayer as any)[p.key]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </>
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
  todayCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  todayTitle: {
    ...Typography.h2,
    color: '#fff',
    marginBottom: Spacing.xs,
  },
  todayDate: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.lg,
    textTransform: 'capitalize',
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
  prayerIcon: {
    marginBottom: Spacing.xs,
  },
  prayerName: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  prayerTime: {
    ...Typography.h3,
    color: '#fff',
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
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
  },
  dayCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dayTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textTransform: 'capitalize',
  },
  dayPrayers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayPrayerItem: {
    width: '20%',
    alignItems: 'center',
  },
  dayPrayerName: {
    ...Typography.caption,
    marginBottom: 2,
  },
  dayPrayerTime: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
});
