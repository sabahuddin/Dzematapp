import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Avatar,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Visibility, CheckCircle, Cancel, Delete, Print } from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { MembershipApplication } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export function MembershipApplicationsList() {
  const { t } = useTranslation('membershipFees');
  const [selectedApplication, setSelectedApplication] = useState<MembershipApplication | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved');
  const { toast } = useToast();

  const { data: applications = [], isLoading } = useQuery<MembershipApplication[]>({
    queryKey: ['/api/membership-applications'],
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const response = await apiRequest(`/api/membership-applications/${id}/review`, 'PATCH', {
        status,
        reviewNotes: notes,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/membership-applications'] });
      toast({
        title: t('messages.reviewSuccess'),
        description: t('messages.reviewSuccess'),
      });
      setReviewDialogOpen(false);
      setSelectedApplication(null);
      setReviewNotes('');
    },
    onError: () => {
      toast({
        title: t('messages.reviewError'),
        description: t('messages.reviewError'),
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/membership-applications/${id}`, 'DELETE');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/membership-applications'] });
      toast({
        title: t('messages.deleteSuccess'),
        description: t('messages.deleteSuccess'),
      });
    },
    onError: () => {
      toast({
        title: t('messages.deleteError'),
        description: t('messages.deleteError'),
        variant: 'destructive',
      });
    },
  });

  const handleViewDetails = (application: MembershipApplication) => {
    setSelectedApplication(application);
  };

  const handleReview = (application: MembershipApplication, action: 'approved' | 'rejected') => {
    setSelectedApplication(application);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const handleConfirmReview = () => {
    if (!selectedApplication) return;
    reviewMutation.mutate({
      id: selectedApplication.id,
      status: reviewAction,
      notes: reviewNotes,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm(t('messages.deleteConfirm'))) {
      deleteMutation.mutate(id);
    }
  };

  const handlePrint = (application: MembershipApplication) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Pristupnica - ${application.firstName} ${application.lastName}</title>
          <style>
            @page { margin: 10mm; size: A4; }
            * { box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 0; 
              margin: 0;
              color: #333;
              line-height: 1.3;
              font-size: 11px;
            }
            .container { width: 100%; padding: 5px; }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #3949AB; 
              padding-bottom: 8px; 
              margin-bottom: 12px; 
            }
            .header h1 { 
              color: #3949AB; 
              margin: 0 0 4px 0; 
              font-size: 20px;
            }
            .header .subtitle {
              color: #666;
              font-size: 11px;
            }
            .photo-section {
              text-align: center;
              margin-bottom: 12px;
            }
            .photo-section img {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              object-fit: cover;
              border: 2px solid #3949AB;
            }
            .section { 
              margin-bottom: 10px; 
              page-break-inside: avoid;
            }
            .section-title { 
              background: #3949AB; 
              color: white; 
              padding: 5px 10px; 
              margin-bottom: 8px;
              font-size: 12px;
              font-weight: 600;
              border-radius: 3px;
            }
            .fields-grid { 
              display: grid; 
              grid-template-columns: repeat(3, 1fr); 
              gap: 6px; 
            }
            .field { 
              padding: 6px 8px;
              background: #f8f9fa;
              border-radius: 3px;
              border-left: 2px solid #1E88E5;
            }
            .field.full-width { grid-column: span 3; }
            .field.half-width { grid-column: span 2; }
            .field-label { 
              font-size: 9px; 
              color: #666; 
              text-transform: uppercase;
              letter-spacing: 0.3px;
              margin-bottom: 2px;
            }
            .field-value { 
              font-size: 11px; 
              color: #333;
              font-weight: 500;
            }
            .status-badge {
              display: inline-block;
              padding: 3px 10px;
              border-radius: 12px;
              font-weight: 600;
              font-size: 10px;
            }
            .status-pending { background: #FFF3E0; color: #E65100; }
            .status-approved { background: #E8F5E9; color: #2E7D32; }
            .status-rejected { background: #FFEBEE; color: #C62828; }
            .footer {
              margin-top: 15px;
              padding-top: 8px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #666;
              font-size: 9px;
            }
            .signature-section {
              margin-top: 20px;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 30px;
            }
            .signature-box {
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #333;
              margin-top: 35px;
              padding-top: 5px;
              font-size: 10px;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>PRISTUPNICA</h1>
              <div class="subtitle">Zahtjev za članstvo u džematu</div>
            </div>
            
            ${application.photo ? `
              <div class="photo-section">
                <img src="${application.photo}" alt="Fotografija" />
              </div>
            ` : ''}
            
            <div class="section">
              <div class="section-title">Lični podaci</div>
              <div class="fields-grid">
                <div class="field">
                  <div class="field-label">Ime</div>
                  <div class="field-value">${application.firstName || '-'}</div>
                </div>
                <div class="field">
                  <div class="field-label">Prezime</div>
                  <div class="field-value">${application.lastName || '-'}</div>
                </div>
                <div class="field">
                  <div class="field-label">Pol</div>
                  <div class="field-value">${application.gender || '-'}</div>
                </div>
                <div class="field">
                  <div class="field-label">Datum rođenja</div>
                  <div class="field-value">${application.dateOfBirth || '-'}</div>
                </div>
                <div class="field">
                  <div class="field-label">Mjesto rođenja</div>
                  <div class="field-value">${application.placeOfBirth || '-'}</div>
                </div>
                <div class="field">
                  <div class="field-label">Zanimanje</div>
                  <div class="field-value">${application.occupation || '-'}</div>
                </div>
                <div class="field half-width">
                  <div class="field-label">Adresa stanovanja</div>
                  <div class="field-value">${application.streetAddress || ''}, ${application.postalCode || ''} ${application.city || ''}</div>
                </div>
                <div class="field">
                  <div class="field-label">Telefon</div>
                  <div class="field-value">${application.phone || '-'}</div>
                </div>
                <div class="field half-width">
                  <div class="field-label">Email</div>
                  <div class="field-value">${application.email || '-'}</div>
                </div>
                ${application.skillsHobbies ? `
                  <div class="field">
                    <div class="field-label">Hobiji/Vještine</div>
                    <div class="field-value">${application.skillsHobbies}</div>
                  </div>
                ` : ''}
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Porodični podaci</div>
              <div class="fields-grid">
                <div class="field">
                  <div class="field-label">Bračno stanje</div>
                  <div class="field-value">${application.maritalStatus || '-'}</div>
                </div>
                <div class="field">
                  <div class="field-label">Bračni partner</div>
                  <div class="field-value">${application.spouseName || '-'}</div>
                </div>
                <div class="field">
                  <div class="field-label">Djeca</div>
                  <div class="field-value">${application.childrenInfo || '-'}</div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Podaci o članstvu</div>
              <div class="fields-grid">
                <div class="field">
                  <div class="field-label">Mjesečna članarina</div>
                  <div class="field-value">${application.monthlyFee || '-'} €</div>
                </div>
                <div class="field">
                  <div class="field-label">Dostava računa</div>
                  <div class="field-value">${application.invoiceDelivery || '-'}</div>
                </div>
                <div class="field">
                  <div class="field-label">Datum prijave</div>
                  <div class="field-value">${application.createdAt ? new Date(application.createdAt).toLocaleDateString('bs-BA') : '-'}</div>
                </div>
              </div>
            </div>
            
            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-line">Potpis podnosioca</div>
              </div>
              <div class="signature-box">
                <div class="signature-line">Potpis ovlaštene osobe</div>
              </div>
            </div>
            
            <div class="footer">
              Dokument generisan: ${new Date().toLocaleString('bs-BA')}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return t('status.pending');
      case 'approved':
        return t('status.approved');
      case 'rejected':
        return t('status.rejected');
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>{t('loading')}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('applications')}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        {t('applicationsDescription')}
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ime i prezime</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Telefon</TableCell>
              <TableCell>Datum rođenja</TableCell>
              <TableCell>Mjesečna članarina</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Datum prijave</TableCell>
              <TableCell>Akcije</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="text.secondary">Nema pristupnica</Typography>
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app) => (
                <TableRow key={app.id} data-testid={`application-row-${app.id}`}>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      {app.photo && (
                        <Avatar src={app.photo} alt={`${app.firstName} ${app.lastName}`} />
                      )}
                      <Typography>
                        {app.firstName} {app.lastName}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{app.email}</TableCell>
                  <TableCell>{app.phone}</TableCell>
                  <TableCell>{app.dateOfBirth}</TableCell>
                  <TableCell>{app.monthlyFee}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(app.status)}
                      color={getStatusColor(app.status)}
                      size="small"
                      data-testid={`status-${app.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    {app.createdAt && new Date(app.createdAt).toLocaleDateString('bs-BA')}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(app)}
                        data-testid={`button-view-${app.id}`}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handlePrint(app)}
                        data-testid={`button-print-${app.id}`}
                      >
                        <Print fontSize="small" />
                      </IconButton>
                      {app.status === 'pending' && (
                        <>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleReview(app, 'approved')}
                            data-testid={`button-approve-${app.id}`}
                          >
                            <CheckCircle fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleReview(app, 'rejected')}
                            data-testid={`button-reject-${app.id}`}
                          >
                            <Cancel fontSize="small" />
                          </IconButton>
                        </>
                      )}
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(app.id)}
                        data-testid={`button-delete-${app.id}`}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Details Dialog */}
      <Dialog
        open={!!selectedApplication && !reviewDialogOpen}
        onClose={() => setSelectedApplication(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detalji pristupnice</DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                {selectedApplication.photo && (
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Avatar
                        src={selectedApplication.photo}
                        alt={`${selectedApplication.firstName} ${selectedApplication.lastName}`}
                        sx={{ width: 150, height: 150, mx: 'auto' }}
                      />
                    </Box>
                  </Grid>
                )}

                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" gutterBottom>
                    Lični podaci
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Ime
                  </Typography>
                  <Typography>{selectedApplication.firstName}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Prezime
                  </Typography>
                  <Typography>{selectedApplication.lastName}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Pol
                  </Typography>
                  <Typography>{selectedApplication.gender}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Datum rođenja
                  </Typography>
                  <Typography>{selectedApplication.dateOfBirth}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Mjesto rođenja
                  </Typography>
                  <Typography>{selectedApplication.placeOfBirth}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">
                    Adresa
                  </Typography>
                  <Typography>
                    {selectedApplication.streetAddress}, {selectedApplication.postalCode}{' '}
                    {selectedApplication.city}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Zanimanje
                  </Typography>
                  <Typography>{selectedApplication.occupation}</Typography>
                </Grid>
                {selectedApplication.skillsHobbies && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">
                      Posebne sposobnosti
                    </Typography>
                    <Typography>{selectedApplication.skillsHobbies}</Typography>
                  </Grid>
                )}

                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Porodični podaci
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Bračno stanje
                  </Typography>
                  <Typography>{selectedApplication.maritalStatus}</Typography>
                </Grid>
                {selectedApplication.spouseName && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Ime bračnog partnera
                    </Typography>
                    <Typography>{selectedApplication.spouseName}</Typography>
                  </Grid>
                )}
                {selectedApplication.childrenInfo && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">
                      Djeca
                    </Typography>
                    <Typography>{selectedApplication.childrenInfo}</Typography>
                  </Grid>
                )}

                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Podaci o članstvu
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Mjesečna članarina
                  </Typography>
                  <Typography>{selectedApplication.monthlyFee}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Način dostave računa
                  </Typography>
                  <Typography>{selectedApplication.invoiceDelivery}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Email
                  </Typography>
                  <Typography>{selectedApplication.email}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Telefon
                  </Typography>
                  <Typography>{selectedApplication.phone}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Datum pristupanja
                  </Typography>
                  <Typography>{selectedApplication.membershipStartDate}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={getStatusLabel(selectedApplication.status)}
                    color={getStatusColor(selectedApplication.status)}
                    size="small"
                  />
                </Grid>
                {selectedApplication.reviewNotes && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">
                      Napomena
                    </Typography>
                    <Typography>{selectedApplication.reviewNotes}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedApplication(null)} data-testid="button-close-details">
            Zatvori
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {reviewAction === 'approved' ? 'Odobri pristupnicu' : 'Odbij pristupnicu'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Napomena (opciono)"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              multiline
              rows={3}
              data-testid="input-review-notes"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)} data-testid="button-cancel-review">
            Otkaži
          </Button>
          <Button
            onClick={handleConfirmReview}
            variant="contained"
            color={reviewAction === 'approved' ? 'success' : 'error'}
            disabled={reviewMutation.isPending}
            data-testid="button-confirm-review"
          >
            {reviewMutation.isPending ? 'Čuvanje...' : 'Potvrdi'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MembershipApplicationsList;
