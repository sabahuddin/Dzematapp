import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, ActivityIndicator, RefreshControl, TouchableOpacity, Linking, Image } from 'react-native';
import { apiClient } from '@/services/api';
import { AppColors, BorderRadius, Spacing, Typography, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Sponsor {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  tier: string;
  isActive: boolean;
}

const TIER_COLORS: Record<string, string> = {
  platinum: '#E5E4E2',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
  standard: AppColors.primary,
};

const TIER_LABELS: Record<string, string> = {
  platinum: 'Platinasti sponzor',
  gold: 'Zlatni sponzor',
  silver: 'Srebrni sponzor',
  bronze: 'Brončani sponzor',
  standard: 'Sponzor',
};

export default function SponsorsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSponsors();
  }, []);

  const loadSponsors = async () => {
    try {
      const response = await apiClient.get<Sponsor[]>('/api/sponsors');
      const activeSponsors = (response.data || []).filter(s => s.isActive);
      setSponsors(activeSponsors);
    } catch (error) {
      console.error('Error loading sponsors:', error);
      setSponsors([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSponsors();
  };

  const openWebsite = async (url: string) => {
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

  // Group sponsors by tier
  const tiers = ['platinum', 'gold', 'silver', 'bronze', 'standard'];
  const groupedSponsors = tiers.reduce((acc, tier) => {
    const tierSponsors = sponsors.filter(s => s.tier === tier);
    if (tierSponsors.length > 0) {
      acc[tier] = tierSponsors;
    }
    return acc;
  }, {} as Record<string, Sponsor[]>);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />
      }
    >
      {/* Header */}
      <View style={[styles.headerCard, { backgroundColor: AppColors.primary }]}>
        <Text style={styles.headerIcon}>❤️</Text>
        <Text style={styles.headerTitle}>Naši sponzori</Text>
        <Text style={styles.headerSubtitle}>Zahvaljujemo se svim sponzorima na podršci</Text>
      </View>

      {sponsors.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={styles.emptyIcon}>🤝</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Trenutno nema aktivnih sponzora
          </Text>
        </View>
      ) : (
        Object.entries(groupedSponsors).map(([tier, tierSponsors]) => (
          <View key={tier} style={styles.tierSection}>
            <View style={styles.tierHeader}>
              <View style={[styles.tierBadge, { backgroundColor: TIER_COLORS[tier] }]}>
                <Text style={[styles.tierLabel, tier === 'gold' || tier === 'standard' ? { color: '#000' } : {}]}>
                  {TIER_LABELS[tier] || tier}
                </Text>
              </View>
            </View>

            {tierSponsors.map((sponsor) => (
              <TouchableOpacity
                key={sponsor.id}
                style={[styles.sponsorCard, { backgroundColor: colors.surface }]}
                onPress={() => sponsor.websiteUrl && openWebsite(sponsor.websiteUrl)}
                disabled={!sponsor.websiteUrl}
                activeOpacity={sponsor.websiteUrl ? 0.7 : 1}
              >
                {sponsor.logoUrl ? (
                  <Image 
                    source={{ uri: sponsor.logoUrl }} 
                    style={styles.sponsorLogo}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={[styles.logoPlaceholder, { backgroundColor: TIER_COLORS[tier] }]}>
                    <Text style={styles.logoInitial}>{sponsor.name.charAt(0)}</Text>
                  </View>
                )}
                <View style={styles.sponsorInfo}>
                  <Text style={[styles.sponsorName, { color: colors.text }]}>{sponsor.name}</Text>
                  {sponsor.description && (
                    <Text style={[styles.sponsorDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                      {sponsor.description}
                    </Text>
                  )}
                  {sponsor.websiteUrl && (
                    <Text style={[styles.websiteLink, { color: AppColors.secondary }]}>
                      Posjeti web stranicu →
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))
      )}

      {/* Become a sponsor */}
      <View style={[styles.ctaCard, { backgroundColor: colors.surface, borderColor: AppColors.primary }]}>
        <Text style={styles.ctaIcon}>⭐</Text>
        <Text style={[styles.ctaTitle, { color: colors.text }]}>Želite postati sponzor?</Text>
        <Text style={[styles.ctaText, { color: colors.textSecondary }]}>
          Kontaktirajte administratora džemata za više informacija o sponzorstvu.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl * 2 },
  headerCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerIcon: { fontSize: 48, marginBottom: Spacing.sm },
  headerTitle: { ...Typography.h2, color: '#fff', marginBottom: Spacing.xs },
  headerSubtitle: { ...Typography.body, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyText: { ...Typography.body, textAlign: 'center' },
  tierSection: { marginBottom: Spacing.lg },
  tierHeader: { marginBottom: Spacing.sm },
  tierBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  tierLabel: { ...Typography.bodySmall, fontWeight: '700', color: '#fff' },
  sponsorCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sponsorLogo: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInitial: { ...Typography.h2, color: '#fff' },
  sponsorInfo: { flex: 1 },
  sponsorName: { ...Typography.body, fontWeight: '600', marginBottom: Spacing.xs },
  sponsorDesc: { ...Typography.bodySmall, marginBottom: Spacing.xs },
  websiteLink: { ...Typography.bodySmall, fontWeight: '600' },
  ctaCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  ctaIcon: { fontSize: 32, marginBottom: Spacing.sm },
  ctaTitle: { ...Typography.h3, marginBottom: Spacing.xs },
  ctaText: { ...Typography.body, textAlign: 'center' },
});
