import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Container, Typography, Box, Card, CardContent, CardHeader, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Chip } from "@mui/material";
import { FileText, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import type { Request } from "@shared/schema";

export default function RequestsPage() {
  const { t } = useTranslation("requests");
  const { toast } = useToast();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});

  const requestTypes = [
    { value: "wedding", label: t("requestTypes.wedding") },
    { value: "mekteb", label: t("requestTypes.mekteb") },
    { value: "facility", label: t("requestTypes.facility") },
    { value: "akika", label: t("requestTypes.akika") }
  ];

  const { data: requests = [], isLoading } = useQuery<Request[]>({
    queryKey: ["/api/requests/my"]
  });

  const submitMutation = useMutation({
    mutationFn: async (data: { requestType: string; formData: Record<string, string> }) => {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: data.requestType,
          formData: JSON.stringify(data.formData),
          status: "pending",
          userId: user!.id
        })
      });
      if (!response.ok) throw new Error("Failed to submit request");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests/my"] });
      toast({
        title: t("toast.success"),
        description: t("toast.successDescription")
      });
      setDialogOpen(false);
      setSelectedType("");
      setFormData({});
    },
    onError: () => {
      toast({
        title: t("toast.error"),
        description: t("toast.errorDescription"),
        variant: "destructive"
      });
    }
  });

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setSelectedType("");
    setFormData({});
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setFormData({});
  };

  const handleSubmit = () => {
    if (!selectedType) {
      toast({
        title: t("toast.error"),
        description: t("toast.selectTypeError"),
        variant: "destructive"
      });
      return;
    }

    submitMutation.mutate({
      requestType: selectedType,
      formData
    });
  };

  const renderForm = () => {
    if (!selectedType) return null;

    const typeLabel = requestTypes.find(t => t.value === selectedType)?.label;

    return (
      <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="h6">{typeLabel}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t("dialog.formNotAvailable")}
        </Typography>
        
        <TextField
          label={t("dialog.noteLabel")}
          value={formData.note || ""}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          multiline
          rows={4}
          fullWidth
          data-testid="input-request-note"
        />
      </Box>
    );
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return t("status.pending");
      case "approved":
        return t("status.approved");
      case "rejected":
        return t("status.rejected");
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "approved":
        return "success";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("bs-BA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getTypeLabel = (type: string) => {
    return requestTypes.find(t => t.value === type)?.label || type;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          {t("title")}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={handleOpenDialog}
          data-testid="button-new-request"
        >
          {t("newRequest")}
        </Button>
      </Box>

      {isLoading ? (
        <Typography>{t("loading")}</Typography>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: "center", py: 4 }}>
              <FileText size={48} style={{ opacity: 0.3, margin: "0 auto" }} />
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                {t("noRequests")}
              </Typography>
              <Button
                variant="outlined"
                onClick={handleOpenDialog}
                sx={{ mt: 2 }}
                data-testid="button-first-request"
              >
                {t("submitFirstRequest")}
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {requests.map((request) => (
            <Card key={request.id} data-testid={`card-request-${request.id}`}>
              <CardHeader
                title={getTypeLabel(request.requestType)}
                subheader={`${t("card.submittedLabel")} ${formatDate(request.createdAt)}`}
                action={
                  <Chip
                    label={getStatusLabel(request.status)}
                    color={getStatusColor(request.status) as any}
                    size="small"
                    data-testid={`status-${request.id}`}
                  />
                }
              />
              <CardContent>
                {request.adminNotes && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t("card.adminNotesLabel")}
                    </Typography>
                    <Typography variant="body2">
                      {request.adminNotes}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t("dialog.title")}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>{t("dialog.selectType")}</InputLabel>
              <Select
                value={selectedType}
                onChange={(e) => handleTypeChange(e.target.value)}
                label={t("dialog.selectType")}
                data-testid="select-request-type"
              >
                {requestTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value} data-testid={`option-${type.value}`}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {renderForm()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} data-testid="button-cancel-request">
            {t("dialog.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!selectedType || submitMutation.isPending}
            data-testid="button-submit-request"
          >
            {submitMutation.isPending ? t("dialog.submitting") : t("dialog.submit")}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
