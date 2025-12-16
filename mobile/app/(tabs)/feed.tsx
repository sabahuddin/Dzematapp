import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { apiClient } from '@/services/api';
import { AppColors, BorderRadius, Spacing, Typography, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface FeedItem {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
  userId: string | null;
  userName: string | null;
  metadata: any;
}

const FEED_ICONS: Record<string, string> = {
  announcement: '📢',
  event: '📅',
  task: '✅',
  message: '💬',
  badge: '🏅',
  membership: '💳',
  certificate: '🎖️',
  question: '❓',
  default: '📌',
};

const FEED_COLORS: Record<string, string> = {
  announcement: AppColors.primary,
  event: '#9C27B0',
  task: AppColors.success,
  message: AppColors.info,
  badge: '#FFC107',
  membership: '#4CAF50',
  certificate: '#FF9800',
  question: '#7E57C2',
  default: AppColors.textSecondary,
};

export default function FeedScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      const response = await apiClient.get<FeedItem[]>('/api/activity-feed');
      setFeedItems(response.data || []);
    } catch (error) {
      console.error('Error loading feed:', error);
      setFeedItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFeed();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Upravo sada';
    if (minutes < 60) return `Prije ${minutes} min`;
    if (hours < 24) return `Prije ${hours} h`;
    if (days < 7) return `Prije ${days} dana`;
    
    return date.toLocaleDateString('hr-HR', { day: '2-digit', month: '2-digit' });
  };

  const getIcon = (type: string) => FEED_ICONS[type] || FEED_ICONS.default;
  const getColor = (type: string) => FEED_COLORS[type] || FEED_COLORS.default;

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
      <Text style={[styles.pageTitle, { color: colors.text }]}>Aktivnosti zajednice</Text>
      <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
        Najnovije aktivnosti u vašem džematu
      </Text>

      {feedItems.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={styles.emptyIcon}>📰</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Nema aktivnosti</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Ovdje će se prikazivati aktivnosti vašeg džemata
          </Text>
        </View>
      ) : (
        <View style={styles.timeline}>
          {feedItems.map((item, index) => (
            <View key={item.id} style={styles.timelineItem}>
              {/* Timeline connector */}
              <View style={styles.timelineLeft}>
                <View style={[styles.iconCircle, { backgroundColor: getColor(item.type) }]}>
                  <Text style={styles.itemIcon}>{getIcon(item.type)}</Text>
                </View>
                {index < feedItems.length - 1 && (
                  <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                )}
              </View>

              {/* Content */}
              <View style={[styles.itemCard, { backgroundColor: colors.surface }]}>
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemTime, { color: colors.textSecondary }]}>
                    {formatDate(item.createdAt)}
                  </Text>
                </View>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                {item.description && (
                  <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
                {item.userName && (
                  <Text style={[styles.itemUser, { color: getColor(item.type) }]}>
                    👤 {item.userName}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl * 2 },
  pageTitle: { ...Typography.h2, marginBottom: Spacing.xs },
  pageSubtitle: { ...Typography.body, marginBottom: Spacing.lg },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  emptyIcon: { fontSize: 64, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h3, marginBottom: Spacing.sm },
  emptyText: { ...Typography.body, textAlign: 'center' },
  timeline: { paddingLeft: Spacing.xs },
  timelineItem: { flexDirection: 'row', marginBottom: Spacing.sm },
  timelineLeft: { alignItems: 'center', marginRight: Spacing.md },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemIcon: { fontSize: 18 },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: Spacing.xs,
    minHeight: 20,
  },
  itemCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: { marginBottom: Spacing.xs },
  itemTime: { ...Typography.caption },
  itemTitle: { ...Typography.body, fontWeight: '600', marginBottom: Spacing.xs },
  itemDesc: { ...Typography.bodySmall, marginBottom: Spacing.xs },
  itemUser: { ...Typography.caption, fontWeight: '600' },
});
