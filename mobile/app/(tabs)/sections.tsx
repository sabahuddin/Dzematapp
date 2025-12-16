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
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WorkGroup {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  workGroupId: string;
  assignedUsers: { id: string; firstName: string; lastName: string }[];
}

interface TaskComment {
  id: string;
  content: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export default function SectionsScreen() {
  const [workGroups, setWorkGroups] = useState<WorkGroup[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<WorkGroup | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    loadWorkGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadTasks(selectedGroup.id);
    }
  }, [selectedGroup]);

  const loadWorkGroups = async () => {
    try {
      const response = await apiClient.get<WorkGroup[]>('/api/work-groups');
      setWorkGroups(response.data || []);
      if (response.data && response.data.length > 0 && !selectedGroup) {
        setSelectedGroup(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading work groups:', error);
      setWorkGroups([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadTasks = async (groupId: string) => {
    try {
      const response = await apiClient.get<Task[]>(`/api/work-groups/${groupId}/tasks`);
      setTasks(response.data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    }
  };

  const loadComments = async (taskId: string) => {
    setLoadingComments(true);
    try {
      const response = await apiClient.get<TaskComment[]>(`/api/tasks/${taskId}/comments`);
      setComments(response.data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleOpenTask = (task: Task) => {
    setSelectedTask(task);
    loadComments(task.id);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask) return;
    
    setSubmitting(true);
    try {
      await apiClient.post(`/api/tasks/${selectedTask.id}/comments`, {
        content: newComment.trim()
      });
      setNewComment('');
      loadComments(selectedTask.id);
    } catch (error) {
      Alert.alert('Greška', 'Nije moguće dodati komentar.');
    } finally {
      setSubmitting(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWorkGroups();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return AppColors.success;
      case 'in_progress': return AppColors.warning;
      default: return AppColors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Završeno';
      case 'in_progress': return 'U toku';
      default: return 'Na čekanju';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return AppColors.error;
      case 'medium': return AppColors.warning;
      default: return AppColors.textSecondary;
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
      {workGroups.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.groupTabs}
          contentContainerStyle={styles.groupTabsContent}
        >
          {workGroups.map((group) => (
            <TouchableOpacity
              key={group.id}
              style={[
                styles.groupTab,
                { borderBottomColor: group.color || AppColors.primary },
                selectedGroup?.id === group.id && styles.groupTabActive
              ]}
              onPress={() => setSelectedGroup(group)}
            >
              <Text style={[
                styles.groupTabText,
                { color: selectedGroup?.id === group.id ? colors.text : colors.textSecondary }
              ]}>
                {group.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />}
      >
        {workGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nema radnih grupa</Text>
          </View>
        ) : tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nema zadataka u ovoj grupi</Text>
          </View>
        ) : (
          tasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={[styles.taskCard, { backgroundColor: colors.surface }]}
              onPress={() => handleOpenTask(task)}
            >
              <View style={styles.taskHeader}>
                <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
                <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]} />
              </View>
              {task.description && (
                <Text style={[styles.taskDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                  {task.description}
                </Text>
              )}
              <View style={styles.taskFooter}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
                  <Text style={styles.statusText}>{getStatusLabel(task.status)}</Text>
                </View>
                {task.dueDate && (
                  <Text style={[styles.dueDate, { color: colors.textSecondary }]}>
                    📅 {new Date(task.dueDate).toLocaleDateString('bs-BA')}
                  </Text>
                )}
              </View>
              {task.assignedUsers && task.assignedUsers.length > 0 && (
                <Text style={[styles.assignees, { color: colors.textSecondary }]}>
                  👥 {task.assignedUsers.map(u => `${u.firstName} ${u.lastName}`).join(', ')}
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={!!selectedTask} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedTask?.title}</Text>
              <TouchableOpacity onPress={() => setSelectedTask(null)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {selectedTask?.description && (
              <Text style={[styles.taskDescription, { color: colors.textSecondary }]}>
                {selectedTask.description}
              </Text>
            )}

            <Text style={[styles.commentsTitle, { color: colors.text }]}>Komentari</Text>
            
            <ScrollView style={styles.commentsList}>
              {loadingComments ? (
                <ActivityIndicator color={AppColors.primary} />
              ) : comments.length === 0 ? (
                <Text style={[styles.noComments, { color: colors.textSecondary }]}>Nema komentara</Text>
              ) : (
                comments.map((comment) => (
                  <View key={comment.id} style={[styles.commentCard, { backgroundColor: colors.background }]}>
                    <Text style={[styles.commentAuthor, { color: colors.text }]}>{comment.userName}</Text>
                    <Text style={[styles.commentContent, { color: colors.textSecondary }]}>{comment.content}</Text>
                    <Text style={[styles.commentDate, { color: colors.textSecondary }]}>
                      {new Date(comment.createdAt).toLocaleDateString('bs-BA')}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.commentInputRow}>
              <TextInput
                style={[styles.commentInput, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Dodaj komentar..."
                placeholderTextColor={colors.textSecondary}
                value={newComment}
                onChangeText={setNewComment}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, submitting && styles.buttonDisabled]}
                onPress={handleAddComment}
                disabled={submitting || !newComment.trim()}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.sendButtonText}>➤</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  groupTabs: { maxHeight: 50, backgroundColor: '#fff' },
  groupTabsContent: { paddingHorizontal: Spacing.sm },
  groupTab: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  groupTabActive: { borderBottomColor: AppColors.primary },
  groupTabText: { ...Typography.body, fontWeight: '500' },
  content: { padding: Spacing.md },
  taskCard: { borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xs },
  taskTitle: { ...Typography.h3, flex: 1, marginRight: Spacing.sm },
  priorityDot: { width: 10, height: 10, borderRadius: 5 },
  taskDesc: { ...Typography.bodySmall, marginBottom: Spacing.sm },
  taskFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  statusText: { ...Typography.caption, color: '#fff' },
  dueDate: { ...Typography.caption },
  assignees: { ...Typography.caption, marginTop: Spacing.sm },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl * 2 },
  emptyIcon: { fontSize: 60, marginBottom: Spacing.md },
  emptyText: { ...Typography.body },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { ...Typography.h2, flex: 1 },
  closeButton: { fontSize: 24, color: AppColors.textSecondary, padding: Spacing.sm },
  taskDescription: { ...Typography.body, marginBottom: Spacing.lg },
  commentsTitle: { ...Typography.h3, marginBottom: Spacing.md },
  commentsList: { maxHeight: 250 },
  noComments: { ...Typography.body, textAlign: 'center', paddingVertical: Spacing.lg },
  commentCard: { borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.sm },
  commentAuthor: { ...Typography.bodySmall, fontWeight: '600' },
  commentContent: { ...Typography.body, marginVertical: Spacing.xs },
  commentDate: { ...Typography.caption },
  commentInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, marginTop: Spacing.md, paddingBottom: Spacing.lg },
  commentInput: { flex: 1, borderRadius: BorderRadius.md, padding: Spacing.md, minHeight: 44, maxHeight: 100 },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: AppColors.secondary, justifyContent: 'center', alignItems: 'center' },
  sendButtonText: { color: '#fff', fontSize: 18 },
  buttonDisabled: { opacity: 0.7 },
});
