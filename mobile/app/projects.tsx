import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  budget?: string;
  startDate?: string;
  endDate?: string;
}

export default function ProjectsScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await apiClient.get<Project[]>('/api/projects');
      setProjects(data || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return AppColors.accent;
      case 'completed': return AppColors.primary;
      case 'planned': return '#FFA726';
      default: return AppColors.textSecondary;
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'active': return 'U toku';
      case 'completed': return 'Završen';
      case 'planned': return 'Planiran';
      default: return status;
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Projekti', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Projekti', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />}
      >
        {projects.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={64} color={AppColors.navInactive} />
            <Text style={styles.emptyText}>Nema projekata</Text>
          </View>
        ) : (
          projects.map(project => (
            <View key={project.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{project.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(project.status)}20` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(project.status) }]}>
                    {getStatusLabel(project.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardDescription}>{project.description}</Text>
              {project.budget && (
                <View style={styles.infoRow}>
                  <Ionicons name="wallet-outline" size={16} color={AppColors.textSecondary} />
                  <Text style={styles.infoText}>Budžet: {project.budget}</Text>
                </View>
              )}
            </View>
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
  card: { backgroundColor: AppColors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  cardTitle: { flex: 1, fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: AppColors.textPrimary, marginRight: Spacing.sm },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  statusText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.medium },
  cardDescription: { fontSize: Typography.fontSize.md, color: AppColors.textSecondary, lineHeight: 22 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm },
  infoText: { fontSize: Typography.fontSize.sm, color: AppColors.textSecondary, marginLeft: Spacing.xs },
});
