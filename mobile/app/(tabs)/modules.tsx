import React from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const MODULES = [
  { id: 'announcements', label: 'Obavijesti', icon: '📢' },
  { id: 'events', label: 'Događaji', icon: '📅' },
  { id: 'tasks', label: 'Zadaci', icon: '✓' },
  { id: 'members', label: 'Članovi', icon: '👥' },
  { id: 'shop', label: 'Trgovina', icon: '🛍️' },
  { id: 'finance', label: 'Finansije', icon: '💰' },
];

export default function ModulesScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Moduli</Text>
      <View style={styles.grid}>
        {MODULES.map((module) => (
          <TouchableOpacity
            key={module.id}
            style={styles.moduleCard}
            onPress={() => {
              // Navigate to module
            }}
          >
            <Text style={styles.moduleIcon}>{module.icon}</Text>
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
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moduleCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  moduleIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  moduleLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
});
