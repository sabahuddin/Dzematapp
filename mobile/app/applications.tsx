import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';

interface ApplicationType {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface Application {
  id: string;
  type: string;
  status: string;
  notes?: string;
  createdAt: string;
}

const applicationTypes: ApplicationType[] = [
  { id: 'akika', name: 'Akika', description: 'Prijava za akiku za novorođenče', icon: 'heart', color: '#EC407A' },
  { id: 'vjencanje', name: 'Vjenčanje', description: 'Prijava za vjenčanje u džamiji', icon: 'heart', color: '#EF5350' },
  { id: 'tevhid', name: 'Tevhid', description: 'Prijava za tevhid', icon: 'flower', color: '#9C27B0' },
  { id: 'dzenaza', name: 'Dženaza', description: 'Prijava za dženazu', icon: 'leaf', color: '#607D8B' },
];

export default function ApplicationsScreen() {
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState<ApplicationType | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const data = await apiClient.get<Application[]>('/api/applications/my');
      setMyApplications(data || []);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectType = (type: ApplicationType) => {
    setSelectedType(type);
    setNotes('');
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!selectedType) return;
    
    setSubmitting(true);
    try {
      await apiClient.post('/api/applications', {
        type: selectedType.id,
        notes: notes.trim(),
      });
      setShowForm(false);
      setSelectedType(null);
      setNotes('');
      Alert.alert('Uspješno', 'Vaša prijava je poslana. Administracija će vas kontaktirati.');
      loadData();
    } catch (error) {
      Alert.alert('Greška', 'Nije moguće poslati prijavu. Pokušajte ponovo.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending': return 'Na čekanju';
      case 'approved': return 'Odobreno';
      case 'rejected': return 'Odbijeno';
      case 'completed': return 'Završeno';
      default: return status;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return AppColors.warning;
      case 'approved': return AppColors.success;
      case 'rejected': return AppColors.error;
      case 'completed': return AppColors.primary;
      default: return AppColors.textSecondary;
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Prijave', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Prijave', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Prijave za usluge</Text>
        <Text style={styles.subtitle}>Odaberite vrstu prijave koju želite podnijeti</Text>
        
        {applicationTypes.map(type => (
          <TouchableOpacity key={type.id} style={styles.card} onPress={() => handleSelectType(type)}>
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

        {myApplications.length > 0 && (
          <>
            <Text style={[styles.title, { marginTop: Spacing.xl }]}>Moje prijave</Text>
            {myApplications.map(app => {
              const type = applicationTypes.find(t => t.id === app.type);
              return (
                <View key={app.id} style={styles.applicationCard}>
                  <View style={styles.applicationHeader}>
                    <Text style={styles.applicationType}>{type?.name || app.type}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(app.status)}20` }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(app.status) }]}>
                        {getStatusLabel(app.status)}
                      </Text>
                    </View>
                  </View>
                  {app.notes && <Text style={styles.applicationNotes}>{app.notes}</Text>}
                  <Text style={styles.applicationDate}>
                    Podneseno: {new Date(app.createdAt).toLocaleDateString('bs-BA')}
                  </Text>
                </View>
              );
            })}
          </>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color={AppColors.secondary} />
          <Text style={styles.infoText}>
            Za sve prijave kontaktirajte džemat putem poruka ili telefona za dodatne informacije i dogovor termina.
          </Text>
        </View>
      </ScrollView>

      <Modal visible={showForm} animationType="slide" onRequestClose={() => setShowForm(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Ionicons name="close" size={28} color={AppColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedType?.name}</Text>
            <TouchableOpacity onPress={handleSubmit} disabled={submitting}>
              <Text style={[styles.submitButton, submitting && { opacity: 0.5 }]}>
                {submitting ? 'Šaljem...' : 'Pošalji'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Dodatne napomene (opcionalno)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Unesite dodatne informacije, datum, vrijeme..."
              placeholderTextColor={AppColors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: Spacing.md },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: AppColors.background },
  title: { fontSize: Typography.fontSize.xxl, fontWeight: Typography.fontWeight.bold, color: AppColors.textPrimary, marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.fontSize.md, color: AppColors.textSecondary, marginBottom: Spacing.lg },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.card },
  iconContainer: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: AppColors.textPrimary },
  cardDescription: { fontSize: Typography.fontSize.sm, color: AppColors.textSecondary, marginTop: 2 },
  applicationCard: { backgroundColor: AppColors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.card },
  applicationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  applicationType: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: AppColors.textPrimary },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  statusText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.medium },
  applicationNotes: { fontSize: Typography.fontSize.sm, color: AppColors.textSecondary, marginBottom: Spacing.sm },
  applicationDate: { fontSize: Typography.fontSize.xs, color: AppColors.navInactive },
  infoCard: { flexDirection: 'row', backgroundColor: `${AppColors.secondary}10`, borderRadius: BorderRadius.lg, padding: Spacing.md, marginTop: Spacing.lg },
  infoText: { flex: 1, fontSize: Typography.fontSize.sm, color: AppColors.textSecondary, marginLeft: Spacing.sm, lineHeight: 20 },
  modalContainer: { flex: 1, backgroundColor: AppColors.white },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: AppColors.navBorder, paddingTop: 60 },
  modalTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: AppColors.textPrimary },
  submitButton: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: AppColors.secondary },
  modalContent: { flex: 1, padding: Spacing.lg },
  inputLabel: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.medium, color: AppColors.textPrimary, marginBottom: Spacing.sm },
  textArea: { backgroundColor: AppColors.inputBackground, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: Typography.fontSize.md, color: AppColors.textPrimary, minHeight: 150 },
});
