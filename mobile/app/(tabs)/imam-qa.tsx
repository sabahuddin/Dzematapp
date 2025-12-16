import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { apiClient } from '@/services/api';
import { AppColors, BorderRadius, Spacing, Typography, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ImamQuestion {
  id: string;
  question: string;
  answer: string | null;
  isPublic: boolean;
  isAnonymous: boolean;
  status: 'pending' | 'answered' | 'archived';
  createdAt: string;
  answeredAt: string | null;
}

export default function ImamQAScreen() {
  const [questions, setQuestions] = useState<ImamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');
  const [showAskModal, setShowAskModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ question: '', isAnonymous: false });
  const [submitting, setSubmitting] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<ImamQuestion | null>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const response = await apiClient.get<ImamQuestion[]>('/api/imam-questions');
      setQuestions(response.data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
      setQuestions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadQuestions();
  };

  const handleAskQuestion = async () => {
    if (!newQuestion.question.trim()) {
      Alert.alert('Greška', 'Unesite pitanje');
      return;
    }
    
    setSubmitting(true);
    try {
      await apiClient.post('/api/imam-questions', {
        question: newQuestion.question.trim(),
        isAnonymous: newQuestion.isAnonymous
      });
      setShowAskModal(false);
      setNewQuestion({ question: '', isAnonymous: false });
      loadQuestions();
      Alert.alert('Uspješno', 'Vaše pitanje je poslano imamu.');
    } catch (error) {
      Alert.alert('Greška', 'Nije moguće poslati pitanje.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'answered': return { label: 'Odgovoreno', color: AppColors.success };
      case 'archived': return { label: 'Arhivirano', color: AppColors.textSecondary };
      default: return { label: 'Čeka odgovor', color: AppColors.warning };
    }
  };

  const myQuestions = questions.filter(q => !q.isPublic || q.status !== 'archived');
  const publicQuestions = questions.filter(q => q.isPublic && q.status === 'answered');
  const displayQuestions = activeTab === 'my' ? myQuestions : publicQuestions;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'my' && styles.activeTab]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>Moja pitanja</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'public' && styles.activeTab]}
          onPress={() => setActiveTab('public')}
        >
          <Text style={[styles.tabText, activeTab === 'public' && styles.activeTabText]}>Javna pitanja</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />}
      >
        {activeTab === 'my' && (
          <TouchableOpacity 
            style={styles.askButton}
            onPress={() => setShowAskModal(true)}
          >
            <Text style={styles.askButtonText}>🙋 Postavi pitanje imamu</Text>
          </TouchableOpacity>
        )}

        {displayQuestions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>❓</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {activeTab === 'my' ? 'Nemate postavljenih pitanja' : 'Nema javnih pitanja'}
            </Text>
          </View>
        ) : (
          displayQuestions.map((q) => {
            const statusInfo = getStatusInfo(q.status);
            return (
              <TouchableOpacity 
                key={q.id} 
                style={[styles.questionCard, { backgroundColor: colors.surface }]}
                onPress={() => setSelectedQuestion(q)}
              >
                <View style={styles.questionHeader}>
                  <Text style={[styles.questionText, { color: colors.text }]} numberOfLines={2}>
                    {q.question}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                    <Text style={styles.statusText}>{statusInfo.label}</Text>
                  </View>
                </View>
                {q.answer && (
                  <Text style={[styles.answerPreview, { color: colors.textSecondary }]} numberOfLines={2}>
                    {q.answer}
                  </Text>
                )}
                <View style={styles.questionFooter}>
                  <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                    {new Date(q.createdAt).toLocaleDateString('bs-BA')}
                  </Text>
                  {q.isAnonymous && <Text style={styles.anonymousTag}>🔒 Anonimno</Text>}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal visible={showAskModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Postavi pitanje imamu</Text>
            
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Unesite vaše pitanje..."
              placeholderTextColor={colors.textSecondary}
              value={newQuestion.question}
              onChangeText={(text) => setNewQuestion({ ...newQuestion, question: text })}
              multiline
              numberOfLines={5}
            />
            
            <TouchableOpacity
              style={styles.anonymousToggle}
              onPress={() => setNewQuestion({ ...newQuestion, isAnonymous: !newQuestion.isAnonymous })}
            >
              <View style={[styles.checkbox, newQuestion.isAnonymous && styles.checkboxChecked]}>
                {newQuestion.isAnonymous && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.anonymousLabel, { color: colors.text }]}>Postavi anonimno</Text>
            </TouchableOpacity>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAskModal(false)}
              >
                <Text style={styles.cancelButtonText}>Odustani</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.buttonDisabled]}
                onPress={handleAskQuestion}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Pošalji</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!selectedQuestion} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.detailHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Pitanje i odgovor</Text>
              <TouchableOpacity onPress={() => setSelectedQuestion(null)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.detailScroll}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Pitanje:</Text>
              <Text style={[styles.detailQuestion, { color: colors.text }]}>{selectedQuestion?.question}</Text>
              
              {selectedQuestion?.answer ? (
                <>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Odgovor:</Text>
                  <Text style={[styles.detailAnswer, { color: colors.text }]}>{selectedQuestion.answer}</Text>
                </>
              ) : (
                <View style={styles.pendingAnswer}>
                  <Text style={styles.pendingIcon}>⏳</Text>
                  <Text style={[styles.pendingText, { color: colors.textSecondary }]}>
                    Čeka se odgovor od imama
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabBar: { flexDirection: 'row', backgroundColor: AppColors.primary, paddingTop: Spacing.sm },
  tab: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#fff' },
  tabText: { ...Typography.body, color: 'rgba(255,255,255,0.7)' },
  activeTabText: { color: '#fff', fontWeight: '600' },
  content: { padding: Spacing.md },
  askButton: { backgroundColor: AppColors.secondary, padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', marginBottom: Spacing.md },
  askButtonText: { ...Typography.button, color: '#fff' },
  questionCard: { borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  questionText: { ...Typography.body, fontWeight: '600', flex: 1, marginRight: Spacing.sm },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  statusText: { ...Typography.caption, color: '#fff' },
  answerPreview: { ...Typography.bodySmall, marginBottom: Spacing.sm },
  questionFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { ...Typography.caption },
  anonymousTag: { ...Typography.caption },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl * 2 },
  emptyIcon: { fontSize: 60, marginBottom: Spacing.md },
  emptyText: { ...Typography.body },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, maxHeight: '80%' },
  modalTitle: { ...Typography.h2, marginBottom: Spacing.lg, textAlign: 'center' },
  input: { borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md, fontSize: 16 },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  anonymousToggle: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  checkbox: { width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: AppColors.border, marginRight: Spacing.sm, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: AppColors.secondary, borderColor: AppColors.secondary },
  checkmark: { color: '#fff', fontWeight: 'bold' },
  anonymousLabel: { ...Typography.body },
  modalButtons: { flexDirection: 'row', gap: Spacing.md },
  cancelButton: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: AppColors.border, alignItems: 'center' },
  cancelButtonText: { ...Typography.body, color: AppColors.textSecondary },
  submitButton: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: AppColors.secondary, alignItems: 'center' },
  submitButtonText: { ...Typography.button, color: '#fff' },
  buttonDisabled: { opacity: 0.7 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  closeButton: { fontSize: 24, color: AppColors.textSecondary, padding: Spacing.sm },
  detailScroll: { maxHeight: 400 },
  detailLabel: { ...Typography.bodySmall, fontWeight: '600', marginBottom: Spacing.xs, marginTop: Spacing.md },
  detailQuestion: { ...Typography.body, lineHeight: 24 },
  detailAnswer: { ...Typography.body, lineHeight: 24, backgroundColor: 'rgba(57, 73, 171, 0.1)', padding: Spacing.md, borderRadius: BorderRadius.md },
  pendingAnswer: { alignItems: 'center', paddingVertical: Spacing.xl },
  pendingIcon: { fontSize: 40, marginBottom: Spacing.sm },
  pendingText: { ...Typography.body },
});
