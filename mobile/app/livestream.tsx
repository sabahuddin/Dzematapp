import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';

interface LivestreamSettings {
  youtubeUrl?: string;
  facebookUrl?: string;
  isLive: boolean;
}

export default function LivestreamScreen() {
  const [settings, setSettings] = useState<LivestreamSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<LivestreamSettings>('/api/livestream/settings')
      .then(setSettings)
      .catch(() => setSettings(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Livestream', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Livestream', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {settings?.isLive && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>UŽIVO</Text>
          </View>
        )}

        {settings?.youtubeUrl ? (
          <TouchableOpacity style={styles.card} onPress={() => Linking.openURL(settings.youtubeUrl!)}>
            <View style={[styles.cardIcon, { backgroundColor: '#FF000020' }]}>
              <Ionicons name="logo-youtube" size={32} color="#FF0000" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>YouTube</Text>
              <Text style={styles.cardSubtitle}>Gledaj na YouTube</Text>
            </View>
            <Ionicons name="open-outline" size={24} color={AppColors.textSecondary} />
          </TouchableOpacity>
        ) : null}

        {settings?.facebookUrl ? (
          <TouchableOpacity style={styles.card} onPress={() => Linking.openURL(settings.facebookUrl!)}>
            <View style={[styles.cardIcon, { backgroundColor: '#1877F220' }]}>
              <Ionicons name="logo-facebook" size={32} color="#1877F2" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Facebook</Text>
              <Text style={styles.cardSubtitle}>Gledaj na Facebook</Text>
            </View>
            <Ionicons name="open-outline" size={24} color={AppColors.textSecondary} />
          </TouchableOpacity>
        ) : null}

        {!settings?.youtubeUrl && !settings?.facebookUrl && (
          <View style={styles.emptyState}>
            <Ionicons name="videocam-off-outline" size={64} color={AppColors.navInactive} />
            <Text style={styles.emptyText}>Nema aktivnih prijenosa</Text>
            <Text style={styles.emptySubtext}>Livestream nije konfigurisan</Text>
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
  liveIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EF535020', padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: Spacing.lg },
  liveDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF5350', marginRight: Spacing.sm },
  liveText: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: '#EF5350' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.card },
  cardIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: AppColors.textPrimary },
  cardSubtitle: { fontSize: Typography.fontSize.sm, color: AppColors.textSecondary, marginTop: 2 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: Typography.fontSize.md, color: AppColors.textSecondary, marginTop: Spacing.md },
  emptySubtext: { fontSize: Typography.fontSize.sm, color: AppColors.navInactive, marginTop: Spacing.xs },
});
