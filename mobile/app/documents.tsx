import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';

interface Document {
  id: string;
  name: string;
  category: string;
  fileType: string;
  filePath: string;
  createdAt: string;
}

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await apiClient.get<Document[]>('/api/documents');
      setDocuments(data || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
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

  const getFileIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    if (type.includes('pdf')) return 'document-text';
    if (type.includes('image')) return 'image';
    if (type.includes('word') || type.includes('doc')) return 'document';
    if (type.includes('excel') || type.includes('sheet')) return 'grid';
    return 'document-attach';
  };

  const handleOpenDocument = (doc: Document) => {
    if (doc.filePath) {
      Linking.openURL(`https://app.dzematapp.com${doc.filePath}`);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Dokumenti', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Dokumenti', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />}
      >
        {documents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={AppColors.navInactive} />
            <Text style={styles.emptyText}>Nema dokumenata</Text>
          </View>
        ) : (
          documents.map(doc => (
            <TouchableOpacity key={doc.id} style={styles.card} onPress={() => handleOpenDocument(doc)}>
              <View style={styles.cardIcon}>
                <Ionicons name={getFileIcon(doc.fileType)} size={24} color={AppColors.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{doc.name}</Text>
                {doc.category && <Text style={styles.cardCategory}>{doc.category}</Text>}
              </View>
              <Ionicons name="download-outline" size={22} color={AppColors.secondary} />
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
  cardIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, backgroundColor: `${AppColors.primary}15`, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.medium, color: AppColors.textPrimary },
  cardCategory: { fontSize: Typography.fontSize.sm, color: AppColors.textSecondary, marginTop: 2 },
});
