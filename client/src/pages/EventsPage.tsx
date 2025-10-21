import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Chip,
  Tabs,
  Tab,
  TextField,
  Badge
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  CalendarMonth,
  EventNote
} from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { isSameDay, format } from 'date-fns';
import { Event, ImportantDate } from '@shared/schema';
import EventModal from '../components/modals/EventModal';
import EventViewModal from '../components/modals/EventViewModal';
import EventRSVPModal from '../components/modals/EventRSVPModal';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { useMarkAsViewed } from '../hooks/useMarkAsViewed';
import { apiRequest } from '../lib/queryClient';

function EventDay(props: PickersDayProps & { eventDates?: Date[] }) {
  const { eventDates = [], day, outsideCurrentMonth, ...other } = props;
  const hasEvent = eventDates.some((eventDate: Date) => isSameDay(eventDate, day));

  return (
    <Badge
      key={day.toString()}
      overlap="circular"
      badgeContent={hasEvent ? '•' : undefined}
      sx={{
        '& .MuiBadge-badge': {
          backgroundColor: '#ed6c02',
          color: '#ed6c02',
          minWidth: 6,
          height: 6,
          borderRadius: '50%',
          padding: 0,
          top: 4,
          right: 4,
        }
      }}
    >
      <PickersDay 
        {...other} 
        day={day} 
        outsideCurrentMonth={outsideCurrentMonth}
      />
    </Badge>
  );
}

