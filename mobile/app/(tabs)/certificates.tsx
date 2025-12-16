import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity,
  Image,
  Modal,
  Linking,
  Alert
} from 'react-native';
import { apiClient } from '@/services/api';
import { AppColors, BorderRadius, Spacing, Typography, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Certificate {
  id: string;
  recipientName: string;
  certificateType: string;
  reason: string;
  issuedAt: string;
  certificateImagePath: string;
  viewed: boolean;
}

export default function CertificatesScreen() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      const response = await apiClient.get<Certificate[]>('/api/certificates/user');
      setCertificates(response.data || []);
    } catch (error) {
      console.error('Error loading certificates:', error);
      setCertificates([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCertificates();
  };

  const handleViewCertificate = (cert: Certificate) => {
    setSelectedCertificate(cert);
  };

  const handleDownload = async (cert: Certificate) => {
    try {
      const supported = await Linking.canOpenURL(cert.certificateImagePath);
      if (supported) {
        await Linking.openURL(cert.certificateImagePath);
      } else {
        Alert.alert('Greška', 'Nije moguće preuzeti certifikat.');
      }
    } catch (error) {
      Alert.alert('Greška', 'Nije moguće preuzeti certifikat.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />}
      >
        {certificates.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎖️</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Nemate primljenih zahvalnica
            </Text>
          </View>
        ) : (
          certificates.map((cert) => (
            <TouchableOpacity
              key={cert.id}
              style={[
                styles.certCard, 
                { backgroundColor: colors.surface },
                !cert.viewed && styles.unviewedCard
              ]}
              onPress={() => handleViewCertificate(cert)}
            >
              {cert.certificateImagePath && (
                <Image 
                  source={{ uri: cert.certificateImagePath }} 
                  style={styles.certImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.certContent}>
                <Text style={[styles.certType, { color: colors.text }]}>{cert.certificateType}</Text>
                <Text style={[styles.certRecipient, { color: colors.textSecondary }]}>
                  {cert.recipientName}
                </Text>
                <Text style={[styles.certReason, { color: colors.textSecondary }]} numberOfLines={2}>
                  {cert.reason}
                </Text>
                <Text style={[styles.certDate, { color: colors.textSecondary }]}>
                  {new Date(cert.issuedAt).toLocaleDateString('bs-BA')}
                </Text>
              </View>
              {!cert.viewed && <View style={styles.newBadge}><Text style={styles.newBadgeText}>Novo</Text></View>}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={!!selectedCertificate} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedCertificate(null)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            
            {selectedCertificate?.certificateImagePath && (
              <Image 
                source={{ uri: selectedCertificate.certificateImagePath }} 
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}
            
            <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedCertificate?.certificateType}</Text>
            <Text style={[styles.modalRecipient, { color: colors.textSecondary }]}>{selectedCertificate?.recipientName}</Text>
            <Text style={[styles.modalReason, { color: colors.textSecondary }]}>{selectedCertificate?.reason}</Text>
            
            <TouchableOpacity 
              style={styles.downloadButton}
              onPress={() => selectedCertificate && handleDownload(selectedCertificate)}
            >
              <Text style={styles.downloadButtonText}>⬇️ Preuzmi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.md },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl * 2 },
  emptyIcon: { fontSize: 60, marginBottom: Spacing.md },
  emptyText: { ...Typography.body },
  certCard: { 
    borderRadius: BorderRadius.lg, 
    marginBottom: Spacing.md, 
    overflow: 'hidden',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2 
  },
  unviewedCard: { borderWidth: 2, borderColor: AppColors.primary },
  certImage: { width: '100%', height: 150 },
  certContent: { padding: Spacing.md },
  certType: { ...Typography.h3, marginBottom: Spacing.xs },
  certRecipient: { ...Typography.body, fontWeight: '600', marginBottom: Spacing.xs },
  certReason: { ...Typography.bodySmall, marginBottom: Spacing.sm },
  certDate: { ...Typography.caption },
  newBadge: { position: 'absolute', top: Spacing.sm, right: Spacing.sm, backgroundColor: AppColors.primary, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  newBadgeText: { ...Typography.caption, color: '#fff', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  modalContent: { borderRadius: BorderRadius.xl, padding: Spacing.lg, width: '100%', maxWidth: 400, alignItems: 'center' },
  closeButton: { position: 'absolute', top: Spacing.md, right: Spacing.md, zIndex: 1 },
  closeButtonText: { fontSize: 24, color: AppColors.textSecondary },
  modalImage: { width: '100%', height: 250, marginBottom: Spacing.md, borderRadius: BorderRadius.md },
  modalTitle: { ...Typography.h2, marginBottom: Spacing.xs, textAlign: 'center' },
  modalRecipient: { ...Typography.body, fontWeight: '600', marginBottom: Spacing.sm, textAlign: 'center' },
  modalReason: { ...Typography.body, textAlign: 'center', marginBottom: Spacing.lg },
  downloadButton: { backgroundColor: AppColors.secondary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.md },
  downloadButtonText: { ...Typography.button, color: '#fff' },
});
