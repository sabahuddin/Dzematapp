import React from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AppColors, BorderRadius, Spacing, Typography, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Dodatni moduli</Text>
      <View style={styles.grid}>
        {MODULES.map((module) => (
          <TouchableOpacity
            key={module.id}
            style={[styles.moduleCard, { backgroundColor: colors.surface }]}
            onPress={() => router.push(module.route as any)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name={module.icon} size={32} color={AppColors.primary} />
            </View>
            <Text style={[styles.moduleLabel, { color: colors.text }]}>{module.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  moduleCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(57, 73, 171, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  moduleLabel: {
    ...Typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
});
