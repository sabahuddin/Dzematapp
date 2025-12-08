import { Box, Typography, List, ListItem, ListItemText, ListItemIcon, Paper, Chip } from '@mui/material';
import { Campaign, Event, Store, QuestionAnswer, Task, Mail, CardGiftcard, Info } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

export default function NotificationsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: notificationCounts } = useQuery<{ 
    shop: number; 
    events: number; 
    announcements: number; 
    imamQuestions: number; 
    tasks: number; 
    accessRequests: number;
  }>({
    queryKey: ['/api/notifications/unread'],
    refetchInterval: 30000,
    enabled: !!user,
  });

  const { data: unreadMessages } = useQuery<{ count: number }>({
    queryKey: ['/api/messages/unread-count'],
    refetchInterval: 30000,
    enabled: !!user,
  });

  const { data: unviewedCertificates } = useQuery<{ count: number }>({
    queryKey: ['/api/certificates/unviewed-count'],
    refetchInterval: 30000,
    enabled: !!user,
  });

  const notificationItems = [
    {
      icon: <Campaign sx={{ color: '#3949AB' }} />,
      label: 'Nova obavještenja',
      count: notificationCounts?.announcements || 0,
      route: '/announcements',
      testId: 'notification-announcements'
    },
    {
      icon: <Event sx={{ color: '#3949AB' }} />,
      label: 'Novi događaji',
      count: notificationCounts?.events || 0,
      route: '/events',
      testId: 'notification-events'
    },
    {
      icon: <Store sx={{ color: '#3949AB' }} />,
      label: 'Novi proizvodi',
      count: notificationCounts?.shop || 0,
      route: '/shop',
      testId: 'notification-shop'
    },
    {
      icon: <Task sx={{ color: '#3949AB' }} />,
      label: 'Novi zadaci',
      count: notificationCounts?.tasks || 0,
      route: '/tasks',
      testId: 'notification-tasks'
    },
    {
      icon: <QuestionAnswer sx={{ color: '#3949AB' }} />,
      label: 'Pitanja za imama',
      count: notificationCounts?.imamQuestions || 0,
      route: '/ask-imam',
      testId: 'notification-imam'
    },
    {
      icon: <Mail sx={{ color: '#3949AB' }} />,
      label: 'Nove poruke',
      count: unreadMessages?.count || 0,
      route: '/messages',
      testId: 'notification-messages'
    },
    {
      icon: <CardGiftcard sx={{ color: '#3949AB' }} />,
      label: 'Nove zahvalnice',
      count: unviewedCertificates?.count || 0,
      route: '/my-certificates',
      testId: 'notification-certificates'
    },
  ];

  // Filter out items with zero count
  const activeNotifications = notificationItems.filter(item => item.count > 0);

  const totalCount = notificationItems.reduce((sum, item) => sum + item.count, 0);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#0D1B2A', mb: 1 }}>
          Notifikacije
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {totalCount > 0 ? `Imate ${totalCount} novih notifikacija` : 'Nemate novih notifikacija'}
        </Typography>
      </Box>

      {activeNotifications.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Info sx={{ fontSize: 64, color: '#3949AB', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Nemate novih notifikacija
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Sve notifikacije su pročitane
          </Typography>
        </Paper>
      ) : (
        <List sx={{ p: 0 }}>
          {activeNotifications.map((item) => (
            <Paper
              key={item.testId}
              onClick={() => setLocation(item.route)}
              data-testid={item.testId}
              sx={{
                mb: 2,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(8px)',
                  boxShadow: '0 8px 16px rgba(57, 73, 171, 0.15)',
                },
              }}
            >
              <ListItem>
                <ListItemIcon sx={{ minWidth: 48 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: 600,
                    fontSize: '0.95rem'
                  }}
                />
                <Chip
                  label={item.count}
                  color="error"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </ListItem>
            </Paper>
          ))}
        </List>
      )}
    </Box>
  );
}
