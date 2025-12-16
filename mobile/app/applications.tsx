import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';

const applicationTypes = [
  { id: 'akika', name: 'Akika', description: 'Prijava za akiku za novorođenče', icon: 'heart' as const, color: '#EC407A' },
  { id: 'vjencanje', name: 'Vjenčanje', description: 'Prijava za vjenčanje u džamiji', icon: 'heart' as const, color: '#EF5350' },
  { id: 'tevhid', name: 'Tevhid', description: 'Prijava za tevhid', icon: 'flower' as const, color: '#9C27B0' },
  { id: 'dzenaza', name: 'Dženaza', description: 'Prijava za dženazu', icon: 'leaf' as const, color: '#607D8B' },
];

export default function ApplicationsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Prijave', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Prijave za usluge</Text>
        <Text style={styles.subtitle}>Odaberite vrstu prijave koju želite podnijeti</Text>
        
        {applicationTypes.map(type => (
          <TouchableOpacity key={type.id} style={styles.card}>
            <View style={[styles.iconContainer, { backgroundColor: `${type.color}20` }]}>
              <Ionicons name={type.icon} size={28} color={type.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{type.name}</Text>
              <Text style={styles.cardDescription}>{type.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={AppColors.navInactive} />
          </TouchableOpacity>
        ))}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color={AppColors.secondary} />
          <Text style={styles.infoText}>
            Za sve prijave kontaktirajte džemat putem poruka ili telefona za dodatne informacije i dogovor termina.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: Spacing.md },
  title: { fontSize: Typography.fontSize.xxl, fontWeight: Typography.fontWeight.bold, color: AppColors.textPrimary, marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.fontSize.md, color: AppColors.textSecondary, marginBottom: Spacing.lg },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.card },
  iconContainer: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: AppColors.textPrimary },
  cardDescription: { fontSize: Typography.fontSize.sm, color: AppColors.textSecondary, marginTop: 2 },
  infoCard: { flexDirection: 'row', backgroundColor: `${AppColors.secondary}10`, borderRadius: BorderRadius.lg, padding: Spacing.md, marginTop: Spacing.lg },
  infoText: { flex: 1, fontSize: Typography.fontSize.sm, color: AppColors.textSecondary, marginLeft: Spacing.sm, lineHeight: 20 },
});
