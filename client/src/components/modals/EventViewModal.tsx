import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import { Close, CalendarMonth, LocationOn, People, Schedule } from '@mui/icons-material';
import { Event, EventRsvpStats } from '@shared/schema';
import { downloadICS } from '@/lib/icsGenerator';
import EventRSVPModal from './EventRSVPModal';

interface EventViewModalProps {
  open: boolean;
  onClose: () => void;
  event: Event | null;
}

export default function EventViewModal({ 
  open, 
  onClose, 
  event
}: EventViewModalProps) {
  const [rsvpModalOpen, setRsvpModalOpen] = useState(false);

  // Fetch RSVP stats to check capacity (must be before any conditional returns)
  const rsvpQuery = useQuery<EventRsvpStats>({
    queryKey: ['/api/events', event?.id, 'rsvps'],
    enabled: open && !!event && !!event.rsvpEnabled,
  });

  if (!event) return null;

  const isCapacityReached = event.maxAttendees && rsvpQuery.data 
    ? rsvpQuery.data.totalAttendees >= event.maxAttendees 
    : false;

  const formatDateTime = (dateTime: string | Date) => {
    const date = new Date(dateTime);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year}. u ${hours}:${minutes}h`;
  };

  const handleRemindMe = () => {
    downloadICS({
      name: event.name,
      description: event.description || undefined,
      location: event.location,
      dateTime: new Date(event.dateTime),
      reminderTime: event.reminderTime || undefined
    });
  };

  const handleRSVP = () => {
    setRsvpModalOpen(true);
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {event.name}
          </Typography>
          <IconButton onClick={onClose} data-testid="close-event-view-modal">
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Categories */}
            {event.categories && event.categories.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {event.categories.map((category, idx) => (
                  <Chip 
                    key={idx}
                    label={category} 
                    color="primary"
                    size="small"
                    data-testid={`chip-category-${idx}`}
                  />
                ))}
              </Box>
            )}

            {/* Date and Time */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CalendarMonth sx={{ color: 'primary.main', fontSize: 28 }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Datum i vrijeme
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formatDateTime(event.dateTime)}
                </Typography>
              </Box>
            </Box>

            {/* Location */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <LocationOn sx={{ color: 'primary.main', fontSize: 28 }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Lokacija
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {event.location}
                </Typography>
              </Box>
            </Box>

            {/* Max Attendees */}
            {event.maxAttendees && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <People sx={{ color: 'primary.main', fontSize: 28 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Maksimalan broj učesnika
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {event.maxAttendees}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Reminder */}
            {event.reminderTime && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Schedule sx={{ color: 'primary.main', fontSize: 28 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Podsjetnik
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {event.reminderTime === '7_days' && '7 dana prije'}
                    {event.reminderTime === '24_hours' && '24 sata prije'}
                    {event.reminderTime === '2_hours' && '2 sata prije'}
                  </Typography>
                </Box>
              </Box>
            )}

            <Divider />

            {/* Description */}
            {event.description && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Detaljan opis
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    backgroundColor: '#fafafa',
                    '& p': { marginBottom: '1em' },
                    '& ul, & ol': { marginLeft: '1.5em', marginBottom: '1em' },
                    '& a': { color: 'primary.main', textDecoration: 'underline' },
                    '& strong': { fontWeight: 'bold' },
                    '& em': { fontStyle: 'italic' },
                    '& u': { textDecoration: 'underline' },
                    '& img': { 
                      maxWidth: '100%', 
                      height: 'auto',
                      display: 'block',
                      margin: '10px 0',
                      borderRadius: '4px'
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              </Box>
            )}

            {/* RSVP Info */}
            {event.rsvpEnabled && (
              <>
                {isCapacityReached ? (
                  <Alert severity="error" icon={<People />}>
                    <Typography variant="body2">
                      Maksimalan broj učesnika je dostignut ({event.maxAttendees}). Prijava dolaska više nije moguća.
                    </Typography>
                  </Alert>
                ) : (
                  <Alert severity="info" icon={<People />}>
                    <Typography variant="body2">
                      Prijava dolaska je omogućena za ovaj događaj.
                      {event.requireAdultsChildren && ' Potrebno je navesti broj odraslih i djece.'}
                      {event.maxAttendees && rsvpQuery.data && (
                        <> Trenutno prijavljeno: {rsvpQuery.data.totalAttendees} / {event.maxAttendees}</>
                      )}
                    </Typography>
                  </Alert>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Button 
            onClick={handleRemindMe}
            variant="outlined"
            startIcon={<CalendarMonth />}
            data-testid="button-add-to-calendar"
          >
            Dodaj u kalendar
          </Button>
          
          {event.rsvpEnabled && !isCapacityReached && (
            <Button 
              onClick={handleRSVP}
              variant="contained"
              startIcon={<People />}
              data-testid="button-rsvp"
            >
              {event.requireAdultsChildren ? 'Prijava dolaska' : 'Prijavi me'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {rsvpModalOpen && (
        <EventRSVPModal
          open={rsvpModalOpen}
          onClose={() => setRsvpModalOpen(false)}
          event={event}
        />
      )}
    </>
  );
}
