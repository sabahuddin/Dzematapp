import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, ActivityIndicator, RefreshControl, TouchableOpacity, Linking } from 'react-native';
import { apiClient } from '@/services/api';
import { AppColors, BorderRadius, Spacing, Typography, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface TenantSettings {
  id: string;
  livestreamUrl: string | null;
  livestreamEnabled: boolean;
  livestreamTitle: string | null;
  livestreamDescription: string | null;
}

interface LivestreamSettings {
  youtubeUrl: string | null;
  facebookUrl: string | null;
  customUrl: string | null;
  isLive: boolean;
  title: string | null;
  description: string | null;
}

export default function LivestreamScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [settings, setSettings] = useState<LivestreamSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await apiClient.get<TenantSettings>('/api/tenant-settings');
      const data = response.data;
      if (data) {
        const url = data.livestreamUrl || '';
        const isYoutube = url.includes('youtube') || url.includes('youtu.be');
        const isFacebook = url.includes('facebook');
        
        setSettings({
          youtubeUrl: isYoutube ? url : null,
          facebookUrl: isFacebook ? url : null,
          customUrl: !isYoutube && !isFacebook && url ? url : null,
          isLive: data.livestreamEnabled || false,
          title: data.livestreamTitle || null,
          description: data.livestreamDescription || null,
        });
      } else {
        setSettings(null);
      }
    } catch (error) {
      console.error('Error loading livestream:', error);
      setSettings(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSettings();
  };

  const openUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  const hasAnyStream = settings?.youtubeUrl || settings?.facebookUrl || settings?.customUrl;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />
      }
    >
      {/* Live Status */}
      <View style={[styles.statusCard, { backgroundColor: settings?.isLive ? AppColors.error : colors.surface }]}>
        <View style={[styles.liveIndicator, { backgroundColor: settings?.isLive ? '#fff' : colors.textSecondary }]} />
        <Text style={[styles.statusText, { color: settings?.isLive ? '#fff' : colors.text }]}>
          {settings?.isLive ? 'UŽIVO' : 'Nema aktivnog prijenosa'}
        </Text>
      </View>

      {settings?.title && (
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.streamTitle, { color: colors.text }]}>{settings.title}</Text>
          {settings.description && (
            <Text style={[styles.streamDesc, { color: colors.textSecondary }]}>{settings.description}</Text>
          )}
        </View>
      )}

      {/* Stream Links */}
      {hasAnyStream ? (
        <View style={styles.linksSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Gledaj prijenos</Text>

          {settings?.youtubeUrl && (
            <TouchableOpacity
              style={[styles.linkCard, { backgroundColor: '#FF0000' }]}
              onPress={() => openUrl(settings.youtubeUrl!)}
            >
              <Text style={styles.linkIcon}>▶️</Text>
              <View style={styles.linkContent}>
                <Text style={styles.linkTitle}>YouTube</Text>
                <Text style={styles.linkSubtitle}>Gledaj na YouTube</Text>
              </View>
              <Text style={styles.linkArrow}>→</Text>
            </TouchableOpacity>
          )}

          {settings?.facebookUrl && (
            <TouchableOpacity
              style={[styles.linkCard, { backgroundColor: '#1877F2' }]}
              onPress={() => openUrl(settings.facebookUrl!)}
            >
              <Text style={styles.linkIcon}>📘</Text>
              <View style={styles.linkContent}>
                <Text style={styles.linkTitle}>Facebook</Text>
                <Text style={styles.linkSubtitle}>Gledaj na Facebooku</Text>
              </View>
              <Text style={styles.linkArrow}>→</Text>
            </TouchableOpacity>
          )}

          {settings?.customUrl && (
            <TouchableOpacity
              style={[styles.linkCard, { backgroundColor: AppColors.primary }]}
              onPress={() => openUrl(settings.customUrl!)}
            >
              <Text style={styles.linkIcon}>🌐</Text>
              <View style={styles.linkContent}>
                <Text style={styles.linkTitle}>Web Stream</Text>
                <Text style={styles.linkSubtitle}>Otvori u pregledniku</Text>
              </View>
              <Text style={styles.linkArrow}>→</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={styles.emptyIcon}>📺</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Nema dostupnih prijenosa</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Kada džemat postavi link za prijenos, ovdje ćete ga moći pogledati.
          </Text>
        </View>
      )}

      {/* Info Section */}
      <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Prijenosi se odvijaju putem YouTube-a ili Facebooka. Kliknite na dugme da otvorite prijenos u odgovarajućoj aplikaciji.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl * 2 },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  liveIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  statusText: { ...Typography.h3 },
  infoCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  streamTitle: { ...Typography.h2, marginBottom: Spacing.xs },
  streamDesc: { ...Typography.body },
  linksSection: { marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.h3, marginBottom: Spacing.md },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  linkIcon: { fontSize: 32, marginRight: Spacing.md },
  linkContent: { flex: 1 },
  linkTitle: { ...Typography.body, fontWeight: '700', color: '#fff' },
  linkSubtitle: { ...Typography.bodySmall, color: 'rgba(255,255,255,0.8)' },
  linkArrow: { fontSize: 24, color: '#fff' },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  emptyIcon: { fontSize: 64, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h3, marginBottom: Spacing.sm },
  emptyText: { ...Typography.body, textAlign: 'center' },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  infoIcon: { fontSize: 20, marginRight: Spacing.sm },
  infoText: { ...Typography.bodySmall, flex: 1 },
});
