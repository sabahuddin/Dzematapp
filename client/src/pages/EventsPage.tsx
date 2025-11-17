import { useState, type SyntheticEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  CalendarMonth,
  EventNote,
  ExpandMore
} from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { isSameDay, format, isWeekend } from 'date-fns';
import { Event, ImportantDate } from '@shared/schema';
import EventModal from '../components/modals/EventModal';
import EventViewModal from '../components/modals/EventViewModal';
import EventRSVPModal from '../components/modals/EventRSVPModal';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { useMarkAsViewed } from '../hooks/useMarkAsViewed';
import { apiRequest } from '../lib/queryClient';

function EventDay(props: PickersDayProps & { eventDates?: Date[]; selectedDate?: Date | null }) {
  const { eventDates = [], selectedDate, day, outsideCurrentMonth, ...other } = props;
  const hasEvent = eventDates.some((eventDate: Date) => isSameDay(eventDate, day));
  const isToday = isSameDay(day, new Date());
  const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
  const isWeekendDay = isWeekend(day);

  return (
    <Badge
      key={day.toString()}
      overlap="circular"
      badgeContent={hasEvent ? '•' : undefined}
      sx={{
        '& .MuiBadge-badge': {
          backgroundColor: 'var(--semantic-success-active)',
          color: 'var(--semantic-success-active)',
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
        sx={{
          backgroundColor: outsideCurrentMonth 
            ? 'transparent'
            : isSelected 
            ? 'var(--semantic-info-active) !important' 
            : isToday 
            ? 'var(--semantic-award-active) !important'
            : isWeekendDay 
            ? 'var(--semantic-neutral-bg)'
            : hasEvent
            ? 'var(--semantic-success-bg)'
            : 'transparent',
          color: outsideCurrentMonth
            ? 'var(--semantic-neutral-text)'
            : isSelected || isToday
            ? '#ffffff !important'
            : hasEvent
            ? 'var(--semantic-success-text)'
            : isWeekendDay
            ? 'var(--semantic-neutral-text)'
            : 'inherit',
          fontWeight: isToday || isSelected || hasEvent ? 600 : 400,
          '&:hover': {
            backgroundColor: outsideCurrentMonth
              ? 'var(--semantic-neutral-bg)'
              : isSelected
              ? 'var(--semantic-info-active-hover) !important'
              : isToday
              ? 'var(--semantic-award-active-hover) !important'
              : isWeekendDay
              ? 'var(--semantic-neutral-bg-hover)'
              : hasEvent
              ? 'var(--semantic-success-bg-hover)'
              : 'var(--semantic-neutral-bg)',
          },
          border: isToday ? '2px solid hsl(35 100% 66%)' : 'none',
          borderRadius: '8px',
        }}
      />
    </Badge>
  );
}

export default function EventsPage() {
  const { t } = useTranslation(['events', 'common']);
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
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>(false);
  
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
      const response = await apiRequest('/api/events', 'POST', eventData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({ title: t('events:toast.success'), description: t('events:toast.eventCreated') });
    },
    onError: () => {
      toast({ title: t('events:toast.error'), description: t('events:toast.eventCreateError'), variant: 'destructive' });
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, ...eventData }: any) => {
      const response = await apiRequest(`/api/events/${id}`, 'PUT', eventData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({ title: t('events:toast.success'), description: t('events:toast.eventUpdated') });
    },
    onError: () => {
      toast({ title: t('events:toast.error'), description: t('events:toast.eventUpdateError'), variant: 'destructive' });
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/events/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({ title: t('events:toast.success'), description: t('events:toast.eventDeleted') });
    },
    onError: () => {
      toast({ title: t('events:toast.error'), description: t('events:toast.eventDeleteError'), variant: 'destructive' });
    }
  });

  const createImportantDateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/important-dates', 'POST', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/important-dates'] });
      toast({ title: t('events:toast.success'), description: t('events:toast.importantDateAdded') });
      setImportantDateForm({ name: '', date: '' });
    },
    onError: () => {
      toast({ title: t('events:toast.error'), description: t('events:toast.importantDateAddError'), variant: 'destructive' });
    }
  });

  const updateImportantDateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await apiRequest(`/api/important-dates/${id}`, 'PUT', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/important-dates'] });
      toast({ title: t('events:toast.success'), description: t('events:toast.importantDateUpdated') });
      setEditingImportantDate(null);
      setImportantDateForm({ name: '', date: '' });
    },
    onError: () => {
      toast({ title: t('events:toast.error'), description: t('events:toast.importantDateUpdateError'), variant: 'destructive' });
    }
  });

  const deleteImportantDateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/important-dates/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/important-dates'] });
      toast({ title: t('events:toast.success'), description: t('events:toast.importantDateDeleted') });
    },
    onError: () => {
      toast({ title: t('events:toast.error'), description: t('events:toast.importantDateDeleteError'), variant: 'destructive' });
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
      toast({ title: t('events:toast.error'), description: t('events:toast.fillNameAndDate'), variant: 'destructive' });
      return;
    }

    // Validate date format (dd.mm)
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])$/;
    if (!dateRegex.test(importantDateForm.date)) {
      toast({ 
        title: t('events:toast.error'), 
        description: t('events:importantDate.dateFormatError'), 
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

  const handleAccordionChange = (panel: string) => (event: SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  const renderEventRow = (event: Event, isPastEvent: boolean = false) => {
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
        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{event.location}</TableCell>
        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
          {event.rsvpEnabled ? `${rsvpCount}/${maxAttendees}` : t('events:no')}
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => handleEventClick(event)}
              sx={{ color: 'hsl(207 88% 55%)' }}
              data-testid={`button-view-event-${event.id}`}
            >
              <Visibility fontSize="small" />
            </IconButton>
            {user?.isAdmin && (
              <>
                <IconButton
                  size="small"
                  onClick={() => handleEditEvent(event)}
                  sx={{ color: 'hsl(14 100% 45%)' }}
                  data-testid={`button-edit-event-${event.id}`}
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteClick(event)}
                  sx={{ color: 'hsl(4 90% 58%)' }}
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
        {t('events:loadingError')}
      </Alert>
    );
  }

  const allEvents = eventsQuery.data || [];
  const importantDates = importantDatesQuery.data || [];
  
  // Sort events by date
  const sortedEvents = [...allEvents].sort((a, b) => {
    const dateA = new Date(a.dateTime).getTime();
    const dateB = new Date(b.dateTime).getTime();
    return dateA - dateB;
  });

  // Separate into upcoming and past events
  const now = new Date();
  const upcomingEvents = sortedEvents.filter(event => new Date(event.dateTime) >= now);
  const pastEvents = sortedEvents
    .filter(event => new Date(event.dateTime) < now)
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  // Top 3 upcoming events for main list
  const topUpcomingEvents = upcomingEvents.slice(0, 3);
  const otherUpcomingEvents = upcomingEvents.slice(3);
  
  const eventDates = allEvents.map(event => new Date(event.dateTime));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {t('events:pageTitle')}
        </Typography>
        {user?.isAdmin && activeTab === 0 && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateEvent}
            data-testid="button-add-event"
          >
            {t('events:createEvent')}
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
            label={t('events:title')} 
            data-testid="tab-events"
          />
          <Tab 
            icon={<EventNote />} 
            iconPosition="start" 
            label={t('events:importantDates')} 
            data-testid="tab-important-dates"
          />
        </Tabs>
      </Paper>

      {/* Tab Događaji */}
      {activeTab === 0 && (
        <Box>
          {/* Calendar and Selected Date Events side by side */}
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 3, 
              mb: 3,
              flexDirection: { xs: 'column', md: 'row' },
              '& > *': { flex: 1 }
            }}
          >
            {/* Calendar */}
            <Card>
              <Box sx={{ p: 2, borderBottom: '1px solid hsl(0 0% 88%)' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('events:calendar.title')}
                </Typography>
              </Box>
              <CardContent sx={{ px: 3, py: 2 }}>
                <DateCalendar
                  value={selectedDate}
                  onChange={(newDate) => setSelectedDate(newDate)}
                  slots={{
                    day: EventDay,
                  }}
                  slotProps={{
                    day: {
                      eventDates,
                      selectedDate,
                    } as any,
                  }}
                  dayOfWeekFormatter={(day) => {
                    const dayNames = ['N', 'P', 'U', 'S', 'Č', 'P', 'S'];
                    return dayNames[day.getDay()];
                  }}
                  sx={{
                    width: '100%',
                    mx: 0,
                    '& .MuiPickersCalendarHeader-root': {
                      paddingLeft: 2,
                      paddingRight: 2,
                    },
                    '& .MuiDayCalendar-header': {
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingLeft: '4px',
                      paddingRight: '4px',
                    },
                    '& .MuiDayCalendar-weekDayLabel': {
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: 'var(--semantic-neutral-text)',
                      width: '36px',
                      height: '36px',
                      margin: '0 2px',
                    },
                    '& .MuiDayCalendar-weekContainer': {
                      justifyContent: 'space-between',
                      margin: '0',
                    },
                    '& .MuiPickersDay-root': {
                      width: '36px',
                      height: '36px',
                      margin: '0 2px',
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* Selected Date Events */}
            {selectedDate && (
              <Card>
                <Box sx={{ p: 2, borderBottom: '1px solid hsl(0 0% 88%)', bgcolor: 'hsl(0 0% 98%)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t('events:eventsFor')} {format(selectedDate, 'dd.MM.yyyy.')}
                  </Typography>
                </Box>
                <CardContent>
                  {(() => {
                    const selectedDateEvents = allEvents.filter(event => 
                      isSameDay(new Date(event.dateTime), selectedDate)
                    );
                    
                    if (selectedDateEvents.length === 0) {
                      return (
                        <Box sx={{ py: 3, textAlign: 'center' }}>
                          <Typography color="text.secondary">
                            {t('events:noEventsForDate')}
                          </Typography>
                        </Box>
                      );
                    }
                    
                    return (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {selectedDateEvents.map((event: Event) => (
                          <Card 
                            key={event.id} 
                            variant="outlined"
                            sx={{ 
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              '&:hover': {
                                boxShadow: 2,
                                transform: 'translateY(-2px)',
                              }
                            }}
                            onClick={() => handleEventClick(event)}
                          >
                            <CardContent sx={{ p: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
                                    {event.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    <strong>{t('events:time')}:</strong> {format(new Date(event.dateTime), 'HH:mm')}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    <strong>{t('events:location')}:</strong> {event.location}
                                  </Typography>
                                  {event.description && (
                                    <Box 
                                      sx={{ 
                                        mt: 1,
                                        '& p': { margin: '4px 0' },
                                        '& img': { 
                                          maxWidth: '200px',
                                          height: 'auto',
                                          borderRadius: '4px',
                                          display: 'block',
                                          margin: '8px 0'
                                        }
                                      }}
                                      dangerouslySetInnerHTML={{ __html: event.description }}
                                    />
                                  )}
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
                                  {event.rsvpEnabled && (
                                    <Chip 
                                      label={`${getRsvpCount(event)}/${event.maxAttendees || '∞'}`}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                    />
                                  )}
                                  {user?.isAdmin && (
                                    <>
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditEvent(event);
                                        }}
                                        sx={{ color: 'hsl(14 100% 45%)' }}
                                      >
                                        <Edit fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteClick(event);
                                        }}
                                        sx={{ color: 'hsl(4 90% 58%)' }}
                                      >
                                        <Delete fontSize="small" />
                                      </IconButton>
                                    </>
                                  )}
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </Box>

          {/* Top 3 Upcoming Events */}
          <Card sx={{ mb: 2 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid hsl(0 0% 88%)' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {t('events:upcomingEvents')}
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('events:eventName')}</TableCell>
                    <TableCell>{t('events:dateTime')}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t('events:location')}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t('events:rsvp')}</TableCell>
                    <TableCell>{t('events:actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topUpcomingEvents.map((event: Event) => renderEventRow(event, false))}
                  {topUpcomingEvents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">
                          {t('events:noUpcomingEvents')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {/* Other Upcoming Events Accordion */}
          {otherUpcomingEvents.length > 0 && (
            <Accordion
              expanded={expandedAccordion === 'other'}
              onChange={handleAccordionChange('other')}
              TransitionProps={{ unmountOnExit: false, timeout: 0 }}
              sx={{ mb: 2 }}
              data-testid="accordion-other-events"
            >
              <AccordionSummary 
                expandIcon={<ExpandMore />}
                sx={{ bgcolor: 'hsl(0 0% 96%)' }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('events:otherEvents')} ({otherUpcomingEvents.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('events:eventName')}</TableCell>
                        <TableCell>{t('events:dateTime')}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t('events:location')}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t('events:rsvp')}</TableCell>
                        <TableCell>{t('events:actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {otherUpcomingEvents.map((event: Event) => renderEventRow(event, false))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Past Events Accordion */}
          {pastEvents.length > 0 && (
            <Accordion
              expanded={expandedAccordion === 'past'}
              onChange={handleAccordionChange('past')}
              TransitionProps={{ unmountOnExit: false, timeout: 0 }}
              sx={{ mb: 2 }}
              data-testid="accordion-past-events"
            >
              <AccordionSummary 
                expandIcon={<ExpandMore />}
                sx={{ bgcolor: 'hsl(0 0% 96%)' }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('events:pastEvents')} ({pastEvents.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('events:eventName')}</TableCell>
                        <TableCell>{t('events:dateTime')}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t('events:location')}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t('events:rsvp')}</TableCell>
                        <TableCell>{t('events:actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pastEvents.map((event: Event) => renderEventRow(event, true))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      )}

      {/* Tab Važni datumi */}
      {activeTab === 1 && (
        <Box>
          {user?.isAdmin && (
            <Card sx={{ mb: 3 }}>
              <Box sx={{ p: 2, borderBottom: '1px solid hsl(0 0% 88%)' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {editingImportantDate ? t('events:importantDate.edit') : t('events:importantDate.add')}
                </Typography>
              </Box>
              <CardContent>
                <Box component="form" onSubmit={handleImportantDateSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label={t('events:importantDate.name')}
                    value={importantDateForm.name}
                    onChange={(e) => setImportantDateForm({ ...importantDateForm, name: e.target.value })}
                    required
                    fullWidth
                    data-testid="input-important-date-name"
                  />
                  <TextField
                    label={`${t('events:importantDate.date')} (${t('events:importantDate.dateFormat')})`}
                    value={importantDateForm.date}
                    onChange={(e) => setImportantDateForm({ ...importantDateForm, date: e.target.value })}
                    placeholder={t('events:datePlaceholder')}
                    required
                    fullWidth
                    data-testid="input-important-date-date"
                    helperText={t('events:dateHelperText')}
                  />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button 
                      type="submit" 
                      variant="contained"
                      data-testid="button-submit-important-date"
                    >
                      {editingImportantDate ? t('common:buttons.edit') : t('common:buttons.add')}
                    </Button>
                    {editingImportantDate && (
                      <Button 
                        onClick={handleCancelEditImportantDate}
                        variant="outlined"
                        data-testid="button-cancel-edit-important-date"
                      >
                        {t('common:buttons.cancel')}
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          <Card>
            <Box sx={{ p: 2, borderBottom: '1px solid hsl(0 0% 88%)' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {t('events:importantDateList')}
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('events:importantDate.date')}</TableCell>
                    <TableCell>{t('events:importantDate.name')}</TableCell>
                    {user?.isAdmin && (
                      <TableCell>{t('events:actions')}</TableCell>
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
                              sx={{ color: 'hsl(14 100% 45%)' }}
                              data-testid={`button-edit-important-date-${date.id}`}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => deleteImportantDateMutation.mutate(date.id)}
                              sx={{ color: 'hsl(4 90% 58%)' }}
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
                          {t('events:importantDate.noImportantDates')}
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
        <DialogTitle>{t('events:confirmDelete')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('events:confirmDeleteMessage', { eventName: eventToDelete?.name })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} data-testid="button-cancel-delete">
            {t('common:buttons.cancel')}
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            data-testid="button-confirm-delete"
          >
            {t('common:buttons.delete')}
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
