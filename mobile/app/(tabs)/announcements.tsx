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
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/api';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';

const { width: screenWidth } = Dimensions.get('window');
const API_BASE = 'https://app.dzematapp.com';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string | null;
  categories?: string[];
  isPinned: boolean;
  createdAt: string;
  publishDate?: string;
  photoUrl?: string;
}

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const normalizeImageUrl = (url?: string): string | null => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads')) return `${API_BASE}${url}`;
    return url;
  };

  const categories = useMemo(() => {
    const cats: string[] = [];
    announcements.forEach(a => {
      if (a.category && !cats.includes(a.category)) cats.push(a.category);
      if (a.categories) {
        a.categories.forEach(c => {
          if (!cats.includes(c)) cats.push(c);
        });
      }
    });
    return cats;
  }, [announcements]);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(a => {
      const matchesSearch = !searchQuery || 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || 
        a.category === selectedCategory || 
        (a.categories && a.categories.includes(selectedCategory));
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
    return html
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]*>/g, '')
      .trim();
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('bs-BA', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return '';
    }
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
            placeholder="Pretraži obavijesti..."
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
            <Text style={styles.emptyText}>Nema obavijesti</Text>
          </View>
        ) : (
          filteredAnnouncements.map(announcement => {
            const imageUrl = normalizeImageUrl(announcement.photoUrl);
            const dateStr = formatDate(announcement.publishDate || announcement.createdAt);
            
            return (
              <TouchableOpacity
                key={announcement.id}
                style={styles.card}
                onPress={() => setSelectedAnnouncement(announcement)}
                activeOpacity={0.7}
              >
                {imageUrl && (
                  <Image 
                    source={{ uri: imageUrl }} 
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    {announcement.isPinned && (
                      <Ionicons name="pin" size={16} color={AppColors.primary} style={styles.pinIcon} />
                    )}
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {announcement.title}
                    </Text>
                  </View>
                  
                  <Text style={styles.cardContent} numberOfLines={2}>
                    {stripHtml(announcement.content)}
                  </Text>
                  
                  <View style={styles.cardFooter}>
                    {(announcement.category || (announcement.categories && announcement.categories.length > 0)) && (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>
                          {announcement.category || announcement.categories?.[0]}
                        </Text>
                      </View>
                    )}
                    {dateStr ? (
                      <Text style={styles.cardDate}>{dateStr}</Text>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={selectedAnnouncement !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedAnnouncement(null)}
      >
        {selectedAnnouncement && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedAnnouncement(null)}>
                <Ionicons name="close" size={28} color={AppColors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Obavijest</Text>
              <View style={{ width: 28 }} />
            </View>
            
            <ScrollView style={styles.modalContent}>
              {normalizeImageUrl(selectedAnnouncement.photoUrl) && (
                <Image 
                  source={{ uri: normalizeImageUrl(selectedAnnouncement.photoUrl)! }} 
                  style={styles.modalImage}
                  resizeMode="cover"
                />
              )}
              
              <View style={styles.modalBody}>
                <Text style={styles.modalTitle}>{selectedAnnouncement.title}</Text>
                
                {formatDate(selectedAnnouncement.publishDate || selectedAnnouncement.createdAt) ? (
                  <Text style={styles.modalDate}>
                    {formatDate(selectedAnnouncement.publishDate || selectedAnnouncement.createdAt)}
                  </Text>
                ) : null}
                
                <Text style={styles.modalText}>
                  {stripHtml(selectedAnnouncement.content)}
                </Text>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
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
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.card,
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardBody: {
    padding: Spacing.md,
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
  cardContent: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  categoryBadge: {
    backgroundColor: `${AppColors.primary}15`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  categoryBadgeText: {
    fontSize: Typography.fontSize.xs,
    color: AppColors.primary,
  },
  cardDate: {
    fontSize: Typography.fontSize.xs,
    color: AppColors.navInactive,
    marginLeft: 'auto',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.navBorder,
  },
  modalHeaderTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.textPrimary,
  },
  modalContent: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 250,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.textPrimary,
    marginBottom: Spacing.sm,
  },
  modalDate: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.textSecondary,
    marginBottom: Spacing.lg,
  },
  modalText: {
    fontSize: Typography.fontSize.md,
    color: AppColors.textPrimary,
    lineHeight: 24,
  },
});
