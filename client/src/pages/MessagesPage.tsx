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
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/messages/conversations"],
  });

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
            <h1 className="text-3xl font-bold">Poruke</h1>
            <p className="text-muted-foreground">Vaše konverzacije</p>
          </div>
          <Button onClick={() => setIsNewMessageModalOpen(true)} data-testid="button-new-message">
            <Plus className="h-4 w-4 mr-2" />
            Nova poruka
          </Button>
        </div>

        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pretraži konverzacije..."
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
              <p>Nema konverzacija</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredConversations.map((conversation) => {
                const isUnread = conversation.unreadCount > 0;
                const isSentByMe = conversation.lastMessage.senderId === user?.id;
                
                return (
                  <div
                    key={conversation.threadId}
                    onClick={() => handleConversationClick(conversation)}
                    className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                      isUnread ? 'bg-blue-50' : ''
                    }`}
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
                              : "Nepoznato"}
                          </h3>
                          <span className="text-xs text-muted-foreground ml-2">
                            {format(new Date(conversation.lastMessage.createdAt), "dd.MM.yyyy.")}
                          </span>
                        </div>
                        
                        <p className={`text-sm truncate ${isUnread ? 'font-medium' : 'text-muted-foreground'}`}>
                          {isSentByMe ? "Vi: " : ""}
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
      <div className="flex items-center gap-3 p-4 border-b">
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
              : "Nepoznato"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {selectedConversation.lastMessage.subject}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {threadMessages.map((message) => {
          const isMine = message.senderId === user?.id;
          
          return (
            <div
              key={message.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${isMine ? 'order-2' : 'order-1'}`}>
                <div
                  className={`rounded-lg p-3 ${
                    isMine
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
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
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            placeholder="Napišite poruku..."
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
