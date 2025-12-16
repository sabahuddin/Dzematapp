import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiClient } from '../services/api';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';

interface WorkGroup {
  id: string;
  name: string;
  description: string;
  memberCount?: number;
}

export default function SectionsScreen() {
  const [workGroups, setWorkGroups] = useState<WorkGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const loadData = async () => {
    try {
      const data = await apiClient.get<WorkGroup[]>('/api/work-groups');
      setWorkGroups(data || []);
    } catch (error) {
      console.error('Failed to load work groups:', error);
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
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Stack.Screen 
          options={{ 
            title: 'Sekcije', 
            headerShown: true,
            headerStyle: { backgroundColor: AppColors.primary }, 
            headerTintColor: AppColors.white,
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={AppColors.white} />
              </TouchableOpacity>
            ),
          }} 
        />
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Sekcije', 
          headerShown: true,
          headerStyle: { backgroundColor: AppColors.primary }, 
          headerTintColor: AppColors.white,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={AppColors.white} />
            </TouchableOpacity>
          ),
        }} 
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.lg }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />}
      >
        {workGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={AppColors.navInactive} />
            <Text style={styles.emptyText}>Nema sekcija</Text>
          </View>
        ) : (
          workGroups.map(group => (
            <TouchableOpacity key={group.id} style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name="people" size={24} color={AppColors.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{group.name}</Text>
                {group.description ? (
                  <Text style={styles.cardDescription} numberOfLines={2}>{group.description}</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={20} color={AppColors.navInactive} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </>
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
  backBtn: {
    marginLeft: Spacing.sm,
  },
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: Spacing.xxl,
  },
  emptyText: { 
    fontSize: Typography.fontSize.md, 
    color: AppColors.textSecondary, 
    marginTop: Spacing.md,
  },
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: AppColors.white, 
    borderRadius: BorderRadius.lg, 
    padding: Spacing.md, 
    marginBottom: Spacing.md, 
    ...Shadows.card,
  },
  cardIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: `${AppColors.primary}15`, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: Spacing.md,
  },
  cardContent: { 
    flex: 1,
  },
  cardTitle: { 
    fontSize: Typography.fontSize.lg, 
    fontWeight: Typography.fontWeight.semibold, 
    color: AppColors.textPrimary, 
    marginBottom: Spacing.xs,
  },
  cardDescription: { 
    fontSize: Typography.fontSize.sm, 
    color: AppColors.textSecondary,
  },
});
