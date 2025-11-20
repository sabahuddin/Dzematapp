import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Container, Typography, Box, Card, CardContent, CardHeader, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material";
import { Download, Delete, Upload, FileText, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import type { Document } from "@shared/schema";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradeCTA } from "@/components/UpgradeCTA";

export default function DocumentsPage() {
  const { t } = useTranslation(['documents']);
  const { toast } = useToast();
  const { user } = useAuth();
  const featureAccess = useFeatureAccess('documents');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: "",
    description: "",
    file: null as File | null
  });

  if (featureAccess.upgradeRequired) {
    return <UpgradeCTA moduleId="documents" requiredPlan={featureAccess.requiredPlan || 'standard'} currentPlan={featureAccess.currentPlan || 'basic'} />;
  }

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"]
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; file: File }) => {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64 = reader.result as string;
            const response = await fetch("/api/documents", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: data.title,
                description: data.description || null,
                fileName: data.file.name,
                filePath: base64,
                fileSize: data.file.size,
                uploadedById: user!.id
              })
            });
            if (!response.ok) throw new Error("Failed to upload");
            resolve(await response.json());
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(data.file);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: t('success'),
        description: t('documentAddedSuccess')
      });
      setUploadDialogOpen(false);
      setUploadData({ title: "", description: "", file: null });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('cannotAddDocument'),
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to delete");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: t('success'),
        description: t('documentDeletedSuccess')
      });
    }
  });

  const handleUpload = () => {
    if (!uploadData.file || !uploadData.title) {
      toast({
        title: t('error'),
        description: t('enterTitleAndFile'),
        variant: "destructive"
      });
      return;
    }

    if (uploadData.file.type !== "application/pdf") {
      toast({
        title: t('error'),
        description: t('onlyPdfAllowed'),
        variant: "destructive"
      });
      return;
    }

    uploadMutation.mutate({
      title: uploadData.title,
      description: uploadData.description,
      file: uploadData.file
    });
  };

  const handleViewPdf = (doc: Document) => {
    try {
      const byteCharacters = atob(doc.filePath.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      toast({
        title: t('error'),
        description: t('cannotOpenPdf'),
        variant: "destructive"
      });
    }
  };

  const handleDownload = (doc: Document) => {
    try {
      const byteCharacters = atob(doc.filePath.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.fileName;
      link.click();
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      toast({
        title: t('error'),
        description: t('cannotDownloadPdf'),
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          {t('title')}
        </Typography>
        {user?.isAdmin && (
          <Button
            variant="contained"
            startIcon={<Upload />}
            onClick={() => setUploadDialogOpen(true)}
            data-testid="button-add-document"
          >
            {t('addDocument')}
          </Button>
        )}
      </Box>

      {isLoading ? (
        <Typography>{t('loading')}</Typography>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: "center", py: 4 }}>
              <FileText size={48} style={{ opacity: 0.3, margin: "0 auto" }} />
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                {t('noDocumentsAvailable')}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {documents.map((doc) => (
            <Card key={doc.id} data-testid={`card-document-${doc.id}`}>
              <CardHeader
                title={doc.title}
                subheader={`${t('added')} ${formatDate(doc.uploadedAt)} • ${formatFileSize(doc.fileSize)}`}
                action={
                  <Box>
                    <IconButton
                      onClick={() => handleViewPdf(doc)}
                      data-testid={`button-view-${doc.id}`}
                      title={t('viewPdf')}
                      color="primary"
                    >
                      <Eye />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDownload(doc)}
                      data-testid={`button-download-${doc.id}`}
                      title={t('download')}
                    >
                      <Download />
                    </IconButton>
                    {user?.isAdmin && (
                      <IconButton
                        onClick={() => deleteMutation.mutate(doc.id)}
                        color="error"
                        data-testid={`button-delete-${doc.id}`}
                        title={t('delete')}
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </Box>
                }
              />
              {doc.description && (
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    {doc.description}
                  </Typography>
                </CardContent>
              )}
            </Card>
          ))}
        </Box>
      )}

      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('addNewDocument')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label={t('documentTitle')}
              value={uploadData.title}
              onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
              fullWidth
              required
              data-testid="input-document-title"
            />
            <TextField
              label={t('descriptionOptional')}
              value={uploadData.description}
              onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              data-testid="input-document-description"
            />
            <Box>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                data-testid="button-select-file"
              >
                {uploadData.file ? uploadData.file.name : t('selectPdfFile')}
                <input
                  type="file"
                  hidden
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadData({ ...uploadData, file });
                    }
                  }}
                />
              </Button>
              {uploadData.file && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                  {t('fileSize')} {formatFileSize(uploadData.file.size)}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} data-testid="button-cancel-upload">
            {t('cancel')}
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={uploadMutation.isPending}
            data-testid="button-confirm-upload"
          >
            {uploadMutation.isPending ? t('adding') : t('add')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
