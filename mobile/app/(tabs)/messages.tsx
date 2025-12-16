import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput, Alert } from 'react-native';
import { apiClient } from '@/services/api';
import { AppColors, BorderRadius, Spacing, Typography, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Conversation {
  threadId: string;
  otherParticipant: {
    id: string;
    firstName: string;
    lastName: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    isFromMe: boolean;
  };
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: {
    firstName: string;
    lastName: string;
  };
}

export default function MessagesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedThread, setSelectedThread] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread.threadId);
    }
  }, [selectedThread]);

  const loadConversations = async () => {
    try {
      const response = await apiClient.get<Conversation[]>('/api/messages/conversations');
      setConversations(response.data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMessages = async (threadId: string) => {
    try {
      const response = await apiClient.get<Message[]>(`/api/messages/thread/${threadId}`);
      setMessages(response.data);
      // Mark as read
      await apiClient.put(`/api/messages/thread/${threadId}/read`, {});
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (selectedThread) {
      loadMessages(selectedThread.threadId);
    } else {
      loadConversations();
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return;

    setSending(true);
    try {
      await apiClient.post('/api/messages', {
        recipientId: selectedThread.otherParticipant.id,
        content: newMessage.trim(),
      });
      setNewMessage('');
      loadMessages(selectedThread.threadId);
    } catch (error) {
      Alert.alert('Greška', 'Nije moguće poslati poruku');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Jučer';
    } else if (days < 7) {
      return date.toLocaleDateString('hr-HR', { weekday: 'short' });
    }
    return date.toLocaleDateString('hr-HR', { day: '2-digit', month: '2-digit' });
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  // Thread detail view
  if (selectedThread) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.threadHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setSelectedThread(null)} style={styles.backButton}>
            <Text style={[styles.backText, { color: AppColors.primary }]}>← Nazad</Text>
          </TouchableOpacity>
          <Text style={[styles.threadTitle, { color: colors.text }]}>
            {selectedThread.otherParticipant.firstName} {selectedThread.otherParticipant.lastName}
          </Text>
        </View>
        
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />
          }
        >
          {messages.map((message) => {
            const isMe = message.sender === null;
            return (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  isMe ? styles.myMessage : styles.theirMessage,
                  { backgroundColor: isMe ? AppColors.primary : colors.surface }
                ]}
              >
                <Text style={[styles.messageText, { color: isMe ? '#fff' : colors.text }]}>
                  {message.content}
                </Text>
                <Text style={[styles.messageTime, { color: isMe ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>
                  {formatDate(message.createdAt)}
                </Text>
              </View>
            );
          })}
        </ScrollView>
        
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            placeholder="Napišite poruku..."
            placeholderTextColor={colors.textSecondary}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || sending}
          >
            <Text style={styles.sendButtonText}>Pošalji</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Conversations list
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />
      }
    >
      {conversations.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Nemate poruka
          </Text>
        </View>
      ) : (
        conversations.map((conversation) => (
          <TouchableOpacity
            key={conversation.threadId}
            style={[styles.conversationCard, { backgroundColor: colors.surface }]}
            onPress={() => setSelectedThread(conversation)}
            activeOpacity={0.7}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {conversation.otherParticipant.firstName[0]}{conversation.otherParticipant.lastName[0]}
              </Text>
            </View>
            <View style={styles.conversationContent}>
              <View style={styles.conversationHeader}>
                <Text style={[styles.participantName, { color: colors.text }]}>
                  {conversation.otherParticipant.firstName} {conversation.otherParticipant.lastName}
                </Text>
                <Text style={[styles.messageDate, { color: colors.textSecondary }]}>
                  {formatDate(conversation.lastMessage.createdAt)}
                </Text>
              </View>
              <View style={styles.lastMessageRow}>
                <Text 
                  style={[styles.lastMessage, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {conversation.lastMessage.isFromMe ? 'Vi: ' : ''}{conversation.lastMessage.content}
                </Text>
                {conversation.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  participantName: {
    ...Typography.body,
    fontWeight: '600',
  },
  messageDate: {
    ...Typography.caption,
  },
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    ...Typography.bodySmall,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: AppColors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Thread view
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: Spacing.md,
  },
  backText: {
    ...Typography.body,
    fontWeight: '600',
  },
  threadTitle: {
    ...Typography.h3,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.md,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  myMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    ...Typography.body,
  },
  messageTime: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    maxHeight: 100,
    ...Typography.body,
  },
  sendButton: {
    backgroundColor: AppColors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    ...Typography.button,
    color: '#fff',
  },
});
