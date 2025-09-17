import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Visibility
} from '@mui/icons-material';
import { Event, EventRsvp } from '@shared/schema';
import EventModal from '../components/modals/EventModal';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { apiRequest } from '../lib/queryClient';

export default function EventsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuEvent, setMenuEvent] = useState<Event | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [rsvpDialogOpen, setRsvpDialogOpen] = useState(false);
  const [selectedEventRsvps, setSelectedEventRsvps] = useState<EventRsvp[]>([]);

  // Fetch events
  const eventsQuery = useQuery({
    queryKey: ['/api/events'],
    retry: 1,
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await apiRequest('POST', '/api/events', eventData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({ title: 'Uspjeh', description: 'Događaj je uspješno kreiran' });
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri kreiranju događaja', variant: 'destructive' });
    }
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, ...eventData }: any) => {
      const response = await apiRequest('PUT', `/api/events/${id}`, eventData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({ title: 'Uspjeh', description: 'Događaj je uspješno ažuriran' });
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri ažuriranju događaja', variant: 'destructive' });
    }
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({ title: 'Uspjeh', description: 'Događaj je uspješno obrisan' });
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri brisanju događaja', variant: 'destructive' });
    }
  });

  // Fetch event RSVPs
  const fetchEventRsvps = async (eventId: string) => {
    const response = await fetch(`/api/events/${eventId}/rsvps`);
    if (!response.ok) throw new Error('Failed to fetch RSVPs');
    return response.json();
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setModalOpen(true);
    handleMenuClose();
  };

  const handleDeleteClick = (event: Event) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleViewRsvps = async (event: Event) => {
    try {
      const rsvps = await fetchEventRsvps(event.id);
      setSelectedEventRsvps(rsvps);
      setRsvpDialogOpen(true);
    } catch (error) {
      toast({ title: 'Greška', description: 'Greška pri učitavanju prijava', variant: 'destructive' });
    }
    handleMenuClose();
  };

  const handleDeleteConfirm = () => {
    if (eventToDelete) {
      deleteEventMutation.mutate(eventToDelete.id);
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };

  const handleSaveEvent = (eventData: any) => {
    if (selectedEvent) {
      updateEventMutation.mutate({ id: selectedEvent.id, ...eventData });
    } else {
      createEventMutation.mutate(eventData);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, eventItem: Event) => {
    setMenuAnchor(event.currentTarget);
    setMenuEvent(eventItem);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuEvent(null);
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('hr-HR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Mock RSVP count for demo purposes
  const getRsvpCount = (event: Event) => {
    // In real app, this would come from the event data or separate query
    const mockCounts: { [key: string]: number } = {
      'Skupština džamije': 45,
      'Iftar program': 120,
      'Edukacijska radionica': 12
    };
    return mockCounts[event.name] || 0;
  };

  if (eventsQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (eventsQuery.error) {
    return (
      <Alert severity="error">
        Greška pri učitavanju događaja. Molimo pokušajte ponovo.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Upravljanje Događajima
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateEvent}
          data-testid="button-add-event"
        >
          Kreiraj Događaj
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 600 }}>Naziv Događaja</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Datum i Vrijeme</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Lokacija</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>RSVP</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Akcije</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(eventsQuery.data || []).map((event: Event) => {
                const rsvpCount = getRsvpCount(event);
                const maxAttendees = event.maxAttendees || '∞';
                return (
                  <TableRow key={event.id}>
                    <TableCell>{event.name}</TableCell>
                    <TableCell>{formatDateTime(event.dateTime.toString())}</TableCell>
                    <TableCell>{event.location}</TableCell>
                    <TableCell>
                      {event.rsvpEnabled ? `${rsvpCount}/${maxAttendees}` : 'Onemogućeno'}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, event)}
                        data-testid={`menu-event-${event.id}`}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(eventsQuery.data || []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      Nema događaja
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Event Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => menuEvent && handleEditEvent(menuEvent)} data-testid="menu-edit">
          <Edit sx={{ mr: 1 }} />
          Uredi
        </MenuItem>
        <MenuItem onClick={() => menuEvent && handleViewRsvps(menuEvent)} data-testid="menu-view-rsvps">
          <Visibility sx={{ mr: 1 }} />
          Vidi Prijave
        </MenuItem>
        <MenuItem onClick={() => menuEvent && handleDeleteClick(menuEvent)} data-testid="menu-delete">
          <Delete sx={{ mr: 1 }} />
          Obriši
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Potvrdi Brisanje</DialogTitle>
        <DialogContent>
          <Typography>
            Da li ste sigurni da želite obrisati događaj "{eventToDelete?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} data-testid="button-cancel-delete">
            Odustani
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            data-testid="button-confirm-delete"
          >
            Obriši
          </Button>
        </DialogActions>
      </Dialog>

      {/* RSVP View Dialog */}
      <Dialog
        open={rsvpDialogOpen}
        onClose={() => setRsvpDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Prijave za Događaj</DialogTitle>
        <DialogContent>
          {selectedEventRsvps.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Korisnik</TableCell>
                  <TableCell>Odrasli</TableCell>
                  <TableCell>Djeca</TableCell>
                  <TableCell>Datum Prijave</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedEventRsvps.map((rsvp) => (
                  <TableRow key={rsvp.id}>
                    <TableCell>Korisnik {rsvp.userId}</TableCell>
                    <TableCell>{rsvp.adultsCount}</TableCell>
                    <TableCell>{rsvp.childrenCount}</TableCell>
                    <TableCell>
                      {rsvp.rsvpDate ? new Date(rsvp.rsvpDate).toLocaleDateString('hr-HR') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              Nema prijava za ovaj događaj
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRsvpDialogOpen(false)} data-testid="button-close-rsvps">
            Zatvori
          </Button>
        </DialogActions>
      </Dialog>

      {/* Event Modal */}
      <EventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveEvent}
        event={selectedEvent}
        createdById={user?.id || ''}
      />
    </Box>
  );
}
