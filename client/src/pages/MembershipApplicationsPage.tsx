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
import { Visibility, CheckCircle, Cancel, Delete } from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { MembershipApplication } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export function MembershipApplicationsList() {
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
        title: 'Uspješno',
        description: 'Pristupnica je pregledana',
      });
      setReviewDialogOpen(false);
      setSelectedApplication(null);
      setReviewNotes('');
    },
    onError: () => {
      toast({
        title: 'Greška',
        description: 'Greška pri pregledu pristupnice',
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
        title: 'Uspješno',
        description: 'Pristupnica je obrisana',
      });
    },
    onError: () => {
      toast({
        title: 'Greška',
        description: 'Greška pri brisanju pristupnice',
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
    if (confirm('Da li ste sigurni da želite obrisati ovu pristupnicu?')) {
      deleteMutation.mutate(id);
    }
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
        return 'Na čekanju';
      case 'approved':
        return 'Odobreno';
      case 'rejected':
        return 'Odbijeno';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Učitavanje...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Pristupnice
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Pregled svih zahtjeva za članstvo
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
