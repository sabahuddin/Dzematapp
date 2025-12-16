import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';

interface PrayerTime {
  id: string;
  date: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  juma?: string;
}

export default function VaktijaScreen() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [todayPrayer, setTodayPrayer] = useState<PrayerTime | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [today, all] = await Promise.all([
        apiClient.get<PrayerTime>('/api/prayer-times/today').catch(() => null),
        apiClient.get<PrayerTime[]>('/api/prayer-times').catch(() => []),
      ]);
      setTodayPrayer(today);
      setPrayerTimes(all || []);
    } catch (error) {
      console.error('Failed to load prayer times:', error);
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

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Vaktija', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Vaktija', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />}
      >
        {todayPrayer && (
          <View style={styles.todayCard}>
            <View style={styles.todayHeader}>
              <Ionicons name="sunny" size={24} color={AppColors.white} />
              <Text style={styles.todayTitle}>Danas</Text>
            </View>
            <View style={styles.prayerGrid}>
              <PrayerItem name="Sabah" time={todayPrayer.fajr} />
              <PrayerItem name="Izlazak" time={todayPrayer.sunrise} />
              <PrayerItem name="Podne" time={todayPrayer.dhuhr} />
              <PrayerItem name="Ikindija" time={todayPrayer.asr} />
              <PrayerItem name="Akšam" time={todayPrayer.maghrib} />
              <PrayerItem name="Jacija" time={todayPrayer.isha} />
            </View>
            {todayPrayer.juma && (
              <View style={styles.jumaRow}>
                <Ionicons name="calendar" size={18} color="rgba(255,255,255,0.8)" />
                <Text style={styles.jumaText}>Džuma: {todayPrayer.juma}</Text>
              </View>
            )}
          </View>
        )}

        {prayerTimes.length > 0 && (
          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>Sedmični pregled</Text>
            {prayerTimes.slice(0, 7).map((pt, i) => (
              <View key={pt.id || i} style={styles.dayCard}>
                <Text style={styles.dayDate}>
                  {new Date(pt.date).toLocaleDateString('bs-BA', { weekday: 'long', day: 'numeric', month: 'short' })}
                </Text>
                <View style={styles.dayTimes}>
                  <Text style={styles.dayTime}>S: {pt.fajr}</Text>
                  <Text style={styles.dayTime}>P: {pt.dhuhr}</Text>
                  <Text style={styles.dayTime}>I: {pt.asr}</Text>
                  <Text style={styles.dayTime}>A: {pt.maghrib}</Text>
                  <Text style={styles.dayTime}>J: {pt.isha}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

function PrayerItem({ name, time }: { name: string; time: string }) {
  return (
    <View style={styles.prayerItem}>
      <Text style={styles.prayerName}>{name}</Text>
      <Text style={styles.prayerTime}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: Spacing.md },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: AppColors.background },
  todayCard: { backgroundColor: AppColors.primary, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.card },
  todayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  todayTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: AppColors.white, marginLeft: Spacing.sm },
  prayerGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  prayerItem: { width: '30%', alignItems: 'center', marginBottom: Spacing.md },
  prayerName: { fontSize: Typography.fontSize.xs, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  prayerTime: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: AppColors.white },
  jumaRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  jumaText: { fontSize: Typography.fontSize.md, color: 'rgba(255,255,255,0.9)', marginLeft: Spacing.sm },
  listSection: { marginTop: Spacing.md },
  sectionTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: AppColors.textPrimary, marginBottom: Spacing.md },
  dayCard: { backgroundColor: AppColors.white, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadows.card },
  dayDate: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.medium, color: AppColors.textPrimary, marginBottom: Spacing.xs },
  dayTimes: { flexDirection: 'row', justifyContent: 'space-between' },
  dayTime: { fontSize: Typography.fontSize.sm, color: AppColors.textSecondary },
});
