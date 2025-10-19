import React from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Button
} from '@mui/material';
import {
  People,
  Campaign,
  Event,
  TaskAlt,
  CalendarMonth,
  Mail
} from '@mui/icons-material';
import { 
  mockStatistics, 
  mockRecentActivities, 
  getActivityTypeChip, 
  formatTimeAgo 
} from '../data/mockData';
import TasksDashboard from '../components/TasksDashboard';
import { useAuth } from '../hooks/useAuth';
import type { Announcement, Event as EventType } from '@shared/schema';
import { format } from 'date-fns';

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

export default function DashboardHome() {
  const { user } = useAuth();
  
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

  // For members, fetch latest announcement and upcoming events
  const announcementsQuery = useQuery<Announcement[]>({
    queryKey: ['/api/announcements'],
    enabled: !user?.isAdmin,
  });

  const eventsQuery = useQuery<EventType[]>({
    queryKey: ['/api/events'],
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

  if (user?.isAdmin) {
    if (statisticsQuery.isLoading || activitiesQuery.isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (statisticsQuery.error || activitiesQuery.error) {
      return (
        <Alert severity="error">
          Greška pri učitavanju podataka. Molimo pokušajte ponovo.
        </Alert>
      );
    }
  } else {
    if (announcementsQuery.isLoading || eventsQuery.isLoading || messagesQuery.isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (announcementsQuery.error || eventsQuery.error || messagesQuery.error) {
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
  const upcomingEvents = eventsQuery.data
    ?.filter(event => new Date(event.dateTime) >= new Date())
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
    .slice(0, 5);
  const unreadMessages = messagesQuery.data?.filter(msg => !msg.isRead && msg.recipientId === user?.id) || [];

  // Member Dashboard
  if (!user?.isAdmin) {
    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Dobrodošli, {user?.firstName}!
        </Typography>

        <Grid container spacing={3}>
          {/* Latest Announcement */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Campaign sx={{ color: '#2e7d32' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Najnovija Obavijest
                </Typography>
              </Box>
              <CardContent>
                {latestAnnouncement ? (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {latestAnnouncement.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {format(new Date(latestAnnouncement.publishedAt), 'dd.MM.yyyy HH:mm')}
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {latestAnnouncement.content}
                    </Typography>
                  </Box>
                ) : (
                  <Typography color="text.secondary">
                    Nema novih obavijesti
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Upcoming Events */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
              <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 2 }}>
                <CalendarMonth sx={{ color: '#ed6c02' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Nadolazeći Događaji
                </Typography>
              </Box>
              <CardContent>
                {upcomingEvents && upcomingEvents.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {upcomingEvents.map((event) => (
                      <Box 
                        key={event.id}
                        sx={{ 
                          p: 2, 
                          borderRadius: 1, 
                          bgcolor: '#f8f9fa',
                          borderLeft: '4px solid #ed6c02'
                        }}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {event.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(event.dateTime), 'dd.MM.yyyy HH:mm')}
                        </Typography>
                        {event.location && (
                          <Typography variant="body2" color="text.secondary">
                            📍 {event.location}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography color="text.secondary">
                    Nema nadolazećih događaja
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Unread Messages */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
              <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Mail sx={{ color: '#1976d2' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Nepročitane Poruke
                </Typography>
              </Box>
              <CardContent>
                {unreadMessages.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {unreadMessages.slice(0, 5).map((message) => (
                      <Box 
                        key={message.id}
                        sx={{ 
                          p: 2, 
                          borderRadius: 1, 
                          bgcolor: '#f8f9fa',
                          borderLeft: '4px solid #1976d2'
                        }}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {message.subject}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Od: {message.sender?.firstName} {message.sender?.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(message.createdAt), 'dd.MM.yyyy HH:mm')}
                        </Typography>
                      </Box>
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
        </Grid>
      </Box>
    );
  }

  // Admin Dashboard
  return (
    <Box>
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
