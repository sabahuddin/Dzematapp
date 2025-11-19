import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Visibility,
  Delete,
  EmojiEvents
} from '@mui/icons-material';
import { format } from "date-fns";

interface UserCertificate {
  id: string;
  userId: string;
  templateId: string;
  recipientName: string;
  certificateImagePath: string;
  message: string | null;
  issuedById: string;
  issuedAt: Date | null;
  viewed: boolean | null;
}

interface AllCertificatesPageProps {
  hideHeader?: boolean;
}

export default function AllCertificatesPage({ hideHeader = false }: AllCertificatesPageProps = {}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedCertificate, setSelectedCertificate] = useState<UserCertificate | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [certificateToDelete, setCertificateToDelete] = useState<UserCertificate | null>(null);

  const { data: certificates = [], isLoading } = useQuery<UserCertificate[]>({
    queryKey: ['/api/certificates/all'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (certificateId: string) => {
      return apiRequest(`/api/certificates/${certificateId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/all'] });
      toast({
        title: "Uspješno",
        description: "Zahvalnica je obrisana",
      });
      setDeleteModalOpen(false);
      setCertificateToDelete(null);
    },
    onError: () => {
      toast({
        title: "Greška",
        description: "Neuspješno brisanje zahvalnice",
        variant: "destructive",
      });
    },
  });

  const handleViewCertificate = (certificate: UserCertificate) => {
    setSelectedCertificate(certificate);
    setViewModalOpen(true);
  };

  const handleDeleteClick = (certificate: UserCertificate) => {
    setCertificateToDelete(certificate);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (certificateToDelete) {
      deleteMutation.mutate(certificateToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {!hideHeader && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }} data-testid="text-page-title">
            Sve Zahvale
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pregled svih izdanih zahvalnica
          </Typography>
        </Box>
      )}

      <Card>
        <TableContainer sx={{ overflowX: 'auto' }}>
          {certificates.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 12 }}>
              <EmojiEvents sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }} data-testid="text-no-certificates">
                Nema zahvalnica
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Još nisu izdane nijedne zahvalnice
              </Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Primalac</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Poruka</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Datum izdavanja</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Akcije</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {certificates.map((certificate) => (
                  <TableRow key={certificate.id} data-testid={`row-certificate-${certificate.id}`}>
                    <TableCell data-testid={`text-recipient-${certificate.id}`}>
                      <Typography variant="body2" fontWeight={500}>
                        {certificate.recipientName}
                      </Typography>
                    </TableCell>
                    <TableCell data-testid={`text-message-${certificate.id}`}>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {certificate.message || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell data-testid={`text-date-${certificate.id}`}>
                      <Typography variant="body2">
                        {certificate.issuedAt
                          ? format(new Date(certificate.issuedAt), 'dd.MM.yyyy')
                          : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell data-testid={`text-status-${certificate.id}`}>
                      <Chip
                        label={certificate.viewed ? 'Viđeno' : 'Novo'}
                        color={certificate.viewed ? 'default' : 'primary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleViewCertificate(certificate)}
                          sx={{ color: 'hsl(207 88% 55%)' }}
                          data-testid={`button-view-${certificate.id}`}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(certificate)}
                          sx={{ color: 'hsl(4 90% 58%)' }}
                          data-testid={`button-delete-${certificate.id}`}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Card>

      {/* View Certificate Dialog */}
      <Dialog 
        open={viewModalOpen} 
        onClose={() => setViewModalOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle data-testid="text-modal-title">
          Zahvalnica - {selectedCertificate?.recipientName}
        </DialogTitle>
        <DialogContent>
          {selectedCertificate && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              <img
                src={selectedCertificate.certificateImagePath}
                alt={`Zahvalnica za ${selectedCertificate.recipientName}`}
                style={{ width: '100%', height: 'auto', borderRadius: 8, border: '1px solid hsl(0 0% 88%)' }}
                data-testid="img-modal-certificate"
              />
              {selectedCertificate.message && (
                <Box sx={{ p: 2, bgcolor: 'hsl(0 0% 98%)', borderRadius: 1, border: '1px solid hsl(0 0% 88%)' }} data-testid="text-modal-message">
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>Poruka:</Typography>
                  <Typography variant="body2">{selectedCertificate.message}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Potvrda brisanja</DialogTitle>
        <DialogContent data-testid="dialog-delete-confirm">
          <Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>
            Da li ste sigurni da želite obrisati zahvalnicu za {certificateToDelete?.recipientName}?
            Ova akcija se ne može poništiti.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteModalOpen(false)}
            data-testid="button-cancel-delete"
          >
            Odustani
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleteMutation.isPending}
            data-testid="button-confirm-delete"
          >
            {deleteMutation.isPending ? "Brisanje..." : "Obriši"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
