import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Mail, MailOpen, Users, User, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import NewMessageModal from "@/components/modals/NewMessageModal";
import MessageViewModal from "@/components/modals/MessageViewModal";
import { useAuth } from "@/hooks/useAuth";

interface MessageWithDetails {
  id: string;
  senderId: string;
  recipientId: string | null;
  category: string | null;
  subject: string;
  content: string;
  isRead: boolean;
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

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("received");
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<MessageWithDetails | null>(null);
  const [replyTo, setReplyTo] = useState<MessageWithDetails | null>(null);

  const { data: messages = [], isLoading } = useQuery<MessageWithDetails[]>({
    queryKey: ["/api/messages"],
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId: string) => 
      apiRequest(`/api/messages/${messageId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      setSelectedMessage(null);
    },
  });

  const receivedMessages = messages.filter(
    (msg) => msg.recipientId === user?.id || (msg.category && msg.recipientId !== user?.id)
  );

  const sentMessages = messages.filter(
    (msg) => msg.senderId === user?.id
  );

  const filteredMessages = (selectedTab === "received" ? receivedMessages : sentMessages).filter(
    (msg) =>
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.sender?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.sender?.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMessageClick = (message: MessageWithDetails) => {
    setSelectedMessage(message);
  };

  const handleReply = (message: MessageWithDetails) => {
    setReplyTo(message);
    setIsNewMessageModalOpen(true);
    setSelectedMessage(null);
  };

  const handleDelete = (messageId: string) => {
    if (confirm("Da li ste sigurni da želite obrisati ovu poruku?")) {
      deleteMutation.mutate(messageId);
    }
  };

  const handleCloseMessageView = () => {
    setSelectedMessage(null);
  };

  const handleCloseNewMessage = () => {
    setIsNewMessageModalOpen(false);
    setReplyTo(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Poruke</h1>
          <p className="text-muted-foreground">Upravljajte vašim porukama</p>
        </div>
        <Button onClick={() => setIsNewMessageModalOpen(true)} data-testid="button-new-message">
          <Plus className="h-4 w-4 mr-2" />
          Nova poruka
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pretraži poruke..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
          data-testid="input-search-messages"
        />
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="received" data-testid="tab-received-messages">
            Primljene
            {receivedMessages.filter(m => !m.isRead).length > 0 && (
              <Badge variant="destructive" className="ml-2" data-testid="badge-unread-received">
                {receivedMessages.filter(m => !m.isRead).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" data-testid="tab-sent-messages">
            Poslane
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">Učitavanje poruka...</p>
              </CardContent>
            </Card>
          ) : filteredMessages.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">Nema primljenih poruka</p>
              </CardContent>
            </Card>
          ) : (
            filteredMessages.map((message) => (
              <Card
                key={message.id}
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  !message.isRead ? "border-primary" : ""
                }`}
                onClick={() => handleMessageClick(message)}
                data-testid={`card-message-${message.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {!message.isRead ? (
                        <Mail className="h-5 w-5 text-primary" data-testid="icon-unread" />
                      ) : (
                        <MailOpen className="h-5 w-5 text-muted-foreground" data-testid="icon-read" />
                      )}
                      {message.category ? (
                        <Users className="h-4 w-4 text-muted-foreground" data-testid="icon-category-message" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" data-testid="icon-private-message" />
                      )}
                      <CardTitle className={!message.isRead ? "font-bold" : ""}>
                        {message.subject}
                      </CardTitle>
                    </div>
                    <span className="text-sm text-muted-foreground" data-testid={`text-date-${message.id}`}>
                      {format(new Date(message.createdAt), "dd.MM.yyyy HH:mm")}
                    </span>
                  </div>
                  <CardDescription className="flex items-center space-x-2">
                    <span>
                      Od: {message.sender?.firstName} {message.sender?.lastName}
                    </span>
                    {message.category && (
                      <Badge variant="secondary" data-testid={`badge-category-${message.id}`}>
                        {message.category}
                      </Badge>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {message.content}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">Učitavanje poruka...</p>
              </CardContent>
            </Card>
          ) : filteredMessages.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">Nema poslanih poruka</p>
              </CardContent>
            </Card>
          ) : (
            filteredMessages.map((message) => (
              <Card
                key={message.id}
                className="cursor-pointer transition-colors hover:bg-accent"
                onClick={() => handleMessageClick(message)}
                data-testid={`card-message-${message.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <MailOpen className="h-5 w-5 text-muted-foreground" />
                      {message.category ? (
                        <Users className="h-4 w-4 text-muted-foreground" data-testid="icon-category-message" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" data-testid="icon-private-message" />
                      )}
                      <CardTitle>{message.subject}</CardTitle>
                    </div>
                    <span className="text-sm text-muted-foreground" data-testid={`text-date-${message.id}`}>
                      {format(new Date(message.createdAt), "dd.MM.yyyy HH:mm")}
                    </span>
                  </div>
                  <CardDescription className="flex items-center space-x-2">
                    <span>
                      Za: {message.recipient ? `${message.recipient.firstName} ${message.recipient.lastName}` : "Kategorija"}
                    </span>
                    {message.category && (
                      <Badge variant="secondary" data-testid={`badge-category-${message.id}`}>
                        {message.category}
                      </Badge>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {message.content}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <NewMessageModal
        isOpen={isNewMessageModalOpen}
        onClose={handleCloseNewMessage}
        replyTo={replyTo}
      />

      <MessageViewModal
        message={selectedMessage}
        onClose={handleCloseMessageView}
        onReply={handleReply}
        onDelete={handleDelete}
      />
    </div>
  );
}
