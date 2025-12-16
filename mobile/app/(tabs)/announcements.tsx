import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/api';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string | null;
  isPinned: boolean;
  createdAt: string;
  photoUrl?: string;
}

export default function AnnouncementsScreen() {
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

  const loadData = async () => {
    try {
      const data = await apiClient.get<Announcement[]>('/api/announcements');
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Failed to load announcements:', error);
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

  const stripHtml = (html: string): string => {
    return html.replace(/<[^>]*>/g, '').trim();
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('bs-BA', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={AppColors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pretraži objave..."
            placeholderTextColor={AppColors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={AppColors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {categories.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>
              Sve
            </Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />
        }
      >
        {filteredAnnouncements.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={64} color={AppColors.navInactive} />
            <Text style={styles.emptyText}>Nema objava</Text>
          </View>
        ) : (
          filteredAnnouncements.map(announcement => (
            <TouchableOpacity
              key={announcement.id}
              style={styles.card}
              onPress={() => setExpandedId(expandedId === announcement.id ? null : announcement.id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                {announcement.isPinned && (
                  <Ionicons name="pin" size={16} color={AppColors.primary} style={styles.pinIcon} />
                )}
                <Text style={styles.cardTitle} numberOfLines={expandedId === announcement.id ? undefined : 2}>
                  {announcement.title}
                </Text>
              </View>
              
              {announcement.category && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{announcement.category}</Text>
                </View>
              )}
              
              <Text 
                style={styles.cardContent} 
                numberOfLines={expandedId === announcement.id ? undefined : 3}
              >
                {stripHtml(announcement.content)}
              </Text>
              
              <Text style={styles.cardDate}>{formatDate(announcement.createdAt)}</Text>
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
    backgroundColor: AppColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.background,
  },
  searchContainer: {
    padding: Spacing.md,
    backgroundColor: AppColors.white,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: AppColors.textPrimary,
  },
  categoriesContainer: {
    backgroundColor: AppColors.white,
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: AppColors.background,
    marginRight: Spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: AppColors.primary,
  },
  categoryText: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.textSecondary,
  },
  categoryTextActive: {
    color: AppColors.white,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.md,
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
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pinIcon: {
    marginRight: Spacing.xs,
    marginTop: 2,
  },
  cardTitle: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.textPrimary,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${AppColors.primary}15`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  categoryBadgeText: {
    fontSize: Typography.fontSize.xs,
    color: AppColors.primary,
  },
  cardContent: {
    fontSize: Typography.fontSize.md,
    color: AppColors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  cardDate: {
    fontSize: Typography.fontSize.xs,
    color: AppColors.navInactive,
    marginTop: Spacing.sm,
  },
});
