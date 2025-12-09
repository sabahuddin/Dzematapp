import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import { CheckCircle, Event as EventIcon, LocationOn, CalendarMonth, EmojiEvents } from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { bs } from 'date-fns/locale';
import { DzematLogo } from '@/components/DzematLogo';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';

interface EventInfo {
  id: string;
  name: string;
  location: string;
  dateTime: string;
  photoUrl: string | null;
  pointsValue: number;
  tenantId: string;
  organizationName: string;
}

export default function EventCheckinPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const [guestName, setGuestName] = useState('');
  const [checkinSuccess, setCheckinSuccess] = useState(false);
  const [checkinResult, setCheckinResult] = useState<{ message: string; pointsAwarded: number; isGuest: boolean } | null>(null);

  const eventQuery = useQuery<EventInfo>({
    queryKey: ['/api/events', eventId, 'checkin-info'],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/checkin-info`);
      if (!response.ok) throw new Error('Event not found');
      return response.json();
    },
    enabled: !!eventId
  });

  const checkinMutation = useMutation({
    mutationFn: async (data: { guestName?: string }) => {
      const response = await apiRequest(`/api/events/${eventId}/qr-checkin`, 'POST', data);
      return response.json();
    },
    onSuccess: (data) => {
      setCheckinSuccess(true);
      setCheckinResult(data);
    }
  });

  useEffect(() => {
    if (user && !authLoading && eventQuery.data && !checkinSuccess && !checkinMutation.isPending) {
      checkinMutation.mutate({});
    }
  }, [user, authLoading, eventQuery.data]);

  const handleGuestCheckin = () => {
    if (guestName.trim().length >= 2) {
      checkinMutation.mutate({ guestName: guestName.trim() });
    }
  };

  if (eventQuery.isLoading || authLoading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #3949AB 0%, #1E88E5 100%)'
      }}>
        <CircularProgress sx={{ color: 'white' }} />
      </Box>
    );
  }

  if (eventQuery.error || !eventQuery.data) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #3949AB 0%, #1E88E5 100%)',
        p: 2
      }}>
        <Card sx={{ maxWidth: 400, width: '100%', borderRadius: 4 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="error">
              Događaj nije pronađen
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const event = eventQuery.data;
  const eventDate = new Date(event.dateTime);

  if (checkinSuccess && checkinResult) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #26A69A 0%, #00897B 100%)',
        p: 2
      }}>
        <Card sx={{ maxWidth: 400, width: '100%', borderRadius: 4 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle sx={{ fontSize: 80, color: '#26A69A', mb: 2 }} />
            <Typography variant="h5" fontWeight={600} gutterBottom>
              {checkinResult.message}
            </Typography>
            
            {!checkinResult.isGuest && checkinResult.pointsAwarded > 0 && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: 1,
                mt: 2,
                p: 2,
                bgcolor: '#FFF3E0',
                borderRadius: 2
              }}>
                <EmojiEvents sx={{ color: '#FF9800' }} />
                <Typography variant="h6" color="#E65100">
                  +{checkinResult.pointsAwarded} bodova
                </Typography>
              </Box>
            )}

            <Typography variant="body1" color="text.secondary" sx={{ mt: 3 }}>
              {event.name}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #3949AB 0%, #1E88E5 100%)',
      py: 4,
      px: 2
    }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <DzematLogo size={80} color="white" />
          <Typography variant="h6" sx={{ color: 'white', mt: 2 }}>
            {event.organizationName}
          </Typography>
        </Box>

        <Card sx={{ borderRadius: 4, overflow: 'hidden' }}>
          {event.photoUrl && (
            <Box
              component="img"
              src={event.photoUrl}
              alt={event.name}
              sx={{ width: '100%', height: 200, objectFit: 'cover' }}
            />
          )}
          
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              {event.name}
            </Typography>

            <Stack spacing={1.5} sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonth sx={{ color: '#3949AB' }} />
                <Typography>
                  {format(eventDate, "EEEE, d. MMMM yyyy. 'u' HH:mm", { locale: bs })}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn sx={{ color: '#3949AB' }} />
                <Typography>{event.location}</Typography>
              </Box>
              {event.pointsValue > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmojiEvents sx={{ color: '#FF9800' }} />
                  <Typography>{event.pointsValue} bodova za prisustvo</Typography>
                </Box>
              )}
            </Stack>

            {checkinMutation.error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {(checkinMutation.error as any)?.message || 'Greška pri prijavi'}
              </Alert>
            )}

            {user ? (
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                <Typography>Prijavljujem vas...</Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Niste prijavljeni u DžematApp. Unesite ime i prezime za prijavu kao gost:
                </Typography>
                
                <TextField
                  fullWidth
                  label="Ime i prezime"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  sx={{ mb: 2 }}
                  data-testid="input-guest-name"
                />

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleGuestCheckin}
                  disabled={guestName.trim().length < 2 || checkinMutation.isPending}
                  sx={{ 
                    py: 1.5,
                    bgcolor: '#3949AB',
                    '&:hover': { bgcolor: '#303F9F' }
                  }}
                  data-testid="button-guest-checkin"
                >
                  {checkinMutation.isPending ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Prijavi se'}
                </Button>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                  Imate DžematApp nalog? <a href="/login" style={{ color: '#3949AB' }}>Prijavite se</a> za automatsku prijavu i bodove.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
