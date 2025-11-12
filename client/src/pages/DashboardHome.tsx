import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
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
  IconButton,
  LinearProgress
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
  Close,
  EmojiEvents
} from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { 
  getActivityTypeChip, 
  formatTimeAgo 
} from '../data/mockData';
import TasksDashboard from '../components/TasksDashboard';
import { useAuth } from '../hooks/useAuth';
import type { Announcement, Event as EventType, WorkGroup, PrayerTime } from '@shared/schema';
import { format, isSameDay, isWeekend } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface Statistics {
  userCount: number;
  newAnnouncementsCount: number;
  upcomingEventsCount: number;
  activeTasksCount: number;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  userId: string;
  createdAt: string;
}

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

export default function DashboardHome() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useTranslation(['dashboard', 'common', 'navigation', 'vaktija']);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [dateEventsModalOpen, setDateEventsModalOpen] = useState(false);
  
  // Fetch real statistics from API
  const statisticsQuery = useQuery<Statistics>({
    queryKey: ['/api/statistics'],
  });

  // Fetch real activities from API
  const activitiesQuery = useQuery<Activity[]>({
    queryKey: ['/api/activities'],
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

  // Fetch badges for points progress (members only)
  const badgesQuery = useQuery({
    queryKey: ['/api/badges'],
    enabled: !user?.isAdmin && !!user,
  });

  const userBadgesQuery = useQuery({
    queryKey: [`/api/user-badges/${user?.id}`],
    enabled: !user?.isAdmin && !!user,
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
          {t('dashboard:error')}
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
          {t('dashboard:error')}
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
        {/* User Badges Section */}
        {(() => {
          const allBadges = (badgesQuery.data as any[]) || [];
          const userBadges = (userBadgesQuery.data as any[]) || [];
          
          const earnedBadges = userBadges.map((ub: any) => {
            const badge = allBadges.find((b: any) => b.id === ub.badgeId);
            return badge;
          }).filter(Boolean);

          // Debug display
          if (badgesQuery.isLoading || userBadgesQuery.isLoading) {
            return (
              <Alert severity="info" sx={{ mb: 3 }}>
                Učitavanje značaka...
              </Alert>
            );
          }

          if (badgesQuery.error || userBadgesQuery.error) {
            return (
              <Alert severity="error" sx={{ mb: 3 }}>
                Greška pri učitavanju značaka. (Badges: {allBadges.length}, User badges: {userBadges.length})
              </Alert>
            );
          }

          if (earnedBadges.length > 0) {
            const getBadgeColor = (criteriaType: string) => {
              switch (criteriaType) {
                case 'points_total': return { bg: 'var(--semantic-award-bg)', text: 'var(--semantic-award-text)', border: 'var(--semantic-award-border)' };
                case 'contributions_amount': return { bg: 'var(--semantic-success-bg)', text: 'var(--semantic-success-text)', border: 'var(--semantic-success-border)' };
                case 'tasks_completed': return { bg: 'var(--semantic-info-bg)', text: 'var(--semantic-info-text)', border: 'var(--semantic-info-border)' };
                case 'events_attended': return { bg: 'var(--semantic-celebration-bg)', text: 'var(--semantic-celebration-text)', border: 'var(--semantic-celebration-border)' };
                default: return { bg: 'var(--surface-gray-96)', text: '#616161', border: 'var(--border-color-hover)' };
              }
            };

            return (
              <Card sx={{ mb: 3, bgcolor: '#ffffff', boxShadow: 2 }}>
                <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    {earnedBadges.map((badge: any) => {
                      const colors = getBadgeColor(badge.criteriaType);
                      return (
                        <Box
                          key={badge.id}
                          sx={{ 
                            fontSize: '2.5rem',
                            bgcolor: colors.bg,
                            border: `3px solid ${colors.border}`,
                            borderRadius: '50%',
                            width: 64,
                            height: 64,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 2,
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': {
                              transform: 'scale(1.1)',
                              boxShadow: 4
                            }
                          }}
                          title={badge.name}
                          onClick={() => setLocation('/my-badges')}
                        >
                          {badge.icon || '🏆'}
                        </Box>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            );
          }
          return null;
        })()}

        {/* Points Progress Card */}
        {(() => {
          const allBadges = (badgesQuery.data as any[]) || [];
          const userBadges = (userBadgesQuery.data as any[]) || [];
          const userBadgeIds = userBadges.map((ub: any) => ub.badgeId);
          
          // Find next badge based on points_total criteria
          const nextPointsBadge = allBadges
            .filter((badge: any) => 
              badge.criteriaType === 'points_total' && 
              !userBadgeIds.includes(badge.id) &&
              ((user as any)?.totalPoints || 0) < badge.criteriaValue
            )
            .sort((a: any, b: any) => a.criteriaValue - b.criteriaValue)[0];
          
          const currentPoints = (user as any)?.totalPoints || 0;
          const nextThreshold = nextPointsBadge?.criteriaValue || currentPoints;
          const progress = nextThreshold > 0 ? Math.min((currentPoints / nextThreshold) * 100, 100) : 0;
          
          return (
            <Card sx={{ mb: 3, bgcolor: 'hsl(36 100% 94%)', cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => setLocation('/my-points')}>
              <Box sx={{ p: 2, borderBottom: '1px solid hsl(35 100% 66%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <EmojiEvents sx={{ color: 'hsl(14 100% 45%)' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'hsl(14 100% 45%)' }}>
                    {t('dashboard:pointsProgress')}
                  </Typography>
                </Box>
              </Box>
              <CardContent>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: 'hsl(14 100% 45%)' }}>
                        {currentPoints.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ukupno bodova
                      </Typography>
                    </Box>
                    {nextPointsBadge && (
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'hsl(14 100% 45%)' }}>
                          {(nextThreshold - currentPoints).toLocaleString()} bodova
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          do sljedeće značke
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: 'hsl(36 100% 94%)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: 'hsl(14 100% 45%)'
                      }
                    }} 
                  />
                  {nextPointsBadge && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Sljedeća značka: {nextPointsBadge.icon} {nextPointsBadge.name} ({nextThreshold.toLocaleString()} bodova)
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          );
        })()}

        {/* Today's Prayer Times */}
        {todayPrayerTime && (
          <Card sx={{ mb: 3, bgcolor: 'hsl(207 90% 95%)' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #90caf9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Schedule sx={{ color: 'hsl(207 88% 55%)' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'hsl(207 88% 55%)' }}>
                  {t('dashboard:todaysPrayerTimes')} - {todayPrayerTime.date}
                </Typography>
              </Box>
              <Link href="/vaktija">
                <Button 
                  size="small" 
                  endIcon={<ArrowForward />}
                  sx={{ textTransform: 'none' }}
                  data-testid="link-full-vaktija"
                >
                  {t('dashboard:monthlyPrayerTimes')}
                </Button>
              </Link>
            </Box>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'space-around' }}>
                <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                  <Typography variant="caption" color="text.secondary">{t('dashboard:prayers.fajr')}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.fajr}</Typography>
                </Box>
                {todayPrayerTime.sunrise && (
                  <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                    <Typography variant="caption" color="text.secondary">{t('dashboard:prayers.sunrise')}</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.sunrise}</Typography>
                  </Box>
                )}
                <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                  <Typography variant="caption" color="text.secondary">{t('dashboard:prayers.dhuhr')}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.dhuhr}</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                  <Typography variant="caption" color="text.secondary">{t('dashboard:prayers.asr')}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.asr}</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                  <Typography variant="caption" color="text.secondary">{t('dashboard:prayers.maghrib')}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.maghrib}</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                  <Typography variant="caption" color="text.secondary">{t('dashboard:prayers.isha')}</Typography>
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
              <Box sx={{ p: 2, borderBottom: '1px solid hsl(0 0% 88%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Campaign sx={{ color: 'hsl(122 60% 29%)' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t('dashboard:latestAnnouncement')}
                  </Typography>
                </Box>
                <Link href="/announcements">
                  <Button 
                    size="small" 
                    endIcon={<Archive />}
                    sx={{ textTransform: 'none' }}
                    data-testid="link-archive-announcements"
                  >
                    {t('dashboard:announcementsArchive')}
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
                          '& img': { 
                            width: '180px',
                            height: '135px',
                            aspectRatio: '4/3',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            display: 'block',
                            margin: '8px 0'
                          }
                        }}
                        dangerouslySetInnerHTML={{ __html: latestAnnouncement.content }}
                      />
                    </Box>
                  </Link>
                ) : (
                  <Typography color="text.secondary">
                    {t('dashboard:noAnnouncements')}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Next Event */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ height: '100%' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid hsl(0 0% 88%)', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Event sx={{ color: 'hsl(14 100% 45%)' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('dashboard:nextEvent')}
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
                            '& img': { 
                              width: '150px',
                              height: '112px',
                              aspectRatio: '4/3',
                              objectFit: 'cover',
                              borderRadius: '4px',
                              display: 'block',
                              margin: '8px 0'
                            }
                          }}
                          dangerouslySetInnerHTML={{ __html: upcomingEvent.description || '' }}
                        />
                      )}
                    </Box>
                  </Link>
                ) : (
                  <Typography color="text.secondary">
                    {t('dashboard:noEvents')}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Calendar and Events side by side */}
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 3, 
            mt: 3,
            flexDirection: { xs: 'column', md: 'row' },
            '& > *': { flex: 1 }
          }}
        >
          {/* Calendar */}
          <Card sx={{ height: '100%' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid hsl(0 0% 88%)', display: 'flex', alignItems: 'center', gap: 2 }}>
              <CalendarMonth sx={{ color: 'hsl(207 88% 55%)' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {t('dashboard:eventCalendar')}
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
          
          {/* Today's Events */}
          <Card sx={{ height: '100%' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid hsl(0 0% 88%)', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Event sx={{ color: 'hsl(14 100% 45%)' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {selectedDate ? (
                  <>
                    {t('dashboard:eventsFor')} {format(selectedDate, 'dd.MM.yyyy.')}
                  </>
                ) : (
                  t('dashboard:todaysEvents')
                )}
              </Typography>
            </Box>
            <CardContent>
              {(() => {
                const dateToShow = selectedDate || new Date();
                const dateEvents = allEvents.filter(event => 
                  isSameDay(new Date(event.dateTime), dateToShow)
                );
                
                if (dateEvents.length === 0) {
                  return (
                    <Box sx={{ py: 3, textAlign: 'center' }}>
                      <Typography color="text.secondary">
                        {t('dashboard:noEventsForDate')}
                      </Typography>
                    </Box>
                  );
                }
                
                return (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {dateEvents.map((event: EventType) => (
                      <Link key={event.id} href="/events">
                        <Card 
                          variant="outlined"
                          sx={{ 
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              boxShadow: 2,
                              transform: 'translateY(-2px)',
                            }
                          }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
                              {event.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              ⏰ {format(new Date(event.dateTime), 'HH:mm')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              📍 {event.location}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </Box>
                );
              })()}
            </CardContent>
          </Card>
        </Box>

        {/* My Messages and My Sections side by side */}
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 3, 
            mt: 3,
            flexDirection: { xs: 'column', md: 'row' },
            '& > *': { flex: 1 }
          }}
        >
          {/* My Messages */}
          <Card sx={{ height: '100%' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid hsl(0 0% 88%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Mail sx={{ color: 'hsl(207 88% 55%)' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('dashboard:myMessages')}
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
                  {t('dashboard:all')}
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
                          bgcolor: 'hsl(207 90% 95%)',
                          borderLeft: '4px solid var(--semantic-info-gradient-start)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: 'hsl(207 90% 95%)',
                            transform: 'translateX(4px)'
                          }
                        }}
                        data-testid={`message-preview-${message.id}`}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {message.subject}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('dashboard:from')}: {message.sender?.firstName} {message.sender?.lastName}
                        </Typography>
                      </Box>
                    </Link>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">
                  {t('dashboard:noUnreadMessages')}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* My Sections */}
          <Card sx={{ height: '100%' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid hsl(0 0% 88%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Workspaces sx={{ color: 'hsl(291 64% 32%)' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('dashboard:mySections')}
                </Typography>
              </Box>
              <Link href="/tasks">
                <Button 
                  size="small" 
                  endIcon={<ChevronRight />}
                  sx={{ textTransform: 'none' }}
                  data-testid="link-all-sections"
                >
                  {t('dashboard:all')}
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
                          bgcolor: 'var(--semantic-celebration-bg)',
                          borderLeft: '4px solid #9c27b0',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: 'var(--semantic-celebration-bg)',
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
                  {t('dashboard:noSectionMembership')}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Date Events Modal */}
        <Dialog
          open={dateEventsModalOpen}
          onClose={() => setDateEventsModalOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {t('dashboard:eventsFor')} {selectedDate && format(selectedDate, 'dd.MM.yyyy.')}
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
                          '&:hover': { bgcolor: 'hsl(0 0% 96%)' }
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
                {t('dashboard:noEventsForDate')}
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
      {/* Admin Points Header */}
      <Link href="/badges">
        <Card 
          sx={{ 
            mb: 3, 
            bgcolor: 'hsl(36 100% 94%)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              boxShadow: 3,
              transform: 'translateY(-2px)'
            }
          }}
        >
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
            <EmojiEvents sx={{ fontSize: 40, color: 'hsl(14 100% 45%)' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'hsl(14 100% 45%)' }}>
                {t('dashboard:yourPoints')}: {(user as any)?.totalPoints || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('dashboard:viewBadges')}
              </Typography>
            </Box>
            <ArrowForward sx={{ color: 'hsl(14 100% 45%)' }} />
          </CardContent>
        </Card>
      </Link>

      {/* Today's Prayer Times */}
      {todayPrayerTime && (
        <Card sx={{ mb: 3, bgcolor: 'hsl(207 90% 95%)' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #90caf9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Schedule sx={{ color: 'hsl(207 88% 55%)' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'hsl(207 88% 55%)' }}>
                {t('dashboard:todaysPrayerTimes')} - {todayPrayerTime.date}
              </Typography>
            </Box>
            <Link href="/vaktija">
              <Button 
                size="small" 
                endIcon={<ArrowForward />}
                sx={{ textTransform: 'none' }}
                data-testid="link-full-vaktija"
              >
                {t('dashboard:prayerCalendar')}
              </Button>
            </Link>
          </Box>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'space-around' }}>
              <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                <Typography variant="caption" color="text.secondary">{t('dashboard:prayers.fajr')}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.fajr}</Typography>
              </Box>
              {todayPrayerTime.sunrise && (
                <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                  <Typography variant="caption" color="text.secondary">{t('dashboard:prayers.sunrise')}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.sunrise}</Typography>
                </Box>
              )}
              <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                <Typography variant="caption" color="text.secondary">{t('dashboard:prayers.dhuhr')}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.dhuhr}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                <Typography variant="caption" color="text.secondary">{t('dashboard:prayers.asr')}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.asr}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                <Typography variant="caption" color="text.secondary">{t('dashboard:prayers.maghrib')}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.maghrib}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                <Typography variant="caption" color="text.secondary">{t('dashboard:prayers.isha')}</Typography>
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
            title={t('dashboard:statistics.totalUsers')}
            value={statistics?.userCount || 0}
            color="hsl(207 88% 55%)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<Campaign />}
            title={t('dashboard:statistics.newAnnouncements')}
            value={statistics?.newAnnouncementsCount || 0}
            color="hsl(122 60% 29%)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<Event />}
            title={t('dashboard:statistics.upcomingEvents')}
            value={statistics?.upcomingEventsCount || 0}
            color="#ed6c02"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<TaskAlt />}
            title={t('dashboard:statistics.activeTasks')}
            value={statistics?.activeTasksCount || 0}
            color="#0097a7"
          />
        </Grid>
      </Grid>

      {/* Upcoming Events Section */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 3, borderBottom: '1px solid hsl(0 0% 88%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('dashboard:upcomingEvents')}
          </Typography>
          <Button
            component={Link}
            href="/events"
            endIcon={<ArrowForward />}
            sx={{ textTransform: 'none' }}
            data-testid="link-all-events"
          >
            {t('dashboard:allEvents')}
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
                          bgcolor: 'hsl(207 88% 55%)',
                          backgroundImage: 'linear-gradient(135deg, var(--semantic-info-gradient-start) 0%, var(--semantic-info-gradient-end) 100%)',
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
                              sx={{ color: 'hsl(207 88% 55%)' }}
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
                              {t('dashboard:rsvpButton')}
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<NotificationsActive />}
                            fullWidth
                            data-testid={`button-remind-${event.id}`}
                          >
                            {t('dashboard:remindMeButton')}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          ) : (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              {t('dashboard:noEvents')}
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
        <Box sx={{ p: 3, borderBottom: '1px solid hsl(0 0% 88%)' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('dashboard:recentActivities')}
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('dashboard:activityTable.type')}</TableCell>
                <TableCell>{t('dashboard:activityTable.description')}</TableCell>
                <TableCell>{t('dashboard:activityTable.user')}</TableCell>
                <TableCell>{t('dashboard:activityTable.time')}</TableCell>
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
                      {activity.userId ? t('dashboard:activityTable.userLabel') : t('dashboard:activityTable.systemLabel')}
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
                      {t('dashboard:noActivities')}
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