export default function EventsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  useMarkAsViewed('events');
  
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [rsvpModalOpen, setRsvpModalOpen] = useState(false);
  const [rsvpEvent, setRsvpEvent] = useState<Event | null>(null);
  
  const [importantDateForm, setImportantDateForm] = useState({
    name: '',
    date: ''
  });
  const [editingImportantDate, setEditingImportantDate] = useState<ImportantDate | null>(null);

  const eventsQuery = useQuery<Event[]>({
    queryKey: ['/api/events'],
    retry: 1,
  });

  const importantDatesQuery = useQuery<ImportantDate[]>({
    queryKey: ['/api/important-dates'],
    retry: 1,
  });

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

  const createImportantDateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/important-dates', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/important-dates'] });
      toast({ title: 'Uspjeh', description: 'Važan datum je uspješno dodan' });
      setImportantDateForm({ name: '', date: '' });
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri dodavanju važnog datuma', variant: 'destructive' });
    }
  });

  const updateImportantDateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await apiRequest('PUT', `/api/important-dates/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/important-dates'] });
      toast({ title: 'Uspjeh', description: 'Važan datum je uspješno ažuriran' });
      setEditingImportantDate(null);
      setImportantDateForm({ name: '', date: '' });
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri ažuriranju važnog datuma', variant: 'destructive' });
    }
  });

  const deleteImportantDateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/important-dates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/important-dates'] });
      toast({ title: 'Uspjeh', description: 'Važan datum je uspješno obrisan' });
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri brisanju važnog datuma', variant: 'destructive' });
    }
  });

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setViewModalOpen(true);
  };

  const handleSaveEvent = async (eventData: any) => {
    if (selectedEvent) {
      await updateEventMutation.mutateAsync({ id: selectedEvent.id, ...eventData });
    } else {
      await createEventMutation.mutateAsync(eventData);
    }
    setModalOpen(false);
    setSelectedEvent(null);
  };

  const handleDeleteClick = (event: Event) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (eventToDelete) {
      await deleteEventMutation.mutateAsync(eventToDelete.id);
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };

  const handleRsvpClick = (event: Event) => {
    setRsvpEvent(event);
    setRsvpModalOpen(true);
  };

  const handleImportantDateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importantDateForm.name || !importantDateForm.date) {
      toast({ title: 'Greška', description: 'Molimo popunite naziv i datum', variant: 'destructive' });
      return;
    }

    // Validate date format (dd.mm)
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])$/;
    if (!dateRegex.test(importantDateForm.date)) {
      toast({ 
        title: 'Greška', 
        description: 'Datum mora biti u formatu dd.mm (npr. 15.03)', 
        variant: 'destructive' 
      });
      return;
    }

    if (editingImportantDate) {
      await updateImportantDateMutation.mutateAsync({
        id: editingImportantDate.id,
        ...importantDateForm,
        isRecurring: true
      });
    } else {
      await createImportantDateMutation.mutateAsync({
        ...importantDateForm,
        isRecurring: true
      });
    }
  };

  const handleEditImportantDate = (date: ImportantDate) => {
    setEditingImportantDate(date);
    setImportantDateForm({
      name: date.name,
      date: date.date
    });
  };

  const handleCancelEditImportantDate = () => {
    setEditingImportantDate(null);
    setImportantDateForm({ name: '', date: '' });
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return format(date, 'dd.MM.yyyy. u HH:mm');
  };

  const getRsvpCount = (event: any) => {
    if (!event.rsvpEnabled) return 0;
    return event.rsvpCount || 0;
  };

  if (eventsQuery.isLoading || importantDatesQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (eventsQuery.error || importantDatesQuery.error) {
    return (
      <Alert severity="error">
        Greška pri učitavanju podataka. Molimo pokušajte ponovo.
      </Alert>
    );
  }

  const allEvents = eventsQuery.data || [];
  const importantDates = importantDatesQuery.data || [];
  
  const eventDates = allEvents.map(event => new Date(event.dateTime));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Događaji i Važni Datumi
        </Typography>
        {user?.isAdmin && activeTab === 0 && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateEvent}
            data-testid="button-add-event"
          >
            Kreiraj Događaj
          </Button>
        )}
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<CalendarMonth />} 
            iconPosition="start" 
            label="Događaji" 
            data-testid="tab-events"
          />
          <Tab 
            icon={<EventNote />} 
            iconPosition="start" 
            label="Važni datumi" 
            data-testid="tab-important-dates"
          />
        </Tabs>
      </Paper>

      {/* Tab Događaji */}
      {activeTab === 0 && (
        <Box>
          {/* Calendar */}
          <Card sx={{ mb: 3 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Kalendar Događaja
              </Typography>
            </Box>
            <CardContent sx={{ p: 0 }}>
              <DateCalendar
                value={selectedDate}
                onChange={(newDate) => setSelectedDate(newDate)}
                slots={{
                  day: EventDay,
                }}
                slotProps={{
                  day: {
                    eventDates,
                  } as any,
                }}
                sx={{
                  width: '100%',
                  '& .MuiPickersCalendarHeader-root': {
                    paddingLeft: 2,
                    paddingRight: 2,
                  },
                  '& .MuiDayCalendar-weekContainer': {
                    justifyContent: 'space-around',
                  }
                }}
              />
            </CardContent>
          </Card>

          {/* Events List */}
          <Card>
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Svi Događaji
              </Typography>
            </Box>
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
                  {allEvents.map((event: Event) => {
                    const rsvpCount = getRsvpCount(event);
                    const maxAttendees = event.maxAttendees || '∞';
                    return (
                      <TableRow key={event.id}>
                        <TableCell>
                          <Typography
                            onClick={() => handleEventClick(event)}
                            sx={{
                              cursor: 'pointer',
                              color: 'primary.main',
                              fontWeight: 500,
                              '&:hover': {
                                textDecoration: 'underline'
                              }
                            }}
                            data-testid={`link-event-${event.id}`}
                          >
                            {event.name}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDateTime(event.dateTime.toString())}</TableCell>
                        <TableCell>{event.location}</TableCell>
                        <TableCell>
                          {event.rsvpEnabled ? `${rsvpCount}/${maxAttendees}` : 'Ne'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleEventClick(event)}
                              sx={{ color: '#1976d2' }}
                              data-testid={`button-view-event-${event.id}`}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                            {user?.isAdmin && (
                              <>
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditEvent(event)}
                                  sx={{ color: '#ed6c02' }}
                                  data-testid={`button-edit-event-${event.id}`}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteClick(event)}
                                  sx={{ color: '#d32f2f' }}
                                  data-testid={`button-delete-event-${event.id}`}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {allEvents.length === 0 && (
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
        </Box>
      )}

      {/* Tab Važni datumi */}
      {activeTab === 1 && (
        <Box>
          {user?.isAdmin && (
            <Card sx={{ mb: 3 }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {editingImportantDate ? 'Uredi Važan Datum' : 'Dodaj Važan Datum'}
                </Typography>
              </Box>
              <CardContent>
                <Box component="form" onSubmit={handleImportantDateSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Naziv"
                    value={importantDateForm.name}
                    onChange={(e) => setImportantDateForm({ ...importantDateForm, name: e.target.value })}
                    required
                    fullWidth
                    data-testid="input-important-date-name"
                  />
                  <TextField
                    label="Datum (dd.mm)"
                    value={importantDateForm.date}
                    onChange={(e) => setImportantDateForm({ ...importantDateForm, date: e.target.value })}
                    placeholder="npr. 15.03"
                    required
                    fullWidth
                    data-testid="input-important-date-date"
                    helperText="Format: dd.mm (npr. 15.03 za 15. mart)"
                  />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button 
                      type="submit" 
                      variant="contained"
                      data-testid="button-submit-important-date"
                    >
                      {editingImportantDate ? 'Ažuriraj' : 'Dodaj'}
                    </Button>
                    {editingImportantDate && (
                      <Button 
                        onClick={handleCancelEditImportantDate}
                        variant="outlined"
                        data-testid="button-cancel-edit-important-date"
                      >
                        Odustani
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          <Card>
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Spisak Važnih Datuma
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Datum</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Naziv</TableCell>
                    {user?.isAdmin && (
                      <TableCell sx={{ fontWeight: 600 }}>Akcije</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importantDates.map((date: ImportantDate) => (
                    <TableRow key={date.id}>
                      <TableCell sx={{ fontWeight: 500 }}>{date.date}</TableCell>
                      <TableCell>{date.name}</TableCell>
                      {user?.isAdmin && (
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleEditImportantDate(date)}
                              sx={{ color: '#ed6c02' }}
                              data-testid={`button-edit-important-date-${date.id}`}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => deleteImportantDateMutation.mutate(date.id)}
                              sx={{ color: '#d32f2f' }}
                              data-testid={`button-delete-important-date-${date.id}`}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {importantDates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={user?.isAdmin ? 3 : 2} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">
                          Nema važnih datuma
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {/* Dialogs */}
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

      <EventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveEvent}
        event={selectedEvent}
        createdById={user?.id || ''}
        isAdmin={user?.isAdmin || false}
      />

      <EventViewModal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        event={selectedEvent}
      />

      {rsvpEvent && (
        <EventRSVPModal
          open={rsvpModalOpen}
          onClose={() => setRsvpModalOpen(false)}
          event={rsvpEvent}
        />
      )}
    </Box>
  );
}
