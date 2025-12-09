import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Container, Typography, Box, Card, CardContent, Tabs, Tab, TextField, Button, FormControl, InputLabel, Select, MenuItem, Alert, Stack, Grid, Chip, CardHeader, IconButton, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Divider } from "@mui/material";
import { ChildCare, Favorite, CheckCircle, List as ListIcon, Print, Archive as ArchiveIcon, Inbox, Check, Close, PersonAdd } from "@mui/icons-material";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import type { Request, AkikaApplication } from "@shared/schema";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradeCTA } from "@/components/UpgradeCTA";
import { MembershipApplicationsList } from "./MembershipApplicationsPage";

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
    email: '',
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
        email: '',
        notes: '',
      });
    } catch (error) {
      console.error('Application submission failed:', error);
      setSubmitError(t("akika.error"));
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
          {t("akika.successTitle")}
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {t("akika.successMessage")}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {t("akika.successDescription")}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => setSubmitSuccess(false)}
          sx={{ mt: 2 }}
          data-testid="button-submit-another-akika"
        >
          {t("akika.submitAnother")}
        </Button>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        {t("akika.title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        {t("akika.description")}
      </Typography>

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t("akika.parentData")}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("akika.fatherName")}
              value={formData.fatherName}
              onChange={handleChange('fatherName')}
              data-testid="input-fatherName"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("akika.motherName")}
              value={formData.motherName}
              onChange={handleChange('motherName')}
              data-testid="input-motherName"
            />
          </Grid>
        </Grid>
      </Card>

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t("akika.childData")}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("akika.childName")}
              value={formData.childName}
              onChange={handleChange('childName')}
              data-testid="input-childName"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>{t("akika.childGender")}</InputLabel>
              <Select
                value={formData.childGender}
                onChange={(e) => setFormData(prev => ({ ...prev, childGender: e.target.value }))}
                label={t("akika.childGender")}
                data-testid="select-childGender"
              >
                <MenuItem value="muško">{t("akika.genderMale")}</MenuItem>
                <MenuItem value="žensko">{t("akika.genderFemale")}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              type="date"
              label={t("akika.childDateOfBirth")}
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
              label={t("akika.childPlaceOfBirth")}
              value={formData.childPlaceOfBirth}
              onChange={handleChange('childPlaceOfBirth')}
              data-testid="input-childPlaceOfBirth"
            />
          </Grid>
        </Grid>
      </Card>

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t("akika.locationData")}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth required>
              <InputLabel>{t("akika.location")}</InputLabel>
              <Select
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                label={t("akika.location")}
                data-testid="select-location"
              >
                <MenuItem value="Islamski centar GAM">{t("akika.locationGAM")}</MenuItem>
                <MenuItem value="Druga adresa">{t("akika.locationOther")}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {formData.location === 'Druga adresa' && (
            <>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  required
                  label={t("akika.customAddress")}
                  value={formData.customAddress}
                  onChange={handleChange('customAddress')}
                  data-testid="input-customAddress"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  required
                  label={t("akika.customPostalCode")}
                  value={formData.customPostalCode}
                  onChange={handleChange('customPostalCode')}
                  data-testid="input-customPostalCode"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  required
                  label={t("akika.customCity")}
                  value={formData.customCity}
                  onChange={handleChange('customCity')}
                  data-testid="input-customCity"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  required
                  label={t("akika.customCanton")}
                  value={formData.customCanton}
                  onChange={handleChange('customCanton')}
                  data-testid="input-customCanton"
                />
              </Grid>
            </>
          )}

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("akika.phone")}
              value={formData.phone}
              onChange={handleChange('phone')}
              data-testid="input-phone"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              type="email"
              label={t("akika.email")}
              value={formData.email}
              onChange={handleChange('email')}
              helperText={t("akika.emailOptional")}
              data-testid="input-email"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label={t("akika.proposedDateTime")}
              placeholder={t("akika.proposedDateTimePlaceholder")}
              value={formData.notes}
              onChange={handleChange('notes')}
              data-testid="input-proposedDateTime"
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
          {submitApplicationMutation.isPending ? t("akika.submitting") : t("akika.submit")}
        </Button>
      </Stack>
    </Box>
  );
}

