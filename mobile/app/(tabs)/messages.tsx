import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/api';
import { useAuth } from '../../services/auth';
import { AppColors, Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';

interface Message {
  id: string;
  subject: string;
  content: string;
  senderId: string;
  recipientId: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    firstName: string;
    lastName: string;
  };
  recipient?: {
    firstName: string;
    lastName: string;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
}

export default function MessagesScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const loadData = async () => {
    try {
      const data = await apiClient.get<Message[]>('/api/messages');
      setMessages(data || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
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

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('bs-BA', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Jučer';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('bs-BA', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('bs-BA', { day: 'numeric', month: 'short' });
    }
  };

  const inboxMessages = messages.filter(m => m.recipientId === user?.id);
  const sentMessages = messages.filter(m => m.senderId === user?.id);
  const displayMessages = activeTab === 'inbox' ? inboxMessages : sentMessages;
  const unreadCount = inboxMessages.filter(m => !m.isRead).length;

  const handleOpenMessage = async (message: Message) => {
    setSelectedMessage(message);
    if (!message.isRead && message.recipientId === user?.id) {
      try {
        await apiClient.post(`/api/messages/${message.id}/read`);
        setMessages(msgs => msgs.map(m => 
          m.id === message.id ? { ...m, isRead: true } : m
        ));
      } catch (error) {
        console.error('Failed to mark message as read:', error);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'inbox' && styles.tabActive]}
          onPress={() => setActiveTab('inbox')}
        >
          <Text style={[styles.tabText, activeTab === 'inbox' && styles.tabTextActive]}>
            Primljene {unreadCount > 0 && `(${unreadCount})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && styles.tabActive]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && styles.tabTextActive]}>
            Poslane
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />
        }
      >
        {displayMessages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={AppColors.navInactive} />
            <Text style={styles.emptyText}>
              {activeTab === 'inbox' ? 'Nema primljenih poruka' : 'Nema poslanih poruka'}
            </Text>
          </View>
        ) : (
          displayMessages.map(message => (
            <TouchableOpacity
              key={message.id}
              style={[styles.messageCard, !message.isRead && activeTab === 'inbox' && styles.messageUnread]}
              onPress={() => handleOpenMessage(message)}
            >
              <View style={styles.messageHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {activeTab === 'inbox' 
                      ? (message.sender?.firstName?.[0] || 'U')
                      : (message.recipient?.firstName?.[0] || 'U')
                    }
                  </Text>
                </View>
                <View style={styles.messageInfo}>
                  <Text style={styles.messageSender}>
                    {activeTab === 'inbox'
                      ? `${message.sender?.firstName || ''} ${message.sender?.lastName || ''}`
                      : `${message.recipient?.firstName || ''} ${message.recipient?.lastName || ''}`
                    }
                  </Text>
                  <Text style={styles.messageSubject} numberOfLines={1}>
                    {message.subject}
                  </Text>
                </View>
                <Text style={styles.messageDate}>{formatDate(message.createdAt)}</Text>
              </View>
              <Text style={styles.messagePreview} numberOfLines={2}>
                {message.content}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCompose(true)}
      >
        <Ionicons name="create" size={24} color={AppColors.white} />
      </TouchableOpacity>

      <Modal
        visible={!!selectedMessage}
        animationType="slide"
        onRequestClose={() => setSelectedMessage(null)}
      >
        {selectedMessage && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedMessage(null)}>
                <Ionicons name="close" size={28} color={AppColors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Poruka</Text>
              <View style={{ width: 28 }} />
            </View>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalSubject}>{selectedMessage.subject}</Text>
              <View style={styles.modalMeta}>
                <Text style={styles.modalFrom}>
                  Od: {selectedMessage.sender?.firstName} {selectedMessage.sender?.lastName}
                </Text>
                <Text style={styles.modalDate}>
                  {new Date(selectedMessage.createdAt).toLocaleString('bs-BA')}
                </Text>
              </View>
              <Text style={styles.modalBody}>{selectedMessage.content}</Text>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.background,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: AppColors.white,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.navBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: AppColors.primary,
  },
  tabText: {
    fontSize: Typography.fontSize.md,
    color: AppColors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  tabTextActive: {
    color: AppColors.primary,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: AppColors.textSecondary,
    marginTop: Spacing.md,
  },
  messageCard: {
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  messageUnread: {
    borderLeftWidth: 4,
    borderLeftColor: AppColors.primary,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  avatarText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.white,
  },
  messageInfo: {
    flex: 1,
  },
  messageSender: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.textPrimary,
  },
  messageSubject: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.textSecondary,
  },
  messageDate: {
    fontSize: Typography.fontSize.xs,
    color: AppColors.navInactive,
  },
  messagePreview: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.button,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.navBorder,
    paddingTop: 60,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: AppColors.textPrimary,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  modalSubject: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: AppColors.textPrimary,
    marginBottom: Spacing.md,
  },
  modalMeta: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.navBorder,
  },
  modalFrom: {
    fontSize: Typography.fontSize.md,
    color: AppColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  modalDate: {
    fontSize: Typography.fontSize.sm,
    color: AppColors.textSecondary,
  },
  modalBody: {
    fontSize: Typography.fontSize.md,
    color: AppColors.textPrimary,
    lineHeight: 24,
  },
});
