import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Switch,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../services/auth';
import { apiClient } from '../../services/api';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';

export default function ProfileScreen() {
  const { user, logout, clearTenant, updateUser } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    city: user?.city || '',
    streetAddress: user?.streetAddress || '',
    occupation: user?.occupation || '',
  });

  const handleLogout = () => {
    Alert.alert(
      'Odjava',
      'Jeste li sigurni da se želite odjaviti?',
      [
        { text: 'Odustani', style: 'cancel' },
        {
          text: 'Odjavi se',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleChangeTenant = () => {
    Alert.alert(
      'Promjena organizacije',
      'Ovo će vas odjaviti i vratiti na odabir organizacije.',
      [
        { text: 'Odustani', style: 'cancel' },
        {
          text: 'Nastavi',
          onPress: async () => {
            await logout();
            await clearTenant();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handlePickPhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Dozvola potrebna', 'Potrebna je dozvola za pristup fotografijama.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        setSaving(true);
        const formData = new FormData();
        formData.append('photo', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        } as any);
        
        await apiClient.post('/api/users/photo', formData);
        Alert.alert('Uspjeh', 'Fotografija je uspješno ažurirana.');
      } catch (error) {
        Alert.alert('Greška', 'Nije moguće učitati fotografiju.');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await apiClient.patch(`/api/users/${user?.id}`, editForm);
      if (updateUser) {
        updateUser({ ...user, ...editForm });
      }
      setEditModalVisible(false);
      Alert.alert('Uspjeh', 'Profil je uspješno ažuriran.');
    } catch (error) {
      Alert.alert('Greška', 'Nije moguće spremiti promjene.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (): string => {
    if (!user) return '?';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('bs-BA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileHeader}>
        <TouchableOpacity style={styles.avatarContainer} onPress={() => setEditModalVisible(true)}>
          {user?.photoUrl ? (
            <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
          )}
          <View style={styles.editBadge}>
            <Ionicons name="pencil" size={12} color={AppColors.white} />
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.username}>@{user?.username}</Text>
        {user?.registryNumber && (
          <View style={styles.memberBadge}>
            <Ionicons name="card" size={14} color={AppColors.primary} />
            <Text style={styles.memberNumber}>Članski broj: {user.registryNumber}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Osobni podaci</Text>
        <View style={styles.card}>
          <InfoRow icon="mail" label="Email" value={user?.email || '-'} />
          <InfoRow icon="call" label="Telefon" value={user?.phone || '-'} />
          <InfoRow icon="calendar" label="Datum rođenja" value={formatDate(user?.dateOfBirth)} />
          <InfoRow icon="person" label="Spol" value={user?.gender === 'male' ? 'Muški' : user?.gender === 'female' ? 'Ženski' : '-'} />
          <InfoRow icon="briefcase" label="Zanimanje" value={user?.occupation || '-'} />
          <InfoRow icon="location" label="Grad" value={user?.city || '-'} />
          <InfoRow icon="home" label="Adresa" value={user?.streetAddress || '-'} isLast />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Podešavanja</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.menuItem} onPress={() => setEditModalVisible(true)}>
            <Ionicons name="create-outline" size={22} color={AppColors.primary} style={styles.menuIcon} />
            <Text style={styles.menuLabel}>Uredi profil</Text>
            <Ionicons name="chevron-forward" size={20} color={AppColors.navInactive} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={handlePickPhoto}>
            <Ionicons name="camera-outline" size={22} color={AppColors.primary} style={styles.menuIcon} />
            <Text style={styles.menuLabel}>Promijeni fotografiju</Text>
            <Ionicons name="chevron-forward" size={20} color={AppColors.navInactive} />
          </TouchableOpacity>
          
          <View style={styles.menuItem}>
            <Ionicons name="moon-outline" size={22} color={AppColors.primary} style={styles.menuIcon} />
            <Text style={styles.menuLabel}>Tamna tema</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: AppColors.navInactive, true: AppColors.primary }}
              thumbColor={AppColors.white}
            />
          </View>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleChangeTenant}>
            <Ionicons name="swap-horizontal" size={22} color={AppColors.textPrimary} style={styles.menuIcon} />
            <Text style={styles.menuLabel}>Promijeni organizaciju</Text>
            <Ionicons name="chevron-forward" size={20} color={AppColors.navInactive} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={AppColors.error} style={styles.menuIcon} />
            <Text style={[styles.menuLabel, styles.menuLabelDestructive]}>Odjava</Text>
            <Ionicons name="chevron-forward" size={20} color={AppColors.navInactive} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.version}>DžematApp v1.0.0</Text>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text style={styles.modalCancel}>Odustani</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Uredi profil</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={AppColors.primary} />
              ) : (
                <Text style={styles.modalSave}>Spremi</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Ime</Text>
              <TextInput
                style={styles.input}
                value={editForm.firstName}
                onChangeText={(text) => setEditForm({ ...editForm, firstName: text })}
                placeholder="Unesite ime"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Prezime</Text>
              <TextInput
                style={styles.input}
                value={editForm.lastName}
                onChangeText={(text) => setEditForm({ ...editForm, lastName: text })}
                placeholder="Unesite prezime"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={editForm.email}
                onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                placeholder="Unesite email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Telefon</Text>
              <TextInput
                style={styles.input}
                value={editForm.phone}
                onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                placeholder="Unesite telefon"
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Grad</Text>
              <TextInput
                style={styles.input}
                value={editForm.city}
                onChangeText={(text) => setEditForm({ ...editForm, city: text })}
                placeholder="Unesite grad"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Adresa</Text>
              <TextInput
                style={styles.input}
                value={editForm.streetAddress}
                onChangeText={(text) => setEditForm({ ...editForm, streetAddress: text })}
                placeholder="Unesite adresu"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Zanimanje</Text>
              <TextInput
                style={styles.input}
                value={editForm.occupation}
                onChangeText={(text) => setEditForm({ ...editForm, occupation: text })}
                placeholder="Unesite zanimanje"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

function InfoRow({ 
  icon, 
  label, 
  value, 
  isLast = false 
}: { 
  icon: keyof typeof Ionicons.glyphMap; 
  label: string; 
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <Ionicons name={icon} size={20} color={AppColors.primary} style={styles.infoIcon} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    paddingBottom: Spacing.xxl,
  },
  profileHeader: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    backgroundColor: AppColors.background,
  },
  avatarContainer: {
    marginBottom: Spacing.md,
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: AppColors.primary,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: `${AppColors.primary}50`,
  },
  avatarText: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.white,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: AppColors.secondary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: AppColors.background,
  },
  name: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  username: {
    fontSize: Typography.fontSize.md,
    color: AppColors.textSecondary,
    marginBottom: Spacing.sm,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${AppColors.primary}15`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  memberNumber: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.primary,
    marginLeft: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.textSecondary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: AppColors.navBorder,
  },
  infoIcon: {
    marginRight: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Typography.fontSize.xs,
    color: AppColors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: Typography.fontSize.md,
    color: AppColors.textPrimary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.navBorder,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    marginRight: Spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: AppColors.textPrimary,
  },
  menuLabelDestructive: {
    color: AppColors.error,
  },
  version: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.navInactive,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.navBorder,
  },
  modalCancel: {
    fontSize: Typography.fontSize.md,
    color: AppColors.textSecondary,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.textPrimary,
  },
  modalSave: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.primary,
  },
  modalContent: {
    padding: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: AppColors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: AppColors.textPrimary,
    borderWidth: 1,
    borderColor: AppColors.navBorder,
  },
});
