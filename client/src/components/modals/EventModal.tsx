import React, { useState, useEffect } from 'react';
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
  Chip
} from '@mui/material';
import { Close, CalendarMonth } from '@mui/icons-material';
import { Event } from '@shared/schema';
import RichTextEditor from '../ui/rich-text-editor';
import { downloadICS } from '@/lib/icsGenerator';

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (eventData: any) => void;
  event?: Event | null;
  createdById: string;
}

export default function EventModal({ 
  open, 
  onClose, 
  onSave, 
  event, 
  createdById 
}: EventModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    dateTime: '',
    rsvpEnabled: true,
    requireAdultsChildren: false,
    maxAttendees: '',
    reminderTime: '',
    categories: [] as string[]
  });

  const predefinedCategories = [
    'Iftar',
    'Mevlud',
    'Edukacija',
    'Sport',
    'Humanitarno',
    'Omladina',
    'Halka',
    'Socijalno'
  ];

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
        reminderTime: event.reminderTime || '',
        categories: event.categories || []
      });
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
        reminderTime: '',
        categories: []
      });
    }
  }, [event, open]);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({
      ...formData,
      createdById,
      dateTime: new Date(formData.dateTime).toISOString(),
      maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees, 10) : null,
      reminderTime: formData.reminderTime || null,
      categories: formData.categories.length > 0 ? formData.categories : null
    });
    onClose();
  };

  const handleAddToCalendar = () => {
    if (formData.name && formData.location && formData.dateTime) {
      downloadICS({
        name: formData.name,
        description: formData.description,
        location: formData.location,
        dateTime: new Date(formData.dateTime),
        reminderTime: formData.reminderTime || null
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
        {event ? 'Uredi Događaj' : 'Kreiraj Događaj'}
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
              label="Naziv Događaja"
              value={formData.name}
              onChange={handleChange('name')}
              required
              data-testid="input-name"
            />
            
            <RichTextEditor
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              label="Detaljan Opis"
              placeholder="Unesite detaljan opis događaja..."
              data-testid="input-description"
            />

            <Autocomplete
              multiple
              freeSolo
              options={predefinedCategories}
              value={formData.categories}
              onChange={(event, newValue) => {
                setFormData(prev => ({ ...prev, categories: newValue }));
              }}
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
                  label="Kategorije"
                  placeholder="Odaberite ili unesite kategoriju"
                  InputLabelProps={{ shrink: true }}
                  data-testid="input-categories"
                />
              )}
              data-testid="autocomplete-categories"
            />
            
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Lokacija"
                  value={formData.location}
                  onChange={handleChange('location')}
                  required
                  data-testid="input-location"
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Datum i Vrijeme"
                  type="datetime-local"
                  value={formData.dateTime}
                  onChange={handleChange('dateTime')}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 60 }}
                  required
                  data-testid="input-dateTime"
                />
              </Grid>
            </Grid>
            
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Maksimalan broj učesnika"
                  type="number"
                  value={formData.maxAttendees}
                  onChange={handleChange('maxAttendees')}
                  helperText="Ostavite prazno za neograničeno"
                  data-testid="input-maxAttendees"
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Podsjetnik</InputLabel>
                  <Select
                    value={formData.reminderTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, reminderTime: e.target.value }))}
                    label="Podsjetnik"
                    data-testid="select-reminderTime"
                  >
                    <MenuItem value="">
                      <em>Bez podsjetnika</em>
                    </MenuItem>
                    <MenuItem value="7_days">7 dana prije</MenuItem>
                    <MenuItem value="24_hours">24 sata prije</MenuItem>
                    <MenuItem value="2_hours">2 sata prije</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.rsvpEnabled}
                    onChange={handleChange('rsvpEnabled')}
                    data-testid="switch-rsvpEnabled"
                  />
                }
                label="Omogući Prijavu Dolaska (RSVP)"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.requireAdultsChildren}
                    onChange={handleChange('requireAdultsChildren')}
                    data-testid="switch-requireAdultsChildren"
                  />
                }
                label="Zahtijevaj Broj Odraslih/Djece"
              />
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
          <Button 
            onClick={handleAddToCalendar}
            variant="outlined"
            startIcon={<CalendarMonth />}
            disabled={!formData.name || !formData.location || !formData.dateTime}
            data-testid="button-add-to-calendar"
          >
            Dodaj u Kalendar
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              onClick={onClose} 
              variant="outlined"
              data-testid="button-cancel"
            >
              Odustani
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              data-testid="button-save"
            >
              Spremi
            </Button>
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
}
