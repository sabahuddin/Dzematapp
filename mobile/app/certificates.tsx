import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';

interface Certificate {
  id: string;
  title: string;
  issuedAt: string;
  pdfPath?: string;
}

export default function CertificatesScreen() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await apiClient.get<Certificate[]>('/api/issued-certificates/my');
      setCertificates(data || []);
    } catch (error) {
      console.error('Failed to load certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDownload = (cert: Certificate) => {
    if (cert.pdfPath) {
      Linking.openURL(`https://app.dzematapp.com${cert.pdfPath}`);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Moje zahvale', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Moje zahvale', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />}
      >
        {certificates.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="medal-outline" size={64} color={AppColors.navInactive} />
            <Text style={styles.emptyText}>Nemate zahvalnica</Text>
          </View>
        ) : (
          certificates.map(cert => (
            <TouchableOpacity key={cert.id} style={styles.card} onPress={() => handleDownload(cert)}>
              <View style={styles.cardIcon}>
                <Ionicons name="medal" size={28} color="#EC407A" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{cert.title}</Text>
                <Text style={styles.cardDate}>
                  Izdato: {new Date(cert.issuedAt).toLocaleDateString('bs-BA')}
                </Text>
              </View>
              <Ionicons name="download-outline" size={24} color={AppColors.secondary} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: Spacing.md },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: AppColors.background },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: Typography.fontSize.md, color: AppColors.textSecondary, marginTop: Spacing.md },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.card },
  cardIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#EC407A20', justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: AppColors.textPrimary },
  cardDate: { fontSize: Typography.fontSize.sm, color: AppColors.textSecondary, marginTop: Spacing.xs },
});
