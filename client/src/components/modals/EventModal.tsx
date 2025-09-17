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
  Grid
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { Event } from '@shared/schema';

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
    maxAttendees: ''
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
        maxAttendees: event.maxAttendees?.toString() || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        location: '',
        dateTime: '',
        rsvpEnabled: true,
        requireAdultsChildren: false,
        maxAttendees: ''
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
      maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees, 10) : null
    });
    onClose();
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
              label="Naziv Događaja"
              value={formData.name}
              onChange={handleChange('name')}
              required
              data-testid="input-name"
            />
            
            <TextField
              fullWidth
              label="Detaljan Opis"
              value={formData.description}
              onChange={handleChange('description')}
              multiline
              rows={4}
              data-testid="input-description"
            />
            
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
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
                  label="Datum i Vrijeme"
                  type="datetime-local"
                  value={formData.dateTime}
                  onChange={handleChange('dateTime')}
                  InputLabelProps={{ shrink: true }}
                  required
                  data-testid="input-dateTime"
                />
              </Grid>
            </Grid>
            
            <TextField
              fullWidth
              label="Maksimalan broj učesnika"
              type="number"
              value={formData.maxAttendees}
              onChange={handleChange('maxAttendees')}
              helperText="Ostavite prazno za neograničeno"
              data-testid="input-maxAttendees"
            />
            
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
        
        <DialogActions sx={{ p: 3 }}>
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
        </DialogActions>
      </form>
    </Dialog>
  );
}
