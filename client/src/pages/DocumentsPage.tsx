import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Container, Typography, Box, Card, CardContent, CardHeader, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material";
import { Download, Delete, Upload, FileText, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import type { Document } from "@shared/schema";

export default function DocumentsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: "",
    description: "",
    file: null as File | null
  });

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
        title: "Uspješno",
        description: "Dokument je uspješno dodat"
      });
      setUploadDialogOpen(false);
      setUploadData({ title: "", description: "", file: null });
    },
    onError: () => {
      toast({
        title: "Greška",
        description: "Nije moguće dodati dokument",
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
        title: "Uspješno",
        description: "Dokument je obrisan"
      });
    }
  });

  const handleUpload = () => {
    if (!uploadData.file || !uploadData.title) {
      toast({
        title: "Greška",
        description: "Molimo unesite naslov i odaberite PDF fajl",
        variant: "destructive"
      });
      return;
    }

    if (uploadData.file.type !== "application/pdf") {
      toast({
        title: "Greška",
        description: "Samo PDF fajlovi su dozvoljeni",
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
    window.open(doc.filePath, "_blank");
  };

  const handleDownload = (doc: Document) => {
    const link = document.createElement("a");
    link.href = doc.filePath;
    link.download = doc.fileName;
    link.click();
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
          Dokumenti
        </Typography>
        {user?.isAdmin && (
          <Button
            variant="contained"
            startIcon={<Upload />}
            onClick={() => setUploadDialogOpen(true)}
            data-testid="button-add-document"
          >
            Dodaj Dokument
          </Button>
        )}
      </Box>

      {isLoading ? (
        <Typography>Učitavanje...</Typography>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: "center", py: 4 }}>
              <FileText size={48} style={{ opacity: 0.3, margin: "0 auto" }} />
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                Nema dostupnih dokumenata
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
                subheader={`Dodato: ${formatDate(doc.uploadedAt)} • ${formatFileSize(doc.fileSize)}`}
                action={
                  <Box>
                    <IconButton
                      onClick={() => handleViewPdf(doc)}
                      data-testid={`button-view-${doc.id}`}
                      title="Pregledaj PDF"
                      color="primary"
                    >
                      <Eye />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDownload(doc)}
                      data-testid={`button-download-${doc.id}`}
                      title="Preuzmi"
                    >
                      <Download />
                    </IconButton>
                    {user?.isAdmin && (
                      <IconButton
                        onClick={() => deleteMutation.mutate(doc.id)}
                        color="error"
                        data-testid={`button-delete-${doc.id}`}
                        title="Obriši"
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
        <DialogTitle>Dodaj Novi Dokument</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="Naslov dokumenta"
              value={uploadData.title}
              onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
              fullWidth
              required
              data-testid="input-document-title"
            />
            <TextField
              label="Opis (opciono)"
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
                {uploadData.file ? uploadData.file.name : "Odaberi PDF Fajl"}
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
                  Veličina: {formatFileSize(uploadData.file.size)}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} data-testid="button-cancel-upload">
            Otkaži
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={uploadMutation.isPending}
            data-testid="button-confirm-upload"
          >
            {uploadMutation.isPending ? "Dodavanje..." : "Dodaj"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
