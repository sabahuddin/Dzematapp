import React from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface Module {
  id: string;
  label: string;
  icon: IconName;
  route: string;
}

// Member-focused modules with consistent Indigo theme icons
const MODULES: Module[] = [
  { id: 'feed', label: 'Feed', icon: 'newspaper-variant-outline', route: '/(tabs)/feed' },
  { id: 'vaktija', label: 'Vaktija', icon: 'mosque', route: '/(tabs)/vaktija' },
  { id: 'messages', label: 'Poruke', icon: 'message-text-outline', route: '/(tabs)/messages' },
  { id: 'notifications', label: 'Obavještenja', icon: 'bell-outline', route: '/(tabs)/notifications' },
  { id: 'activities', label: 'Moje aktivnosti', icon: 'star-outline', route: '/(tabs)/activities' },
  { id: 'badges', label: 'Moje značke', icon: 'medal-outline', route: '/(tabs)/badges' },
  { id: 'membership', label: 'Članarina', icon: 'credit-card-outline', route: '/(tabs)/membership' },
  { id: 'certificates', label: 'Moje zahvale', icon: 'certificate-outline', route: '/(tabs)/certificates' },
  { id: 'shop', label: 'Shop', icon: 'cart-outline', route: '/(tabs)/shop' },
  { id: 'sections', label: 'Sekcije', icon: 'clipboard-list-outline', route: '/(tabs)/sections' },
  { id: 'imam-qa', label: 'Pitaj imama', icon: 'account-question-outline', route: '/(tabs)/imam-qa' },
  { id: 'documents', label: 'Dokumenti', icon: 'folder-outline', route: '/(tabs)/documents' },
  { id: 'applications', label: 'Prijave', icon: 'file-document-edit-outline', route: '/(tabs)/applications' },
  { id: 'livestream', label: 'Livestream', icon: 'video-outline', route: '/(tabs)/livestream' },
  { id: 'sponsors', label: 'Sponzori', icon: 'heart-outline', route: '/(tabs)/sponsors' },
  { id: 'guide', label: 'Vodič', icon: 'book-open-page-variant-outline', route: '/(tabs)/guide' },
];

export default function ModulesScreen() {
  const router = useRouter();

  return (
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
              <MaterialCommunityIcons name={module.icon} size={26} color="#3949AB" />
            </View>
            <Text style={styles.moduleLabel}>{module.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECEFF1',
  },
  content: {
    padding: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moduleCard: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(57, 73, 171, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  moduleLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    color: '#0D1B2A',
  },
});
