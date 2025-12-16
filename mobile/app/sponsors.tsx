import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image, Linking, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';

interface Sponsor {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
}

export default function SponsorsScreen() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<Sponsor[]>('/api/sponsors')
      .then(data => setSponsors(data || []))
      .catch(() => setSponsors([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Sponzori', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Sponzori', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {sponsors.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={64} color={AppColors.navInactive} />
            <Text style={styles.emptyText}>Nema sponzora</Text>
          </View>
        ) : (
          sponsors.map(sponsor => (
            <TouchableOpacity 
              key={sponsor.id} 
              style={styles.card}
              onPress={() => sponsor.websiteUrl && Linking.openURL(sponsor.websiteUrl)}
              disabled={!sponsor.websiteUrl}
            >
              {sponsor.logoUrl ? (
                <Image source={{ uri: sponsor.logoUrl }} style={styles.logo} resizeMode="contain" />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="business" size={32} color={AppColors.navInactive} />
                </View>
              )}
              <Text style={styles.sponsorName}>{sponsor.name}</Text>
              {sponsor.description && (
                <Text style={styles.sponsorDescription}>{sponsor.description}</Text>
              )}
              {sponsor.websiteUrl && (
                <View style={styles.linkRow}>
                  <Ionicons name="globe-outline" size={16} color={AppColors.secondary} />
                  <Text style={styles.linkText}>Posjeti web stranicu</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
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
  card: { backgroundColor: AppColors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, alignItems: 'center', ...Shadows.card },
  logo: { width: 120, height: 80, marginBottom: Spacing.md },
  logoPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: AppColors.background, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  sponsorName: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: AppColors.textPrimary, textAlign: 'center' },
  sponsorDescription: { fontSize: Typography.fontSize.sm, color: AppColors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
  linkRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md },
  linkText: { fontSize: Typography.fontSize.sm, color: AppColors.secondary, marginLeft: Spacing.xs },
});
