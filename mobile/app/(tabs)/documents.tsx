import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity,
  Linking,
  Alert
} from 'react-native';
import { apiClient } from '@/services/api';
import { AppColors, BorderRadius, Spacing, Typography, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Document {
  id: string;
  title: string;
  description: string | null;
  category: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await apiClient.get<Document[]>('/api/documents');
      setDocuments(response.data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDocuments();
  };

  const handleOpenDocument = async (doc: Document) => {
    try {
      const supported = await Linking.canOpenURL(doc.fileUrl);
      if (supported) {
        await Linking.openURL(doc.fileUrl);
      } else {
        Alert.alert('Greška', 'Nije moguće otvoriti dokument.');
      }
    } catch (error) {
      Alert.alert('Greška', 'Nije moguće otvoriti dokument.');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('doc')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('video')) return '🎥';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const categories = [...new Set(documents.map(d => d.category))];
  const filteredDocuments = selectedCategory 
    ? documents.filter(d => d.category === selectedCategory)
    : documents;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {categories.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryBar}
          contentContainerStyle={styles.categoryContent}
        >
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>Sve</Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />}
      >
        {filteredDocuments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📁</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nema dokumenata</Text>
          </View>
        ) : (
          filteredDocuments.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={[styles.documentCard, { backgroundColor: colors.surface }]}
              onPress={() => handleOpenDocument(doc)}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.fileIcon}>{getFileIcon(doc.fileType)}</Text>
              </View>
              <View style={styles.documentInfo}>
                <Text style={[styles.documentTitle, { color: colors.text }]}>{doc.title}</Text>
                {doc.description && (
                  <Text style={[styles.documentDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                    {doc.description}
                  </Text>
                )}
                <View style={styles.documentMeta}>
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {formatFileSize(doc.fileSize)}
                  </Text>
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {new Date(doc.createdAt).toLocaleDateString('bs-BA')}
                  </Text>
                </View>
              </View>
              <View style={styles.downloadIcon}>
                <Text style={{ color: AppColors.secondary, fontSize: 20 }}>⬇️</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  categoryBar: { maxHeight: 50, backgroundColor: '#fff' },
  categoryContent: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm },
  categoryChip: { 
    paddingHorizontal: Spacing.md, 
    paddingVertical: Spacing.sm, 
    borderRadius: BorderRadius.full, 
    backgroundColor: AppColors.background, 
    marginRight: Spacing.sm 
  },
  categoryChipActive: { backgroundColor: AppColors.primary },
  categoryText: { ...Typography.bodySmall, color: AppColors.textSecondary },
  categoryTextActive: { color: '#fff', fontWeight: '600' },
  content: { padding: Spacing.md },
  documentCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: BorderRadius.lg, 
    padding: Spacing.md, 
    marginBottom: Spacing.md, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2 
  },
  iconContainer: { 
    width: 50, 
    height: 50, 
    borderRadius: BorderRadius.md, 
    backgroundColor: AppColors.background, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: Spacing.md 
  },
  fileIcon: { fontSize: 28 },
  documentInfo: { flex: 1 },
  documentTitle: { ...Typography.body, fontWeight: '600', marginBottom: Spacing.xs },
  documentDesc: { ...Typography.bodySmall, marginBottom: Spacing.xs },
  documentMeta: { flexDirection: 'row', gap: Spacing.md },
  metaText: { ...Typography.caption },
  downloadIcon: { padding: Spacing.sm },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl * 2 },
  emptyIcon: { fontSize: 60, marginBottom: Spacing.md },
  emptyText: { ...Typography.body },
});
