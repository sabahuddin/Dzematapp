import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { type Event } from '@shared/schema';
import { CalendarMonth } from '@mui/icons-material';
import { format } from 'date-fns';
import { normalizeImageUrl } from '@/lib/imageUtils';

const cardStyle = { borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };

export default function EventsWidget() {
  const [, setLocation] = useLocation();

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  const upcomingEvents = events
    .filter(e => new Date(e.dateTime!) >= new Date())
    .sort((a, b) => new Date(a.dateTime!).getTime() - new Date(b.dateTime!).getTime())
    .slice(0, 3);

  const formatDate = (dateString: Date | null | string | undefined) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd.MM.yyyy');
  };

  const formatTime = (dateString: Date | null | string | undefined) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'HH:mm');
  };

  return (
    <Card sx={cardStyle}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarMonth fontSize="small" color="primary" />
            <Typography variant="subtitle2" fontWeight={600}>Događaji</Typography>
          </Box>
          <Typography 
            variant="caption" 
            color="primary" 
            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            onClick={() => setLocation('/events')}
          >
            Vidi sve
          </Typography>
        </Box>
        {isLoading ? (
          <CircularProgress size={20} />
        ) : upcomingEvents.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Nema nadolazećih događaja</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {upcomingEvents.map((event) => {
              const imageUrl = event.photoUrl ? normalizeImageUrl(event.photoUrl) : null;
              return (
                <Box 
                  key={event.id}
                  onClick={() => setLocation(`/events`)}
                  sx={{ 
                    display: 'flex', 
                    gap: 2,
                    p: 1.5,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  {imageUrl && (
                    <Box
                      component="img"
                      src={imageUrl}
                      alt={event.name}
                      sx={{ width: 80, height: 60, borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                    />
                  )}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>{event.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(event.dateTime)} u {formatTime(event.dateTime)}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
