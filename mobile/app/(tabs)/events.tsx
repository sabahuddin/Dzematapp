import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { apiClient } from '@/services/api';
import { AppColors, BorderRadius, Spacing, Typography, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Event {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  location: string | null;
  pointsValue: number;
  rsvpEnabled: boolean;
}

interface EventRsvp {
  eventId: string;
  status: string;
}

export default function EventsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [events, setEvents] = useState<Event[]>([]);
  const [rsvps, setRsvps] = useState<EventRsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const [eventsResponse, rsvpsResponse] = await Promise.all([
        apiClient.get<Event[]>('/api/events').catch(() => ({ data: [] })),
        apiClient.get<EventRsvp[]>('/api/event-rsvp/my').catch(() => ({ data: [] }))
      ]);
      setEvents(eventsResponse.data || []);
      setRsvps(rsvpsResponse.data || []);
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const handleRsvp = async (eventId: string, status: 'going' | 'not_going') => {
    try {
      await apiClient.post('/api/event-rsvp', { eventId, status });
      loadEvents();
      Alert.alert('Uspješno', status === 'going' ? 'Potvrđeno prisustvo' : 'Odbijeno prisustvo');
    } catch (error) {
      Alert.alert('Greška', 'Nije moguće potvrditi prisustvo');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('hr-HR', { 
      weekday: 'short',
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRsvpStatus = (eventId: string) => {
    return rsvps.find(r => r.eventId === eventId)?.status;
  };

  const upcomingEvents = events.filter(e => new Date(e.eventDate) >= new Date());

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
      {upcomingEvents.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Nema nadolazećih događaja
          </Text>
        </View>
      ) : (
        upcomingEvents.map((event) => {
          const rsvpStatus = getRsvpStatus(event.id);
          
          return (
            <View key={event.id} style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{event.title}</Text>
                {event.pointsValue > 0 && (
                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsText}>+{event.pointsValue} bod</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.eventDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailIcon}>📅</Text>
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                    {formatDate(event.eventDate)}
                  </Text>
                </View>
                {event.location && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>📍</Text>
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                      {event.location}
                    </Text>
                  </View>
                )}
              </View>
              
              {event.description && (
                <Text style={[styles.cardDescription, { color: colors.textSecondary }]} numberOfLines={3}>
                  {event.description}
                </Text>
              )}
              
              {event.rsvpEnabled && (
                <View style={styles.rsvpContainer}>
                  {rsvpStatus === 'going' ? (
                    <View style={[styles.rsvpStatus, { backgroundColor: AppColors.success + '20' }]}>
                      <Text style={[styles.rsvpStatusText, { color: AppColors.success }]}>
                        ✓ Dolazim
                      </Text>
                    </View>
                  ) : rsvpStatus === 'not_going' ? (
                    <View style={[styles.rsvpStatus, { backgroundColor: AppColors.error + '20' }]}>
                      <Text style={[styles.rsvpStatusText, { color: AppColors.error }]}>
                        ✗ Ne dolazim
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.rsvpButtons}>
                      <TouchableOpacity
                        style={[styles.rsvpButton, { backgroundColor: AppColors.success }]}
                        onPress={() => handleRsvp(event.id, 'going')}
                      >
                        <Text style={styles.rsvpButtonText}>Dolazim</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.rsvpButton, { backgroundColor: AppColors.error }]}
                        onPress={() => handleRsvp(event.id, 'not_going')}
                      >
                        <Text style={styles.rsvpButtonText}>Ne dolazim</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    ...Typography.h3,
    flex: 1,
    marginRight: Spacing.sm,
  },
  pointsBadge: {
    backgroundColor: AppColors.accent + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  pointsText: {
    ...Typography.caption,
    color: AppColors.accent,
    fontWeight: '600',
  },
  eventDetails: {
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  detailIcon: {
    marginRight: Spacing.sm,
  },
  detailText: {
    ...Typography.bodySmall,
  },
  cardDescription: {
    ...Typography.body,
    marginBottom: Spacing.md,
  },
  rsvpContainer: {
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    paddingTop: Spacing.md,
  },
  rsvpButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  rsvpButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  rsvpButtonText: {
    ...Typography.button,
    color: '#fff',
  },
  rsvpStatus: {
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  rsvpStatusText: {
    ...Typography.button,
  },
});