function MarriageApplicationForm() {
  const { t } = useTranslation("applications");
  const [formData, setFormData] = useState({
    groomLastName: '',
    groomFirstName: '',
    groomDateOfBirth: '',
    groomPlaceOfBirth: '',
    groomNationality: '',
    groomStreetAddress: '',
    groomPostalCode: '',
    groomCity: '',
    groomFatherName: '',
    groomMotherName: '',
    brideLastName: '',
    brideFirstName: '',
    brideDateOfBirth: '',
    bridePlaceOfBirth: '',
    brideNationality: '',
    brideStreetAddress: '',
    bridePostalCode: '',
    brideCity: '',
    brideFatherName: '',
    brideMotherName: '',
    selectedLastName: '',
    mahr: '',
    civilMarriageDate: '',
    civilMarriageLocation: '',
    witness1Name: '',
    witness2Name: '',
    witness3Name: '',
    witness4Name: '',
    proposedDateTime: '',
    location: 'Islamski centar GAM',
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
      const response = await apiRequest('/api/marriage-applications', 'POST', data);
      return await response.json();
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    try {
      let finalData: any = { ...formData };

      if (!finalData.witness3Name) finalData.witness3Name = null;
      if (!finalData.witness4Name) finalData.witness4Name = null;
      if (!finalData.customAddress) finalData.customAddress = null;
      if (!finalData.customCity) finalData.customCity = null;
      if (!finalData.customCanton) finalData.customCanton = null;
      if (!finalData.customPostalCode) finalData.customPostalCode = null;
      if (!finalData.notes) finalData.notes = null;

      await submitApplicationMutation.mutateAsync(finalData);
      
      setSubmitSuccess(true);
      setFormData({
        groomLastName: '',
        groomFirstName: '',
        groomDateOfBirth: '',
        groomPlaceOfBirth: '',
        groomNationality: '',
        groomStreetAddress: '',
        groomPostalCode: '',
        groomCity: '',
        groomFatherName: '',
        groomMotherName: '',
        brideLastName: '',
        brideFirstName: '',
        brideDateOfBirth: '',
        bridePlaceOfBirth: '',
        brideNationality: '',
        brideStreetAddress: '',
        bridePostalCode: '',
        brideCity: '',
        brideFatherName: '',
        brideMotherName: '',
        selectedLastName: '',
        mahr: '',
        civilMarriageDate: '',
        civilMarriageLocation: '',
        witness1Name: '',
        witness2Name: '',
        witness3Name: '',
        witness4Name: '',
        proposedDateTime: '',
        location: 'Islamski centar GAM',
        customAddress: '',
        customCity: '',
        customCanton: '',
        customPostalCode: '',
        phone: '',
        notes: '',
      });
    } catch (error) {
      console.error('Marriage application submission failed:', error);
      setSubmitError(t("marriage.error"));
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
          {t("marriage.successTitle")}
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {t("marriage.successMessage")}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {t("marriage.successDescription")}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => setSubmitSuccess(false)}
          sx={{ mt: 2 }}
          data-testid="button-submit-another-marriage"
        >
          {t("marriage.submitAnother")}
        </Button>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        {t("marriage.title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        {t("marriage.description")}
      </Typography>

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t("marriage.groomData")}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("marriage.groomLastName")}
              value={formData.groomLastName}
              onChange={handleChange('groomLastName')}
              data-testid="input-groomLastName"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("marriage.groomFirstName")}
              value={formData.groomFirstName}
              onChange={handleChange('groomFirstName')}
              data-testid="input-groomFirstName"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              type="date"
              label={t("marriage.groomDateOfBirth")}
              value={formData.groomDateOfBirth}
              onChange={handleChange('groomDateOfBirth')}
              InputLabelProps={{ shrink: true }}
              data-testid="input-groomDateOfBirth"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("marriage.groomPlaceOfBirth")}
              value={formData.groomPlaceOfBirth}
              onChange={handleChange('groomPlaceOfBirth')}
              data-testid="input-groomPlaceOfBirth"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("marriage.groomNationality")}
              value={formData.groomNationality}
              onChange={handleChange('groomNationality')}
              data-testid="input-groomNationality"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("marriage.groomStreetAddress")}
              value={formData.groomStreetAddress}
              onChange={handleChange('groomStreetAddress')}
              data-testid="input-groomStreetAddress"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("marriage.groomPostalCode")}
              value={formData.groomPostalCode}
              onChange={handleChange('groomPostalCode')}
              data-testid="input-groomPostalCode"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("marriage.groomCity")}
              value={formData.groomCity}
              onChange={handleChange('groomCity')}
              data-testid="input-groomCity"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("marriage.groomFatherName")}
              value={formData.groomFatherName}
              onChange={handleChange('groomFatherName')}
              data-testid="input-groomFatherName"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("marriage.groomMotherName")}
              value={formData.groomMotherName}
              onChange={handleChange('groomMotherName')}
              data-testid="input-groomMotherName"
            />
          </Grid>
        </Grid>
      </Card>

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t("marriage.brideData")}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("marriage.brideLastName")}
              value={formData.brideLastName}
              onChange={handleChange('brideLastName')}
              data-testid="input-brideLastName"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("marriage.brideFirstName")}
              value={formData.brideFirstName}
              onChange={handleChange('brideFirstName')}
              data-testid="input-brideFirstName"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              type="date"
              label={t("marriage.brideDateOfBirth")}
              value={formData.brideDateOfBirth}
              onChange={handleChange('brideDateOfBirth')}
              InputLabelProps={{ shrink: true }}
              data-testid="input-brideDateOfBirth"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("marriage.bridePlaceOfBirth")}
              value={formData.bridePlaceOfBirth}
              onChange={handleChange('bridePlaceOfBirth')}
              data-testid="input-bridePlaceOfBirth"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("marriage.brideNationality")}
              value={formData.brideNationality}
              onChange={handleChange('brideNationality')}
              data-testid="input-brideNationality"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("marriage.brideStreetAddress")}
              value={formData.brideStreetAddress}
              onChange={handleChange('brideStreetAddress')}
              data-testid="input-brideStreetAddress"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("marriage.bridePostalCode")}
              value={formData.bridePostalCode}
              onChange={handleChange('bridePostalCode')}
              data-testid="input-bridePostalCode"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("marriage.brideCity")}
              value={formData.brideCity}
              onChange={handleChange('brideCity')}
              data-testid="input-brideCity"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("marriage.brideFatherName")}
              value={formData.brideFatherName}
              onChange={handleChange('brideFatherName')}
              data-testid="input-brideFatherName"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("marriage.brideMotherName")}
              value={formData.brideMotherName}
              onChange={handleChange('brideMotherName')}
              data-testid="input-brideMotherName"
            />
          </Grid>
        </Grid>
      </Card>

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t("marriage.marriageDetails")}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("marriage.selectedLastName")}
              value={formData.selectedLastName}
              onChange={handleChange('selectedLastName')}
              data-testid="input-selectedLastName"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("marriage.mahr")}
              value={formData.mahr}
              onChange={handleChange('mahr')}
              data-testid="input-mahr"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              type="date"
              label={t("marriage.civilMarriageDate")}
              value={formData.civilMarriageDate}
              onChange={handleChange('civilMarriageDate')}
              InputLabelProps={{ shrink: true }}
              data-testid="input-civilMarriageDate"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("marriage.civilMarriageLocation")}
              value={formData.civilMarriageLocation}
              onChange={handleChange('civilMarriageLocation')}
              data-testid="input-civilMarriageLocation"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("marriage.witness1Name")}
              value={formData.witness1Name}
              onChange={handleChange('witness1Name')}
              data-testid="input-witness1Name"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label={t("marriage.witness2Name")}
              value={formData.witness2Name}
              onChange={handleChange('witness2Name')}
              data-testid="input-witness2Name"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label={t("marriage.witness3Name")}
              value={formData.witness3Name}
              onChange={handleChange('witness3Name')}
              data-testid="input-witness3Name"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label={t("marriage.witness4Name")}
              value={formData.witness4Name}
              onChange={handleChange('witness4Name')}
              data-testid="input-witness4Name"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              type="datetime-local"
              label={t("marriage.proposedDateTime")}
              value={formData.proposedDateTime}
              onChange={handleChange('proposedDateTime')}
              InputLabelProps={{ shrink: true }}
              data-testid="input-proposedDateTime"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>{t("marriage.location")}</InputLabel>
              <Select
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                label={t("marriage.location")}
                data-testid="select-location"
              >
                <MenuItem value="Islamski centar GAM">{t("marriage.locationGAM")}</MenuItem>
                <MenuItem value="Drugo mjesto">{t("marriage.locationOther")}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {formData.location === 'Drugo mjesto' && (
            <>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t("marriage.customAddress")}
                  value={formData.customAddress}
                  onChange={handleChange('customAddress')}
                  data-testid="input-customAddress"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label={t("marriage.customPostalCode")}
                  value={formData.customPostalCode}
                  onChange={handleChange('customPostalCode')}
                  data-testid="input-customPostalCode"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label={t("marriage.customCity")}
                  value={formData.customCity}
                  onChange={handleChange('customCity')}
                  data-testid="input-customCity"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label={t("marriage.customCanton")}
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
              label={t("marriage.phone")}
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
              label={t("marriage.notes")}
              placeholder={t("marriage.notesPlaceholder")}
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
          data-testid="button-submit-marriage-application"
        >
          {submitApplicationMutation.isPending ? t("marriage.submitting") : t("marriage.submit")}
        </Button>
      </Stack>
    </Box>
  );
}

