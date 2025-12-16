import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';

interface FeedItem {
  id: string;
  type: string;
  title: string;
  content: string;
  createdAt: string;
  userName?: string;
}

export default function FeedScreen() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await apiClient.get<FeedItem[]>('/api/activity-feed');
      setItems(data || []);
    } catch (error) {
      console.error('Failed to load feed:', error);
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

  const getItemIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'announcement': return 'megaphone';
      case 'event': return 'calendar';
      case 'task': return 'checkmark-circle';
      default: return 'newspaper';
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Feed', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Feed', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />}
      >
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="newspaper-outline" size={64} color={AppColors.navInactive} />
            <Text style={styles.emptyText}>Nema aktivnosti</Text>
          </View>
        ) : (
          items.map(item => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <Ionicons name={getItemIcon(item.type)} size={20} color={AppColors.primary} />
                </View>
                <Text style={styles.itemType}>{item.type}</Text>
                <Text style={styles.itemDate}>
                  {new Date(item.createdAt).toLocaleDateString('bs-BA', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemContent} numberOfLines={3}>{item.content}</Text>
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  iconContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: `${AppColors.primary}15`, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm },
  itemType: { flex: 1, fontSize: Typography.fontSize.sm, color: AppColors.textSecondary, textTransform: 'capitalize' },
  itemDate: { fontSize: Typography.fontSize.xs, color: AppColors.navInactive },
  itemTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: AppColors.textPrimary, marginBottom: Spacing.xs },
  itemContent: { fontSize: Typography.fontSize.md, color: AppColors.textSecondary, lineHeight: 22 },
});
