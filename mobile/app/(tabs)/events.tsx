import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/api';
import { useAuth } from '../../services/auth';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';

const API_BASE = 'https://app.dzematapp.com';

interface Event {
  id: string;
  name: string;
  description: string;
  location: string;
  dateTime: string;
  startDate?: string;
  endDate?: string;
  rsvpEnabled: boolean;
  maxAttendees?: number;
  categories?: string[];
  pointsValue?: number;
  photoUrl?: string;
  imageUrl?: string;
}

interface RSVP {
  eventId: string;
  status: 'attending' | 'not_attending' | 'maybe';
}

const WEEKDAYS = ['N', 'P', 'U', 'S', 'Č', 'P', 'S'];
const MONTHS = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni', 'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];

export default function EventsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [pastExpanded, setPastExpanded] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const normalizeImageUrl = (url?: string): string | null => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads')) return `${API_BASE}${url}`;
    return url;
  };

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

  const getEventDate = (event: Event): Date => {
    return new Date(event.dateTime || event.startDate || '');
  };

  const isUpcoming = (event: Event): boolean => {
    return getEventDate(event) > new Date();
  };

  const eventDates = useMemo(() => {
    return events.map(e => {
      const d = getEventDate(e);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    });
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events;
    const q = searchQuery.toLowerCase();
    return events.filter(e => 
      e.name.toLowerCase().includes(q) || 
      e.location?.toLowerCase().includes(q)
    );
  }, [events, searchQuery]);

  const upcomingEvents = useMemo(() => 
    filteredEvents.filter(isUpcoming).sort((a, b) => 
      getEventDate(a).getTime() - getEventDate(b).getTime()
    ), 
    [filteredEvents]
  );

  const pastEvents = useMemo(() => 
    filteredEvents.filter(e => !isUpcoming(e)).sort((a, b) => 
      getEventDate(b).getTime() - getEventDate(a).getTime()
    ), 
    [filteredEvents]
  );

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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (number | null)[] = [];
    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const hasEventOnDay = (day: number | null): boolean => {
    if (!day) return false;
    const dateKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}-${day}`;
    return eventDates.includes(dateKey);
  };

  const isToday = (day: number | null): boolean => {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() && 
           currentMonth.getMonth() === today.getMonth() && 
           currentMonth.getFullYear() === today.getFullYear();
  };

  const isSelected = (day: number | null): boolean => {
    if (!day) return false;
    return day === selectedDate.getDate() && 
           currentMonth.getMonth() === selectedDate.getMonth() && 
           currentMonth.getFullYear() === selectedDate.getFullYear();
  };

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const selectDay = (day: number | null) => {
    if (!day) return;
    setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
  };

  const formatDateShort = (date: Date): string => {
    return `${date.getDate()}. ${date.toLocaleDateString('bs-BA', { month: 'short' })}`;
  };

  const stripHtml = (html?: string): string => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  const days = getDaysInMonth(currentMonth);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />
      }
    >
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={AppColors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pretraži događaje..."
            placeholderTextColor={AppColors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={goToPrevMonth}>
            <Ionicons name="chevron-back" size={24} color={AppColors.primary} />
          </TouchableOpacity>
          <Text style={styles.calendarMonth}>
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          <TouchableOpacity onPress={goToNextMonth}>
            <Ionicons name="chevron-forward" size={24} color={AppColors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekdaysRow}>
          {WEEKDAYS.map((day, i) => (
            <Text key={i} style={styles.weekdayText}>{day}</Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {days.map((day, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.dayCell,
                isToday(day) && styles.dayCellToday,
                isSelected(day) && styles.dayCellSelected,
                hasEventOnDay(day) && styles.dayCellHasEvent,
              ]}
              onPress={() => selectDay(day)}
              disabled={!day}
            >
              {day && (
                <Text style={[
                  styles.dayText,
                  isToday(day) && styles.dayTextToday,
                  isSelected(day) && styles.dayTextSelected,
                ]}>
                  {day}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {upcomingEvents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nadolazeći događaji</Text>
          {upcomingEvents.slice(0, 5).map(event => {
            const eventDate = getEventDate(event);
            const imageUrl = normalizeImageUrl(event.photoUrl || event.imageUrl);
            
            return (
              <TouchableOpacity
                key={event.id}
                style={styles.card}
                onPress={() => setSelectedEvent(event)}
                activeOpacity={0.7}
              >
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
                ) : (
                  <View style={styles.cardImagePlaceholder}>
                    <Ionicons name="calendar" size={24} color={AppColors.primary} />
                  </View>
                )}
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{event.name}</Text>
                  <View style={styles.cardMeta}>
                    <Ionicons name="location-outline" size={12} color={AppColors.textSecondary} />
                    <Text style={styles.cardLocation} numberOfLines={1}>{event.location}</Text>
                  </View>
                </View>
                <Text style={styles.cardDate}>{formatDateShort(eventDate)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {pastEvents.length > 0 && (
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.accordionHeader}
            onPress={() => setPastExpanded(!pastExpanded)}
          >
            <Text style={styles.accordionTitle}>Prošli događaji ({pastEvents.length})</Text>
            <Ionicons 
              name={pastExpanded ? 'chevron-up' : 'chevron-down'} 
              size={24} 
              color={AppColors.textSecondary} 
            />
          </TouchableOpacity>
          
          {pastExpanded && (
            pastEvents.slice(0, 10).map(event => {
              const eventDate = getEventDate(event);
              const imageUrl = normalizeImageUrl(event.photoUrl || event.imageUrl);
              
              return (
                <TouchableOpacity
                  key={event.id}
                  style={[styles.card, styles.cardPast]}
                  onPress={() => setSelectedEvent(event)}
                  activeOpacity={0.7}
                >
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.cardImagePlaceholder}>
                      <Ionicons name="calendar" size={24} color={AppColors.navInactive} />
                    </View>
                  )}
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{event.name}</Text>
                    <View style={styles.cardMeta}>
                      <Ionicons name="location-outline" size={12} color={AppColors.textSecondary} />
                      <Text style={styles.cardLocation} numberOfLines={1}>{event.location}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardDate}>{formatDateShort(eventDate)}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}

      {upcomingEvents.length === 0 && pastEvents.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color={AppColors.navInactive} />
          <Text style={styles.emptyText}>Nema događaja</Text>
        </View>
      )}

      <Modal
        visible={selectedEvent !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedEvent(null)}
      >
        {selectedEvent && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedEvent(null)}>
                <Ionicons name="close" size={28} color={AppColors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Događaj</Text>
              <View style={{ width: 28 }} />
            </View>
            
            <ScrollView style={styles.modalContent}>
              {normalizeImageUrl(selectedEvent.photoUrl || selectedEvent.imageUrl) && (
                <Image 
                  source={{ uri: normalizeImageUrl(selectedEvent.photoUrl || selectedEvent.imageUrl)! }} 
                  style={styles.modalImage}
                  resizeMode="cover"
                />
              )}
              
              <View style={styles.modalBody}>
                <Text style={styles.modalTitle}>{selectedEvent.name}</Text>
                
                <View style={styles.modalInfoRow}>
                  <Ionicons name="calendar-outline" size={18} color={AppColors.primary} />
                  <Text style={styles.modalInfoText}>
                    {getEventDate(selectedEvent).toLocaleDateString('bs-BA', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                
                <View style={styles.modalInfoRow}>
                  <Ionicons name="location-outline" size={18} color={AppColors.primary} />
                  <Text style={styles.modalInfoText}>{selectedEvent.location}</Text>
                </View>
                
                {selectedEvent.pointsValue && selectedEvent.pointsValue > 0 && (
                  <View style={styles.modalInfoRow}>
                    <Ionicons name="star" size={18} color="#FFA726" />
                    <Text style={[styles.modalInfoText, { color: '#FFA726' }]}>
                      {selectedEvent.pointsValue} bodova
                    </Text>
                  </View>
                )}
                
                {selectedEvent.description && (
                  <Text style={styles.modalDescription}>
                    {stripHtml(selectedEvent.description)}
                  </Text>
                )}
                
                {selectedEvent.rsvpEnabled && isUpcoming(selectedEvent) && (
                  <View style={styles.rsvpSection}>
                    <TouchableOpacity
                      style={[
                        styles.rsvpButton,
                        getRsvpStatus(selectedEvent.id) === 'attending' && styles.rsvpButtonActive,
                      ]}
                      onPress={() => {
                        handleRsvp(
                          selectedEvent.id, 
                          getRsvpStatus(selectedEvent.id) === 'attending' ? 'not_attending' : 'attending'
                        );
                      }}
                    >
                      <Ionicons 
                        name={getRsvpStatus(selectedEvent.id) === 'attending' ? 'checkmark-circle' : 'checkmark-circle-outline'} 
                        size={22} 
                        color={getRsvpStatus(selectedEvent.id) === 'attending' ? AppColors.white : AppColors.accent} 
                      />
                      <Text style={[
                        styles.rsvpButtonText,
                        getRsvpStatus(selectedEvent.id) === 'attending' && styles.rsvpButtonTextActive,
                      ]}>
                        {getRsvpStatus(selectedEvent.id) === 'attending' ? 'Prijavljen/a' : 'Prijavi se'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
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
  searchContainer: {
    marginBottom: Spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadows.card,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: AppColors.textPrimary,
  },
  calendarCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  calendarMonth: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.textPrimary,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.sm,
  },
  weekdayText: {
    width: 36,
    textAlign: 'center',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    marginVertical: 2,
  },
  dayCellToday: {
    backgroundColor: '#FFA72630',
  },
  dayCellSelected: {
    backgroundColor: AppColors.primary,
  },
  dayCellHasEvent: {
    borderWidth: 2,
    borderColor: AppColors.accent,
  },
  dayText: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.textPrimary,
  },
  dayTextToday: {
    fontWeight: Typography.fontWeight.bold,
    color: '#FFA726',
  },
  dayTextSelected: {
    color: AppColors.white,
    fontWeight: Typography.fontWeight.bold,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.textPrimary,
    marginBottom: Spacing.md,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppColors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  accordionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.textPrimary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  cardPast: {
    opacity: 0.7,
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
  },
  cardImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    backgroundColor: `${AppColors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: Spacing.sm,
    marginRight: Spacing.sm,
  },
  cardTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLocation: {
    fontSize: Typography.fontSize.xs,
    color: AppColors.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  cardDate: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.primary,
    textAlign: 'right',
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
    height: 200,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.textPrimary,
    marginBottom: Spacing.md,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  modalInfoText: {
    fontSize: Typography.fontSize.md,
    color: AppColors.textPrimary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  modalDescription: {
    fontSize: Typography.fontSize.md,
    color: AppColors.textSecondary,
    lineHeight: 24,
    marginTop: Spacing.md,
  },
  rsvpSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: AppColors.navBorder,
  },
  rsvpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: AppColors.accent,
  },
  rsvpButtonActive: {
    backgroundColor: AppColors.accent,
    borderColor: AppColors.accent,
  },
  rsvpButtonText: {
    fontSize: Typography.fontSize.md,
    color: AppColors.accent,
    marginLeft: Spacing.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  rsvpButtonTextActive: {
    color: AppColors.white,
  },
});
