import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Mail, MailOpen, User, Plus, Search } from "lucide-react";
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

interface ImamQuestion {
  id: string;
  userId: string;
  subject: string;
  question: string;
  answer: string | null;
  isAnswered: boolean;
  isRead: boolean;
  createdAt: string;
  answeredAt: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export default function AskImamPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("my-questions");
  const [isNewQuestionOpen, setIsNewQuestionOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<ImamQuestion | null>(null);
  const [questionSubject, setQuestionSubject] = useState("");
  const [questionContent, setQuestionContent] = useState("");
  const [answerContent, setAnswerContent] = useState("");

  const { data: questions = [], isLoading } = useQuery<ImamQuestion[]>({
    queryKey: ["/api/imam-questions"],
  });

  const myQuestions = user?.isAdmin ? questions : questions.filter(q => q.userId === user?.id);
  const unansweredQuestions = user?.isAdmin ? questions.filter(q => !q.isAnswered) : [];
  const answeredQuestions = user?.isAdmin ? questions.filter(q => q.isAnswered) : [];

  const getQuestionsForTab = () => {
    if (selectedTab === "my-questions") return myQuestions;
    if (selectedTab === "unanswered") return unansweredQuestions;
    if (selectedTab === "answered") return answeredQuestions;
    return myQuestions;
  };

  const filteredQuestions = getQuestionsForTab().filter(
    (q) =>
      q.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.answer && q.answer.toLowerCase().includes(searchQuery.toLowerCase())) ||
      q.user?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.user?.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sendQuestionMutation = useMutation({
    mutationFn: (data: { subject: string; question: string }) => {
      return apiRequest("POST", "/api/imam-questions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/imam-questions"] });
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

  const answerQuestionMutation = useMutation({
    mutationFn: (data: { questionId: string; answer: string }) => {
      return apiRequest("PUT", `/api/imam-questions/${data.questionId}/answer`, { answer: data.answer });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/imam-questions"] });
      toast({ title: "Uspjeh", description: "Odgovor je sačuvan" });
      setSelectedQuestion(null);
      setAnswerContent("");
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
    mutationFn: (questionId: string) =>
      apiRequest("PUT", `/api/imam-questions/${questionId}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/imam-questions"] });
    },
  });

  const handleQuestionClick = (question: ImamQuestion) => {
    setSelectedQuestion(question);
    if (!question.isRead && question.userId === user?.id) {
      markAsReadMutation.mutate(question.id);
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
    sendQuestionMutation.mutate({ subject: questionSubject, question: questionContent });
  };

  const handleSendAnswer = () => {
    if (!answerContent.trim() || !selectedQuestion) {
      toast({ 
        title: "Greška", 
        description: "Molimo unesite odgovor", 
        variant: "destructive" 
      });
      return;
    }
    answerQuestionMutation.mutate({ questionId: selectedQuestion.id, answer: answerContent });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pitaj Imama</h1>
          <p className="text-muted-foreground">
            {user?.isAdmin ? "Odgovori na pitanja članova" : "Postavite pitanje i dobijte odgovor od imama"}
          </p>
        </div>
        {!user?.isAdmin && (
          <Button onClick={() => setIsNewQuestionOpen(true)} data-testid="button-new-question">
            <Plus className="h-4 w-4 mr-2" />
            Novo Pitanje
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pretraži pitanja..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
          data-testid="input-search"
        />
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="my-questions" data-testid="tab-my-questions">
            {user?.isAdmin ? "Sva Pitanja" : "Moja Pitanja"}
          </TabsTrigger>
          {user?.isAdmin && (
            <>
              <TabsTrigger value="unanswered" data-testid="tab-unanswered">
                Neodgovorena
                {unansweredQuestions.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unansweredQuestions.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="answered" data-testid="tab-answered">
                Arhiva
                {answeredQuestions.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {answeredQuestions.length}
                  </Badge>
                )}
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="my-questions" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
                <p className="mt-2 text-muted-foreground">Učitavanje...</p>
              </CardContent>
            </Card>
          ) : filteredQuestions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Nema pitanja</p>
              </CardContent>
            </Card>
          ) : (
            filteredQuestions.map((question) => (
              <Card
                key={question.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !question.isRead && question.userId === user?.id ? 'border-l-4 border-l-primary bg-blue-50' : ''
                }`}
                onClick={() => handleQuestionClick(question)}
                data-testid={`question-card-${question.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {question.isAnswered ? (
                        <MailOpen className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      )}
                      <div className="flex-1">
                        <CardTitle className="text-lg">{question.subject}</CardTitle>
                        {user?.isAdmin && question.user && (
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <User className="h-3 w-3" />
                            {question.user.firstName} {question.user.lastName}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {question.isAnswered ? (
                        <Badge variant="default">Odgovoreno</Badge>
                      ) : (
                        <Badge variant="secondary">Na čekanju</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(question.createdAt), "dd.MM.yyyy.")}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{question.question}</p>
                  {question.isAnswered && question.answer && (
                    <div className="mt-3 p-3 bg-green-50 rounded-md border border-green-200">
                      <p className="text-sm font-medium text-green-900">Odgovor:</p>
                      <p className="text-sm text-green-800 mt-1 line-clamp-2">{question.answer}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {user?.isAdmin && (
          <TabsContent value="unanswered" className="space-y-4">
            {unansweredQuestions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <MailOpen className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">Nema neodgovorenih pitanja</p>
                </CardContent>
              </Card>
            ) : (
              unansweredQuestions.map((question) => (
                <Card
                  key={question.id}
                  className="cursor-pointer transition-all hover:shadow-md border-l-4 border-l-orange-500"
                  onClick={() => handleQuestionClick(question)}
                  data-testid={`question-card-${question.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <Mail className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div className="flex-1">
                          <CardTitle className="text-lg">{question.subject}</CardTitle>
                          {question.user && (
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <User className="h-3 w-3" />
                              {question.user.firstName} {question.user.lastName}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(question.createdAt), "dd.MM.yyyy.")}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{question.question}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        )}

        {user?.isAdmin && (
          <TabsContent value="answered" className="space-y-4">
            {answeredQuestions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <MailOpen className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">Nema odgovorenih pitanja</p>
                </CardContent>
              </Card>
            ) : (
              filteredQuestions.map((question) => (
                <Card
                  key={question.id}
                  className="cursor-pointer transition-all hover:shadow-md border-l-4 border-l-green-500"
                  onClick={() => handleQuestionClick(question)}
                  data-testid={`question-card-${question.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <MailOpen className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <CardTitle className="text-lg">{question.subject}</CardTitle>
                          {question.user && (
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <User className="h-3 w-3" />
                              {question.user.firstName} {question.user.lastName}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="default">Odgovoreno</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(question.createdAt), "dd.MM.yyyy.")}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{question.question}</p>
                    {question.answer && (
                      <div className="mt-3 p-3 bg-green-50 rounded-md border border-green-200">
                        <p className="text-sm font-medium text-green-900">Odgovor:</p>
                        <p className="text-sm text-green-800 mt-1 line-clamp-2">{question.answer}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* New Question Dialog */}
      <Dialog open={isNewQuestionOpen} onOpenChange={setIsNewQuestionOpen}>
        <DialogContent data-testid="dialog-new-question">
          <DialogHeader>
            <DialogTitle>Novo Pitanje za Imama</DialogTitle>
            <DialogDescription>
              Postavite pitanje i dobićete odgovor od imama
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Tema</Label>
              <Input
                id="subject"
                placeholder="Unesite temu pitanja..."
                value={questionSubject}
                onChange={(e) => setQuestionSubject(e.target.value)}
                data-testid="input-question-subject"
              />
            </div>
            <div>
              <Label htmlFor="question">Pitanje</Label>
              <Textarea
                id="question"
                placeholder="Unesite vaše pitanje..."
                rows={6}
                value={questionContent}
                onChange={(e) => setQuestionContent(e.target.value)}
                data-testid="textarea-question-content"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewQuestionOpen(false)}
              data-testid="button-cancel-question"
            >
              Otkaži
            </Button>
            <Button
              onClick={handleSendQuestion}
              disabled={sendQuestionMutation.isPending}
              data-testid="button-send-question"
            >
              {sendQuestionMutation.isPending ? "Slanje..." : "Pošalji"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Details Dialog */}
      <Dialog open={!!selectedQuestion} onOpenChange={() => setSelectedQuestion(null)}>
        <DialogContent className="max-w-2xl" data-testid="dialog-question-details">
          <DialogHeader>
            <DialogTitle>{selectedQuestion?.subject}</DialogTitle>
            <DialogDescription>
              {selectedQuestion?.user && (
                <span>Od: {selectedQuestion.user.firstName} {selectedQuestion.user.lastName}</span>
              )}
              {" • "}
              {selectedQuestion?.createdAt && format(new Date(selectedQuestion.createdAt), "dd.MM.yyyy. u HH:mm")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Pitanje:</Label>
              <p className="mt-2 text-sm whitespace-pre-wrap bg-muted p-4 rounded-md">
                {selectedQuestion?.question}
              </p>
            </div>
            
            {selectedQuestion?.isAnswered && selectedQuestion.answer ? (
              <div>
                <Label>Odgovor:</Label>
                <p className="mt-2 text-sm whitespace-pre-wrap bg-green-50 p-4 rounded-md border border-green-200">
                  {selectedQuestion.answer}
                </p>
                {selectedQuestion.answeredAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Odgovoreno: {format(new Date(selectedQuestion.answeredAt), "dd.MM.yyyy. u HH:mm")}
                  </p>
                )}
              </div>
            ) : user?.isAdmin ? (
              <div>
                <Label htmlFor="answer">Odgovor:</Label>
                <Textarea
                  id="answer"
                  placeholder="Unesite odgovor..."
                  rows={6}
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                  data-testid="textarea-answer"
                />
              </div>
            ) : (
              <div className="p-4 bg-orange-50 rounded-md border border-orange-200">
                <p className="text-sm text-orange-800">
                  Vaše pitanje je primljeno. Odgovor ćete dobiti uskoro.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            {user?.isAdmin && !selectedQuestion?.isAnswered && (
              <Button
                onClick={handleSendAnswer}
                disabled={answerQuestionMutation.isPending}
                data-testid="button-send-answer"
              >
                {answerQuestionMutation.isPending ? "Slanje..." : "Pošalji Odgovor"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
