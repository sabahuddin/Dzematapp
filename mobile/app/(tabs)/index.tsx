import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, ActivityIndicator, RefreshControl, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient, API_BASE_URL } from '@/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PrayerTime { fajr: string; sunrise: string; dhuhr: string; asr: string; maghrib: string; isha: string; date: string; }
interface Announcement { id: string; title: string; createdAt: string; photoUrl?: string; categories?: string[]; }
interface FeedItem { id: string; type: string; title: string; description?: string; imageUrl?: string; createdAt: string; }
interface UserData { id: string; firstName?: string; lastName?: string; username: string; points?: number; }

const formatTime = (time: string) => time?.substring(0, 5) || '--:--';
const formatDate = () => {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
};

export default function DashboardScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [prayerTime, setPrayerTime] = useState<PrayerTime | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const userData = await AsyncStorage.getItem('dzematapp_user');
      if (userData) setUser(JSON.parse(userData));

      const [prayerRes, annRes, feedRes] = await Promise.all([
        apiClient.get<PrayerTime>('/api/prayer-times/today').catch(() => ({ data: null })),
        apiClient.get<Announcement[]>('/api/announcements').catch(() => ({ data: [] })),
        apiClient.get<FeedItem[]>('/api/activity-feed').catch(() => ({ data: [] })),
      ]);
      if (prayerRes.data) setPrayerTime(prayerRes.data);
      setAnnouncements(annRes.data || []);
      setFeedItems(feedRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadData(); };
  
  const getNextPrayer = () => {
    if (!prayerTime) return null;
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes();
    const prayers = [
      { name: 'Zora', time: prayerTime.fajr },
      { name: 'Izlazak sunca', time: prayerTime.sunrise },
      { name: 'Podne', time: prayerTime.dhuhr },
      { name: 'Ikindija', time: prayerTime.asr },
      { name: 'Akšam', time: prayerTime.maghrib },
      { name: 'Jacija', time: prayerTime.isha },
    ];
    for (const p of prayers) {
      const [ph, pm] = p.time.split(':').map(Number);
      if (h < ph || (h === ph && m < pm)) return p;
    }
    return prayers[0];
  };

  const nextPrayer = getNextPrayer();
  const imageUrl = (url?: string) => url ? (url.startsWith('http') ? url : `${API_BASE_URL}${url}`) : null;

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3949AB" /></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="mosque" size={24} color="#fff" />
          <Text style={styles.logoText}>DžematApp</Text>
        </View>
        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.topBarBtn}>
            <MaterialCommunityIcons name="trophy" size={18} color="#FFD700" />
            <Text style={styles.pointsText}>{user?.points || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBarBtn} onPress={() => router.push('/(tabs)/notifications')}>
            <MaterialCommunityIcons name="bell" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.firstName?.[0] || user?.username?.[0] || 'U'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3949AB']} />}>
        {prayerTime && (
          <View style={styles.prayerCard}>
            <View style={styles.prayerHeader}>
              <MaterialCommunityIcons name="clock-outline" size={18} color="#3949AB" />
              <Text style={styles.prayerTitle}>Današnja vaktija - {formatDate()}</Text>
            </View>
            {nextPrayer && (
              <View style={styles.nextPrayer}>
                <Text style={styles.nextPrayerLabel}>Sljedeći namaz:</Text>
                <Text style={styles.nextPrayerValue}>{nextPrayer.name} {formatTime(nextPrayer.time)}</Text>
              </View>
            )}
            <View style={styles.prayerGrid}>
              {[
                { name: 'Zora', time: prayerTime.fajr, icon: 'weather-sunset-up' },
                { name: 'Izlazak sunca', time: prayerTime.sunrise, icon: 'white-balance-sunny' },
                { name: 'Podne', time: prayerTime.dhuhr, icon: 'white-balance-sunny' },
                { name: 'Ikindija', time: prayerTime.asr, icon: 'white-balance-sunny' },
                { name: 'Akšam', time: prayerTime.maghrib, icon: 'weather-night' },
                { name: 'Jacija', time: prayerTime.isha, icon: 'weather-night' },
              ].map((p, i) => (
                <View key={i} style={styles.prayerItem}>
                  <MaterialCommunityIcons name={p.icon as any} size={20} color={i < 3 ? '#FFB300' : '#5C6BC0'} />
                  <Text style={styles.prayerName}>{p.name}</Text>
                  <Text style={styles.prayerTime}>{formatTime(p.time)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="file-document" size={18} color="#3949AB" />
              <Text style={styles.sectionTitle}>Novosti iz džemata</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/feed')}>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#546E7A" />
            </TouchableOpacity>
          </View>
          {feedItems.length === 0 ? (
            <Text style={styles.empty}>Nema novih aktivnosti</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.feedScroll}>
              {feedItems.slice(0, 5).map((item) => (
                <View key={item.id} style={styles.feedCard}>
                  {item.imageUrl && <Image source={{ uri: imageUrl(item.imageUrl) || '' }} style={styles.feedImage} />}
                  {!item.imageUrl && <View style={[styles.feedImage, styles.feedPlaceholder]}><MaterialCommunityIcons name="image" size={32} color="#B0BEC5" /></View>}
                  <View style={styles.feedBadge}><Text style={styles.feedBadgeText}>{item.type === 'shop_item' ? 'Prodaje se' : item.type}</Text></View>
                  <Text style={styles.feedTitle} numberOfLines={1}>{item.title}</Text>
                  <TouchableOpacity><MaterialCommunityIcons name="arrow-right" size={16} color="#1E88E5" /></TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="bullhorn" size={18} color="#3949AB" />
              <Text style={styles.sectionTitle}>Obavijesti</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/announcements')}>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#546E7A" />
            </TouchableOpacity>
          </View>
          {announcements.length === 0 ? (
            <Text style={styles.empty}>Nema obavijesti</Text>
          ) : (
            announcements.slice(0, 3).map((a) => (
              <TouchableOpacity key={a.id} style={styles.announcementRow} onPress={() => router.push(`/(tabs)/announcements?id=${a.id}`)}>
                {a.photoUrl ? (
                  <Image source={{ uri: imageUrl(a.photoUrl) || '' }} style={styles.announcementImage} />
                ) : (
                  <View style={[styles.announcementImage, styles.announcementPlaceholder]}><MaterialCommunityIcons name="mosque" size={28} color="#26A69A" /></View>
                )}
                <View style={styles.announcementContent}>
                  <Text style={styles.announcementTitle} numberOfLines={1}>{a.title}</Text>
                  <Text style={styles.announcementDate}>{new Date(a.createdAt).toLocaleDateString('bs')}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#B0BEC5" />
              </TouchableOpacity>
            ))
          )}
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#3949AB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ECEFF1' },
  topBar: { backgroundColor: '#3949AB', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topBarBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pointsText: { color: '#FFD700', fontSize: 14, fontWeight: '600' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  container: { flex: 1, backgroundColor: '#ECEFF1' },
  prayerCard: { backgroundColor: '#fff', margin: 12, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  prayerHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  prayerTitle: { fontSize: 14, fontWeight: '600', color: '#0D1B2A' },
  nextPrayer: { backgroundColor: '#ECEFF1', borderRadius: 8, padding: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  nextPrayerLabel: { fontSize: 13, color: '#546E7A' },
  nextPrayerValue: { fontSize: 16, fontWeight: '700', color: '#0D1B2A' },
  prayerGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  prayerItem: { width: '33.33%', alignItems: 'center', paddingVertical: 8 },
  prayerName: { fontSize: 11, color: '#546E7A', marginTop: 2 },
  prayerTime: { fontSize: 14, fontWeight: '600', color: '#0D1B2A' },
  section: { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 12, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#0D1B2A' },
  empty: { fontSize: 13, color: '#9E9E9E', textAlign: 'center', paddingVertical: 16 },
  feedScroll: { marginHorizontal: -4 },
  feedCard: { width: 140, marginHorizontal: 4, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#ECEFF1' },
  feedImage: { width: '100%', height: 80 },
  feedPlaceholder: { backgroundColor: '#ECEFF1', justifyContent: 'center', alignItems: 'center' },
  feedBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#26A69A', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  feedBadgeText: { color: '#fff', fontSize: 9, fontWeight: '600' },
  feedTitle: { fontSize: 12, fontWeight: '500', color: '#0D1B2A', paddingHorizontal: 8, paddingTop: 8, paddingBottom: 4 },
  announcementRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ECEFF1' },
  announcementImage: { width: 56, height: 56, borderRadius: 8, marginRight: 12 },
  announcementPlaceholder: { backgroundColor: 'rgba(38,166,154,0.1)', justifyContent: 'center', alignItems: 'center' },
  announcementContent: { flex: 1 },
  announcementTitle: { fontSize: 14, fontWeight: '500', color: '#0D1B2A', marginBottom: 2 },
  announcementDate: { fontSize: 12, color: '#546E7A' },
});
