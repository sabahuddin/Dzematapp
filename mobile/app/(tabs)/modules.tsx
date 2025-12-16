import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface Module {
  id: string;
  label: string;
  icon: IconName;
  route: string;
}

interface UserData {
  id: string;
  isAdmin?: boolean;
  roles?: string[];
}

export default function ModulesScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('dzematapp_user');
      if (userData) setUser(JSON.parse(userData));
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const isAdmin = user?.isAdmin || user?.roles?.includes('admin') || user?.roles?.includes('imam');

  const MODULES: Module[] = [
    { id: 'feed', label: 'Feed', icon: 'newspaper-variant-outline', route: '/(tabs)/feed' },
    { id: 'profile', label: 'Profil', icon: 'account-outline', route: '/(tabs)/profile' },
    { id: 'activities', label: 'Moje aktivnosti', icon: 'star-outline', route: '/(tabs)/activities' },
    { id: 'membership', label: 'Moja članarina', icon: 'credit-card-outline', route: '/(tabs)/membership' },
    { id: 'projects', label: 'Projekti', icon: 'bank-outline', route: '/(tabs)/projects' },
    { id: 'announcements', label: 'Objave', icon: 'bullhorn-outline', route: '/(tabs)/announcements' },
    { id: 'events', label: 'Događaji', icon: 'calendar-outline', route: '/(tabs)/events' },
    { id: 'sections', label: 'Sekcije', icon: 'clipboard-list-outline', route: '/(tabs)/sections' },
    { id: 'messages', label: 'Poruke', icon: 'message-text-outline', route: '/(tabs)/messages' },
    { id: 'imam-qa', label: 'Pitaj imama', icon: 'account-question-outline', route: '/(tabs)/imam-qa' },
    { id: 'documents', label: 'Dokumenti', icon: 'folder-outline', route: '/(tabs)/documents' },
    { id: 'shop', label: 'Shop', icon: 'cart-outline', route: '/(tabs)/shop' },
    { id: 'sponsors', label: 'Sponzori', icon: 'heart-outline', route: '/(tabs)/sponsors' },
    { id: 'applications', label: 'Prijave', icon: 'file-document-edit-outline', route: '/(tabs)/applications' },
    { id: 'vaktija', label: 'Vaktija', icon: 'mosque', route: '/(tabs)/vaktija' },
    { id: 'guide', label: 'Vodič', icon: 'book-open-page-variant-outline', route: '/(tabs)/guide' },
    { id: 'livestream', label: 'Livestream', icon: 'video-outline', route: '/(tabs)/livestream' },
  ];

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('dzematapp_user');
      await AsyncStorage.removeItem('dzematapp_tenant');
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Moduli</Text>
      </View>
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          {MODULES.map((module) => (
            <TouchableOpacity
              key={module.id}
              style={styles.moduleCard}
              onPress={() => router.push(module.route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name={module.icon} size={28} color="#3949AB" />
              </View>
              <Text style={styles.moduleLabel}>{module.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#D32F2F" />
          <Text style={styles.logoutText}>Odjava</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#3949AB',
  },
  topBar: {
    backgroundColor: '#3949AB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    backgroundColor: '#ECEFF1',
  },
  content: {
    padding: 12,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moduleCard: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(57, 73, 171, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  moduleLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    color: '#0D1B2A',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D32F2F',
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#D32F2F',
  },
});
