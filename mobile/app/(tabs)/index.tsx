import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '@/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Announcement { id: string; title: string; createdAt: string; }
interface Event { id: string; title: string; date: string; }
interface UserData { id: string; firstName?: string; lastName?: string; username: string; }

export default function DashboardScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const userData = await AsyncStorage.getItem('dzematapp_user');
      if (userData) setUser(JSON.parse(userData));

      const [annRes, evtRes] = await Promise.all([
        apiClient.get<Announcement[]>('/api/announcements?limit=3').catch(() => ({ data: [] })),
        apiClient.get<Event[]>('/api/events?limit=3').catch(() => ({ data: [] })),
      ]);
      setAnnouncements(annRes.data || []);
      setEvents(evtRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadData(); };
  const greeting = user?.firstName ? `Selam, ${user.firstName}` : 'Selam';

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3949AB" /></View>;
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3949AB']} />}>
      <Text style={styles.greeting}>{greeting}</Text>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/announcements')}>
          <MaterialCommunityIcons name="bullhorn" size={22} color="#3949AB" />
          <Text style={styles.quickLabel}>Objave</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/events')}>
          <MaterialCommunityIcons name="calendar" size={22} color="#26A69A" />
          <Text style={styles.quickLabel}>Događaji</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/vaktija')}>
          <MaterialCommunityIcons name="mosque" size={22} color="#1E88E5" />
          <Text style={styles.quickLabel}>Vaktija</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/messages')}>
          <MaterialCommunityIcons name="message" size={22} color="#FF7043" />
          <Text style={styles.quickLabel}>Poruke</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Zadnje objave</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/announcements')}>
            <Text style={styles.seeAll}>Sve</Text>
          </TouchableOpacity>
        </View>
        {announcements.length === 0 ? (
          <Text style={styles.empty}>Nema novih objava</Text>
        ) : (
          announcements.map((a) => (
            <View key={a.id} style={styles.listItem}>
              <MaterialCommunityIcons name="circle-small" size={20} color="#3949AB" />
              <Text style={styles.listText} numberOfLines={1}>{a.title}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nadolazeći događaji</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/events')}>
            <Text style={styles.seeAll}>Sve</Text>
          </TouchableOpacity>
        </View>
        {events.length === 0 ? (
          <Text style={styles.empty}>Nema nadolazećih događaja</Text>
        ) : (
          events.map((e) => (
            <View key={e.id} style={styles.listItem}>
              <MaterialCommunityIcons name="calendar-check" size={18} color="#26A69A" />
              <Text style={styles.listText} numberOfLines={1}>{e.title}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECEFF1', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ECEFF1' },
  greeting: { fontSize: 20, fontWeight: '600', color: '#0D1B2A', marginBottom: 16 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  quickBtn: { backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', width: '23%', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  quickLabel: { fontSize: 10, color: '#546E7A', marginTop: 4, textAlign: 'center' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#3949AB' },
  seeAll: { fontSize: 12, color: '#1E88E5' },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  listText: { fontSize: 13, color: '#0D1B2A', marginLeft: 4, flex: 1 },
  empty: { fontSize: 12, color: '#9E9E9E', fontStyle: 'italic', paddingVertical: 8 },
});
