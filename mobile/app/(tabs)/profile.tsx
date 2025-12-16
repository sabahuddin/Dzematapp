import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { authService, User } from '@/services/auth';
import { apiClient } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppColors, BorderRadius, Spacing, Typography, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const USER_STORAGE_KEY = 'dzematapp_user';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userJson) {
        const userData = JSON.parse(userJson);
        setUser(userData);
        setEditForm({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phone: userData.phone || '',
          email: userData.email || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Potvrda', 'Jeste li sigurni da se želite odjaviti?', [
      { text: 'Otkaži', style: 'cancel' },
      {
        text: 'Odjava',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      await apiClient.put(`/api/users/${user.id}`, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone,
        email: editForm.email
      });
      
      const updatedUser = { ...user, ...editForm };
      setUser(updatedUser);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      
      setShowEditModal(false);
      Alert.alert('Uspješno', 'Profil je ažuriran.');
    } catch (error) {
      Alert.alert('Greška', 'Nije moguće ažurirati profil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Profile Header */}
      <View style={[styles.profileHeader, { backgroundColor: colors.surface }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.[0] || ''}{user?.lastName?.[0] || ''}
          </Text>
        </View>
        <Text style={[styles.name, { color: colors.text }]}>
          {user?.firstName} {user?.lastName}
        </Text>
        {user?.email && (
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text>
        )}
      </View>

      {/* Info Section */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Informacije</Text>
        
        <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Korisničko ime</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{user?.username}</Text>
        </View>
        
        {user?.phone && (
          <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Telefon</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{user.phone}</Text>
          </View>
        )}
        
        {user?.roles && user.roles.length > 0 && (
          <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Uloga</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {user.roles.includes('clan') ? 'Član' : user.roles.join(', ')}
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <TouchableOpacity 
        style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: AppColors.primary }]}
        onPress={() => setShowEditModal(true)}
      >
        <Text style={[styles.actionButtonText, { color: AppColors.primary }]}>Uredi profil</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Odjava</Text>
      </TouchableOpacity>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Uredi profil</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Ime</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              value={editForm.firstName}
              onChangeText={(text) => setEditForm({ ...editForm, firstName: text })}
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Prezime</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              value={editForm.lastName}
              onChangeText={(text) => setEditForm({ ...editForm, lastName: text })}
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Telefon</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              value={editForm.phone}
              onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
              keyboardType="phone-pad"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              value={editForm.email}
              onChangeText={(text) => setEditForm({ ...editForm, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={colors.textSecondary}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditModal(false)}>
                <Text style={styles.cancelBtnText}>Odustani</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveBtn, saving && styles.btnDisabled]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Spremi</Text>
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
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Spacing.md,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  name: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
  },
  email: {
    ...Typography.body,
  },
  section: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    ...Typography.h3,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
  infoLabel: {
    ...Typography.body,
  },
  infoValue: {
    ...Typography.body,
    fontWeight: '600',
  },
  actionButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 2,
  },
  actionButtonText: {
    ...Typography.button,
  },
  logoutButton: {
    backgroundColor: AppColors.error,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  logoutButtonText: {
    ...Typography.button,
    color: '#fff',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, paddingBottom: Spacing.xl * 2 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { ...Typography.h2 },
  closeButton: { fontSize: 24, color: AppColors.textSecondary, padding: Spacing.sm },
  inputLabel: { ...Typography.bodySmall, fontWeight: '600', marginBottom: Spacing.xs, marginTop: Spacing.sm },
  input: { borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: 16 },
  modalButtons: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  cancelBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: AppColors.border, alignItems: 'center' },
  cancelBtnText: { ...Typography.body, color: AppColors.textSecondary },
  saveBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: AppColors.secondary, alignItems: 'center' },
  saveBtnText: { ...Typography.button, color: '#fff' },
  btnDisabled: { opacity: 0.7 },
});
