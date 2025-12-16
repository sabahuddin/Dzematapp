import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Modal, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/api';
import { useAuth } from '../services/auth';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';

interface Question {
  id: string;
  question: string;
  answer?: string;
  isPublic: boolean;
  isArchived: boolean;
  createdAt: string;
  answeredAt?: string;
}

export default function ImamQAScreen() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAskModal, setShowAskModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const data = await apiClient.get<Question[]>('/api/imam-questions');
      setQuestions(data || []);
    } catch (error) {
      console.error('Failed to load questions:', error);
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

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim()) {
      Alert.alert('Greška', 'Unesite pitanje');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/api/imam-questions', { question: newQuestion.trim() });
      setNewQuestion('');
      setShowAskModal(false);
      Alert.alert('Uspješno', 'Vaše pitanje je poslano imamu');
      loadData();
    } catch (error) {
      Alert.alert('Greška', 'Nije moguće poslati pitanje');
    } finally {
      setSubmitting(false);
    }
  };

  const answeredQuestions = questions.filter(q => q.answer && q.isPublic);
  const myQuestions = questions.filter(q => !q.isPublic);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Pitaj imama', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Pitaj imama', headerStyle: { backgroundColor: AppColors.primary }, headerTintColor: AppColors.white }} />
      <View style={styles.container}>
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />}
        >
          {myQuestions.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Moja pitanja</Text>
              {myQuestions.map(q => (
                <View key={q.id} style={styles.questionCard}>
                  <Text style={styles.questionText}>{q.question}</Text>
                  {q.answer ? (
                    <View style={styles.answerBox}>
                      <Text style={styles.answerLabel}>Odgovor:</Text>
                      <Text style={styles.answerText}>{q.answer}</Text>
                    </View>
                  ) : (
                    <View style={styles.pendingBadge}>
                      <Ionicons name="time-outline" size={14} color={AppColors.warning} />
                      <Text style={styles.pendingText}>Čeka odgovor</Text>
                    </View>
                  )}
                </View>
              ))}
            </>
          )}

          {answeredQuestions.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Arhiva pitanja i odgovora</Text>
              {answeredQuestions.map(q => (
                <View key={q.id} style={styles.questionCard}>
                  <Text style={styles.questionText}>{q.question}</Text>
                  <View style={styles.answerBox}>
                    <Text style={styles.answerText}>{q.answer}</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {questions.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="help-circle-outline" size={64} color={AppColors.navInactive} />
              <Text style={styles.emptyText}>Nema pitanja</Text>
              <Text style={styles.emptySubtext}>Postavite svoje pitanje imamu</Text>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity style={styles.fab} onPress={() => setShowAskModal(true)}>
          <Ionicons name="add" size={28} color={AppColors.white} />
        </TouchableOpacity>

        <Modal visible={showAskModal} animationType="slide" onRequestClose={() => setShowAskModal(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAskModal(false)}>
                <Ionicons name="close" size={28} color={AppColors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Novo pitanje</Text>
              <TouchableOpacity onPress={handleSubmitQuestion} disabled={submitting}>
                <Text style={[styles.sendButton, submitting && { opacity: 0.5 }]}>Pošalji</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <TextInput
                style={styles.questionInput}
                placeholder="Napišite vaše pitanje..."
                placeholderTextColor={AppColors.textSecondary}
                value={newQuestion}
                onChangeText={setNewQuestion}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: AppColors.background },
  list: { flex: 1 },
  listContent: { padding: Spacing.md, paddingBottom: 100 },
  sectionTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: AppColors.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.md },
  questionCard: { backgroundColor: AppColors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.card },
  questionText: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.medium, color: AppColors.textPrimary, marginBottom: Spacing.sm },
  answerBox: { backgroundColor: `${AppColors.accent}10`, borderRadius: BorderRadius.md, padding: Spacing.md, marginTop: Spacing.sm },
  answerLabel: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: AppColors.accent, marginBottom: Spacing.xs },
  answerText: { fontSize: Typography.fontSize.md, color: AppColors.textPrimary, lineHeight: 22 },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm },
  pendingText: { fontSize: Typography.fontSize.sm, color: AppColors.warning, marginLeft: Spacing.xs },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: Typography.fontSize.md, color: AppColors.textSecondary, marginTop: Spacing.md },
  emptySubtext: { fontSize: Typography.fontSize.sm, color: AppColors.navInactive, marginTop: Spacing.xs },
  fab: { position: 'absolute', right: Spacing.lg, bottom: Spacing.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: AppColors.secondary, justifyContent: 'center', alignItems: 'center', ...Shadows.button },
  modalContainer: { flex: 1, backgroundColor: AppColors.white },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: AppColors.navBorder, paddingTop: 60 },
  modalTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: AppColors.textPrimary },
  sendButton: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: AppColors.secondary },
  modalContent: { flex: 1, padding: Spacing.lg },
  questionInput: { fontSize: Typography.fontSize.md, color: AppColors.textPrimary, flex: 1 },
});
