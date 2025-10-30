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
  Stack,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Grid,
  Alert,
  MenuItem,
  Select,
  InputLabel,
} from '@mui/material';
import { Announcement, Event, Assignment, Schedule, CloudUpload, CheckCircle } from '@mui/icons-material';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { Announcement as AnnouncementType, Event as EventType, PrayerTime } from '@shared/schema';
import { format } from 'date-fns';
import mosqueLogoPath from '@assets/ChatGPT Image 20. okt 2025. u 22_58_31_1761044165883.png';
import { apiRequest } from '@/lib/queryClient';

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

function MembershipApplicationForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'muško',
    dateOfBirth: '',
    placeOfBirth: '',
    address: '',
    postalCode: '',
    city: '',
    occupation: '',
    skills: '',
    maritalStatus: 'neoženjen/neudana',
    spouseName: '',
    children: '',
    membershipFee: '50',
    invoiceDelivery: 'email',
    email: '',
    phone: '',
    startDate: '',
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formDataUpload = new FormData();
      formDataUpload.append('photo', file);
      const response = await fetch('/api/upload/photo', {
        method: 'POST',
        body: formDataUpload,
      });
      if (!response.ok) throw new Error('Photo upload failed');
      const result = await response.json();
      return result.photoUrl;
    },
  });

  const submitApplicationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/membership-applications', 'POST', data);
      return await response.json();
    },
  });

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    try {
      let finalData: any = { ...formData };

      if (photoFile) {
        try {
          const photoUrl = await uploadPhotoMutation.mutateAsync(photoFile);
          finalData.photoUrl = photoUrl;
        } catch (error) {
          console.error('Photo upload failed:', error);
          setSubmitError('Greška pri učitavanju fotografije');
          return;
        }
      }

      if (finalData.dateOfBirth) {
        const date = new Date(finalData.dateOfBirth);
        finalData.dateOfBirth = format(date, 'dd.MM.yyyy');
      }
      if (finalData.startDate) {
        const date = new Date(finalData.startDate);
        finalData.startDate = format(date, 'dd.MM.yyyy');
      }

      finalData.membershipFee = parseInt(finalData.membershipFee, 10);

      if (!finalData.spouseName) finalData.spouseName = null;
      if (!finalData.children) finalData.children = null;
      if (!finalData.skills) finalData.skills = null;

      await submitApplicationMutation.mutateAsync(finalData);
      
      setSubmitSuccess(true);
      setFormData({
        firstName: '',
        lastName: '',
        gender: 'muško',
        dateOfBirth: '',
        placeOfBirth: '',
        address: '',
        postalCode: '',
        city: '',
        occupation: '',
        skills: '',
        maritalStatus: 'neoženjen/neudana',
        spouseName: '',
        children: '',
        membershipFee: '50',
        invoiceDelivery: 'email',
        email: '',
        phone: '',
        startDate: '',
      });
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (error) {
      console.error('Application submission failed:', error);
      setSubmitError('Greška pri slanju zahtjeva. Pokušajte ponovo.');
    }
  };

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { value: unknown }>) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (submitSuccess) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center', py: 4 }}>
        <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom color="success.main">
          Zahtjev uspješno poslan!
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Hvala vam na prijavi za članstvo u našem džematu.
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Pregledaćemo vaš zahtjev i kontaktirati vas uskoro.
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => setSubmitSuccess(false)}
          sx={{ mt: 2 }}
          data-testid="button-submit-another"
        >
          Pošalji novu pristupnicu
        </Button>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Zahtjev za članstvo
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Popunite formu ispod kako biste aplicirali za članstvo u našem džematu.
      </Typography>

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Lični podaci
        </Typography>
        
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label="Ime"
              value={formData.firstName}
              onChange={handleChange('firstName')}
              data-testid="input-firstName"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label="Prezime"
              value={formData.lastName}
              onChange={handleChange('lastName')}
              data-testid="input-lastName"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Pol</FormLabel>
              <RadioGroup
                row
                value={formData.gender}
                onChange={handleChange('gender')}
                data-testid="radio-gender"
              >
                <FormControlLabel value="muško" control={<Radio />} label="Muško" />
                <FormControlLabel value="žensko" control={<Radio />} label="Žensko" />
              </RadioGroup>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, mb: 1 }}>
              Fotografija (opciono)
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUpload />}
              data-testid="button-upload-photo"
            >
              {photoFile ? 'Promijeni fotografiju' : 'Učitaj fotografiju'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </Button>
            {photoPreview && (
              <Box sx={{ mt: 2 }}>
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px' }}
                />
              </Box>
            )}
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              type="date"
              label="Datum rođenja"
              value={formData.dateOfBirth}
              onChange={handleChange('dateOfBirth')}
              InputLabelProps={{ shrink: true }}
              data-testid="input-dateOfBirth"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label="Mjesto rođenja"
              value={formData.placeOfBirth}
              onChange={handleChange('placeOfBirth')}
              data-testid="input-placeOfBirth"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              required
              label="Adresa"
              value={formData.address}
              onChange={handleChange('address')}
              data-testid="input-address"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              required
              label="Poštanski broj"
              value={formData.postalCode}
              onChange={handleChange('postalCode')}
              data-testid="input-postalCode"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              fullWidth
              required
              label="Grad"
              value={formData.city}
              onChange={handleChange('city')}
              data-testid="input-city"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              required
              label="Zanimanje"
              value={formData.occupation}
              onChange={handleChange('occupation')}
              data-testid="input-occupation"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Posebne sposobnosti (opciono)"
              value={formData.skills}
              onChange={handleChange('skills')}
              multiline
              rows={2}
              data-testid="input-skills"
            />
          </Grid>
        </Grid>
      </Card>

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Porodični podaci
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth>
              <InputLabel>Bračno stanje</InputLabel>
              <Select
                value={formData.maritalStatus}
                onChange={(e) => setFormData(prev => ({ ...prev, maritalStatus: e.target.value }))}
                label="Bračno stanje"
                data-testid="select-maritalStatus"
              >
                <MenuItem value="neoženjen/neudana">Neoženjen/Neudana</MenuItem>
                <MenuItem value="oženjen/udata">Oženjen/Udata</MenuItem>
                <MenuItem value="razveden/razvedena">Razveden/Razvedena</MenuItem>
                <MenuItem value="udovac/udovica">Udovac/Udovica</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {(formData.maritalStatus === 'oženjen/udata') && (
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Ime bračnog partnera"
                value={formData.spouseName}
                onChange={handleChange('spouseName')}
                data-testid="input-spouseName"
              />
            </Grid>
          )}

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Djeca (imena i godine rođenja, opciono)"
              value={formData.children}
              onChange={handleChange('children')}
              multiline
              rows={2}
              placeholder="Npr: Amir (2010), Amina (2015)"
              data-testid="input-children"
            />
          </Grid>
        </Grid>
      </Card>

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Podaci o članstvu
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth>
              <InputLabel>Visina godišnje članarine (CHF)</InputLabel>
              <Select
                value={formData.membershipFee}
                onChange={(e) => setFormData(prev => ({ ...prev, membershipFee: e.target.value }))}
                label="Visina godišnje članarine (CHF)"
                data-testid="select-membershipFee"
              >
                <MenuItem value="30">30 CHF</MenuItem>
                <MenuItem value="40">40 CHF</MenuItem>
                <MenuItem value="50">50 CHF</MenuItem>
                <MenuItem value="60">60 CHF</MenuItem>
                <MenuItem value="70">70 CHF</MenuItem>
                <MenuItem value="80">80 CHF</MenuItem>
                <MenuItem value="90">90 CHF</MenuItem>
                <MenuItem value="100">100 CHF</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth>
              <InputLabel>Način dostave računa</InputLabel>
              <Select
                value={formData.invoiceDelivery}
                onChange={(e) => setFormData(prev => ({ ...prev, invoiceDelivery: e.target.value }))}
                label="Način dostave računa"
                data-testid="select-invoiceDelivery"
              >
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="pošta">Poštom</MenuItem>
                <MenuItem value="lično">Lično preuzimanje</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              data-testid="input-email"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label="Telefon"
              value={formData.phone}
              onChange={handleChange('phone')}
              data-testid="input-phone"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              required
              type="date"
              label="Datum pristupanja"
              value={formData.startDate}
              onChange={handleChange('startDate')}
              InputLabelProps={{ shrink: true }}
              data-testid="input-startDate"
            />
          </Grid>
        </Grid>
      </Card>

      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={submitApplicationMutation.isPending || uploadPhotoMutation.isPending}
          data-testid="button-submit-application"
        >
          {submitApplicationMutation.isPending ? 'Slanje...' : 'Pošalji zahtjev'}
        </Button>
      </Stack>
    </Box>
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

  const { data: todayPrayerTime, isLoading: todayPrayerLoading } = useQuery<PrayerTime>({
    queryKey: ['/api/prayer-times/today'],
    retry: false,
  });

  const { data: allPrayerTimes = [], isLoading: allPrayerLoading } = useQuery<PrayerTime[]>({
    queryKey: ['/api/prayer-times'],
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBackToLogin = () => {
    setLocation('/');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" sx={{ bgcolor: 'white', boxShadow: 1 }}>
        <Toolbar>
          <img 
            src={mosqueLogoPath} 
            alt="Mosque Logo" 
            style={{ width: 40, height: 40, objectFit: 'contain', marginRight: 16 }}
          />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#1976d2' }}>
            DžematApp - Gost pristup
          </Typography>
          <Button 
            onClick={handleBackToLogin} 
            data-testid="button-back-to-login"
            sx={{ color: '#1976d2' }}
          >
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
                icon={<Schedule />} 
                label="Vaktija" 
                iconPosition="start"
                data-testid="tab-vaktija"
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
                        <Box 
                          sx={{ 
                            '& p': { margin: '8px 0' },
                            '& img': { maxWidth: '100%', height: 'auto' },
                            '& br': { lineHeight: '1.5' }
                          }}
                          dangerouslySetInnerHTML={{ __html: announcement.content }}
                        />
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
                          <Box 
                            sx={{ 
                              mt: 1,
                              '& p': { margin: '8px 0' },
                              '& img': { maxWidth: '100%', height: 'auto' },
                              '& br': { lineHeight: '1.5' }
                            }}
                            dangerouslySetInnerHTML={{ __html: event.description }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Typography variant="h5" gutterBottom>
                Vaktija
              </Typography>
              
              {/* Today's Prayer Times */}
              {todayPrayerLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : todayPrayerTime ? (
                <Paper sx={{ p: 3, mb: 4, bgcolor: '#e3f2fd' }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1976d2' }}>
                    Današnja vaktija - {todayPrayerTime.date}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 150px' }}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">Zora</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.fajr}</Typography>
                        </CardContent>
                      </Card>
                    </Box>
                    <Box sx={{ flex: '1 1 150px' }}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">Podne</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.dhuhr}</Typography>
                        </CardContent>
                      </Card>
                    </Box>
                    <Box sx={{ flex: '1 1 150px' }}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">Ikindija</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.asr}</Typography>
                        </CardContent>
                      </Card>
                    </Box>
                    <Box sx={{ flex: '1 1 150px' }}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">Akšam</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.maghrib}</Typography>
                        </CardContent>
                      </Card>
                    </Box>
                    <Box sx={{ flex: '1 1 150px' }}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">Jacija</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.isha}</Typography>
                        </CardContent>
                      </Card>
                    </Box>
                  </Box>
                </Paper>
              ) : (
                <Typography color="text.secondary" sx={{ mb: 4 }}>Nema podataka o današnjim vaktijama.</Typography>
              )}

              {/* Monthly Prayer Times Table */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
                Mjesečne vaktije
              </Typography>
              {allPrayerLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : allPrayerTimes.length === 0 ? (
                <Typography color="text.secondary">Nema učitanih vaktija.</Typography>
              ) : (
                (() => {
                  // Group prayer times by month
                  const monthGroups: { [key: string]: PrayerTime[] } = {};
                  allPrayerTimes.forEach((pt) => {
                    // Parse date (format dd.mm.yyyy)
                    const parts = pt.date.split('.');
                    if (parts.length === 3) {
                      const monthYear = `${parts[1]}.${parts[2]}`; // mm.yyyy
                      if (!monthGroups[monthYear]) {
                        monthGroups[monthYear] = [];
                      }
                      monthGroups[monthYear].push(pt);
                    }
                  });

                  // Sort month groups by date
                  const sortedMonthKeys = Object.keys(monthGroups).sort((a, b) => {
                    const [monthA, yearA] = a.split('.');
                    const [monthB, yearB] = b.split('.');
                    const dateA = new Date(parseInt(yearA), parseInt(monthA) - 1);
                    const dateB = new Date(parseInt(yearB), parseInt(monthB) - 1);
                    return dateA.getTime() - dateB.getTime();
                  });

                  const monthNames = [
                    'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni',
                    'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
                  ];

                  return sortedMonthKeys.map((monthYear) => {
                    const [month, year] = monthYear.split('.');
                    const monthName = monthNames[parseInt(month) - 1];
                    const prayerTimes = monthGroups[monthYear];

                    return (
                      <Box key={monthYear} sx={{ mb: 4 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: '#1976d2' }}>
                          {monthName} {year}
                        </Typography>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                <TableCell sx={{ fontWeight: 600 }}>Datum</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Zora</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Podne</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Ikindija</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Akšam</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Jacija</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {prayerTimes.map((pt) => (
                                <TableRow key={pt.id} hover data-testid={`prayer-time-${pt.id}`}>
                                  <TableCell>{pt.date}</TableCell>
                                  <TableCell>{pt.fajr}</TableCell>
                                  <TableCell>{pt.dhuhr}</TableCell>
                                  <TableCell>{pt.asr}</TableCell>
                                  <TableCell>{pt.maghrib}</TableCell>
                                  <TableCell>{pt.isha}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    );
                  });
                })()
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <MembershipApplicationForm />
            </TabPanel>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
