import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";

const messageFormSchema = z.object({
  messageType: z.enum(["private", "category"]),
  recipientId: z.string().optional(),
  category: z.string().optional(),
  subject: z.string().min(1, "Naslov je obavezan"),
  content: z.string().min(1, "Sadržaj je obavezan"),
}).refine((data) => {
  if (data.messageType === "private") {
    return !!data.recipientId;
  }
  if (data.messageType === "category") {
    return !!data.category;
  }
  return false;
}, {
  message: "Morate izabrati primaoca ili kategoriju",
  path: ["recipientId"],
});

type MessageFormData = z.infer<typeof messageFormSchema>;

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  replyTo?: {
    id: string;
    senderId: string;
    subject: string;
    sender: {
      firstName: string;
      lastName: string;
    } | null;
  } | null;
}

export default function NewMessageModal({ isOpen, onClose, replyTo }: NewMessageModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: isOpen,
  });

  const canSendCategoryMessages = user?.isAdmin || user?.roles?.includes('clan_io');

  const categories = ["Muškarci", "Žene", "Roditelji", "Omladina"];

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      messageType: canSendCategoryMessages ? "private" : "private",
      recipientId: "",
      category: "",
      subject: "",
      content: "",
    },
  });

  const messageType = form.watch("messageType");

  useEffect(() => {
    if (replyTo) {
      form.reset({
        messageType: "private",
        recipientId: replyTo.senderId,
        category: "",
        subject: `Re: ${replyTo.subject}`,
        content: "",
      });
    }
  }, [replyTo, form]);

  const createMessageMutation = useMutation({
    mutationFn: (data: MessageFormData) => {
      const messageData = {
        senderId: user!.id,
        recipientId: data.messageType === "private" ? data.recipientId : null,
        category: data.messageType === "category" ? data.category : null,
        subject: data.subject,
        content: data.content,
      };
      return apiRequest("/api/messages", "POST", messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      toast({
        title: "Uspjeh",
        description: "Poruka je uspješno poslana",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Greška",
        description: error.message || "Nije moguće poslati poruku",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MessageFormData) => {
    createMessageMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl" data-testid="modal-new-message">
        <DialogHeader>
          <DialogTitle>Nova poruka</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {canSendCategoryMessages && (
              <FormField
                control={form.control}
                name="messageType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tip poruke</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!!replyTo}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-message-type">
                          <SelectValue placeholder="Izaberite tip poruke" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="private">Privatna</SelectItem>
                        <SelectItem value="category">Kategorijska</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {messageType === "private" && (
              <FormField
                control={form.control}
                name="recipientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primalac</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!!replyTo}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-recipient">
                          <SelectValue placeholder="Izaberite primaoca" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users
                          .filter((u) => {
                            // Don't show current user
                            if (u.id === user?.id) return false;
                            
                            // For non-admin users, only show admins
                            if (!user?.isAdmin) {
                              return u.isAdmin;
                            }
                            
                            return true;
                          })
                          .map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.firstName} {u.lastName} ({u.email})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {messageType === "category" && (
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategorija</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Izaberite kategoriju" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Naslov</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Unesite naslov poruke"
                      data-testid="input-subject"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sadržaj</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Unesite sadržaj poruke"
                      rows={8}
                      data-testid="textarea-content"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                data-testid="button-cancel"
              >
                Otkaži
              </Button>
              <Button
                type="submit"
                disabled={createMessageMutation.isPending}
                data-testid="button-send"
              >
                {createMessageMutation.isPending ? "Slanje..." : "Pošalji"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
