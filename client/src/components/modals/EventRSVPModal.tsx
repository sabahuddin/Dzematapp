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
import { useTranslation } from 'react-i18next';

interface EventRSVPModalProps {
  open: boolean;
  onClose: () => void;
  event: Event;
}

export default function EventRSVPModal({ open, onClose, event }: EventRSVPModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation(['events', 'common']);
  const [adultsCount, setAdultsCount] = useState<string>('1');
  const [childrenCount, setChildrenCount] = useState<string>('0');

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
      setAdultsCount(String(userRsvp.adultsCount || 1));
      setChildrenCount(String(userRsvp.childrenCount || 0));
    } else {
      setAdultsCount('1');
      setChildrenCount('0');
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
        title: t('toast.success'),
        description: t('rsvpModal.successRegistered')
      });
      onClose();
    },
    onError: () => {
      toast({
        title: t('toast.error'),
        description: t('rsvpModal.errorRegister'),
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
        title: t('toast.success'),
        description: t('rsvpModal.successUpdated')
      });
      onClose();
    },
    onError: () => {
      toast({
        title: t('toast.error'),
        description: t('rsvpModal.errorUpdate'),
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
        title: t('toast.success'),
        description: t('rsvpModal.successCancelled')
      });
      if (!user?.isAdmin) {
        onClose();
      }
    },
    onError: () => {
      toast({
        title: t('toast.error'),
        description: t('rsvpModal.errorCancel'),
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = () => {
    const adults = Math.max(0, parseInt(adultsCount) || 0);
    const children = Math.max(0, parseInt(childrenCount) || 0);
    
    if (userRsvp) {
      updateRsvpMutation.mutate({ adultsCount: adults, childrenCount: children });
    } else {
      createRsvpMutation.mutate({ adultsCount: adults, childrenCount: children });
    }
  };

  const handleDelete = () => {
    if (window.confirm(t('rsvpModal.confirmCancel'))) {
      deleteRsvpMutation.mutate(undefined);
    }
  };

  const handleAdminDeleteRsvp = (rsvpId: string) => {
    if (window.confirm(t('rsvpModal.confirmDelete'))) {
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
    const summaryRow = [t('rsvpModal.excelTotal'), totals.adults, totals.children, totals.total];

    // Export using helper function
    exportToExcel({
      title: `${t('rsvpModal.excelTitle')} - ${event.name}`,
      filename: `Registrations_${event.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
      sheetName: t('rsvpModal.excelSheet'),
      headers: [t('rsvpModal.excelNameHeader'), t('rsvpModal.adultsCount'), t('rsvpModal.childrenCount'), t('rsvpModal.total')],
      data: participantData,
      summaryRow
    });

    toast({
      title: t('toast.success'),
      description: t('rsvpModal.excelExported')
    });
  };

  // Admin view - show list of attendees
  if (user?.isAdmin) {
    const totals = getTotalAttendees();
    
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {t('rsvpModal.overview')} - {event.name}
        </DialogTitle>
        
        <DialogContent>
          {isLoadingAllRsvps ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ mb: 3, p: 2, bgcolor: 'hsl(0 0% 96%)', borderRadius: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {t('rsvpModal.totalRegistered')}: {totals.total} {t('rsvpModal.people')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('rsvpModal.adultsCount')}: {totals.adults} | {t('rsvpModal.childrenCount')}: {totals.children}
                </Typography>
              </Box>

              {allRsvps && allRsvps.rsvps && allRsvps.rsvps.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'hsl(0 0% 98%)' }}>
                        <TableCell sx={{ fontWeight: 600 }}>{t('rsvpModal.user')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('rsvpModal.adultsCount')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('rsvpModal.childrenCount')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('rsvpModal.total')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('actions')}</TableCell>
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
                  {t('rsvpModal.noRegistrations')}
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
            {t('rsvpModal.exportExcel')}
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={onClose} data-testid="button-close-admin-rsvp">
            {t('rsvpModal.close')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Regular user view - show RSVP form
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {userRsvp ? t('rsvpModal.updateRsvp') : t('rsvpModal.registerEvent')}
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
                {t('rsvpModal.requireAdultsChildrenInfo')}
              </Alert>
            )}

            <TextField
              fullWidth
              type="number"
              label={t('rsvpModal.adultsLabel')}
              value={adultsCount}
              onChange={(e) => setAdultsCount(e.target.value)}
              onBlur={(e) => {
                const val = parseInt(e.target.value) || 0;
                setAdultsCount(String(Math.max(0, val)));
              }}
              InputProps={{ inputProps: { min: 0 } }}
              required
              data-testid="input-adults-count"
            />

            <TextField
              fullWidth
              type="number"
              label={t('rsvpModal.childrenLabel')}
              value={childrenCount}
              onChange={(e) => setChildrenCount(e.target.value)}
              onBlur={(e) => {
                const val = parseInt(e.target.value) || 0;
                setChildrenCount(String(Math.max(0, val)));
              }}
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
            {t('rsvpModal.cancelRsvp')}
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} data-testid="button-cancel-rsvp">
          {t('rsvpModal.close')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={createRsvpMutation.isPending || updateRsvpMutation.isPending}
          data-testid="button-submit-rsvp"
        >
          {userRsvp ? t('rsvpModal.update') : t('rsvpModal.register')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
