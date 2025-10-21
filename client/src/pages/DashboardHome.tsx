import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  Button,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton
} from '@mui/material';
import {
  People,
  Campaign,
  Event,
  TaskAlt,
  CalendarMonth,
  Mail,
  Workspaces,
  Archive,
  ChevronRight,
  LocationOn,
  Schedule,
  PersonAdd,
  NotificationsActive,
  ArrowForward,
  Visibility,
  Edit,
  Delete,
  Close
} from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { 
  mockStatistics, 
  mockRecentActivities, 
  getActivityTypeChip, 
  formatTimeAgo 
} from '../data/mockData';
import TasksDashboard from '../components/TasksDashboard';
import { useAuth } from '../hooks/useAuth';
import type { Announcement, Event as EventType, WorkGroup, PrayerTime } from '@shared/schema';
import { format, isSameDay } from 'date-fns';

const StatCard = ({ icon, title, value, color }: {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: string;
}) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          bgcolor: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
          {value.toLocaleString()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

// Custom Day component for highlighting event days
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
        outsideCurrentMonth={outsideCurrentMonth} 
        day={day}
        sx={{
          ...(hasEvent && {
            fontWeight: 600,
            color: '#ed6c02',
          })
        }}
      />
    </Badge>
  );
}

export default function DashboardHome() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [dateEventsModalOpen, setDateEventsModalOpen] = useState(false);
  
  // In a real app, these would be actual API calls
  const statisticsQuery = useQuery({
    queryKey: ['/api/statistics'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockStatistics;
    }
  });

  const activitiesQuery = useQuery({
    queryKey: ['/api/activities'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockRecentActivities;
    }
  });

  // Fetch events for all users
  const eventsQuery = useQuery<EventType[]>({
    queryKey: ['/api/events'],
  });

  // For members, fetch latest announcement
  const announcementsQuery = useQuery<Announcement[]>({
    queryKey: ['/api/announcements'],
    enabled: !user?.isAdmin,
  });

  interface MessageWithDetails {
    id: string;
    senderId: string;
    recipientId: string | null;
    category: string | null;
    subject: string;
    content: string;
    isRead: boolean;
    createdAt: string;
    sender: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  }

  const messagesQuery = useQuery<MessageWithDetails[]>({
    queryKey: ['/api/messages'],
    enabled: !user?.isAdmin,
  });

  // Fetch user's work groups
  const workGroupsQuery = useQuery<WorkGroup[]>({
    queryKey: ['/api/work-groups'],
    enabled: !user?.isAdmin,
  });

  // Fetch today's prayer times for all users
  const todayPrayerTimeQuery = useQuery<PrayerTime>({
    queryKey: ['/api/prayer-times/today'],
    retry: false,
  });

  if (user?.isAdmin) {
    if (statisticsQuery.isLoading || activitiesQuery.isLoading || eventsQuery.isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (statisticsQuery.error || activitiesQuery.error || eventsQuery.error) {
      return (
        <Alert severity="error">
          Greška pri učitavanju podataka. Molimo pokušajte ponovo.
        </Alert>
      );
    }
  } else {
    if (announcementsQuery.isLoading || eventsQuery.isLoading || messagesQuery.isLoading || workGroupsQuery.isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (announcementsQuery.error || eventsQuery.error || messagesQuery.error || workGroupsQuery.error) {
      return (
        <Alert severity="error">
          Greška pri učitavanju podataka. Molimo pokušajte ponovo.
        </Alert>
      );
    }
  }

  const statistics = statisticsQuery.data;
  const activities = activitiesQuery.data;

  // For members: get latest announcement, upcoming events, and unread messages
  const latestAnnouncement = announcementsQuery.data?.[0];
  const allEvents = eventsQuery.data || [];
  const upcomingEvent = allEvents
    .filter(event => new Date(event.dateTime) >= new Date())
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())[0];
  
  // Get event dates for calendar highlighting
  const eventDates = allEvents
    .filter(event => new Date(event.dateTime) >= new Date())
    .map(event => new Date(event.dateTime));

  const unreadMessages = messagesQuery.data?.filter(msg => !msg.isRead && msg.recipientId === user?.id) || [];
  const userWorkGroups = workGroupsQuery.data || [];

  // Member Dashboard
  if (!user?.isAdmin) {
    const todayPrayerTime = todayPrayerTimeQuery.data;

    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Dobrodošli, {user?.firstName}!
        </Typography>

        {/* Today's Prayer Times */}
        {todayPrayerTime && (
          <Card sx={{ mb: 3, bgcolor: '#e3f2fd' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #90caf9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Schedule sx={{ color: '#1976d2' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
                  Današnje vaktije - {todayPrayerTime.date}
                </Typography>
              </Box>
              <Link href="/vaktija">
                <Button 
                  size="small" 
                  endIcon={<ArrowForward />}
                  sx={{ textTransform: 'none' }}
                  data-testid="link-full-vaktija"
                >
                  Kalendar vaktija
                </Button>
              </Link>
            </Box>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'space-around' }}>
                <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                  <Typography variant="caption" color="text.secondary">Zora</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.fajr}</Typography>
                </Box>
                {todayPrayerTime.sunrise && (
                  <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                    <Typography variant="caption" color="text.secondary">Izlazak</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.sunrise}</Typography>
                  </Box>
                )}
                <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                  <Typography variant="caption" color="text.secondary">Podne</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.dhuhr}</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                  <Typography variant="caption" color="text.secondary">Ikindija</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.asr}</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                  <Typography variant="caption" color="text.secondary">Akšam</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.maghrib}</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                  <Typography variant="caption" color="text.secondary">Jacija</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.isha}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        <Grid container spacing={3}>
          {/* Latest Announcement */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ height: '100%' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Campaign sx={{ color: '#2e7d32' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Zadnja Obavijest
                  </Typography>
                </Box>
                <Link href="/announcements">
                  <Button 
                    size="small" 
                    endIcon={<Archive />}
                    sx={{ textTransform: 'none' }}
                    data-testid="link-archive-announcements"
                  >
                    Arhiva obavijesti
                  </Button>
                </Link>
              </Box>
              <CardContent data-testid="card-latest-announcement">
                {latestAnnouncement ? (
                  <Link href="/announcements">
                    <Box
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.8 }
                      }}
                    >
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                        {latestAnnouncement.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {latestAnnouncement.publishDate && format(new Date(latestAnnouncement.publishDate), 'dd.MM.yyyy. u HH:mm')}
                      </Typography>
                      <Box 
                        sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 5,
                          WebkitBoxOrient: 'vertical',
                          '& p': { margin: 0 },
                          '& img': { maxWidth: '100%', height: 'auto' }
                        }}
                        dangerouslySetInnerHTML={{ __html: latestAnnouncement.content }}
                      />
                    </Box>
                  </Link>
                ) : (
                  <Typography color="text.secondary">
                    Nema novih obavijesti
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Next Event */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ height: '100%' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Event sx={{ color: '#ed6c02' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Sljedeći Događaj
                </Typography>
              </Box>
              <CardContent data-testid="card-upcoming-event">
                {upcomingEvent ? (
                  <Link href="/events">
                    <Box
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.8 }
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {upcomingEvent.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        📅 {format(new Date(upcomingEvent.dateTime), 'dd.MM.yyyy. u HH:mm')}
                      </Typography>
                      {upcomingEvent.location && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          📍 {upcomingEvent.location}
                        </Typography>
                      )}
                      {upcomingEvent.description && (
                        <Box 
                          sx={{ 
                            mt: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            '& p': { margin: 0 },
                            '& img': { maxWidth: '100%', height: 'auto' }
                          }}
                          dangerouslySetInnerHTML={{ __html: upcomingEvent.description || '' }}
                        />
                      )}
                    </Box>
                  </Link>
                ) : (
                  <Typography color="text.secondary">
                    Nema nadolazećih događaja
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Calendar with Event Markers */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card sx={{ height: '100%' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 2 }}>
                <CalendarMonth sx={{ color: '#1976d2' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Kalendar Događaja
                </Typography>
              </Box>
              <CardContent sx={{ p: 0 }}>
                <DateCalendar
                  value={selectedDate}
                  onChange={(newDate) => {
                    setSelectedDate(newDate);
                    if (newDate) {
                      setDateEventsModalOpen(true);
                    }
                  }}
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
          </Grid>

          {/* My Messages */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card sx={{ height: '100%' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Mail sx={{ color: '#1976d2' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Moje Poruke
                  </Typography>
                  {unreadMessages.length > 0 && (
                    <Badge badgeContent={unreadMessages.length} color="error" data-testid="badge-unread-messages" />
                  )}
                </Box>
                <Link href="/messages">
                  <Button 
                    size="small" 
                    endIcon={<ChevronRight />}
                    sx={{ textTransform: 'none' }}
                    data-testid="link-all-messages"
                  >
                    Sve
                  </Button>
                </Link>
              </Box>
              <CardContent>
                {unreadMessages.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {unreadMessages.slice(0, 3).map((message) => (
                      <Link key={message.id} href="/messages">
                        <Box 
                          sx={{ 
                            p: 2, 
                            borderRadius: 1, 
                            bgcolor: '#e3f2fd',
                            borderLeft: '4px solid #1976d2',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: '#bbdefb',
                              transform: 'translateX(4px)'
                            }
                          }}
                          data-testid={`message-preview-${message.id}`}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {message.subject}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Od: {message.sender?.firstName} {message.sender?.lastName}
                          </Typography>
                        </Box>
                      </Link>
                    ))}
                  </Box>
                ) : (
                  <Typography color="text.secondary">
                    Nema novih poruka
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* My Sections */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Card sx={{ height: '100%' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Workspaces sx={{ color: '#9c27b0' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Moje Sekcije
                  </Typography>
                </Box>
                <Link href="/tasks">
                  <Button 
                    size="small" 
                    endIcon={<ChevronRight />}
                    sx={{ textTransform: 'none' }}
                    data-testid="link-all-sections"
                  >
                    Sve
                  </Button>
                </Link>
              </Box>
              <CardContent>
                {userWorkGroups.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {userWorkGroups.slice(0, 4).map((workGroup) => (
                      <Link key={workGroup.id} href="/tasks">
                        <Box 
                          sx={{ 
                            p: 2, 
                            borderRadius: 1, 
                            bgcolor: '#f3e5f5',
                            borderLeft: '4px solid #9c27b0',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: '#e1bee7',
                              transform: 'translateX(4px)'
                            }
                          }}
                          data-testid={`section-preview-${workGroup.id}`}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {workGroup.name}
                          </Typography>
                          {workGroup.description && (
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical'
                              }}
                            >
                              {workGroup.description}
                            </Typography>
                          )}
                        </Box>
                      </Link>
                    ))}
                  </Box>
                ) : (
                  <Typography color="text.secondary">
                    Niste član nijedne sekcije
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Date Events Modal */}
        <Dialog
          open={dateEventsModalOpen}
          onClose={() => setDateEventsModalOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Događaji za {selectedDate && format(selectedDate, 'dd.MM.yyyy.')}
            <IconButton
              onClick={() => setDateEventsModalOpen(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
              data-testid="button-close-date-events-modal"
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {selectedDate && allEvents
              .filter(event => selectedDate && isSameDay(new Date(event.dateTime), selectedDate))
              .length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {allEvents
                  .filter(event => selectedDate && isSameDay(new Date(event.dateTime), selectedDate))
                  .map(event => (
                    <Link key={event.id} href="/events">
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#f5f5f5' }
                        }}
                      >
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            {event.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Schedule sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {format(new Date(event.dateTime), 'HH:mm')}
                            </Typography>
                          </Box>
                          {event.location && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationOn sx={{ fontSize: 18, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {event.location}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
              </Box>
            ) : (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Nema događaja za izabrani datum
              </Typography>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    );
  }

  // Admin Dashboard
  const todayPrayerTime = todayPrayerTimeQuery.data;

  return (
    <Box>
      {/* Today's Prayer Times */}
      {todayPrayerTime && (
        <Card sx={{ mb: 3, bgcolor: '#e3f2fd' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #90caf9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Schedule sx={{ color: '#1976d2' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
                Današnje vaktije - {todayPrayerTime.date}
              </Typography>
            </Box>
            <Link href="/vaktija">
              <Button 
                size="small" 
                endIcon={<ArrowForward />}
                sx={{ textTransform: 'none' }}
                data-testid="link-full-vaktija"
              >
                Kalendar vaktija
              </Button>
            </Link>
          </Box>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'space-around' }}>
              <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                <Typography variant="caption" color="text.secondary">Zora</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.fajr}</Typography>
              </Box>
              {todayPrayerTime.sunrise && (
                <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                  <Typography variant="caption" color="text.secondary">Izlazak</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.sunrise}</Typography>
                </Box>
              )}
              <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                <Typography variant="caption" color="text.secondary">Podne</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.dhuhr}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                <Typography variant="caption" color="text.secondary">Ikindija</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.asr}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                <Typography variant="caption" color="text.secondary">Akšam</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.maghrib}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                <Typography variant="caption" color="text.secondary">Jacija</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.isha}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<People />}
            title="Ukupan Broj Korisnika"
            value={statistics?.userCount || 0}
            color="#1976d2"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<Campaign />}
            title="Nove Obavijesti (7 dana)"
            value={statistics?.newAnnouncementsCount || 0}
            color="#2e7d32"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<Event />}
            title="Nadolazeći Događaji"
            value={statistics?.upcomingEventsCount || 0}
            color="#ed6c02"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<TaskAlt />}
            title="Aktivni Zadaci"
            value={statistics?.activeTasksCount || 0}
            color="#0097a7"
          />
        </Grid>
      </Grid>

      {/* Upcoming Events Section */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Nadolazeći Događaji
          </Typography>
          <Button
            component={Link}
            href="/events"
            endIcon={<ArrowForward />}
            sx={{ textTransform: 'none' }}
            data-testid="link-all-events"
          >
            Svi Događaji
          </Button>
        </Box>
        <Box sx={{ p: 3 }}>
          {eventsQuery.data && eventsQuery.data.length > 0 ? (
            <Grid container spacing={2}>
              {eventsQuery.data
                .filter(event => new Date(event.dateTime) >= new Date())
                .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
                .slice(0, 6)
                .map(event => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={event.id}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 3
                        }
                      }}
                      data-testid={`event-card-${event.id}`}
                    >
                      <Box
                        sx={{
                          height: 180,
                          bgcolor: '#1976d2',
                          backgroundImage: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}
                      >
                        <CalendarMonth sx={{ fontSize: 64, color: 'white', opacity: 0.3 }} />
                        <Typography
                          variant="h6"
                          sx={{
                            position: 'absolute',
                            color: 'white',
                            fontWeight: 600,
                            textAlign: 'center',
                            px: 2
                          }}
                        >
                          {format(new Date(event.dateTime), 'dd.MM.yyyy.')}
                        </Typography>
                        
                        {/* Action Icons */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            display: 'flex',
                            gap: 0.5,
                            bgcolor: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: 1,
                            p: 0.5
                          }}
                        >
                          <Link href="/events">
                            <IconButton
                              size="small"
                              sx={{ color: '#1976d2' }}
                              data-testid={`button-view-event-${event.id}`}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Link>
                        </Box>
                      </Box>
                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600, 
                            mb: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}
                        >
                          {event.name}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <LocationOn sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {event.location}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Schedule sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {format(new Date(event.dateTime), 'dd.MM.yyyy. u HH:mm')}
                          </Typography>
                        </Box>

                        <Box sx={{ mt: 'auto', display: 'flex', gap: 1 }}>
                          {event.rsvpEnabled && (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<PersonAdd />}
                              fullWidth
                              data-testid={`button-rsvp-${event.id}`}
                            >
                              Prijavi se
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<NotificationsActive />}
                            fullWidth
                            data-testid={`button-remind-${event.id}`}
                          >
                            Podsjeti me
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          ) : (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Nema nadolazećih događaja
            </Typography>
          )}
        </Box>
      </Card>

      {/* Tasks Dashboard for Admins and Moderators */}
      <Box sx={{ mb: 3 }}>
        <TasksDashboard />
      </Box>

      {/* Recent Activities Table */}
      <Card>
        <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Posljednje Aktivnosti
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 600 }}>Tip</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Opis</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Korisnik</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Vrijeme</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activities?.map((activity, index) => {
                const chipData = getActivityTypeChip(activity.type);
                return (
                  <TableRow key={activity.id || index}>
                    <TableCell>
                      <Chip 
                        label={chipData.label}
                        color={chipData.color}
                        size="small"
                        sx={{ 
                          textTransform: 'uppercase',
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                    <TableCell>{activity.description}</TableCell>
                    <TableCell>
                      {activity.userId ? 'Korisnik' : 'System'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatTimeAgo(new Date(activity.createdAt))}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!activities || activities.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      Nema nedavnih aktivnosti
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
