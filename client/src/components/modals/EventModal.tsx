import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  IconButton,
  Box,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Autocomplete,
  Chip,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider
} from '@mui/material';
import { Close, CalendarMonth, People } from '@mui/icons-material';
import { Event, EventRsvpStats } from '@shared/schema';
import RichTextEditor from '../ui/rich-text-editor';
import { downloadICS } from '@/lib/icsGenerator';

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (eventData: any) => void;
  event?: Event | null;
  createdById: string;
  isAdmin?: boolean;
}

export default function EventModal({ 
  open, 
  onClose, 
  onSave, 
  event, 
  createdById,
  isAdmin = false
}: EventModalProps) {
  const { t } = useTranslation(['events', 'common']);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    dateTime: '',
    rsvpEnabled: true,
    requireAdultsChildren: false,
    maxAttendees: '',
    categories: [] as string[],
    pointsValue: 50
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const predefinedCategories = [
    'Džemat'
  ];

  // Fetch previous event locations
  const locationsQuery = useQuery<string[]>({
    queryKey: ['/api/events/locations'],
    enabled: open,
  });

  // Fetch RSVP data for existing events (admin only)
  const rsvpQuery = useQuery<EventRsvpStats>({
    queryKey: ['/api/events', event?.id, 'rsvps'],
    enabled: open && !!event && isAdmin,
  });

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || '',
        description: event.description || '',
        location: event.location || '',
        dateTime: event.dateTime ? new Date(event.dateTime).toISOString().slice(0, 16) : '',
        rsvpEnabled: event.rsvpEnabled ?? true,
        requireAdultsChildren: event.requireAdultsChildren ?? false,
        maxAttendees: event.maxAttendees?.toString() || '',
        categories: event.categories || [],
        pointsValue: event.pointsValue || 50
      });
      setPhotoUrl(event.photoUrl || null);
      setPhotoPreview(event.photoUrl || null);
      setPhotoFile(null);
    } else {
      // Set default datetime to now + 1 hour (rounded to next hour) for Safari compatibility
      const now = new Date();
      now.setHours(now.getHours() + 1, 0, 0, 0); // Next hour, rounded
      const defaultDateTime = now.toISOString().slice(0, 16);
      
      setFormData({
        name: '',
        description: '',
        location: '',
        dateTime: defaultDateTime,
        rsvpEnabled: true,
        requireAdultsChildren: false,
        maxAttendees: '',
        categories: [],
        pointsValue: 50
      });
      setPhotoUrl(null);
      setPhotoPreview(null);
      setPhotoFile(null);
    }
  }, [event, open]);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoUrl(null);
  };

  const isReadOnly = !!(event && !isAdmin);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isReadOnly) {
      onClose();
      return;
    }

    let finalPhotoUrl = photoUrl;

    // Upload photo if a new file is selected
    if (photoFile) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('photo', photoFile);

        const response = await fetch('/api/upload/event-photo', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload photo');
        }

        const data = await response.json();
        finalPhotoUrl = data.photoUrl;
      } catch (error) {
        console.error('Photo upload failed:', error);
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    
    onSave({
      ...formData,
      createdById,
      dateTime: new Date(formData.dateTime).toISOString(),
      maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees, 10) : null,
      categories: (formData.categories?.length || 0) > 0 ? formData.categories : null,
      pointsValue: formData.pointsValue,
      photoUrl: finalPhotoUrl
    });
    onClose();
  };

  const handleAddToCalendar = () => {
    if (event && event.name && event.location && event.dateTime) {
      downloadICS({
        name: event.name,
        description: event.description || '',
        location: event.location,
        dateTime: new Date(event.dateTime),
        reminderTime: null
      });
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {event && !isAdmin ? t('events:viewEvent') : (event ? t('events:editEvent') : t('events:createEvent'))}
        <IconButton onClick={onClose} data-testid="close-event-modal">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              label={t('events:eventName')}
              value={formData.name}
              onChange={handleChange('name')}
              required
              disabled={isReadOnly}
              data-testid="input-name"
            />
            
            <RichTextEditor
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              label={t('events:detailedDescription')}
              placeholder={t('events:detailedDescription')}
              readOnly={isReadOnly}
              data-testid="input-description"
            />

            {!isReadOnly && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Fotografija događaja
                </Typography>
                {photoPreview ? (
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <Box
                      component="img"
                      src={photoPreview}
                      alt="Preview"
                      sx={{
                        maxWidth: '100%',
                        maxHeight: 200,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    />
                    <IconButton
                      onClick={handleRemovePhoto}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'background.paper' }
                      }}
                      size="small"
                    >
                      <Close />
                    </IconButton>
                  </Box>
                ) : (
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CalendarMonth />}
                  >
                    Odaberi fotografiju
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handlePhotoChange}
                    />
                  </Button>
                )}
              </Box>
            )}

            <Autocomplete
              multiple
              freeSolo
              options={predefinedCategories}
              value={formData.categories}
              onChange={(event, newValue) => {
                setFormData(prev => ({ ...prev, categories: newValue }));
              }}
              disabled={isReadOnly}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    data-testid={`chip-category-${index}`}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label={t('common:common.categories')}
                  placeholder={t('common:common.categories')}
                  InputLabelProps={{ shrink: true }}
                  data-testid="input-categories"
                />
              )}
              data-testid="autocomplete-categories"
            />
            
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  freeSolo
                  options={locationsQuery.data || []}
                  value={formData.location}
                  onChange={(event, newValue) => {
                    setFormData(prev => ({ ...prev, location: newValue || '' }));
                  }}
                  onInputChange={(event, newInputValue) => {
                    setFormData(prev => ({ ...prev, location: newInputValue }));
                  }}
                  disabled={isReadOnly}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      variant="outlined"
                      label={t('events:location')}
                      placeholder={t('events:location')}
                      required
                      data-testid="input-location"
                    />
                  )}
                  data-testid="autocomplete-location"
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label={t('events:dateTime')}
                  type="datetime-local"
                  value={formData.dateTime}
                  onChange={handleChange('dateTime')}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 60 }}
                  required
                  disabled={isReadOnly}
                  data-testid="input-dateTime"
                />
              </Grid>
            </Grid>
            
            <TextField
              fullWidth
              variant="outlined"
              label={t('events:maxAttendees')}
              type="number"
              value={formData.maxAttendees}
              onChange={handleChange('maxAttendees')}
              helperText={t('common:common.optionalField')}
              disabled={isReadOnly}
              data-testid="input-maxAttendees"
            />
            
            <FormControl fullWidth variant="outlined" disabled={isReadOnly}>
              <InputLabel>Bodovi za Prisustvo</InputLabel>
              <Select
                value={formData.pointsValue}
                onChange={(e) => setFormData(prev => ({ ...prev, pointsValue: Number(e.target.value) }))}
                label="Bodovi za Prisustvo"
                data-testid="select-pointsValue"
              >
                <MenuItem value={10} data-testid="option-points-10">10 Bodova</MenuItem>
                <MenuItem value={20} data-testid="option-points-20">20 Bodova</MenuItem>
                <MenuItem value={30} data-testid="option-points-30">30 Bodova</MenuItem>
                <MenuItem value={50} data-testid="option-points-50">50 Bodova</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.rsvpEnabled}
                    onChange={handleChange('rsvpEnabled')}
                    disabled={isReadOnly}
                    data-testid="switch-rsvpEnabled"
                  />
                }
                label={t('events:rsvpEnabled')}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.requireAdultsChildren}
                    onChange={handleChange('requireAdultsChildren')}
                    disabled={isReadOnly}
                    data-testid="switch-requireAdultsChildren"
                  />
                }
                label={t('events:requireAdultsChildren')}
              />
            </Box>

            {/* RSVP List (Admin Only) */}
            {event && isAdmin && formData.rsvpEnabled && (
              <>
                <Divider sx={{ mt: 2 }} />
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <People />
                    {t('common:common.registeredParticipants')}
                  </Typography>
                  
                  {rsvpQuery.isLoading ? (
                    <Typography>{t('common:common.loading')}</Typography>
                  ) : rsvpQuery.data && rsvpQuery.data.rsvps && rsvpQuery.data.rsvps.length > 0 ? (
                    <>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell><strong>{t('common:common.fullName')}</strong></TableCell>
                              <TableCell align="center"><strong>{t('events:adults')}</strong></TableCell>
                              <TableCell align="center"><strong>{t('events:children')}</strong></TableCell>
                              <TableCell align="center"><strong>{t('common:common.total')}</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {rsvpQuery.data.rsvps.map((rsvp) => (
                              <TableRow key={rsvp.id} data-testid={`rsvp-row-${rsvp.id}`}>
                                <TableCell>
                                  {rsvp.user ? `${rsvp.user.firstName} ${rsvp.user.lastName}` : t('messages:unknown')}
                                </TableCell>
                                <TableCell align="center">{rsvp.adultsCount ?? 1}</TableCell>
                                <TableCell align="center">{rsvp.childrenCount ?? 0}</TableCell>
                                <TableCell align="center">
                                  {(rsvp.adultsCount ?? 1) + (rsvp.childrenCount ?? 0)}
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow sx={{ backgroundColor: 'hsl(0 0% 96%)' }}>
                              <TableCell><strong>{t('common:common.total').toUpperCase()}:</strong></TableCell>
                              <TableCell align="center"><strong>{rsvpQuery.data.totalAdults}</strong></TableCell>
                              <TableCell align="center"><strong>{rsvpQuery.data.totalChildren}</strong></TableCell>
                              <TableCell align="center"><strong>{rsvpQuery.data.totalAttendees}</strong></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                      
                      {formData.maxAttendees && (
                        <Typography variant="body2" color={
                          rsvpQuery.data.totalAttendees >= parseInt(formData.maxAttendees) ? 'error' : 'text.secondary'
                        } sx={{ mt: 1 }}>
                          {t('events:maxAttendees')}: {formData.maxAttendees}
                          {rsvpQuery.data.totalAttendees >= parseInt(formData.maxAttendees) && 
                            ` - ${t('common:common.capacityReached').toUpperCase()}`}
                        </Typography>
                      )}
                    </>
                  ) : (
                    <Typography color="text.secondary">{t('common:common.noRegisteredParticipants')}</Typography>
                  )}
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, justifyContent: 'flex-end' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isReadOnly && event && (
              <Button 
                onClick={handleAddToCalendar}
                variant="outlined"
                startIcon={<CalendarMonth />}
                data-testid="button-add-to-calendar"
              >
                {t('events:addToCalendar')}
              </Button>
            )}
            <Button 
              onClick={onClose} 
              variant="outlined"
              data-testid="button-cancel"
            >
              {isReadOnly ? t('common:common.close') : t('common:common.cancel')}
            </Button>
            {!isReadOnly && (
              <Button 
                type="submit" 
                variant="contained"
                data-testid="button-save"
              >
                {t('common:common.save')}
              </Button>
            )}
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
}
