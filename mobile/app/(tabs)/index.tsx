import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/api';
import { useAuth } from '../../services/auth';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';

const { width: screenWidth } = Dimensions.get('window');
const API_BASE = 'https://app.dzematapp.com';

interface PrayerTime {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

interface FeedItem {
  id: number;
  type: string;
  title: string;
  description?: string;
  imageUrl?: string;
}

interface Event {
  id: number;
  name: string;
  location: string;
  startDate: string;
}

interface Task {
  id: number;
  title: string;
  workGroupName?: string;
}

interface Announcement {
  id: string;
  title: string;
  photoUrl?: string;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [currentFeedIndex, setCurrentFeedIndex] = useState(0);
  const feedInterval = useRef<NodeJS.Timeout | null>(null);

  const normalizeImageUrl = (url?: string): string | null => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads')) return `${API_BASE}${url}`;
    return url;
  };

  const loadData = async () => {
    try {
      const [prayerData, eventsData, tasksData, messagesData, announcementsData] = await Promise.all([
        apiClient.get<PrayerTime>('/api/prayer-times/today').catch(() => null),
        apiClient.get<Event[]>('/api/events').catch(() => []),
        apiClient.get<Task[]>('/api/tasks/my').catch(() => []),
        apiClient.get<{ unreadCount: number }>('/api/messages/unread-count').catch(() => ({ unreadCount: 0 })),
        apiClient.get<Announcement[]>('/api/announcements').catch(() => []),
      ]);

      setPrayerTimes(prayerData);
      
      const now = new Date();
      const upcoming = eventsData?.find((e: Event) => new Date(e.startDate) > now);
      setNextEvent(upcoming || null);
      
      setMyTasks(tasksData?.slice(0, 3) || []);
      setUnreadMessages(messagesData?.unreadCount || 0);

      const feed: FeedItem[] = [];
      if (announcementsData && announcementsData.length > 0) {
        announcementsData.slice(0, 5).forEach((a: Announcement, i: number) => {
          feed.push({
            id: i,
            type: 'announcement',
            title: a.title,
            imageUrl: normalizeImageUrl(a.photoUrl) || undefined,
          });
        });
      }
      if (eventsData && eventsData.length > 0) {
        eventsData.slice(0, 3).forEach((e: Event, i: number) => {
          feed.push({
            id: 100 + i,
            type: 'event',
            title: e.name,
          });
        });
      }
      setFeedItems(feed.length > 0 ? feed : [
        { id: 1, type: 'info', title: 'Dobrodošli u DžematApp' },
      ]);
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (feedItems.length > 1) {
      feedInterval.current = setInterval(() => {
        setCurrentFeedIndex((prev) => (prev + 1) % feedItems.length);
      }, 5000);
      return () => {
        if (feedInterval.current) clearInterval(feedInterval.current);
      };
    }
  }, [feedItems.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getNextPrayer = (): { name: string; time: string } | null => {
    if (!prayerTimes) return null;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const prayers = [
      { name: 'Sabah', time: prayerTimes.fajr },
      { name: 'Izlazak', time: prayerTimes.sunrise },
      { name: 'Podne', time: prayerTimes.dhuhr },
      { name: 'Ikindija', time: prayerTimes.asr },
      { name: 'Akšam', time: prayerTimes.maghrib },
      { name: 'Jacija', time: prayerTimes.isha },
    ];
    
    for (const prayer of prayers) {
      if (!prayer.time) continue;
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerMinutes = hours * 60 + minutes;
      if (prayerMinutes > currentTime) {
        return prayer;
      }
    }
    
    return prayers[0];
  };

  const nextPrayer = getNextPrayer();
  const currentFeed = feedItems[currentFeedIndex];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />
      }
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {prayerTimes && (
        <View style={styles.prayerSection}>
          <View style={styles.prayerGrid}>
            {[
              { name: 'Sabah', time: prayerTimes.fajr },
              { name: 'Izlazak', time: prayerTimes.sunrise },
              { name: 'Podne', time: prayerTimes.dhuhr },
              { name: 'Ikindija', time: prayerTimes.asr },
              { name: 'Akšam', time: prayerTimes.maghrib },
              { name: 'Jacija', time: prayerTimes.isha },
            ].map((prayer) => {
              const isNext = nextPrayer?.name === prayer.name;
              return (
                <View 
                  key={prayer.name} 
                  style={[styles.prayerItem, isNext && styles.prayerItemNext]}
                >
                  <Text style={[styles.prayerName, isNext && styles.prayerNameNext]}>
                    {prayer.name}
                  </Text>
                  <Text style={[styles.prayerTime, isNext && styles.prayerTimeNext]}>
                    {prayer.time || '--:--'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {feedItems.length > 0 && currentFeed && (
        <TouchableOpacity 
          style={styles.feedSection} 
          activeOpacity={0.9}
          onPress={() => router.push('/(tabs)/announcements')}
        >
          <View style={styles.feedRow}>
            {currentFeed.imageUrl ? (
              <Image 
                source={{ uri: currentFeed.imageUrl }} 
                style={styles.feedImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.feedImagePlaceholder}>
                <Ionicons 
                  name={currentFeed.type === 'event' ? 'calendar' : 'megaphone'} 
                  size={32} 
                  color={AppColors.primary} 
                />
              </View>
            )}
            <View style={styles.feedContent}>
              <View style={styles.feedBadge}>
                <Text style={styles.feedBadgeText}>
                  {currentFeed.type === 'event' ? 'Događaj' : 'Obavijest'}
                </Text>
              </View>
              <Text style={styles.feedTitle} numberOfLines={2}>{currentFeed.title}</Text>
            </View>
          </View>
          <View style={styles.feedDots}>
            {feedItems.map((_, index) => (
              <View 
                key={index} 
                style={[styles.feedDot, index === currentFeedIndex && styles.feedDotActive]} 
              />
            ))}
          </View>
        </TouchableOpacity>
      )}

      {nextEvent && (
        <TouchableOpacity style={styles.section} onPress={() => router.push('/(tabs)/events')}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={22} color={AppColors.primary} />
            <Text style={styles.sectionTitle}>Sljedeći događaj</Text>
            <Ionicons name="chevron-forward" size={20} color={AppColors.navInactive} />
          </View>
          <Text style={styles.eventName}>{nextEvent.name}</Text>
          <View style={styles.eventMeta}>
            <Ionicons name="location-outline" size={14} color={AppColors.textSecondary} />
            <Text style={styles.eventLocation}>{nextEvent.location}</Text>
            <Text style={styles.eventDate}>
              {new Date(nextEvent.startDate).toLocaleDateString('bs-BA', { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.section} onPress={() => router.push('/sections')}>
        <View style={styles.sectionHeader}>
          <Ionicons name="checkmark-circle" size={22} color={AppColors.accent} />
          <Text style={styles.sectionTitle}>Zadaci</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{myTasks.length}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={AppColors.navInactive} />
        </View>
        {myTasks.length > 0 ? (
          myTasks.map((task) => (
            <View key={task.id} style={styles.taskRow}>
              <View style={styles.taskDot} />
              <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Nemate aktivnih zadataka</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.section} onPress={() => router.push('/shop')}>
        <View style={styles.sectionHeader}>
          <Ionicons name="cart" size={22} color={AppColors.secondary} />
          <Text style={styles.sectionTitle}>Trgovina</Text>
          <Ionicons name="chevron-forward" size={20} color={AppColors.navInactive} />
        </View>
        <Text style={styles.sectionSubtext}>Pregledajte DžematShop i Marketplace</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.section} onPress={() => router.push('/(tabs)/messages')}>
        <View style={styles.sectionHeader}>
          <Ionicons name="chatbubbles" size={22} color="#7E57C2" />
          <Text style={styles.sectionTitle}>Poruke</Text>
          {unreadMessages > 0 && (
            <View style={[styles.badge, { backgroundColor: AppColors.error }]}>
              <Text style={styles.badgeText}>{unreadMessages}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color={AppColors.navInactive} />
        </View>
        <Text style={styles.sectionSubtext}>
          {unreadMessages > 0 
            ? `Imate ${unreadMessages} nepročitanih poruka` 
            : 'Sve poruke su pročitane'
          }
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.background,
  },
  prayerSection: {
    backgroundColor: AppColors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  prayerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  prayerItem: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  prayerItemNext: {
    backgroundColor: AppColors.white,
  },
  prayerName: {
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  prayerNameNext: {
    color: AppColors.primary,
  },
  prayerTime: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.white,
  },
  prayerTimeNext: {
    color: AppColors.primary,
  },
  feedSection: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    ...Shadows.card,
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
  },
  feedImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    backgroundColor: `${AppColors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  feedBadge: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  feedBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.white,
  },
  feedTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.textPrimary,
  },
  feedDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  feedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.navInactive,
    marginHorizontal: 3,
  },
  feedDotActive: {
    backgroundColor: AppColors.primary,
    width: 18,
  },
  section: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.textPrimary,
    marginLeft: Spacing.sm,
  },
  sectionSubtext: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.textSecondary,
  },
  badge: {
    backgroundColor: AppColors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.white,
  },
  eventName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: AppColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventLocation: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.textSecondary,
    marginLeft: 4,
    marginRight: Spacing.md,
  },
  eventDate: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  taskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.accent,
    marginRight: Spacing.sm,
  },
  taskTitle: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: AppColors.textPrimary,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.textSecondary,
    fontStyle: 'italic',
  },
});
