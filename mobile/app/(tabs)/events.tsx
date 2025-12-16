import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/api';
import { useAuth } from '../../services/auth';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';

interface Event {
  id: string;
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate?: string;
  rsvpEnabled: boolean;
  maxAttendees?: number;
  categories?: string[];
  pointsValue?: number;
}

interface RSVP {
  eventId: string;
  status: 'attending' | 'not_attending' | 'maybe';
}

export default function EventsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [eventsData, rsvpsData] = await Promise.all([
        apiClient.get<Event[]>('/api/events'),
        apiClient.get<RSVP[]>('/api/event-rsvps/my').catch(() => []),
      ]);
      setEvents(eventsData || []);
      setRsvps(rsvpsData || []);
    } catch (error) {
      console.error('Failed to load events:', error);
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

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('bs-BA', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRsvpStatus = (eventId: string): string | null => {
    const rsvp = rsvps.find(r => r.eventId === eventId);
    return rsvp?.status || null;
  };

  const handleRsvp = async (eventId: string, status: 'attending' | 'not_attending') => {
    try {
      await apiClient.post('/api/event-rsvps', { eventId, status });
      await loadData();
      Alert.alert('Uspješno', status === 'attending' ? 'Prijava uspješna!' : 'Odjava uspješna!');
    } catch (error) {
      Alert.alert('Greška', 'Nije moguće izvršiti akciju');
    }
  };

  const isUpcoming = (dateStr: string): boolean => {
    return new Date(dateStr) > new Date();
  };

  const upcomingEvents = events.filter(e => isUpcoming(e.startDate));
  const pastEvents = events.filter(e => !isUpcoming(e.startDate));

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
      {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color={AppColors.navInactive} />
          <Text style={styles.emptyText}>Nema događaja</Text>
        </View>
      ) : (
        <>
          {upcomingEvents.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Nadolazeći događaji</Text>
              {upcomingEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  rsvpStatus={getRsvpStatus(event.id)}
                  onRsvp={handleRsvp}
                  formatDate={formatDate}
                />
              ))}
            </>
          )}

          {pastEvents.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Prošli događaji</Text>
              {pastEvents.slice(0, 5).map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  rsvpStatus={getRsvpStatus(event.id)}
                  isPast
                  formatDate={formatDate}
                />
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

function EventCard({ 
  event, 
  rsvpStatus, 
  isPast = false, 
  onRsvp,
  formatDate 
}: { 
  event: Event; 
  rsvpStatus: string | null;
  isPast?: boolean;
  onRsvp?: (eventId: string, status: 'attending' | 'not_attending') => void;
  formatDate: (date: string) => string;
}) {
  return (
    <View style={[styles.card, isPast && styles.cardPast]}>
      <View style={styles.cardHeader}>
        <View style={styles.dateBox}>
          <Text style={styles.dateDay}>{new Date(event.startDate).getDate()}</Text>
          <Text style={styles.dateMonth}>
            {new Date(event.startDate).toLocaleDateString('bs-BA', { month: 'short' })}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{event.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={AppColors.textSecondary} />
            <Text style={styles.locationText}>{event.location}</Text>
          </View>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={14} color={AppColors.textSecondary} />
            <Text style={styles.timeText}>
              {new Date(event.startDate).toLocaleTimeString('bs-BA', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </View>

      {event.description && (
        <Text style={styles.description} numberOfLines={2}>
          {event.description}
        </Text>
      )}

      {event.pointsValue && event.pointsValue > 0 && (
        <View style={styles.pointsBadge}>
          <Ionicons name="star" size={14} color="#FFA726" />
          <Text style={styles.pointsText}>{event.pointsValue} bodova</Text>
        </View>
      )}

      {!isPast && event.rsvpEnabled && onRsvp && (
        <View style={styles.rsvpButtons}>
          <TouchableOpacity
            style={[
              styles.rsvpButton,
              rsvpStatus === 'attending' && styles.rsvpButtonActive,
            ]}
            onPress={() => onRsvp(event.id, rsvpStatus === 'attending' ? 'not_attending' : 'attending')}
          >
            <Ionicons 
              name={rsvpStatus === 'attending' ? 'checkmark-circle' : 'checkmark-circle-outline'} 
              size={20} 
              color={rsvpStatus === 'attending' ? AppColors.white : AppColors.accent} 
            />
            <Text style={[
              styles.rsvpButtonText,
              rsvpStatus === 'attending' && styles.rsvpButtonTextActive,
            ]}>
              {rsvpStatus === 'attending' ? 'Prijavljen/a' : 'Prijavi se'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.textPrimary,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  cardPast: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
  },
  dateBox: {
    width: 56,
    height: 56,
    backgroundColor: AppColors.primary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  dateDay: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.white,
  },
  dateMonth: {
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  locationText: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.textSecondary,
    marginLeft: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.textSecondary,
    marginLeft: 4,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  pointsText: {
    fontSize: Typography.fontSize.sm,
    color: '#FFA726',
    marginLeft: 4,
    fontWeight: Typography.fontWeight.medium,
  },
  rsvpButtons: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: AppColors.navBorder,
    paddingTop: Spacing.md,
  },
  rsvpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: AppColors.accent,
  },
  rsvpButtonActive: {
    backgroundColor: AppColors.accent,
    borderColor: AppColors.accent,
  },
  rsvpButtonText: {
    fontSize: Typography.fontSize.md,
    color: AppColors.accent,
    marginLeft: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  rsvpButtonTextActive: {
    color: AppColors.white,
  },
});
