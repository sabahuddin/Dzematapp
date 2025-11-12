import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton
} from '@mui/material';
import { Delete, Download } from '@mui/icons-material';
import { Event, EventRsvp } from '@shared/schema';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { exportToExcel } from '@/utils/excelExport';

interface EventRSVPModalProps {
  open: boolean;
  onClose: () => void;
  event: Event;
}

export default function EventRSVPModal({ open, onClose, event }: EventRSVPModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [adultsCount, setAdultsCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);

  // For admins: fetch all RSVPs for the event
  const { data: allRsvps, isLoading: isLoadingAllRsvps } = useQuery<{ rsvps: any[], totalAdults: number, totalChildren: number, totalAttendees: number }>({
    queryKey: ['/api/events', event.id, 'rsvps'],
    queryFn: async () => {
      const response = await fetch(`/api/events/${event.id}/rsvps`, {
        credentials: 'include',
        cache: 'no-cache'
      });
      if (!response.ok) throw new Error('Failed to fetch RSVPs');
      return response.json();
    },
    enabled: open && !!user?.isAdmin,
    staleTime: 0
  });

  // For regular users: fetch their own RSVP
  const { data: userRsvp, isLoading } = useQuery<EventRsvp | null>({
    queryKey: ['/api/events', event.id, 'user-rsvp'],
    queryFn: async () => {
      const response = await fetch(`/api/events/${event.id}/user-rsvp`, {
        credentials: 'include'
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: open && !!user && !user.isAdmin
  });

  useEffect(() => {
    if (userRsvp) {
      setAdultsCount(userRsvp.adultsCount || 1);
      setChildrenCount(userRsvp.childrenCount || 0);
    } else {
      setAdultsCount(1);
      setChildrenCount(0);
    }
  }, [userRsvp, open]);

  const createRsvpMutation = useMutation({
    mutationFn: async (data: { adultsCount: number; childrenCount: number }) => {
      return apiRequest(`/api/events/${event.id}/rsvp`, 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', event.id, 'user-rsvp'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', event.id, 'rsvps'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: 'Uspjeh',
        description: 'Uspješno ste se prijavili za događaj'
      });
      onClose();
    },
    onError: () => {
      toast({
        title: 'Greška',
        description: 'Greška pri prijavi za događaj',
        variant: 'destructive'
      });
    }
  });

  const updateRsvpMutation = useMutation({
    mutationFn: async (data: { adultsCount: number; childrenCount: number }) => {
      return apiRequest(`/api/events/${event.id}/rsvp/${userRsvp!.id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', event.id, 'user-rsvp'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', event.id, 'rsvps'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: 'Uspjeh',
        description: 'Uspješno ste ažurirali prijavu'
      });
      onClose();
    },
    onError: () => {
      toast({
        title: 'Greška',
        description: 'Greška pri ažuriranju prijave',
        variant: 'destructive'
      });
    }
  });

  const deleteRsvpMutation = useMutation({
    mutationFn: async (rsvpId?: string) => {
      const id = rsvpId || userRsvp?.id;
      if (!id) throw new Error('No RSVP ID provided');
      return apiRequest(`/api/events/${event.id}/rsvp/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', event.id, 'user-rsvp'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', event.id, 'rsvps'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: 'Uspjeh',
        description: 'Uspješno ste otkazali prijavu'
      });
      if (!user?.isAdmin) {
        onClose();
      }
    },
    onError: () => {
      toast({
        title: 'Greška',
        description: 'Greška pri otkazivanju prijave',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = () => {
    if (userRsvp) {
      updateRsvpMutation.mutate({ adultsCount, childrenCount });
    } else {
      createRsvpMutation.mutate({ adultsCount, childrenCount });
    }
  };

  const handleDelete = () => {
    if (window.confirm('Da li ste sigurni da želite otkazati prijavu?')) {
      deleteRsvpMutation.mutate(undefined);
    }
  };

  const handleAdminDeleteRsvp = (rsvpId: string) => {
    if (window.confirm('Da li ste sigurni da želite obrisati ovu prijavu?')) {
      deleteRsvpMutation.mutate(rsvpId);
    }
  };

  const getTotalAttendees = () => {
    if (!allRsvps) return { adults: 0, children: 0, total: 0 };
    return { 
      adults: allRsvps.totalAdults, 
      children: allRsvps.totalChildren, 
      total: allRsvps.totalAttendees 
    };
  };

  const handleExportToExcel = () => {
    if (!allRsvps || !allRsvps.rsvps) return;

    // Prepare participant data
    const participantData = allRsvps.rsvps.map((rsvp: any) => [
      `${rsvp.user?.firstName || ''} ${rsvp.user?.lastName || ''}`.trim(),
      rsvp.adultsCount || 0,
      rsvp.childrenCount || 0,
      (rsvp.adultsCount || 0) + (rsvp.childrenCount || 0)
    ]);

    // Summary row
    const totals = getTotalAttendees();
    const summaryRow = ['UKUPNO:', totals.adults, totals.children, totals.total];

    // Export using helper function
    exportToExcel({
      title: `Spisak prijavljenih za događaj - ${event.name}`,
      filename: `Prijave_${event.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
      sheetName: 'Prijavljeni',
      headers: ['Ime i prezime', 'Odrasli', 'Djeca', 'Ukupno'],
      data: participantData,
      summaryRow
    });

    toast({
      title: 'Uspjeh',
      description: 'Excel fajl je preuzet'
    });
  };

  // Admin view - show list of attendees
  if (user?.isAdmin) {
    const totals = getTotalAttendees();
    
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Pregled - {event.name}
        </DialogTitle>
        
        <DialogContent>
          {isLoadingAllRsvps ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ mb: 3, p: 2, bgcolor: 'var(--surface-gray-96)', borderRadius: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  Ukupno prijavljenih: {totals.total} osoba
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Odraslih: {totals.adults} | Djece: {totals.children}
                </Typography>
              </Box>

              {allRsvps && allRsvps.rsvps && allRsvps.rsvps.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'var(--surface-gray-50)' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Korisnik</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Odrasli</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Djeca</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Ukupno</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Akcije</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {allRsvps.rsvps.map((rsvp: any) => (
                        <TableRow key={rsvp.id} data-testid={`row-rsvp-${rsvp.id}`}>
                          <TableCell>
                            {rsvp.user?.firstName} {rsvp.user?.lastName}
                          </TableCell>
                          <TableCell>{rsvp.adultsCount || 0}</TableCell>
                          <TableCell>{rsvp.childrenCount || 0}</TableCell>
                          <TableCell>
                            {(rsvp.adultsCount || 0) + (rsvp.childrenCount || 0)}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleAdminDeleteRsvp(rsvp.id)}
                              disabled={deleteRsvpMutation.isPending}
                              data-testid={`button-delete-rsvp-${rsvp.id}`}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  Još niko nije prijavljen za ovaj događaj.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={handleExportToExcel}
            startIcon={<Download />}
            variant="outlined"
            disabled={!allRsvps || !allRsvps.rsvps || allRsvps.rsvps.length === 0}
            data-testid="button-export-excel"
          >
            Exportuj u Excel
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={onClose} data-testid="button-close-admin-rsvp">
            Zatvori
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Regular user view - show RSVP form
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {userRsvp ? 'Ažuriraj Prijavu' : 'Prijavi se za Događaj'}
      </DialogTitle>
      
      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {event.name}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              {new Date(event.dateTime).toLocaleDateString('hr-HR', { 
                day: 'numeric',
                month: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {event.location}
            </Typography>

            {event.requireAdultsChildren && (
              <Alert severity="info">
                Za ovaj događaj je potrebno unijeti broj odraslih i djece.
              </Alert>
            )}

            <TextField
              fullWidth
              type="number"
              label="Broj Odraslih"
              value={adultsCount}
              onChange={(e) => setAdultsCount(Math.max(0, parseInt(e.target.value) || 0))}
              InputProps={{ inputProps: { min: 0 } }}
              required
              data-testid="input-adults-count"
            />

            <TextField
              fullWidth
              type="number"
              label="Broj Djece"
              value={childrenCount}
              onChange={(e) => setChildrenCount(Math.max(0, parseInt(e.target.value) || 0))}
              InputProps={{ inputProps: { min: 0 } }}
              data-testid="input-children-count"
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {userRsvp && (
          <Button 
            onClick={handleDelete} 
            color="error"
            disabled={deleteRsvpMutation.isPending}
            data-testid="button-delete-rsvp"
          >
            Otkaži Prijavu
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} data-testid="button-cancel-rsvp">
          Zatvori
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={createRsvpMutation.isPending || updateRsvpMutation.isPending}
          data-testid="button-submit-rsvp"
        >
          {userRsvp ? 'Ažuriraj' : 'Prijavi se'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
