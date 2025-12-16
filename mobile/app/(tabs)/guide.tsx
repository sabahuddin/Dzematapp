import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { AppColors, BorderRadius, Spacing, Typography, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface GuideSection {
  id: string;
  title: string;
  icon: IconName;
  content: string[];
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'getting-started',
    title: 'Početak korištenja',
    icon: 'rocket-launch-outline',
    content: [
      'Dobrodošli u DžematApp - vašu mobilnu aplikaciju za praćenje aktivnosti džemata.',
      'Prijavite se koristeći svoj korisnički račun koji ste dobili od administratora.',
      'Nakon prijave, na početnom ekranu možete vidjeti najnovije informacije i vaktiju.',
    ],
  },
  {
    id: 'announcements',
    title: 'Objave',
    icon: 'bullhorn-outline',
    content: [
      'Na ekranu Objave možete pratiti sve novosti i obavještenja vašeg džemata.',
      'Prikvačene objave su označene ikonom i uvijek se prikazuju na vrhu.',
      'Koristite pretragu za brzo pronalaženje objava.',
    ],
  },
  {
    id: 'events',
    title: 'Događaji',
    icon: 'calendar-outline',
    content: [
      'Pratite nadolazeće događaje i aktivnosti džemata.',
      'Prijavite se na događaje pomoću RSVP dugmeta.',
      'Za prisustvo na događajima možete osvojiti bodove.',
    ],
  },
  {
    id: 'membership',
    title: 'Članarina',
    icon: 'credit-card-outline',
    content: [
      'Pratite status vaše članarine na ekranu Članarina.',
      'Zelena boja označava plaćene mjesece, crvena neplaćene.',
      'Za pitanja o članarini kontaktirajte administratora.',
    ],
  },
  {
    id: 'sections',
    title: 'Sekcije i zadaci',
    icon: 'clipboard-list-outline',
    content: [
      'Sekcije su radne grupe u okviru džemata.',
      'Ako ste član neke sekcije, možete vidjeti dodijeljene zadatke.',
      'Komentarišite zadatke za koordinaciju s drugim članovima.',
    ],
  },
  {
    id: 'shop',
    title: 'Shop i Marketplace',
    icon: 'cart-outline',
    content: [
      'DžematShop nudi proizvode koje džemat prodaje.',
      'Marketplace omogućava članovima da prodaju ili poklone stvari.',
      'Za kupovinu pošaljite zahtjev, administrator će vas kontaktirati.',
    ],
  },
  {
    id: 'badges',
    title: 'Značke i bodovi',
    icon: 'medal-outline',
    content: [
      'Bodove osvajate kroz aktivnosti u džematu.',
      'Prisustvo na događajima, ispunjavanje zadataka i doprinosi donose bodove.',
      'Kad skupite dovoljno bodova, osvajate značke.',
    ],
  },
  {
    id: 'imam-qa',
    title: 'Pitaj imama',
    icon: 'account-question-outline',
    content: [
      'Postavite pitanja imamu putem aplikacije.',
      'Pitanja možete postaviti anonimno.',
      'Odgovore ćete dobiti direktno u aplikaciji.',
    ],
  },
  {
    id: 'profile',
    title: 'Profil',
    icon: 'account-outline',
    content: [
      'Uredite svoje podatke na ekranu Profil.',
      'Možete promijeniti ime, prezime, telefon i email.',
      'Za promjenu lozinke kontaktirajte administratora.',
    ],
  },
];

export default function GuideScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.headerCard, { backgroundColor: AppColors.primary }]}>
        <MaterialCommunityIcons name="book-open-page-variant-outline" size={48} color="#fff" style={{ marginBottom: Spacing.sm }} />
        <Text style={styles.headerTitle}>Vodič za korištenje</Text>
        <Text style={styles.headerSubtitle}>Naučite kako koristiti DžematApp</Text>
      </View>

      {GUIDE_SECTIONS.map((section) => (
        <TouchableOpacity
          key={section.id}
          style={[styles.sectionCard, { backgroundColor: colors.surface }]}
          onPress={() => setExpandedId(expandedId === section.id ? null : section.id)}
          activeOpacity={0.8}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <MaterialCommunityIcons name={section.icon} size={24} color={AppColors.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            <MaterialCommunityIcons 
              name={expandedId === section.id ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={colors.textSecondary} 
            />
          </View>
          
          {expandedId === section.id && (
            <View style={styles.sectionContent}>
              {section.content.map((paragraph, index) => (
                <Text key={index} style={[styles.paragraph, { color: colors.textSecondary }]}>
                  • {paragraph}
                </Text>
              ))}
            </View>
          )}
        </TouchableOpacity>
      ))}

      <View style={[styles.contactCard, { backgroundColor: colors.surface }]}>
        <MaterialCommunityIcons name="help-circle-outline" size={32} color={AppColors.secondary} style={{ marginBottom: Spacing.sm }} />
        <Text style={[styles.contactTitle, { color: colors.text }]}>Trebate pomoć?</Text>
        <Text style={[styles.contactText, { color: colors.textSecondary }]}>
          Za dodatna pitanja ili tehničku podršku, kontaktirajte administratora vašeg džemata.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: Spacing.xl * 2 },
  headerCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerIcon: { marginBottom: Spacing.sm },
  headerTitle: { ...Typography.h2, color: '#fff', marginBottom: Spacing.xs },
  headerSubtitle: { ...Typography.body, color: 'rgba(255,255,255,0.8)' },
  sectionCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center' },
  sectionIconContainer: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(57, 73, 171, 0.1)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: Spacing.sm 
  },
  sectionTitle: { ...Typography.body, fontWeight: '600', flex: 1 },
  expandIcon: { fontSize: 12 },
  sectionContent: { marginTop: Spacing.md, paddingLeft: Spacing.md },
  paragraph: { ...Typography.body, marginBottom: Spacing.sm, lineHeight: 22 },
  contactCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  contactIcon: { marginBottom: Spacing.sm },
  contactTitle: { ...Typography.h3, marginBottom: Spacing.xs },
  contactText: { ...Typography.body, textAlign: 'center' },
});
