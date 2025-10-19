import { useState } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Typography,
  AppBar,
  Toolbar,
  Button,
  Card,
  CardContent,
  Stack
} from '@mui/material';
import { Hub, Announcement, Event, Assignment } from '@mui/icons-material';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import type { Announcement as AnnouncementType, Event as EventType } from '@shared/schema';
import { format } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`guest-tabpanel-${index}`}
      aria-labelledby={`guest-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function GuestPage() {
  const [, setLocation] = useLocation();
  const [tabValue, setTabValue] = useState(0);

  const { data: announcements = [], isLoading: announcementsLoading } = useQuery<AnnouncementType[]>({
    queryKey: ['/api/announcements'],
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<EventType[]>({
    queryKey: ['/api/events'],
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBackToLogin = () => {
    setLocation('/');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" sx={{ bgcolor: '#1976d2' }}>
        <Toolbar>
          <Hub sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            JamatHub - Gost pristup
          </Typography>
          <Button color="inherit" onClick={handleBackToLogin} data-testid="button-back-to-login">
            Nazad na prijavu
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Card>
          <CardContent>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
              data-testid="guest-tabs"
            >
              <Tab 
                icon={<Announcement />} 
                label="Obavještenja" 
                iconPosition="start"
                data-testid="tab-announcements"
              />
              <Tab 
                icon={<Event />} 
                label="Događaji" 
                iconPosition="start"
                data-testid="tab-events"
              />
              <Tab 
                icon={<Assignment />} 
                label="Pristupnica" 
                iconPosition="start"
                data-testid="tab-membership"
              />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Typography variant="h5" gutterBottom>
                Obavještenja
              </Typography>
              {announcementsLoading ? (
                <Typography>Učitavanje...</Typography>
              ) : announcements.length === 0 ? (
                <Typography color="text.secondary">Nema obavještenja.</Typography>
              ) : (
                <Stack spacing={2}>
                  {announcements.map((announcement) => (
                    <Card variant="outlined" key={announcement.id} data-testid={`announcement-${announcement.id}`}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {announcement.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {announcement.publishDate && format(new Date(announcement.publishDate), 'dd.MM.yyyy')}
                        </Typography>
                        <Typography variant="body1">
                          {announcement.content}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Typography variant="h5" gutterBottom>
                Događaji
              </Typography>
              {eventsLoading ? (
                <Typography>Učitavanje...</Typography>
              ) : events.length === 0 ? (
                <Typography color="text.secondary">Nema događaja.</Typography>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  {events.map((event) => (
                    <Card variant="outlined" key={event.id} data-testid={`event-${event.id}`}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {event.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {event.dateTime && format(new Date(event.dateTime), 'dd.MM.yyyy HH:mm')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          📍 {event.location}
                        </Typography>
                        {event.description && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {event.description}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Typography variant="h5" gutterBottom>
                Zahtjev za članstvo
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Forma za prijavu članstva će biti dostupna uskoro.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Za više informacija, molimo kontaktirajte administraciju džemata.
              </Typography>
            </TabPanel>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
