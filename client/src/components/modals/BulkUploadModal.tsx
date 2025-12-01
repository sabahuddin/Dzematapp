import { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import { CloudUpload, Download, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';

interface BulkUploadModalProps {
  open: boolean;
  onClose: () => void;
}

interface UploadResult {
  successCount: number;
  errorCount: number;
  results: {
    success: Array<{ row: number; user: { firstName: string; lastName: string; username: string } }>;
    errors: Array<{ row: number; errors: string[] }>;
  };
}

export default function BulkUploadModal({ open, onClose }: BulkUploadModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const downloadTemplateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/users/template', 'GET');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'DzematApp_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({ title: 'Uspjeh', description: 'Template fajl je preuzet' });
    },
    onError: (error: Error) => {
      toast({ title: 'Greška', description: error.message || 'Greška pri preuzimanju template fajla', variant: 'destructive' });
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiRequest('/api/users/bulk-upload', 'POST', formData);
      return response.json();
    },
    onSuccess: (data: UploadResult) => {
      setUploadResult(data);
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.tenantId] });
      
      if (data.errorCount === 0) {
        toast({ 
          title: 'Uspjeh', 
          description: `Uspješno importovano ${data.successCount} korisnika` 
        });
      } else {
        toast({ 
          title: 'Djelimičan uspjeh', 
          description: `Importovano ${data.successCount} korisnika, ${data.errorCount} greški`,
          variant: 'destructive'
        });
      }
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Greška', 
        description: error.message || 'Greška pri upload-u fajla', 
        variant: 'destructive' 
      });
    }
  });

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && 
        file.type !== 'application/vnd.ms-excel') {
      toast({ 
        title: 'Greška', 
        description: 'Molimo uploadujte Excel fajl (.xlsx ili .xls)', 
        variant: 'destructive' 
      });
      return;
    }

    setSelectedFile(file);
    setUploadResult(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadResult(null);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      data-testid="dialog-bulk-upload"
    >
      <DialogTitle>
        Bulk Upload Korisnika
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => downloadTemplateMutation.mutate()}
            disabled={downloadTemplateMutation.isPending}
            fullWidth
            data-testid="button-download-template"
          >
            {downloadTemplateMutation.isPending ? 'Preuzimanje...' : 'Preuzmi Template'}
          </Button>
        </Box>

        <Box
          sx={{
            border: '2px dashed',
            borderColor: isDragging ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            backgroundColor: isDragging ? 'action.hover' : 'background.paper',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'action.hover'
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          data-testid="dropzone-upload"
        >
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {selectedFile ? selectedFile.name : 'Prevucite fajl ovdje ili kliknite za upload'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Podržani formati: .xlsx, .xls
          </Typography>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
            data-testid="input-file"
          />
        </Box>

        {uploadMutation.isPending && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              Upload u toku...
            </Typography>
          </Box>
        )}

        {uploadResult && (
          <Box sx={{ mt: 3 }}>
            <Alert 
              severity={uploadResult.errorCount === 0 ? 'success' : 'warning'}
              sx={{ mb: 2 }}
              data-testid="alert-upload-result"
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Rezultat importa:
              </Typography>
              <Typography variant="body2">
                ✓ Uspješno: {uploadResult.successCount} korisnika
              </Typography>
              {uploadResult.errorCount > 0 && (
                <Typography variant="body2">
                  ✗ Greške: {uploadResult.errorCount} redova
                </Typography>
              )}
            </Alert>

            {uploadResult.results.success.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Uspješno importovani korisnici:
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Red</TableCell>
                        <TableCell>Ime i Prezime</TableCell>
                        <TableCell>Korisničko ime</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {uploadResult.results.success.map((item) => (
                        <TableRow key={item.row} data-testid={`success-row-${item.row}`}>
                          <TableCell>{item.row}</TableCell>
                          <TableCell>
                            {item.user.firstName} {item.user.lastName}
                          </TableCell>
                          <TableCell>{item.user.username}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {uploadResult.results.errors.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'error.main' }}>
                  Greške pri importu:
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Red</TableCell>
                        <TableCell>Greške</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {uploadResult.results.errors.map((error) => (
                        <TableRow key={error.row} data-testid={`error-row-${error.row}`}>
                          <TableCell>{error.row}</TableCell>
                          <TableCell>
                            {error.errors.map((err, idx) => (
                              <Chip
                                key={idx}
                                label={err}
                                color="error"
                                size="small"
                                icon={<ErrorIcon />}
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={handleClose} 
          data-testid="button-close"
        >
          Zatvori
        </Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!selectedFile || uploadMutation.isPending}
          data-testid="button-upload"
        >
          {uploadMutation.isPending ? 'Upload...' : 'Upload Fajl'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
