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
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/api';
import { useAuth } from '../../services/auth';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';

const { width: screenWidth } = Dimensions.get('window');

interface PrayerTime {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

interface FeedItem {
  id: string;
  type: string;
  title: string;
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
  const feedRef = useRef<FlatList>(null);

  const loadData = async () => {
    try {
      const [prayerData, eventsData, tasksData, messagesData] = await Promise.all([
        apiClient.get<PrayerTime>('/api/prayer-times/today').catch(() => null),
        apiClient.get<Event[]>('/api/events').catch(() => []),
        apiClient.get<Task[]>('/api/tasks/my').catch(() => []),
        apiClient.get<{ unreadCount: number }>('/api/messages/unread-count').catch(() => ({ unreadCount: 0 })),
      ]);

      setPrayerTimes(prayerData);
      
      const upcoming = eventsData?.find((e: Event) => new Date(e.startDate) > new Date());
      setNextEvent(upcoming || null);
      
      setMyTasks(tasksData?.slice(0, 3) || []);
      setUnreadMessages(messagesData?.unreadCount || 0);

      const mockFeed: FeedItem[] = [
        { id: '1', type: 'announcement', title: 'Nova objava iz džemata' },
        { id: '2', type: 'event', title: 'Nadolazeći događaj' },
        { id: '3', type: 'news', title: 'Vijesti iz zajednice' },
      ];
      setFeedItems(mockFeed);
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
      const interval = setInterval(() => {
        setCurrentFeedIndex((prev) => (prev + 1) % feedItems.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [feedItems.length]);

  useEffect(() => {
    if (feedRef.current && feedItems.length > 0) {
      feedRef.current.scrollToIndex({ index: currentFeedIndex, animated: true });
    }
  }, [currentFeedIndex]);

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
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerMinutes = hours * 60 + minutes;
      if (prayerMinutes > currentTime) {
        return prayer;
      }
    }
    
    return prayers[0];
  };

  const nextPrayer = getNextPrayer();

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
    >
      <Text style={styles.greeting}>Selam alejkum,</Text>
      <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>

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
                    {prayer.time}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {feedItems.length > 0 && (
        <View style={styles.feedSection}>
          <FlatList
            ref={feedRef}
            data={feedItems}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.feedItem}>
                <View style={styles.feedContent}>
                  <Ionicons 
                    name={item.type === 'event' ? 'calendar' : 'megaphone'} 
                    size={24} 
                    color={AppColors.primary} 
                  />
                  <Text style={styles.feedTitle}>{item.title}</Text>
                </View>
              </View>
            )}
            getItemLayout={(_, index) => ({
              length: screenWidth - Spacing.md * 2,
              offset: (screenWidth - Spacing.md * 2) * index,
              index,
            })}
          />
          <View style={styles.feedDots}>
            {feedItems.map((_, index) => (
              <View 
                key={index} 
                style={[styles.feedDot, index === currentFeedIndex && styles.feedDotActive]} 
              />
            ))}
          </View>
        </View>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.background,
  },
  greeting: {
    fontSize: Typography.fontSize.md,
    color: AppColors.textSecondary,
  },
  userName: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.textPrimary,
    marginBottom: Spacing.lg,
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
    marginBottom: Spacing.md,
  },
  feedItem: {
    width: screenWidth - Spacing.md * 2,
    height: 100,
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    ...Shadows.card,
  },
  feedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  feedTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    color: AppColors.textPrimary,
    marginLeft: Spacing.md,
  },
  feedDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  feedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.navInactive,
    marginHorizontal: 4,
  },
  feedDotActive: {
    backgroundColor: AppColors.primary,
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
