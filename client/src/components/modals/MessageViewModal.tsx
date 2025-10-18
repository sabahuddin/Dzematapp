import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Reply, Trash2, Users, User } from "lucide-react";
import { format } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface MessageViewModalProps {
  message: {
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
  } | null;
  onClose: () => void;
  onReply: (message: any) => void;
  onDelete: (messageId: string) => void;
}

export default function MessageViewModal({ message, onClose, onReply, onDelete }: MessageViewModalProps) {
  const { user } = useAuth();

  const markAsReadMutation = useMutation({
    mutationFn: (messageId: string) =>
      apiRequest(`/api/messages/${messageId}/read`, "PUT"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
    },
  });

  useEffect(() => {
    if (message && !message.isRead && message.recipientId === user?.id) {
      markAsReadMutation.mutate(message.id);
    }
  }, [message, user?.id]);

  if (!message) return null;

  const isReceived = message.recipientId === user?.id || (message.category && message.senderId !== user?.id);
  const canReply = isReceived && !message.category;

  return (
    <Dialog open={!!message} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl" data-testid="modal-message-view">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {message.category ? (
                <Users className="h-5 w-5 text-muted-foreground" data-testid="icon-category" />
              ) : (
                <User className="h-5 w-5 text-muted-foreground" data-testid="icon-private" />
              )}
              <DialogTitle data-testid="text-subject">{message.subject}</DialogTitle>
            </div>
            {message.category && (
              <Badge variant="secondary" data-testid="badge-category">
                {message.category}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">
                <span className="font-medium">Od:</span>{" "}
                {message.sender?.firstName} {message.sender?.lastName}
              </p>
              {message.recipient && (
                <p className="text-muted-foreground">
                  <span className="font-medium">Za:</span>{" "}
                  {message.recipient.firstName} {message.recipient.lastName}
                </p>
              )}
            </div>
            <p className="text-muted-foreground" data-testid="text-date">
              {format(new Date(message.createdAt), "dd.MM.yyyy HH:mm")}
            </p>
          </div>

          <Separator />

          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap" data-testid="text-content">
              {message.content}
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(message.id);
                onClose();
              }}
              data-testid="button-delete"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Obriši
            </Button>
            <div className="flex space-x-2">
              {canReply && (
                <Button
                  variant="outline"
                  onClick={() => onReply(message)}
                  data-testid="button-reply"
                >
                  <Reply className="h-4 w-4 mr-2" />
                  Odgovori
                </Button>
              )}
              <Button onClick={onClose} data-testid="button-close">
                Zatvori
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
