import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Text, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { apiClient } from '@/services/api';
import { AppColors, BorderRadius, Spacing, Typography, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string | null;
  isPinned: boolean;
  createdAt: string;
}

export default function AnnouncementsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    return [...new Set(announcements.map(a => a.category).filter(Boolean))] as string[];
  }, [announcements]);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(a => {
      const matchesSearch = !searchQuery || 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || a.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [announcements, searchQuery, selectedCategory]);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const response = await apiClient.get<Announcement[]>('/api/announcements');
      setAnnouncements(response.data || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
      setAnnouncements([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnnouncements();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('hr-HR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.background, color: colors.text }]}
          placeholder="Pretraži objave..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {categories.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryScrollContent}
          >
            <TouchableOpacity
              style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>Sve</Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />
        }
      >
      {filteredAnnouncements.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={styles.emptyIcon}>📢</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Nema objava za prikaz
          </Text>
        </View>
      ) : (
        filteredAnnouncements.map((announcement) => (
          <TouchableOpacity
            key={announcement.id}
            style={[
              styles.card,
              { backgroundColor: colors.surface },
              announcement.isPinned && styles.pinnedCard
            ]}
            onPress={() => setExpandedId(expandedId === announcement.id ? null : announcement.id)}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              {announcement.isPinned && (
                <Text style={styles.pinnedBadge}>📌</Text>
              )}
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={expandedId === announcement.id ? undefined : 2}>
                {announcement.title}
              </Text>
            </View>
            
            <Text 
              style={[styles.cardContent, { color: colors.textSecondary }]} 
              numberOfLines={expandedId === announcement.id ? undefined : 3}
            >
              {announcement.content}
            </Text>
            
            <View style={styles.cardFooter}>
              <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
                {formatDate(announcement.createdAt)}
              </Text>
              {announcement.category && (
                <View style={[styles.categoryBadge, { backgroundColor: AppColors.primary + '20' }]}>
                  <Text style={[styles.categoryText, { color: AppColors.primary }]}>
                    {announcement.category}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))
      )}
      </ScrollView>
    </View>
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
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pinnedCard: {
    borderLeftWidth: 4,
    borderLeftColor: AppColors.warning,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  pinnedBadge: {
    marginRight: Spacing.xs,
  },
  cardTitle: {
    ...Typography.h3,
    flex: 1,
  },
  cardContent: {
    ...Typography.body,
    marginBottom: Spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: {
    ...Typography.caption,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  categoryText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  searchContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  searchInput: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.sm,
  },
  categoryScroll: {
    marginTop: Spacing.xs,
  },
  categoryScrollContent: {
    gap: Spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: AppColors.background,
    marginRight: Spacing.xs,
  },
  categoryChipActive: {
    backgroundColor: AppColors.primary,
  },
  chipText: {
    ...Typography.bodySmall,
    color: AppColors.textSecondary,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