function MyApplicationsList() {
  const { t } = useTranslation("applications");
  const [archiveTab, setArchiveTab] = useState<'active' | 'archived'>('active');
  
  const { data: applications = [], isLoading } = useQuery<AkikaApplication[]>({
    queryKey: ["/api/akika-applications/my"]
  });
  
  // Filter applications based on archive tab
  const filteredApplications = applications.filter(app => {
    if (archiveTab === 'active') {
      return !app.isArchived;
    } else {
      return app.isArchived;
    }
  });
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return t("status.pending");
      case "approved":
        return t("status.approved");
      case "rejected":
        return t("status.rejected");
      case "archived":
        return t("status.archived");
      default:
        return status;
    }
  };
  
  const getStatusColor = (status: string): 'warning' | 'success' | 'error' | 'default' => {
    switch (status) {
      case "pending":
        return "warning";
      case "approved":
        return "success";
      case "rejected":
      case "archived":
        return "error";
      default:
        return "default";
    }
  };
  
  const handlePrint = (application: AkikaApplication) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Akika Prijava - ${application.childName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #1976d2; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .label { font-weight: bold; color: #555; }
            .value { margin-left: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <h1>Akika</h1>
          
          <div class="section">
            <div class="label">Dijete:</div>
            <div class="value">${application.childName}</div>
          </div>
          
          <div class="grid">
            <div class="section">
              <div class="label">Otac:</div>
              <div class="value">${application.fatherName}</div>
            </div>
            <div class="section">
              <div class="label">Majka:</div>
              <div class="value">${application.motherName}</div>
            </div>
          </div>
          
          <div class="section">
            <div class="label">Status:</div>
            <div class="value">${getStatusLabel(application.status)}</div>
          </div>
          
          ${application.reviewNotes ? `
            <div class="section">
              <div class="label">Odgovor/Napomena:</div>
              <div class="value">${application.reviewNotes}</div>
            </div>
          ` : ''}
          
          <div class="section">
            <div class="label">Podneseno:</div>
            <div class="value">${application.createdAt ? new Date(application.createdAt).toLocaleString('hr-HR') : '-'}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };
  
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        {t("myApplications.title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        {t("myApplications.description")}
      </Typography>
      
      {/* Archive Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={archiveTab} 
          onChange={(_, newValue) => setArchiveTab(newValue)}
          data-testid="tabs-archive"
        >
          <Tab 
            label={t("myApplications.tabs.active")} 
            value="active" 
            data-testid="tab-active-requests"
          />
          <Tab 
            label={t("myApplications.tabs.archived")} 
            value="archived" 
            data-testid="tab-archived-requests"
          />
        </Tabs>
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredApplications.length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                {archiveTab === 'active' ? t("myApplications.noActiveRequests") : t("myApplications.noArchivedRequests")}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {filteredApplications.map((application) => (
            <Card key={application.id} variant="outlined">
              <CardHeader
                title={`${application.childName} - ${application.fatherName}`}
                subheader={`${t("print.submittedAt")}: ${application.createdAt ? new Date(application.createdAt).toLocaleString('hr-HR') : '-'}`}
                action={
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip
                      label={getStatusLabel(application.status)}
                      color={getStatusColor(application.status)}
                      size="small"
                    />
                    <IconButton 
                      onClick={() => handlePrint(application)}
                      data-testid={`button-print-application-${application.id}`}
                    >
                      <Print />
                    </IconButton>
                  </Box>
                }
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t("akika.fatherName")}
                    </Typography>
                    <Typography variant="body2">{application.fatherName}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t("akika.motherName")}
                    </Typography>
                    <Typography variant="body2">{application.motherName}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t("akika.childName")}
                    </Typography>
                    <Typography variant="body2">{application.childName}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t("akika.childGender")}
                    </Typography>
                    <Typography variant="body2">{application.childGender}</Typography>
                  </Grid>
                  {application.reviewNotes && (
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Odgovor/Napomena
                        </Typography>
                        <Typography variant="body2">{application.reviewNotes}</Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}

function IncomingAkikaApplications() {
  const { t } = useTranslation("applications");
  const { toast } = useToast();
  const [archiveTab, setArchiveTab] = useState<'active' | 'archived'>('active');
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<AkikaApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  
  const { data: applications, isLoading } = useQuery<AkikaApplication[]>({
    queryKey: ['/api/akika-applications'],
  });

  // Filter applications based on archive tab
  const filteredApplications = applications?.filter(app => {
    if (archiveTab === 'active') {
      return !app.isArchived;
    } else {
      return app.isArchived;
    }
  }) || [];

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest(`/api/akika-applications/${id}/review`, 'PATCH', {
        status,
        reviewNotes: reviewNotes.trim() || null,
      });
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/akika-applications'] });
      const statusText = variables.status === 'approved' ? 'odobrena' : 'odbijena';
      toast({
        title: `Akika prijava ${statusText}`,
      });
      setReviewDialogOpen(false);
      setSelectedApplication(null);
      setReviewNotes('');
    },
    onError: () => {
      toast({
        title: "Greška pri obradi prijave",
        variant: "destructive",
      });
    },
  });


  const handleOpenReview = (application: AkikaApplication) => {
    setSelectedApplication(application);
    setReviewNotes('');
    setReviewDialogOpen(true);
  };

  const handleApprove = () => {
    if (selectedApplication) {
      reviewMutation.mutate({ id: selectedApplication.id, status: 'approved' });
    }
  };

  const handleReject = () => {
    if (selectedApplication) {
      reviewMutation.mutate({ id: selectedApplication.id, status: 'rejected' });
    }
  };

  const handlePrint = (application: AkikaApplication) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const statusLabel = application.status === 'pending' ? 'Na čekanju' : 
                        application.status === 'approved' ? 'Odobreno' : 'Odbijeno';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Akika prijava - ${application.childName}</title>
          <style>
            @page { margin: 20mm; }
            * { box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 0; 
              margin: 0;
              color: #333;
              line-height: 1.6;
            }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { 
              text-align: center; 
              border-bottom: 3px solid #3949AB; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .header h1 { 
              color: #3949AB; 
              margin: 0 0 10px 0; 
              font-size: 28px;
            }
            .header .subtitle {
              color: #666;
              font-size: 14px;
            }
            .section { 
              margin-bottom: 25px; 
              page-break-inside: avoid;
            }
            .section-title { 
              background: #3949AB; 
              color: white; 
              padding: 10px 15px; 
              margin-bottom: 15px;
              font-size: 16px;
              font-weight: 600;
              border-radius: 4px;
            }
            .fields-grid { 
              display: grid; 
              grid-template-columns: repeat(2, 1fr); 
              gap: 15px; 
            }
            .field { 
              padding: 12px;
              background: #f8f9fa;
              border-radius: 4px;
              border-left: 3px solid #1E88E5;
            }
            .field.full-width { grid-column: span 2; }
            .field-label { 
              font-size: 11px; 
              color: #666; 
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .field-value { 
              font-size: 14px; 
              color: #333;
              font-weight: 500;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 16px;
              border-radius: 20px;
              font-weight: 600;
              font-size: 12px;
            }
            .status-pending { background: #FFF3E0; color: #E65100; }
            .status-approved { background: #E8F5E9; color: #2E7D32; }
            .status-rejected { background: #FFEBEE; color: #C62828; }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            .signature-section {
              margin-top: 50px;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 40px;
            }
            .signature-box {
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #333;
              margin-top: 60px;
              padding-top: 10px;
              font-size: 12px;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>AKIKA PRIJAVA</h1>
              <div class="subtitle">Zahtjev za organizaciju akike</div>
            </div>
            
            <div class="section">
              <div class="section-title">Podaci o roditeljima</div>
              <div class="fields-grid">
                <div class="field">
                  <div class="field-label">Ime oca</div>
                  <div class="field-value">${application.fatherName || '-'}</div>
                </div>
                <div class="field">
                  <div class="field-label">Ime majke</div>
                  <div class="field-value">${application.motherName || '-'}</div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Podaci o djetetu</div>
              <div class="fields-grid">
                <div class="field">
                  <div class="field-label">Ime djeteta</div>
                  <div class="field-value">${application.childName || '-'}</div>
                </div>
                <div class="field">
                  <div class="field-label">Spol</div>
                  <div class="field-value">${application.childGender || '-'}</div>
                </div>
                <div class="field">
                  <div class="field-label">Datum rođenja</div>
                  <div class="field-value">${application.childDateOfBirth || '-'}</div>
                </div>
                <div class="field">
                  <div class="field-label">Mjesto rođenja</div>
                  <div class="field-value">${application.childPlaceOfBirth || '-'}</div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Detalji organizacije</div>
              <div class="fields-grid">
                <div class="field">
                  <div class="field-label">Lokacija</div>
                  <div class="field-value">${application.location || '-'}</div>
                </div>
                <div class="field">
                  <div class="field-label">Organizirati ketering</div>
                  <div class="field-value">${application.organizeCatering ? 'Da' : 'Ne'}</div>
                </div>
                <div class="field">
                  <div class="field-label">Kontakt telefon</div>
                  <div class="field-value">${application.phone || '-'}</div>
                </div>
                <div class="field">
                  <div class="field-label">Email</div>
                  <div class="field-value">${application.email || '-'}</div>
                </div>
                ${application.notes ? `
                  <div class="field full-width">
                    <div class="field-label">Napomene</div>
                    <div class="field-value">${application.notes}</div>
                  </div>
                ` : ''}
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Status prijave</div>
              <div class="fields-grid">
                <div class="field">
                  <div class="field-label">Status</div>
                  <div class="field-value">
                    <span class="status-badge status-${application.status}">${statusLabel}</span>
                  </div>
                </div>
                <div class="field">
                  <div class="field-label">Datum prijave</div>
                  <div class="field-value">${application.createdAt ? new Date(application.createdAt).toLocaleDateString('bs-BA') : '-'}</div>
                </div>
                ${application.reviewNotes ? `
                  <div class="field full-width">
                    <div class="field-label">Odgovor/Napomena</div>
                    <div class="field-value">${application.reviewNotes}</div>
                  </div>
                ` : ''}
              </div>
            </div>
            
            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-line">Potpis podnosioca</div>
              </div>
              <div class="signature-box">
                <div class="signature-line">Potpis ovlaštene osobe</div>
              </div>
            </div>
            
            <div class="footer">
              Dokument generisan: ${new Date().toLocaleString('bs-BA')}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" paragraph>
        {t("incomingApplications.description")}
      </Typography>

      {/* Archive Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={archiveTab} 
          onChange={(_, newValue) => setArchiveTab(newValue)}
          data-testid="tabs-admin-archive"
        >
          <Tab 
            label="Aktivne" 
            value="active" 
            data-testid="tab-active-admin"
          />
          <Tab 
            label="Arhivirane" 
            value="archived" 
            data-testid="tab-archived-admin"
          />
        </Tabs>
      </Box>

      {filteredApplications.length === 0 ? (
        <Alert severity="info">{t("incomingApplications.noApplications")}</Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredApplications.map((application) => (
            <Card key={application.id} variant="outlined">
              <CardHeader
                title={`${application.childName} - ${application.fatherName}`}
                subheader={`${t("print.submittedAt")}: ${application.createdAt ? new Date(application.createdAt).toLocaleString('hr-HR') : '-'}`}
                action={
                  <IconButton 
                    onClick={() => handlePrint(application)}
                    data-testid={`button-print-application-${application.id}`}
                  >
                    <Print />
                  </IconButton>
                }
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t("akika.fatherName")}
                    </Typography>
                    <Typography variant="body2">{application.fatherName}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t("akika.motherName")}
                    </Typography>
                    <Typography variant="body2">{application.motherName}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t("akika.childName")}
                    </Typography>
                    <Typography variant="body2">{application.childName}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t("akika.childGender")}
                    </Typography>
                    <Typography variant="body2">{application.childGender}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t("akika.childDateOfBirth")}
                    </Typography>
                    <Typography variant="body2">{application.childDateOfBirth}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t("akika.childPlaceOfBirth")}
                    </Typography>
                    <Typography variant="body2">{application.childPlaceOfBirth}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t("akika.location")}
                    </Typography>
                    <Typography variant="body2">{application.location}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t("akika.phone")}
                    </Typography>
                    <Typography variant="body2">{application.phone}</Typography>
                  </Grid>
                  {application.notes && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary">
                        {t("akika.notes")}
                      </Typography>
                      <Typography variant="body2">{application.notes}</Typography>
                    </Grid>
                  )}
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t("print.status")}
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={t(`status.${application.status}`)}
                        color={application.status === 'approved' ? 'success' : application.status === 'rejected' ? 'error' : 'default'}
                        size="small"
                      />
                    </Box>
                  </Grid>
                  {application.status === 'pending' && (
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<Check />}
                          onClick={() => handleOpenReview(application)}
                          data-testid={`button-review-approve-${application.id}`}
                        >
                          Odobri
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<Close />}
                          onClick={() => handleOpenReview(application)}
                          data-testid={`button-review-reject-${application.id}`}
                        >
                          Odbij
                        </Button>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog 
        open={reviewDialogOpen} 
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Pregled Akika prijave
        </DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Dijete:</strong> {selectedApplication.childName}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Otac:</strong> {selectedApplication.fatherName}
              </Typography>
              <Typography variant="body2" gutterBottom sx={{ mb: 3 }}>
                <strong>Majka:</strong> {selectedApplication.motherName}
              </Typography>

              <TextField
                fullWidth
                label="Odgovor / Napomena (opciono)"
                multiline
                rows={4}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Unesite odgovor ili napomenu koja će biti poslana podnosiocu prijave..."
                data-testid="input-review-notes"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setReviewDialogOpen(false)}
            data-testid="button-cancel-review"
          >
            Otkaži
          </Button>
          <Button
            onClick={handleReject}
            variant="outlined"
            color="error"
            disabled={reviewMutation.isPending}
            data-testid="button-confirm-reject"
          >
            Odbij
          </Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            color="success"
            disabled={reviewMutation.isPending}
            data-testid="button-confirm-approve"
          >
            Odobri
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function ApplicationsPage() {
  const { user } = useAuth();
  const { t } = useTranslation("applications");
  const featureAccess = useFeatureAccess('applications');
  const [tabValue, setTabValue] = useState(0);

  if (featureAccess.upgradeRequired) {
    return <UpgradeCTA moduleId="applications" requiredPlan={featureAccess.requiredPlan || 'standard'} currentPlan={featureAccess.currentPlan || 'basic'} />;
  }

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
              <Tab 
                icon={user?.isAdmin ? <PersonAdd /> : <ListIcon />} 
                label={user?.isAdmin ? "Pristupnice" : t("myApplications.title")} 
                iconPosition="start"
                data-testid={user?.isAdmin ? "tab-membership-applications" : "tab-my-applications"}
              />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              {user?.isAdmin ? (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>Pristigle akika prijave</Typography>
                  <IncomingAkikaApplications />
                  <Divider sx={{ my: 4 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>Podnesite novu akika prijavu</Typography>
                  <AkikaApplicationForm />
                </Box>
              ) : (
                <AkikaApplicationForm />
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <MarriageApplicationForm />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {user?.isAdmin ? <MembershipApplicationsList /> : <MyApplicationsList />}
            </TabPanel>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
