import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Send, Plus, Search, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import NewMessageModal from "@/components/modals/NewMessageModal";
import { useAuth } from "@/hooks/useAuth";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradeCTA } from "@/components/UpgradeCTA";

interface MessageWithDetails {
  id: string;
  senderId: string;
  recipientId: string | null;
  category: string | null;
  subject: string;
  content: string;
  isRead: boolean;
  threadId: string | null;
  parentMessageId: string | null;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  recipient: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface Conversation {
  threadId: string;
  lastMessage: MessageWithDetails;
  unreadCount: number;
  otherUser: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export default function MessagesPage() {
  const { t } = useTranslation(['messages']);
  const { user } = useAuth();
  const featureAccess = useFeatureAccess('messages');
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  if (featureAccess.upgradeRequired) {
    return <UpgradeCTA moduleId="messages" requiredPlan={featureAccess.requiredPlan || 'standard'} currentPlan={featureAccess.currentPlan || 'basic'} />;
  }

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/messages/conversations"],
  });

  // Deep linking - open specific conversation when ?threadId= is in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const threadId = params.get('threadId');
    if (threadId && conversations.length > 0 && !selectedConversation) {
      const conversation = conversations.find(c => c.threadId === threadId);
      if (conversation) {
        setSelectedConversation(conversation);
        // Clear URL after opening conversation
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [conversations, selectedConversation]);

  const { data: threadMessages = [] } = useQuery<MessageWithDetails[]>({
    queryKey: ["/api/messages/thread", selectedConversation?.threadId],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const response = await fetch(`/api/messages/thread/${selectedConversation.threadId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch thread');
      return response.json();
    },
    enabled: !!selectedConversation,
  });

  const markThreadAsReadMutation = useMutation({
    mutationFn: (threadId: string) => 
      apiRequest(`/api/messages/thread/${threadId}/read`, "PUT", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/messages", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/thread", selectedConversation?.threadId] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      setNewMessage("");
    },
  });

  useEffect(() => {
    if (selectedConversation && selectedConversation.unreadCount > 0) {
      markThreadAsReadMutation.mutate(selectedConversation.threadId);
    }
  }, [selectedConversation?.threadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages]);

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.otherUser?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.otherUser?.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageData = {
      senderId: user!.id,
      recipientId: selectedConversation.otherUser?.id,
      subject: selectedConversation.lastMessage.subject,
      content: newMessage,
      threadId: selectedConversation.threadId,
      parentMessageId: selectedConversation.lastMessage.id,
    };

    sendMessageMutation.mutate(messageData);
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "?";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  // Conversation List View
  if (!selectedConversation) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h1 className="text-3xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground">{t('yourConversations')}</p>
          </div>
          <Button onClick={() => setIsNewMessageModalOpen(true)} data-testid="button-new-message">
            <Plus className="h-4 w-4 mr-2" />
            {t('newMessage')}
          </Button>
        </div>

        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchConversations')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
              data-testid="input-search-conversations"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Mail className="h-8 w-8 text-muted-foreground animate-pulse" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Mail className="h-12 w-12 mb-4" />
              <p>{t('noConversations')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 p-4">
              {filteredConversations.map((conversation) => {
                const isUnread = conversation.unreadCount > 0;
                const isSentByMe = conversation.lastMessage.senderId === user?.id;
                
                return (
                  <div
                    key={conversation.threadId}
                    onClick={() => handleConversationClick(conversation)}
                    className="p-4 cursor-pointer transition-all rounded-lg"
                    style={{
                      backgroundColor: isUnread ? '#E8EAF6' : '#FFFFFF',
                      border: isUnread ? '2px solid #3949AB' : '1px solid #E0E0E0',
                      borderRadius: '16px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isUnread ? '#E8EAF6' : '#F5F5FA';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isUnread ? '#E8EAF6' : '#FFFFFF';
                    }}
                    data-testid={`conversation-${conversation.threadId}`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(
                            conversation.otherUser?.firstName,
                            conversation.otherUser?.lastName
                          )}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-semibold truncate ${isUnread ? 'text-primary' : ''}`}>
                            {conversation.otherUser
                              ? `${conversation.otherUser.firstName} ${conversation.otherUser.lastName}`
                              : t('unknown')}
                          </h3>
                          <span className="text-xs text-muted-foreground ml-2">
                            {format(new Date(conversation.lastMessage.createdAt), "dd.MM.yyyy.")}
                          </span>
                        </div>
                        
                        <p className={`text-sm truncate ${isUnread ? 'font-medium' : 'text-muted-foreground'}`}>
                          {isSentByMe ? `${t('you')}: ` : ""}
                          {conversation.lastMessage.content}
                        </p>
                      </div>
                      
                      {isUnread && (
                        <Badge variant="default" className="ml-2">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <NewMessageModal
          isOpen={isNewMessageModalOpen}
          onClose={() => setIsNewMessageModalOpen(false)}
        />
      </div>
    );
  }

  // Chat View
  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div 
        className="flex items-center gap-3 p-4 border-b"
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '2px solid #E8EAF6'
        }}
      >
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleBack}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials(
              selectedConversation.otherUser?.firstName,
              selectedConversation.otherUser?.lastName
            )}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h2 className="font-semibold">
            {selectedConversation.otherUser
              ? `${selectedConversation.otherUser.firstName} ${selectedConversation.otherUser.lastName}`
              : t('unknown')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {selectedConversation.lastMessage.subject}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundColor: '#F5F7FA' }}>
        {threadMessages.map((message) => {
          const isMine = message.senderId === user?.id;
          
          return (
            <div
              key={message.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${isMine ? 'order-2' : 'order-1'}`}>
                <div
                  style={{
                    backgroundColor: isMine ? '#3949AB' : '#FFFFFF',
                    color: isMine ? '#FFFFFF' : '#0D1B2A',
                    borderRadius: '12px',
                    padding: '12px',
                    border: isMine ? 'none' : '1px solid #E0E0E0'
                  }}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1 px-1">
                  {format(new Date(message.createdAt), "dd.MM.yyyy. u HH:mm")}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div 
        className="p-4 border-t"
        style={{
          backgroundColor: '#FFFFFF',
          borderTop: '2px solid #E8EAF6'
        }}
      >
        <div className="flex gap-2">
          <Textarea
            placeholder={t('writeMessage')}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="min-h-[60px] resize-none"
            data-testid="input-new-message"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            data-testid="button-send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
