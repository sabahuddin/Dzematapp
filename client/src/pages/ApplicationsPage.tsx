import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Container, Typography, Box, Card, CardContent, Tabs, Tab, TextField, Button, FormControl, InputLabel, Select, MenuItem, Alert, Stack, Grid } from "@mui/material";
import { ChildCare, Favorite, CheckCircle } from "@mui/icons-material";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function AkikaApplicationForm() {
  const { user } = useAuth();
  const { t } = useTranslation("applications");
  const [formData, setFormData] = useState({
    isMember: true,
    fatherName: '',
    motherName: '',
    childName: '',
    childGender: 'muško',
    childDateOfBirth: '',
    childPlaceOfBirth: '',
    location: 'Islamski centar GAM',
    organizeCatering: false,
    customAddress: '',
    customCity: '',
    customCanton: '',
    customPostalCode: '',
    phone: '',
    notes: '',
  });

  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submitApplicationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('/api/akika-applications', 'POST', data);
      return await response.json();
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    try {
      let finalData: any = { ...formData };

      if (finalData.childDateOfBirth) {
        const date = new Date(finalData.childDateOfBirth);
        finalData.childDateOfBirth = format(date, 'dd.MM.yyyy');
      }

      if (!finalData.customAddress) finalData.customAddress = null;
      if (!finalData.customCity) finalData.customCity = null;
      if (!finalData.customCanton) finalData.customCanton = null;
      if (!finalData.customPostalCode) finalData.customPostalCode = null;
      if (!finalData.notes) finalData.notes = null;

      await submitApplicationMutation.mutateAsync(finalData);
      
      setSubmitSuccess(true);
      setFormData({
        isMember: true,
        fatherName: '',
        motherName: '',
        childName: '',
        childGender: 'muško',
        childDateOfBirth: '',
        childPlaceOfBirth: '',
        location: 'Islamski centar GAM',
        organizeCatering: false,
        customAddress: '',
        customCity: '',
        customCanton: '',
        customPostalCode: '',
        phone: '',
        notes: '',
      });
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
          Hvala vam na prijavi akike.
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Pregledaćemo vaš zahtjev i kontaktirati vas uskoro.
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => setSubmitSuccess(false)}
          sx={{ mt: 2 }}
          data-testid="button-submit-another-akika"
        >
          Pošalji novu prijavu
        </Button>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Prijava akike
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Popunite formu ispod kako biste prijavili akiku za novorođenče.
      </Typography>

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Podaci o roditeljima
        </Typography>
        
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label="Ime i prezime oca"
              value={formData.fatherName}
              onChange={handleChange('fatherName')}
              data-testid="input-fatherName"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label="Ime i prezime majke"
              value={formData.motherName}
              onChange={handleChange('motherName')}
              data-testid="input-motherName"
            />
          </Grid>
        </Grid>
      </Card>

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Podaci o djetetu
        </Typography>
        
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label="Ime i prezime djeteta"
              value={formData.childName}
              onChange={handleChange('childName')}
              data-testid="input-childName"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>Spol</InputLabel>
              <Select
                value={formData.childGender}
                onChange={(e) => setFormData(prev => ({ ...prev, childGender: e.target.value }))}
                label="Spol"
                data-testid="select-childGender"
              >
                <MenuItem value="muško">Muško</MenuItem>
                <MenuItem value="žensko">Žensko</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              type="date"
              label="Datum rođenja djeteta"
              value={formData.childDateOfBirth}
              onChange={handleChange('childDateOfBirth')}
              InputLabelProps={{ shrink: true }}
              data-testid="input-childDateOfBirth"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label="Mjesto rođenja djeteta"
              value={formData.childPlaceOfBirth}
              onChange={handleChange('childPlaceOfBirth')}
              data-testid="input-childPlaceOfBirth"
            />
          </Grid>
        </Grid>
      </Card>

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Podaci o mjestu i terminu akike
        </Typography>
        
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth required>
              <InputLabel>Gdje bi se akika obavila?</InputLabel>
              <Select
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                label="Gdje bi se akika obavila?"
                data-testid="select-location"
              >
                <MenuItem value="Islamski centar GAM">Islamski centar GAM</MenuItem>
                <MenuItem value="Druga adresa">Druga adresa</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {formData.location === 'Druga adresa' && (
            <>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  required
                  label="Ulica i broj"
                  value={formData.customAddress}
                  onChange={handleChange('customAddress')}
                  data-testid="input-customAddress"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  required
                  label="Poštanski broj"
                  value={formData.customPostalCode}
                  onChange={handleChange('customPostalCode')}
                  data-testid="input-customPostalCode"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  required
                  label="Grad"
                  value={formData.customCity}
                  onChange={handleChange('customCity')}
                  data-testid="input-customCity"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  required
                  label="Kanton"
                  value={formData.customCanton}
                  onChange={handleChange('customCanton')}
                  data-testid="input-customCanton"
                />
              </Grid>
            </>
          )}

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              required
              label="Telefon za kontakt"
              value={formData.phone}
              onChange={handleChange('phone')}
              data-testid="input-phone"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Napomena (opciono)"
              value={formData.notes}
              onChange={handleChange('notes')}
              data-testid="input-notes"
            />
          </Grid>
        </Grid>
      </Card>

      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={submitApplicationMutation.isPending}
          data-testid="button-submit-akika-application"
        >
          {submitApplicationMutation.isPending ? 'Slanje...' : 'Pošalji zahtjev'}
        </Button>
      </Stack>
    </Box>
  );
}

function MarriageApplicationForm() {
  const { t } = useTranslation("applications");
  
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        {t("marriage.title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        {t("marriage.description")}
      </Typography>
    </Box>
  );
}

export default function ApplicationsPage() {
  const { t } = useTranslation("applications");
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom data-testid="page-title">
              {t("pageTitle")}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {t("pageDescription")}
            </Typography>

            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
              data-testid="applications-tabs"
            >
              <Tab 
                icon={<ChildCare />} 
                label={t("akika.title")} 
                iconPosition="start"
                data-testid="tab-akika"
              />
              <Tab 
                icon={<Favorite />} 
                label={t("marriage.title")} 
                iconPosition="start"
                data-testid="tab-marriage"
              />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <AkikaApplicationForm />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <MarriageApplicationForm />
            </TabPanel>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
