import React, { useState, useMemo } from 'react';
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
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  ViewList,
  ViewWeek,
  CalendarMonth
} from '@mui/icons-material';
import { Event, EventRsvp } from '@shared/schema';
import EventModal from '../components/modals/EventModal';
import EventViewModal from '../components/modals/EventViewModal';
import EventRSVPModal from '../components/modals/EventRSVPModal';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { useMarkAsViewed } from '../hooks/useMarkAsViewed';
import { apiRequest } from '../lib/queryClient';

type ViewMode = 'list' | 'week' | 'month';

function WeekView({ 
  events, 
  onEventClick 
}: { 
  events: Event[]; 
  onEventClick: (event: Event) => void 
}) {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });
  
  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.dateTime);
      return eventDate.toDateString() === date.toDateString();
    });
  };
  
  return (
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: { 
        xs: 'repeat(1, 1fr)',
        sm: 'repeat(2, 1fr)',
        md: 'repeat(4, 1fr)',
        lg: 'repeat(7, 1fr)'
      }, 
      gap: 1 
    }}>
      {weekDays.map((day, index) => {
        const dayEvents = getEventsForDay(day);
        const isToday = day.toDateString() === today.toDateString();
        
        return (
          <Paper 
            key={index} 
            sx={{ 
              p: 2, 
              minHeight: 200,
              bgcolor: isToday ? '#f0f7ff' : '#fff',
              border: isToday ? '2px solid #1976d2' : '1px solid #e0e0e0'
            }}
            data-testid={`week-day-${index}`}
          >
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 600, 
                mb: 1,
                color: isToday ? '#1976d2' : 'text.primary'
              }}
            >
              {day.toLocaleDateString('hr-HR', { weekday: 'short' })}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mb: 2 }}>
              {day.toLocaleDateString('hr-HR', { day: 'numeric', month: 'short' })}
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {dayEvents.map(event => (
                <Card
                  key={event.id}
                  sx={{ 
                    p: 1, 
                    cursor: 'pointer',
                    bgcolor: '#1976d2',
                    color: 'white',
                    '&:hover': { opacity: 0.9 }
                  }}
                  onClick={() => onEventClick(event)}
                  data-testid={`week-event-${event.id}`}
                >
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                    {new Date(event.dateTime).toLocaleTimeString('hr-HR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                    {event.name}
                  </Typography>
                </Card>
              ))}
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
}

function MonthView({ 
  events, 
  onEventClick 
}: { 
  events: Event[]; 
  onEventClick: (event: Event) => void 
}) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };
  
  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.dateTime);
      return eventDate.toDateString() === date.toDateString();
    });
  };
  
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const days = getDaysInMonth();
  const weekDays = ['Ned', 'Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub'];
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button onClick={handlePrevMonth} data-testid="button-prev-month">
          Prethodni
        </Button>
        <Typography variant="h6">
          {currentMonth.toLocaleDateString('hr-HR', { month: 'long', year: 'numeric' })}
        </Typography>
        <Button onClick={handleNextMonth} data-testid="button-next-month">
          Sljedeći
        </Button>
      </Box>
      
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(4, 1fr)',
          lg: 'repeat(7, 1fr)'
        }, 
        gap: 1 
      }}>
        {weekDays.map(day => (
          <Box key={day} sx={{ 
            p: 1, 
            textAlign: 'center', 
            fontWeight: 600,
            display: { xs: 'none', lg: 'block' }
          }}>
            {day}
          </Box>
        ))}
        
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isToday = day.toDateString() === today.toDateString();
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          
          return (
            <Paper
              key={index}
              sx={{
                p: 1,
                minHeight: { xs: 80, md: 100 },
                bgcolor: isToday ? '#f0f7ff' : '#fff',
                border: isToday ? '2px solid #1976d2' : '1px solid #e0e0e0',
                opacity: isCurrentMonth ? 1 : 0.5
              }}
              data-testid={`month-day-${index}`}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: isToday ? 600 : 400,
                    color: isToday ? '#1976d2' : 'text.secondary'
                  }}
                >
                  {day.getDate()}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: { xs: 'inline', lg: 'none' },
                    fontSize: '0.7rem',
                    color: 'text.secondary'
                  }}
                >
                  {day.toLocaleDateString('hr-HR', { weekday: 'short' })}
                </Typography>
              </Box>
              
              <Box sx={{ mt: 0.5 }}>
                {dayEvents.map(event => (
                  <Chip
                    key={event.id}
                    label={event.name}
                    size="small"
                    sx={{ 
                      fontSize: '0.65rem',
                      height: 20,
                      mb: 0.5,
                      width: '100%',
                      cursor: 'pointer'
                    }}
                    onClick={() => onEventClick(event)}
                    data-testid={`month-event-${event.id}`}
                  />
                ))}
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}

