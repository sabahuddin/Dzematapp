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
  CircularProgress
} from '@mui/material';
import { Event, EventRsvp } from '@shared/schema';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

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

  const { data: userRsvp, isLoading } = useQuery<EventRsvp | null>({
    queryKey: ['/api/events', event.id, 'user-rsvp'],
    queryFn: async () => {
      const response = await fetch(`/api/events/${event.id}/user-rsvp`, {
        credentials: 'include'
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: open && !!user
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
      return apiRequest('POST', `/api/events/${event.id}/rsvp`, data);
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
      return apiRequest('PUT', `/api/events/${event.id}/rsvp/${userRsvp!.id}`, data);
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
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/events/${event.id}/rsvp/${userRsvp!.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', event.id, 'user-rsvp'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', event.id, 'rsvps'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: 'Uspjeh',
        description: 'Uspješno ste otkazali prijavu'
      });
      onClose();
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
      deleteRsvpMutation.mutate();
    }
  };

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
