import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Mail, MailOpen, User, Plus, Search, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface ImamMessage {
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

interface User {
  id: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
}

export default function AskImamPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("my-questions");
  const [isNewQuestionOpen, setIsNewQuestionOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ImamMessage | null>(null);
  const [questionSubject, setQuestionSubject] = useState("");
  const [questionContent, setQuestionContent] = useState("");
  const [replyContent, setReplyContent] = useState("");

  const { data: messages = [], isLoading } = useQuery<ImamMessage[]>({
    queryKey: ["/api/messages"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Find admin users (imams)
  const admins = users.filter(u => u.isAdmin);

  // Filter messages related to imam communication
  const imamMessages = messages.filter(msg => {
    const isFromAdmin = msg.sender?.id && admins.some(admin => admin.id === msg.sender!.id);
    const isToAdmin = msg.recipientId && admins.some(admin => admin.id === msg.recipientId!);
    return (isFromAdmin || isToAdmin) && !msg.category;
  });

  const myQuestions = imamMessages.filter(msg => msg.senderId === user?.id);
  const receivedQuestions = user?.isAdmin ? imamMessages.filter(msg => msg.recipientId === user?.id) : [];

  const filteredMessages = (selectedTab === "my-questions" ? myQuestions : receivedQuestions).filter(
    (msg) =>
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.sender?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.sender?.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sendQuestionMutation = useMutation({
    mutationFn: (data: { subject: string; content: string }) => {
      const adminUser = admins[0];
      if (!adminUser) throw new Error("No admin found");
      
      return apiRequest("POST", "/api/messages", {
        senderId: user!.id,
        recipientId: adminUser.id,
        subject: data.subject,
        content: data.content,
        category: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      toast({ title: "Uspjeh", description: "Pitanje je poslano imamu" });
      setIsNewQuestionOpen(false);
      setQuestionSubject("");
      setQuestionContent("");
    },
    onError: () => {
      toast({ 
        title: "Greška", 
        description: "Greška pri slanju pitanja", 
        variant: "destructive" 
      });
    },
  });

  const replyMutation = useMutation({
    mutationFn: (data: { messageId: string; content: string; originalSenderId: string }) => {
      return apiRequest("POST", "/api/messages", {
        senderId: user!.id,
        recipientId: data.originalSenderId,
        subject: `Re: ${selectedMessage?.subject}`,
        content: data.content,
        category: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      toast({ title: "Uspjeh", description: "Odgovor je poslan" });
      setSelectedMessage(null);
      setReplyContent("");
    },
    onError: () => {
      toast({ 
        title: "Greška", 
        description: "Greška pri slanju odgovora", 
        variant: "destructive" 
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (messageId: string) =>
      apiRequest("PUT", `/api/messages/${messageId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
    },
  });

  const handleMessageClick = (message: ImamMessage) => {
    setSelectedMessage(message);
    if (!message.isRead && message.recipientId === user?.id) {
      markAsReadMutation.mutate(message.id);
    }
  };

  const handleSendQuestion = () => {
    if (!questionSubject.trim() || !questionContent.trim()) {
      toast({ 
        title: "Greška", 
        description: "Molimo popunite sva polja", 
        variant: "destructive" 
      });
      return;
    }
    sendQuestionMutation.mutate({ subject: questionSubject, content: questionContent });
  };

  const handleSendReply = () => {
    if (!replyContent.trim() || !selectedMessage) return;
    replyMutation.mutate({
      messageId: selectedMessage.id,
      content: replyContent,
      originalSenderId: selectedMessage.senderId,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pitaj Imama</h1>
          <p className="text-muted-foreground">
            {user?.isAdmin 
              ? "Pregledajte pitanja članova i odgovorite" 
              : "Postavite pitanje imamu i dobijte odgovor"}
          </p>
        </div>
        {!user?.isAdmin && (
          <Button onClick={() => setIsNewQuestionOpen(true)} data-testid="button-new-question">
            <Plus className="h-4 w-4 mr-2" />
            Novo pitanje
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pretraži pitanja..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
          data-testid="input-search-questions"
        />
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="my-questions" data-testid="tab-my-questions">
            {user?.isAdmin ? "Primljena pitanja" : "Moja pitanja"}
            {user?.isAdmin && receivedQuestions.filter(m => !m.isRead).length > 0 && (
              <Badge variant="destructive" className="ml-2" data-testid="badge-unread-questions">
                {receivedQuestions.filter(m => !m.isRead).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-questions" className="space-y-4">
          {isLoading ? (
            <Card className="bg-card border-2">
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">Učitavanje...</p>
              </CardContent>
            </Card>
          ) : filteredMessages.length === 0 ? (
            <Card className="bg-card border-2">
              <CardContent className="p-6">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {user?.isAdmin ? "Nema primljenih pitanja" : "Nema postavljenih pitanja"}
                  </p>
                  {!user?.isAdmin && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setIsNewQuestionOpen(true)}
                    >
                      Postavi prvo pitanje
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredMessages.map((message) => (
              <Card
                key={message.id}
                className={`cursor-pointer transition-all hover:shadow-md bg-card border-2 ${
                  !message.isRead && message.recipientId === user?.id
                    ? "border-primary shadow-sm" 
                    : "border-border"
                }`}
                onClick={() => handleMessageClick(message)}
                data-testid={`card-question-${message.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {!message.isRead && message.recipientId === user?.id ? (
                        <Mail className="h-5 w-5 text-primary" data-testid="icon-unread" />
                      ) : (
                        <MailOpen className="h-5 w-5 text-muted-foreground" data-testid="icon-read" />
                      )}
                      <User className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className={!message.isRead && message.recipientId === user?.id ? "font-bold" : ""}>
                        {message.subject}
                      </CardTitle>
                    </div>
                    <span className="text-sm text-muted-foreground" data-testid={`text-date-${message.id}`}>
                      {format(new Date(message.createdAt), "dd.MM.yyyy HH:mm")}
                    </span>
                  </div>
                  <CardDescription>
                    {message.senderId === user?.id 
                      ? `Za: ${message.recipient?.firstName} ${message.recipient?.lastName}` 
                      : `Od: ${message.sender?.firstName} ${message.sender?.lastName}`}
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

      {/* New Question Dialog */}
      <Dialog open={isNewQuestionOpen} onOpenChange={setIsNewQuestionOpen}>
        <DialogContent data-testid="dialog-new-question">
          <DialogHeader>
            <DialogTitle>Postavi pitanje imamu</DialogTitle>
            <DialogDescription>
              Vaše pitanje će biti poslano imamu i dobit ćete odgovor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Naslov</Label>
              <Input
                id="subject"
                value={questionSubject}
                onChange={(e) => setQuestionSubject(e.target.value)}
                placeholder="Unesite naslov pitanja"
                data-testid="input-question-subject"
              />
            </div>
            <div>
              <Label htmlFor="content">Pitanje</Label>
              <Textarea
                id="content"
                value={questionContent}
                onChange={(e) => setQuestionContent(e.target.value)}
                placeholder="Unesite vaše pitanje"
                rows={6}
                data-testid="textarea-question-content"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewQuestionOpen(false)}>
              Odustani
            </Button>
            <Button 
              onClick={handleSendQuestion}
              disabled={sendQuestionMutation.isPending}
              data-testid="button-send-question"
            >
              {sendQuestionMutation.isPending ? "Slanje..." : "Pošalji pitanje"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Message Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-3xl" data-testid="dialog-view-question">
          {selectedMessage && (
            <>
              <DialogHeader>
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <DialogTitle data-testid="text-message-subject">{selectedMessage.subject}</DialogTitle>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">
                      {selectedMessage.senderId === user?.id 
                        ? `Za: ${selectedMessage.recipient?.firstName} ${selectedMessage.recipient?.lastName}` 
                        : `Od: ${selectedMessage.sender?.firstName} ${selectedMessage.sender?.lastName}`}
                    </p>
                    <p className="text-muted-foreground" data-testid="text-message-date">
                      {format(new Date(selectedMessage.createdAt), "dd.MM.yyyy HH:mm")}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="whitespace-pre-wrap" data-testid="text-message-content">
                    {selectedMessage.content}
                  </p>
                </div>

                {selectedMessage.recipientId === user?.id && (
                  <div className="space-y-2">
                    <Label htmlFor="reply">Odgovor</Label>
                    <Textarea
                      id="reply"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Napišite vaš odgovor..."
                      rows={4}
                      data-testid="textarea-reply-content"
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <div className="flex justify-between w-full">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedMessage(null);
                      setReplyContent("");
                    }}
                  >
                    Zatvori
                  </Button>
                  {selectedMessage.recipientId === user?.id && (
                    <Button
                      onClick={handleSendReply}
                      disabled={replyMutation.isPending || !replyContent.trim()}
                      data-testid="button-send-reply"
                    >
                      {replyMutation.isPending ? "Slanje..." : "Pošalji odgovor"}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