export default function EventsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  useMarkAsViewed('events');
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuEvent, setMenuEvent] = useState<Event | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [rsvpDialogOpen, setRsvpDialogOpen] = useState(false);
  const [selectedEventRsvps, setSelectedEventRsvps] = useState<EventRsvp[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [rsvpModalOpen, setRsvpModalOpen] = useState(false);
  const [rsvpEvent, setRsvpEvent] = useState<Event | null>(null);

  const eventsQuery = useQuery<Event[]>({
    queryKey: ['/api/events'],
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

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    if (user?.isAdmin) {
      setModalOpen(true);
    } else {
      setViewModalOpen(true);
    }
  };

  const handleRsvpClick = (event: Event) => {
    setRsvpEvent(event);
    setRsvpModalOpen(true);
    handleMenuClose();
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year}. u ${hours}:${minutes}`;
  };

  const getRsvpCount = (event: any) => {
    return event.rsvpCount || 0;
  };

  // Get all unique categories from events
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    (eventsQuery.data || []).forEach(event => {
      if (event.categories) {
        event.categories.forEach(cat => categories.add(cat));
      }
    });
    return Array.from(categories).sort();
  }, [eventsQuery.data]);

  // Filter events by category
  const filteredEvents = useMemo(() => {
    if (!categoryFilter) return eventsQuery.data || [];
    return (eventsQuery.data || []).filter(event => 
      event.categories && event.categories.includes(categoryFilter)
    );
  }, [eventsQuery.data, categoryFilter]);

  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    setCategoryFilter(event.target.value);
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
          Događaji
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="list" data-testid="view-toggle-list">
              <ViewList sx={{ mr: 0.5 }} /> Lista
            </ToggleButton>
            <ToggleButton value="week" data-testid="view-toggle-week">
              <ViewWeek sx={{ mr: 0.5 }} /> Sedmica
            </ToggleButton>
            <ToggleButton value="month" data-testid="view-toggle-month">
              <CalendarMonth sx={{ mr: 0.5 }} /> Mjesec
            </ToggleButton>
          </ToggleButtonGroup>
          
          {user?.isAdmin && (
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
      </Box>

      {/* Category Filter */}
      {allCategories.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel>Filtriraj po kategoriji</InputLabel>
            <Select
              value={categoryFilter}
              onChange={handleCategoryChange}
              label="Filtriraj po kategoriji"
              data-testid="select-category-filter"
            >
              <MenuItem value="">
                <em>Sve kategorije</em>
              </MenuItem>
              {allCategories.map(category => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {categoryFilter && (
            <Chip
              label={`Filter: ${categoryFilter}`}
              onDelete={() => setCategoryFilter('')}
              sx={{ ml: 2 }}
              color="primary"
              data-testid="chip-active-filter"
            />
          )}
        </Box>
      )}

      {viewMode === 'list' && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Naziv Događaja</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Datum i Vrijeme</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Lokacija</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Kategorije</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>RSVP</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Akcije</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEvents.map((event: Event) => {
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
                        {event.categories && event.categories.length > 0 ? (
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {event.categories.map((cat, idx) => (
                              <Chip 
                                key={idx} 
                                label={cat} 
                                size="small" 
                                color="primary"
                                variant="outlined"
                                data-testid={`chip-event-category-${idx}`}
                              />
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.rsvpEnabled ? `${rsvpCount}/${maxAttendees}` : 'Onemogućeno'}
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
                {filteredEvents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">
                        {categoryFilter ? 'Nema događaja za odabranu kategoriju' : 'Nema događaja'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {viewMode === 'week' && (
        <WeekView events={filteredEvents} onEventClick={handleEventClick} />
      )}

      {viewMode === 'month' && (
        <MonthView events={filteredEvents} onEventClick={handleEventClick} />
      )}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        {menuEvent?.rsvpEnabled && (
          <MenuItem onClick={() => menuEvent && handleRsvpClick(menuEvent)} data-testid="menu-rsvp">
            <Add sx={{ mr: 1 }} />
            Prijavi se
          </MenuItem>
        )}
        {user?.isAdmin && (
          <>
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
          </>
        )}
      </Menu>

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
