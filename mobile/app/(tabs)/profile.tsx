import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../services/auth';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';

export default function ProfileScreen() {
  const { user, logout, clearTenant } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

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
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {user?.photoUrl ? (
            <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.username}>@{user?.username}</Text>
        {user?.registryNumber && (
          <View style={styles.memberBadge}>
            <Ionicons name="card" size={14} color={AppColors.primary} />
            <Text style={styles.memberNumber}>Članski broj: {user.registryNumber}</Text>
          </View>
        )}
      </View>

      {user?.totalPoints !== undefined && (
        <View style={styles.pointsCard}>
          <Ionicons name="star" size={32} color="#FFA726" />
          <View style={styles.pointsInfo}>
            <Text style={styles.pointsLabel}>Ukupno bodova</Text>
            <Text style={styles.pointsValue}>{user.totalPoints}</Text>
          </View>
        </View>
      )}

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
        <Text style={styles.sectionTitle}>Postavke</Text>
        <View style={styles.card}>
          <MenuItem
            icon="swap-horizontal"
            label="Promijeni organizaciju"
            onPress={handleChangeTenant}
          />
          <MenuItem
            icon="log-out"
            label="Odjava"
            onPress={handleLogout}
            isDestructive
            isLast
          />
        </View>
      </View>

      <Text style={styles.version}>DžematApp v1.0.0</Text>
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

function MenuItem({ 
  icon, 
  label, 
  onPress, 
  isDestructive = false,
  isLast = false 
}: { 
  icon: keyof typeof Ionicons.glyphMap; 
  label: string; 
  onPress: () => void;
  isDestructive?: boolean;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity 
      style={[styles.menuItem, !isLast && styles.menuItemBorder]} 
      onPress={onPress}
    >
      <Ionicons 
        name={icon} 
        size={22} 
        color={isDestructive ? AppColors.error : AppColors.textPrimary} 
        style={styles.menuIcon} 
      />
      <Text style={[styles.menuLabel, isDestructive && styles.menuLabelDestructive]}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={20} color={AppColors.navInactive} />
    </TouchableOpacity>
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
  header: {
    backgroundColor: AppColors.primary,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: AppColors.white,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AppColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.primary,
  },
  name: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.white,
    marginBottom: Spacing.xs,
  },
  username: {
    fontSize: Typography.fontSize.md,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.sm,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
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
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    marginHorizontal: Spacing.md,
    marginTop: -Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
  },
  pointsInfo: {
    marginLeft: Spacing.md,
  },
  pointsLabel: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.textSecondary,
  },
  pointsValue: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.textPrimary,
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
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: AppColors.navBorder,
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
});
