import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';

interface ModuleItem {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
}

const modules: ModuleItem[] = [
  { id: 'profile', name: 'Profil', icon: 'person-circle', route: '/(tabs)/profile', color: '#3949AB' },
  { id: 'sections', name: 'Sekcije', icon: 'people', route: '/sections', color: '#5C6BC0' },
  { id: 'shop', name: 'Shop', icon: 'cart', route: '/shop', color: '#1E88E5' },
  { id: 'vaktija', name: 'Vaktija', icon: 'moon', route: '/vaktija', color: '#26A69A' },
  { id: 'documents', name: 'Dokumenti', icon: 'document-text', route: '/documents', color: '#9C27B0' },
  { id: 'imam-qa', name: 'Pitaj imama', icon: 'help-circle', route: '/imam-qa', color: '#FF7043' },
  { id: 'membership', name: 'Članarina', icon: 'wallet', route: '/membership', color: '#5C6BC0' },
  { id: 'badges', name: 'Značke', icon: 'ribbon', route: '/badges', color: '#FFA726' },
  { id: 'certificates', name: 'Zahvale', icon: 'medal', route: '/certificates', color: '#EC407A' },
  { id: 'activities', name: 'Aktivnosti', icon: 'pulse', route: '/activities', color: '#26C6DA' },
  { id: 'livestream', name: 'Livestream', icon: 'videocam', route: '/livestream', color: '#EF5350' },
  { id: 'feed', name: 'Feed', icon: 'newspaper', route: '/feed', color: '#66BB6A' },
  { id: 'sponsors', name: 'Sponzori', icon: 'business', route: '/sponsors', color: '#8D6E63' },
  { id: 'notifications', name: 'Obavještenja', icon: 'notifications', route: '/notifications', color: '#7E57C2' },
  { id: 'applications', name: 'Prijave', icon: 'create', route: '/applications', color: '#42A5F5' },
  { id: 'projects', name: 'Projekti', icon: 'briefcase', route: '/projects', color: '#78909C' },
  { id: 'guide', name: 'Vodič', icon: 'book', route: '/guide', color: '#4DB6AC' },
];

export default function ModulesScreen() {
  const handleModulePress = (module: ModuleItem) => {
    router.push(module.route as any);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Moduli</Text>
      <Text style={styles.subtitle}>Pristupite svim funkcionalnostima aplikacije</Text>
      
      <View style={styles.grid}>
        {modules.map(module => (
          <TouchableOpacity
            key={module.id}
            style={styles.moduleCard}
            onPress={() => handleModulePress(module)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${module.color}20` }]}>
              <Ionicons name={module.icon} size={28} color={module.color} />
            </View>
            <Text style={styles.moduleName}>{module.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: AppColors.textSecondary,
    marginBottom: Spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moduleCard: {
    width: '31%',
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
    ...Shadows.card,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  moduleName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: AppColors.textPrimary,
    textAlign: 'center',
  },
});
