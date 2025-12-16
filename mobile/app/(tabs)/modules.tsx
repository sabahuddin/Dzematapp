import React from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AppColors, BorderRadius, Spacing, Typography, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Member-focused modules (no admin modules)
const MODULES = [
  { id: 'vaktija', label: 'Vaktija', icon: '🕌', route: '/(tabs)/vaktija', color: AppColors.accent },
  { id: 'messages', label: 'Poruke', icon: '💬', route: '/(tabs)/messages', color: AppColors.info },
  { id: 'activities', label: 'Moje aktivnosti', icon: '⭐', route: '/(tabs)/activities', color: AppColors.primary },
  { id: 'membership', label: 'Članarina', icon: '💳', route: '/(tabs)/membership', color: AppColors.success },
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
            style={[styles.moduleCard, { backgroundColor: colors.surface, borderLeftColor: module.color }]}
            onPress={() => router.push(module.route as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.moduleIcon}>{module.icon}</Text>
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
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  moduleIcon: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  moduleLabel: {
    ...Typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
});
