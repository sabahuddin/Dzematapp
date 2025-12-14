import { useState, useEffect } from 'react';
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
import { Announcement, Event, Assignment, Schedule, CheckCircle, ChildCare, Favorite } from '@mui/icons-material';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { Announcement as AnnouncementType, Event as EventType, PrayerTime } from '@shared/schema';
import { format } from 'date-fns';
import { DzematLogo } from '@/components/DzematLogo';
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

interface MembershipSettingsPublic {
  feeType: string;
  monthlyAmount: number;
  currency: string;
}

function MembershipApplicationForm() {
  const { t } = useTranslation('guest');
  
  // Fetch membership settings for dynamic fee display
  const { data: membershipSettings } = useQuery<MembershipSettingsPublic>({
    queryKey: ['/api/membership-settings/public'],
  });

  const currency = membershipSettings?.currency || 'CHF';
  const suggestedFee = membershipSettings?.monthlyAmount || 50;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'male',
    dateOfBirth: '',
    placeOfBirth: '',
    streetAddress: '',
    postalCode: '',
    city: '',
    occupation: '',
    skillsHobbies: '',
    maritalStatus: 'single',
    spouseName: '',
    childrenInfo: '',
    monthlyFee: String(suggestedFee),
    invoiceDelivery: 'email',
    email: '',
    phone: '',
    membershipStartDate: '',
  });

  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Simple math captcha
  const [captcha, setCaptcha] = useState(() => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    return { a, b, answer: a + b };
  });
  const [captchaInput, setCaptchaInput] = useState('');
  
  // Honeypot field - bots will fill this, humans won't see it
  const [honeypot, setHoneypot] = useState('');

  // Update monthlyFee when settings load
  useEffect(() => {
    if (membershipSettings?.monthlyAmount) {
      setFormData(prev => ({ ...prev, monthlyFee: String(membershipSettings.monthlyAmount) }));
    }
  }, [membershipSettings?.monthlyAmount]);

  const submitApplicationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/membership-applications', 'POST', data);
      return await response.json();
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    // Validate captcha
    if (parseInt(captchaInput) !== captcha.answer) {
      setSubmitError(t('application.captchaError'));
      // Regenerate captcha
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      setCaptcha({ a, b, answer: a + b });
      setCaptchaInput('');
      return;
    }

    try {
      let finalData: any = { 
        ...formData,
        tenantId: 'default-tenant-demo'  // Guest applications go to default tenant
      };

      if (finalData.dateOfBirth) {
        const date = new Date(finalData.dateOfBirth);
        finalData.dateOfBirth = format(date, 'dd.MM.yyyy');
      }
      if (finalData.membershipStartDate) {
        const date = new Date(finalData.membershipStartDate);
        finalData.membershipStartDate = format(date, 'dd.MM.yyyy');
      }

      finalData.monthlyFee = parseInt(finalData.monthlyFee, 10);

      if (!finalData.spouseName) finalData.spouseName = null;
      if (!finalData.childrenInfo) finalData.childrenInfo = null;
      if (!finalData.skillsHobbies) finalData.skillsHobbies = null;

      await submitApplicationMutation.mutateAsync(finalData);
      
      setSubmitSuccess(true);
      setFormData({
        firstName: '',
        lastName: '',
        gender: 'male',
        dateOfBirth: '',
        placeOfBirth: '',
        streetAddress: '',
        postalCode: '',
        city: '',
        occupation: '',
        skillsHobbies: '',
        maritalStatus: 'single',
        spouseName: '',
        childrenInfo: '',
        monthlyFee: String(suggestedFee),
        invoiceDelivery: 'email',
        email: '',
        phone: '',
        membershipStartDate: '',
      });
    } catch (error) {
      console.error('Application submission failed:', error);
      setSubmitError(t('application.submitError'));
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
          {t('application.successTitle')}
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {t('application.successMessage')}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {t('application.successDescription')}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => setSubmitSuccess(false)}
          sx={{ mt: 2 }}
          data-testid="button-submit-another"
        >
          {t('application.submitAnother')}
        </Button>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        {t('application.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        {t('application.description')}
      </Typography>

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('application.personalData')}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t('application.firstName')}
              value={formData.firstName}
              onChange={handleChange('firstName')}
              data-testid="input-firstName"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t('application.lastName')}
              value={formData.lastName}
              onChange={handleChange('lastName')}
              data-testid="input-lastName"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">{t('application.gender')}</FormLabel>
              <RadioGroup
                row
                value={formData.gender}
                onChange={handleChange('gender')}
                data-testid="radio-gender"
              >
                <FormControlLabel value="male" control={<Radio />} label={t('application.male')} />
                <FormControlLabel value="female" control={<Radio />} label={t('application.female')} />
              </RadioGroup>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              type="date"
              label={t('application.dateOfBirth')}
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
              label={t('application.placeOfBirth')}
              value={formData.placeOfBirth}
              onChange={handleChange('placeOfBirth')}
              data-testid="input-placeOfBirth"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              required
              label={t('application.address')}
              value={formData.streetAddress}
              onChange={handleChange('streetAddress')}
              data-testid="input-streetAddress"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              required
              label={t('application.postalCode')}
              value={formData.postalCode}
              onChange={handleChange('postalCode')}
              data-testid="input-postalCode"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              fullWidth
              required
              label={t('application.city')}
              value={formData.city}
              onChange={handleChange('city')}
              data-testid="input-city"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              required
              label={t('application.occupation')}
              value={formData.occupation}
              onChange={handleChange('occupation')}
              data-testid="input-occupation"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label={t('application.skills')}
              value={formData.skillsHobbies}
              onChange={handleChange('skillsHobbies')}
              multiline
              rows={2}
              data-testid="input-skillsHobbies"
            />
          </Grid>
        </Grid>
      </Card>

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('application.familyData')}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth>
              <InputLabel>{t('application.maritalStatus')}</InputLabel>
              <Select
                value={formData.maritalStatus}
                onChange={(e) => setFormData(prev => ({ ...prev, maritalStatus: e.target.value }))}
                label={t('application.maritalStatus')}
                data-testid="select-maritalStatus"
              >
                <MenuItem value="single">{t('application.single')}</MenuItem>
                <MenuItem value="married">{t('application.married')}</MenuItem>
                <MenuItem value="divorced">{t('application.divorced')}</MenuItem>
                <MenuItem value="widowed">{t('application.widowed')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {(formData.maritalStatus === 'married') && (
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('application.spouseName')}
                value={formData.spouseName}
                onChange={handleChange('spouseName')}
                data-testid="input-spouseName"
              />
            </Grid>
          )}

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label={t('application.children')}
              value={formData.childrenInfo}
              onChange={handleChange('childrenInfo')}
              multiline
              rows={2}
              placeholder={t('application.childrenPlaceholder')}
              data-testid="input-childrenInfo"
            />
          </Grid>
        </Grid>
      </Card>

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('application.membershipData')}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth>
              <InputLabel>{t('application.monthlyFee')}</InputLabel>
              <Select
                value={formData.monthlyFee}
                onChange={(e) => setFormData(prev => ({ ...prev, monthlyFee: e.target.value }))}
                label={t('application.monthlyFee')}
                data-testid="select-monthlyFee"
              >
                {[30, 40, 50, 60, 70, 80, 90, 100].map((amount) => (
                  <MenuItem key={amount} value={String(amount)}>
                    {amount} {currency}{amount === suggestedFee ? ` (${t('application.recommended')})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {membershipSettings && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {t('application.suggestedFee')}: {suggestedFee} {currency}
              </Typography>
            )}
          </Grid>

          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth>
              <InputLabel>{t('application.invoiceDelivery')}</InputLabel>
              <Select
                value={formData.invoiceDelivery}
                onChange={(e) => setFormData(prev => ({ ...prev, invoiceDelivery: e.target.value }))}
                label={t('application.invoiceDelivery')}
                data-testid="select-invoiceDelivery"
              >
                <MenuItem value="email">{t('application.email')}</MenuItem>
                <MenuItem value="mail">{t('application.mail')}</MenuItem>
                <MenuItem value="pickup">{t('application.pickup')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t('application.email')}
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
              label={t('application.phone')}
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
              label={t('application.membershipStartDate')}
              value={formData.membershipStartDate}
              onChange={handleChange('membershipStartDate')}
              InputLabelProps={{ shrink: true }}
              data-testid="input-membershipStartDate"
            />
          </Grid>
        </Grid>
      </Card>

      {/* Honeypot field - invisible to humans, bots fill it */}
      <TextField
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        sx={{ 
          position: 'absolute',
          left: '-9999px',
          opacity: 0,
          height: 0,
          width: 0,
          overflow: 'hidden'
        }}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {/* Security Captcha */}
      <Card sx={{ p: 3, mt: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          {t('application.securityQuestion')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body1">
            {t('application.captchaQuestion')} {captcha.a} + {captcha.b} = ?
          </Typography>
          <TextField
            size="small"
            value={captchaInput}
            onChange={(e) => setCaptchaInput(e.target.value)}
            placeholder={t('application.captchaPlaceholder')}
            sx={{ width: 120 }}
            data-testid="input-captcha"
          />
        </Box>
      </Card>

      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={submitApplicationMutation.isPending || !captchaInput}
          data-testid="button-submit-application"
        >
          {submitApplicationMutation.isPending ? t('application.submitting') : t('application.submit')}
        </Button>
      </Stack>
    </Box>
  );
}

export default function GuestPage() {
  const { t } = useTranslation('guest');
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'hsl(0 0% 96%)' }}>
      <AppBar position="static" sx={{ bgcolor: '#ffffff', boxShadow: 1 }}>
        <Toolbar sx={{ gap: 1 }}>
          <DzematLogo size={48} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'hsl(207 88% 55%)' }}>
            {t('pageTitle')}
          </Typography>
          <Button 
            onClick={handleBackToLogin} 
            data-testid="button-back-to-login"
            sx={{ color: 'hsl(207 88% 55%)' }}
          >
            {t('backToLogin')}
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
                label={t('tabs.announcements')} 
                iconPosition="start"
                data-testid="tab-announcements"
              />
              <Tab 
                icon={<Event />} 
                label={t('tabs.events')} 
                iconPosition="start"
                data-testid="tab-events"
              />
              <Tab 
                icon={<Schedule />} 
                label={t('tabs.vaktija')} 
                iconPosition="start"
                data-testid="tab-vaktija"
              />
              <Tab 
                icon={<Assignment />} 
                label={t('tabs.membership')} 
                iconPosition="start"
                data-testid="tab-membership"
              />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Typography variant="h5" gutterBottom>
                {t('sections.announcements')}
              </Typography>
              {announcementsLoading ? (
                <Typography>{t('sections.loading')}</Typography>
              ) : announcements.length === 0 ? (
                <Typography color="text.secondary">{t('sections.noAnnouncements')}</Typography>
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
                {t('sections.events')}
              </Typography>
              {eventsLoading ? (
                <Typography>{t('sections.loading')}</Typography>
              ) : events.length === 0 ? (
                <Typography color="text.secondary">{t('sections.noEvents')}</Typography>
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
                {t('sections.vaktija')}
              </Typography>
              
              {/* Today's Prayer Times */}
              {todayPrayerLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : todayPrayerTime ? (
                <Paper sx={{ p: 3, mb: 4, bgcolor: 'hsl(207 90% 95%)' }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'hsl(207 88% 55%)' }}>
                    {t('sections.todaysPrayerTimes')} - {todayPrayerTime.date}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 150px' }}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">{t('prayerTimes.fajr')}</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.fajr}</Typography>
                        </CardContent>
                      </Card>
                    </Box>
                    <Box sx={{ flex: '1 1 150px' }}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">{t('prayerTimes.dhuhr')}</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.dhuhr}</Typography>
                        </CardContent>
                      </Card>
                    </Box>
                    <Box sx={{ flex: '1 1 150px' }}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">{t('prayerTimes.asr')}</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.asr}</Typography>
                        </CardContent>
                      </Card>
                    </Box>
                    <Box sx={{ flex: '1 1 150px' }}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">{t('prayerTimes.maghrib')}</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.maghrib}</Typography>
                        </CardContent>
                      </Card>
                    </Box>
                    <Box sx={{ flex: '1 1 150px' }}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">{t('prayerTimes.isha')}</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>{todayPrayerTime.isha}</Typography>
                        </CardContent>
                      </Card>
                    </Box>
                  </Box>
                </Paper>
              ) : (
                <Typography color="text.secondary" sx={{ mb: 4 }}>{t('sections.noPrayerData')}</Typography>
              )}

              {/* Monthly Prayer Times Table */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
                {t('sections.prayerCalendar')}
              </Typography>
              {allPrayerLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : allPrayerTimes.length === 0 ? (
                <Typography color="text.secondary">{t('sections.noPrayerData')}</Typography>
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

                  // Use Intl for localized month names based on current i18n language
                  const getLocalizedMonthName = (monthNum: number, yearNum: number) => {
                    const date = new Date(yearNum, monthNum - 1, 1);
                    const locale = localStorage.getItem('language') || 'bs';
                    const localeMap: Record<string, string> = { bs: 'bs-Latn-BA', de: 'de-DE', en: 'en-US', sq: 'sq-AL', tr: 'tr-TR' };
                    return new Intl.DateTimeFormat(localeMap[locale] || 'bs-Latn-BA', { month: 'long' }).format(date);
                  };

                  return sortedMonthKeys.map((monthYear) => {
                    const [month, year] = monthYear.split('.');
                    const monthName = getLocalizedMonthName(parseInt(month), parseInt(year));
                    const prayerTimes = monthGroups[monthYear];

                    return (
                      <Box key={monthYear} sx={{ mb: 4 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: 'hsl(207 88% 55%)' }}>
                          {monthName} {year}
                        </Typography>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: 'hsl(0 0% 96%)' }}>
                                <TableCell sx={{ fontWeight: 600 }}>{t('sections.date')}</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>{t('prayerTimes.fajr')}</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>{t('prayerTimes.dhuhr')}</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>{t('prayerTimes.asr')}</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>{t('prayerTimes.maghrib')}</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>{t('prayerTimes.isha')}</TableCell>
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
