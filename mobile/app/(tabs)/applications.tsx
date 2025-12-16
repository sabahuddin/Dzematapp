import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import { apiClient } from '@/services/api';
import { AppColors, BorderRadius, Spacing, Typography, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type ApplicationType = 'akika' | 'marriage';

interface ApplicationForm {
  type: ApplicationType;
  childName?: string;
  childGender?: 'male' | 'female';
  childBirthDate?: string;
  parentName?: string;
  groomName?: string;
  brideName?: string;
  weddingDate?: string;
  contactPhone?: string;
  notes?: string;
}

const APPLICATION_TYPES: { id: ApplicationType; label: string; icon: IconName; description: string }[] = [
  { id: 'akika', label: 'Akika', icon: 'baby-carriage', description: 'Prijava za organizaciju akike za novorođenče' },
  { id: 'marriage', label: 'Vjenčanje', icon: 'heart-multiple-outline', description: 'Prijava za organizaciju vjenčanja' },
];

export default function ApplicationsScreen() {
  const [selectedType, setSelectedType] = useState<ApplicationType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ApplicationForm>({ type: 'akika' });
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleSelectType = (type: ApplicationType) => {
    setSelectedType(type);
    setForm({ type });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!selectedType) return;
    
    setSubmitting(true);
    try {
      let endpoint = '';
      let payload: any = {};
      
      if (selectedType === 'akika') {
        if (!form.childName || !form.parentName) {
          Alert.alert('Greška', 'Popunite obavezna polja');
          setSubmitting(false);
          return;
        }
        endpoint = '/api/akika-applications';
        payload = {
          childName: form.childName,
          childGender: form.childGender || 'male',
          childBirthDate: form.childBirthDate || new Date().toISOString(),
          parentName: form.parentName,
          contactPhone: form.contactPhone,
          notes: form.notes
        };
      } else if (selectedType === 'marriage') {
        if (!form.groomName || !form.brideName) {
          Alert.alert('Greška', 'Popunite obavezna polja');
          setSubmitting(false);
          return;
        }
        endpoint = '/api/marriage-applications';
        payload = {
          groomName: form.groomName,
          brideName: form.brideName,
          weddingDate: form.weddingDate || new Date().toISOString(),
          contactPhone: form.contactPhone,
          notes: form.notes
        };
      }
      
      await apiClient.post(endpoint, payload);
      Alert.alert('Uspješno', 'Vaša prijava je poslana. Kontaktirat ćemo vas uskoro.');
      setShowForm(false);
      setSelectedType(null);
      setForm({ type: 'akika' });
    } catch (error) {
      Alert.alert('Greška', 'Nije moguće poslati prijavu. Pokušajte ponovo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]}>Prijave</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Odaberite vrstu prijave koju želite podnijeti
      </Text>

      {APPLICATION_TYPES.map((appType) => (
        <TouchableOpacity
          key={appType.id}
          style={[styles.typeCard, { backgroundColor: colors.surface }]}
          onPress={() => handleSelectType(appType.id)}
        >
          <View style={styles.typeIconContainer}>
            <MaterialCommunityIcons name={appType.icon} size={32} color={AppColors.primary} />
          </View>
          <View style={styles.typeContent}>
            <Text style={[styles.typeLabel, { color: colors.text }]}>{appType.label}</Text>
            <Text style={[styles.typeDesc, { color: colors.textSecondary }]}>{appType.description}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={AppColors.secondary} />
        </TouchableOpacity>
      ))}

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedType === 'akika' ? 'Prijava za akiku' : 
                 selectedType === 'marriage' ? 'Prijava za vjenčanje' : 'Prijava za članstvo'}
              </Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll}>
              {selectedType === 'akika' && (
                <>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Ime djeteta *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                    placeholder="Unesite ime djeteta"
                    placeholderTextColor={colors.textSecondary}
                    value={form.childName}
                    onChangeText={(text) => setForm({ ...form, childName: text })}
                  />
                  
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Spol djeteta</Text>
                  <View style={styles.genderRow}>
                    <TouchableOpacity
                      style={[styles.genderOption, form.childGender === 'male' && styles.genderActive]}
                      onPress={() => setForm({ ...form, childGender: 'male' })}
                    >
                      <Text style={[styles.genderText, form.childGender === 'male' && styles.genderTextActive]}>Muško</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.genderOption, form.childGender === 'female' && styles.genderActive]}
                      onPress={() => setForm({ ...form, childGender: 'female' })}
                    >
                      <Text style={[styles.genderText, form.childGender === 'female' && styles.genderTextActive]}>Žensko</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Ime roditelja *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                    placeholder="Unesite ime roditelja"
                    placeholderTextColor={colors.textSecondary}
                    value={form.parentName}
                    onChangeText={(text) => setForm({ ...form, parentName: text })}
                  />
                </>
              )}

              {selectedType === 'marriage' && (
                <>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Ime mladoženje *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                    placeholder="Unesite ime mladoženje"
                    placeholderTextColor={colors.textSecondary}
                    value={form.groomName}
                    onChangeText={(text) => setForm({ ...form, groomName: text })}
                  />
                  
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Ime mlade *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                    placeholder="Unesite ime mlade"
                    placeholderTextColor={colors.textSecondary}
                    value={form.brideName}
                    onChangeText={(text) => setForm({ ...form, brideName: text })}
                  />
                </>
              )}

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Kontakt telefon</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Unesite broj telefona"
                placeholderTextColor={colors.textSecondary}
                value={form.contactPhone}
                onChangeText={(text) => setForm({ ...form, contactPhone: text })}
                keyboardType="phone-pad"
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Napomena</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Dodatne informacije..."
                placeholderTextColor={colors.textSecondary}
                value={form.notes}
                onChangeText={(text) => setForm({ ...form, notes: text })}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowForm(false)}>
                <Text style={styles.cancelButtonText}>Odustani</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Pošalji prijavu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.md },
  title: { ...Typography.h1, marginBottom: Spacing.xs },
  subtitle: { ...Typography.body, marginBottom: Spacing.lg },
  typeCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: BorderRadius.lg, 
    padding: Spacing.lg, 
    marginBottom: Spacing.md,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2 
  },
  typeIconContainer: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: 'rgba(57, 73, 171, 0.1)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: Spacing.md 
  },
  typeContent: { flex: 1 },
  typeLabel: { ...Typography.h3, marginBottom: Spacing.xs },
  typeDesc: { ...Typography.bodySmall },
  arrow: { fontSize: 24, color: AppColors.secondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { ...Typography.h2 },
  closeButton: { fontSize: 24, color: AppColors.textSecondary, padding: Spacing.sm },
  formScroll: { maxHeight: 400 },
  inputLabel: { ...Typography.bodySmall, fontWeight: '600', marginBottom: Spacing.xs, marginTop: Spacing.sm },
  input: { borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: 16 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  genderRow: { flexDirection: 'row', gap: Spacing.sm },
  genderOption: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: AppColors.border, alignItems: 'center' },
  genderActive: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  genderText: { ...Typography.body, color: AppColors.textSecondary },
  genderTextActive: { color: '#fff', fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg, paddingBottom: Spacing.lg },
  cancelButton: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: AppColors.border, alignItems: 'center' },
  cancelButtonText: { ...Typography.body, color: AppColors.textSecondary },
  submitButton: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: AppColors.secondary, alignItems: 'center' },
  submitButtonText: { ...Typography.button, color: '#fff' },
  buttonDisabled: { opacity: 0.7 },
});
