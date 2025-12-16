import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';

const guideItems = [
  { id: '1', title: 'Prijava u aplikaciju', content: 'Unesite kod organizacije koji ste dobili od vašeg džemata, zatim korisničko ime i lozinku.', icon: 'log-in' as const },
  { id: '2', title: 'Početna stranica', content: 'Na početnoj stranici vidite vaktiju, statistiku zajednice i svoje bodove.', icon: 'home' as const },
  { id: '3', title: 'Objave', content: 'Pratite najnovije vijesti i obavještenja vaše zajednice.', icon: 'megaphone' as const },
  { id: '4', title: 'Događaji', content: 'Pregledajte nadolazeće događaje i prijavite se za sudjelovanje.', icon: 'calendar' as const },
  { id: '5', title: 'Poruke', content: 'Komunicirajte s članovima zajednice i administracijom.', icon: 'chatbubbles' as const },
  { id: '6', title: 'Članarina', content: 'Pregledajte status vaše članarine i historiju plaćanja.', icon: 'wallet' as const },
  { id: '7', title: 'Bodovi i značke', content: 'Osvojite bodove sudjelovanjem u aktivnostima i sakupljajte značke.', icon: 'ribbon' as const },
  { id: '8', title: 'Pitaj imama', content: 'Postavite pitanje imamu i dobijte odgovor.', icon: 'help-circle' as const },
];

export default function GuideScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Vodič', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Dobrodošli u DžematApp</Text>
        <Text style={styles.subtitle}>Evo kratkog vodiča kako koristiti aplikaciju</Text>

        {guideItems.map((item, index) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>{index + 1}</Text>
              </View>
              <View style={styles.iconContainer}>
                <Ionicons name={item.icon} size={24} color={AppColors.primary} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
            </View>
            <Text style={styles.cardContent}>{item.content}</Text>
          </View>
        ))}

        <View style={styles.helpCard}>
          <Ionicons name="headset" size={32} color={AppColors.secondary} />
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>Trebate pomoć?</Text>
            <Text style={styles.helpText}>Kontaktirajte vašu džematsku administraciju putem poruka unutar aplikacije.</Text>
          </View>
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
  card: { backgroundColor: AppColors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.card },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  numberBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: AppColors.primary, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm },
  numberText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold, color: AppColors.white },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: `${AppColors.primary}15`, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm },
  cardTitle: { flex: 1, fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: AppColors.textPrimary },
  cardContent: { fontSize: Typography.fontSize.md, color: AppColors.textSecondary, lineHeight: 22, marginLeft: 64 },
  helpCard: { flexDirection: 'row', backgroundColor: `${AppColors.secondary}10`, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginTop: Spacing.lg },
  helpContent: { flex: 1, marginLeft: Spacing.md },
  helpTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: AppColors.textPrimary },
  helpText: { fontSize: Typography.fontSize.sm, color: AppColors.textSecondary, marginTop: Spacing.xs, lineHeight: 20 },
});
