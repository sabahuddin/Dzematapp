import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Box, 
  Button, 
  Card, 
  TextField, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Chip, 
  IconButton, 
  Typography, 
  Alert,
  CircularProgress,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Add,
  Visibility,
  Reply,
  Mail,
  DraftsOutlined
} from '@mui/icons-material';
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMarkAsViewed } from "@/hooks/useMarkAsViewed";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";

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
  const { t } = useTranslation(['askImam', 'common']);
  const { user } = useAuth();
  const { toast } = useToast();
  useMarkAsViewed('imamQuestions');
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isNewQuestionOpen, setIsNewQuestionOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<ImamQuestion | null>(null);
  const [questionSubject, setQuestionSubject] = useState("");
  const [questionContent, setQuestionContent] = useState("");
  const [answerContent, setAnswerContent] = useState("");

  const { data: questions = [], isLoading } = useQuery<ImamQuestion[]>({
    queryKey: ["/api/imam-questions"],
  });

  const myQuestions = user?.isAdmin ? questions : questions.filter(q => q.userId === user?.id);

  const sendQuestionMutation = useMutation({
    mutationFn: (data: { subject: string; question: string }) => {
      return apiRequest("/api/imam-questions", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/imam-questions"] });
      toast({ title: t('common:common.success'), description: t('askImam:questionSent') });
      setIsNewQuestionOpen(false);
      setQuestionSubject("");
      setQuestionContent("");
    },
    onError: () => {
      toast({ 
        title: t('common:common.error'), 
        description: t('askImam:questionSentError'), 
        variant: "destructive" 
      });
    },
  });

  const answerQuestionMutation = useMutation({
    mutationFn: (data: { questionId: string; answer: string }) => {
      return apiRequest(`/api/imam-questions/${data.questionId}/answer`, "PUT", { answer: data.answer });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/imam-questions"] });
      toast({ title: t('common:common.success'), description: t('askImam:answerSaved') });
      setSelectedQuestion(null);
      setAnswerContent("");
    },
    onError: () => {
      toast({ 
        title: t('common:common.error'), 
        description: t('askImam:answerSavedError'), 
        variant: "destructive" 
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (questionId: string) =>
      apiRequest(`/api/imam-questions/${questionId}/read`, "PUT", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/imam-questions"] });
    },
  });

  const handleQuestionClick = (question: ImamQuestion) => {
    setSelectedQuestion(question);
    setAnswerContent(question.answer || "");
    if (!question.isRead && question.userId === user?.id) {
      markAsReadMutation.mutate(question.id);
    }
  };

  const handleSendQuestion = () => {
    if (!questionSubject.trim() || !questionContent.trim()) {
      toast({ 
        title: t('common:common.error'), 
        description: t('askImam:fillAllFields'), 
        variant: "destructive" 
      });
      return;
    }
    sendQuestionMutation.mutate({ subject: questionSubject, question: questionContent });
  };

  const handleSendAnswer = () => {
    if (!answerContent.trim() || !selectedQuestion) {
      toast({ 
        title: t('common:common.error'), 
        description: t('askImam:enterAnswer'), 
        variant: "destructive" 
      });
      return;
    }
    answerQuestionMutation.mutate({ questionId: selectedQuestion.id, answer: answerContent });
  };

  const statusOptions = user?.isAdmin 
    ? ['Svi', 'Neodgovorena', 'Arhiva'] 
    : [];

  const filteredQuestions = myQuestions.filter((q) => {
    const matchesSearch = 
      q.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.answer && q.answer.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (q.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesStatus = 
      !statusFilter || statusFilter === 'Svi' ||
      (statusFilter === 'Neodgovorena' && !q.isAnswered) ||
      (statusFilter === 'Arhiva' && q.isAnswered);

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {t('askImam:title')}
        </Typography>
        {!user?.isAdmin && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsNewQuestionOpen(true)}
            data-testid="button-new-question"
          >
            {t('askImam:newQuestion')}
          </Button>
        )}
      </Box>

      <Card>
        <Box sx={{ p: 3, borderBottom: '1px solid hsl(0 0% 88%)', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            variant="outlined"
            placeholder={t('askImam:searchQuestions')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: 250, flex: 1, maxWidth: 400 }}
            data-testid="input-search"
          />
          {user?.isAdmin && (
            <Autocomplete
              options={statusOptions}
              value={statusFilter || null}
              onChange={(event, newValue) => setStatusFilter(newValue || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  placeholder="Filtriraj po statusu"
                  data-testid="input-status-filter"
                />
              )}
              sx={{ minWidth: 250, flex: 1, maxWidth: 400 }}
              data-testid="autocomplete-status-filter"
            />
          )}
        </Box>

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Tema</TableCell>
                {user?.isAdmin && <TableCell sx={{ fontWeight: 600 }}>Autor</TableCell>}
                <TableCell sx={{ fontWeight: 600 }}>Datum objave</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Akcije</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredQuestions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={user?.isAdmin ? 5 : 4} align="center" sx={{ py: 8 }}>
                    <Mail sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      {t('askImam:noQuestions')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuestions.map((question) => (
                  <TableRow key={question.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {question.subject}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {question.question.substring(0, 80)}
                        {question.question.length > 80 ? '...' : ''}
                      </Typography>
                    </TableCell>
                    {user?.isAdmin && (
                      <TableCell>
                        {question.user ? (
                          <Typography variant="body2">
                            {question.user.firstName} {question.user.lastName}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      {format(new Date(question.createdAt), "dd.MM.yyyy.")}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={question.isAnswered ? t('askImam:answered') : t('askImam:pending')}
                        color={question.isAnswered ? 'success' : 'warning'}
                        size="small"
                        data-testid={`status-${question.id}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleQuestionClick(question)}
                          data-testid={`button-view-${question.id}`}
                        >
                          <Visibility fontSize="small" sx={{ color: 'hsl(207 88% 55%)' }} />
                        </IconButton>
                        {user?.isAdmin && !question.isAnswered && (
                          <IconButton
                            size="small"
                            onClick={() => handleQuestionClick(question)}
                            data-testid={`button-reply-${question.id}`}
                          >
                            <Reply fontSize="small" sx={{ color: 'hsl(120 68% 42%)' }} />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* New Question Dialog */}
      <Dialog 
        open={isNewQuestionOpen} 
        onClose={() => setIsNewQuestionOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('askImam:askQuestion')}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div>
              <Label htmlFor="subject">{t('askImam:topic')}</Label>
              <Input
                id="subject"
                placeholder={t('askImam:topicPlaceholder')}
                value={questionSubject}
                onChange={(e) => setQuestionSubject(e.target.value)}
                data-testid="input-question-subject"
              />
            </div>
            <div>
              <Label htmlFor="question">{t('askImam:question')}</Label>
              <Textarea
                id="question"
                placeholder={t('askImam:questionPlaceholder')}
                rows={6}
                value={questionContent}
                onChange={(e) => setQuestionContent(e.target.value)}
                data-testid="textarea-question-content"
              />
            </div>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsNewQuestionOpen(false)}
            data-testid="button-cancel-question"
          >
            {t('common:buttons.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSendQuestion}
            disabled={sendQuestionMutation.isPending}
            data-testid="button-send-question"
          >
            {sendQuestionMutation.isPending ? t('askImam:sending') : t('common:buttons.send')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Question Details Dialog */}
      <Dialog 
        open={!!selectedQuestion} 
        onClose={() => setSelectedQuestion(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedQuestion?.subject}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {selectedQuestion?.user && (
                  <span>{t('askImam:from')}: {selectedQuestion.user.firstName} {selectedQuestion.user.lastName}</span>
                )}
                {" • "}
                {selectedQuestion?.createdAt && format(new Date(selectedQuestion.createdAt), "dd.MM.yyyy. u HH:mm")}
              </Typography>
            </Box>

            <div>
              <Label>{t('askImam:questionColon')}</Label>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'hsl(0 0% 98%)', borderRadius: 1, border: '1px solid hsl(0 0% 88%)' }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedQuestion?.question}
                </Typography>
              </Box>
            </div>
            
            {selectedQuestion?.isAnswered && selectedQuestion.answer ? (
              <div>
                <Label>{t('askImam:answerColon')}</Label>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'hsl(120 60% 95%)', borderRadius: 1, border: '1px solid hsl(123 46% 64%)' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'hsl(122 60% 20%)' }}>
                    {selectedQuestion.answer}
                  </Typography>
                </Box>
                {selectedQuestion.answeredAt && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    {t('askImam:answeredOn')}: {format(new Date(selectedQuestion.answeredAt), "dd.MM.yyyy. u HH:mm")}
                  </Typography>
                )}
              </div>
            ) : user?.isAdmin ? (
              <div>
                <Label htmlFor="answer">{t('askImam:answerColon')}</Label>
                <Textarea
                  id="answer"
                  placeholder={t('askImam:answerPlaceholder')}
                  rows={6}
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                  data-testid="textarea-answer"
                />
              </div>
            ) : (
              <Box sx={{ p: 2, bgcolor: 'hsl(36 100% 94%)', borderRadius: 1, border: '1px solid hsl(35 100% 66%)' }}>
                <Typography variant="body2" sx={{ color: 'hsl(14 100% 45%)' }}>
                  {t('askImam:questionReceived')}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          {user?.isAdmin && !selectedQuestion?.isAnswered && (
            <Button
              variant="contained"
              onClick={handleSendAnswer}
              disabled={answerQuestionMutation.isPending}
              data-testid="button-send-answer"
            >
              {answerQuestionMutation.isPending ? t('askImam:sending') : t('askImam:sendAnswer')}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
