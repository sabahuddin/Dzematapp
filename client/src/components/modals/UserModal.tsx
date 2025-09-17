import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  IconButton,
  Box
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { User } from '@shared/schema';

interface UserModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (userData: any) => void;
  user?: User | null;
}

export default function UserModal({ open, onClose, onSave, user }: UserModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    address: '',
    city: '',
    postalCode: '',
    dateOfBirth: '',
    occupation: '',
    status: 'active'
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.email || '',
        password: '', // Don't populate password for security
        address: user.address || '',
        city: user.city || '',
        postalCode: user.postalCode || '',
        dateOfBirth: user.dateOfBirth || '',
        occupation: user.occupation || '',
        status: user.status || 'active'
      });
    } else {
      // Reset form for new user
      setFormData({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        address: '',
        city: '',
        postalCode: '',
        dateOfBirth: '',
        occupation: '',
        status: 'active'
      });
    }
  }, [user, open]);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(formData);
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
        {user ? 'Uredi Korisnika' : 'Dodaj Novog Korisnika'}
        <IconButton onClick={onClose} data-testid="close-user-modal">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Ime"
                value={formData.firstName}
                onChange={handleChange('firstName')}
                required
                data-testid="input-firstName"
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Prezime"
                value={formData.lastName}
                onChange={handleChange('lastName')}
                required
                data-testid="input-lastName"
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Korisničko ime"
                value={formData.username}
                onChange={handleChange('username')}
                required
                data-testid="input-username"
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                required
                data-testid="input-email"
              />
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Šifra"
                type="password"
                value={formData.password}
                onChange={handleChange('password')}
                required={!user}
                helperText={user ? "Ostavite prazno da zadržite postojeću šifru" : ""}
                data-testid="input-password"
              />
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Adresa"
                value={formData.address}
                onChange={handleChange('address')}
                data-testid="input-address"
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Grad"
                value={formData.city}
                onChange={handleChange('city')}
                data-testid="input-city"
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Poštanski broj"
                value={formData.postalCode}
                onChange={handleChange('postalCode')}
                data-testid="input-postalCode"
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Datum rođenja"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange('dateOfBirth')}
                InputLabelProps={{ shrink: true }}
                data-testid="input-dateOfBirth"
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Zanimanje"
                value={formData.occupation}
                onChange={handleChange('occupation')}
                data-testid="input-occupation"
              />
            </Grid>
          </Grid>
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
