import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  IconButton,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface FamilySelectionDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export default function FamilySelectionDialog({ open, onClose, userId }: FamilySelectionDialogProps) {
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    relationship: ''
  });

  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      // Extract relationship from userData before sending to /api/users
      const { _relationship, ...userDataToSend } = userData;
      const relationship = _relationship;
      
      if (!relationship) {
        throw new Error('Tip odnosa je obavezan');
      }
      
      const response = await apiRequest('/api/users', 'POST', userDataToSend);
      const newUser = await response.json();
      console.log('[FamilyDialog] New user created:', newUser);
      
      if (!newUser || !newUser.id) {
        throw new Error('Failed to create user - no ID returned');
      }
      
      // Create family relationship with the new user using the extracted relationship
      console.log('[FamilyDialog] Creating relationship:', {
        userId: userId,
        relatedUserId: newUser.id,
        relationship: relationship
      });
      
      const relationshipResponse = await apiRequest('/api/family-relationships', 'POST', {
        userId: userId,
        relatedUserId: newUser.id,
        relationship: relationship
      });
      
      const relationshipResult = await relationshipResponse.json();
      console.log('[FamilyDialog] Relationship created:', relationshipResult);
      
      return { user: newUser, relationship: relationshipResult };
    },
    onSuccess: async (result) => {
      console.log('[FamilyDialog] Success:', result);
      
      // Invalidate and refetch all family-relationships queries to ensure UI updates
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/family-relationships']
      });
      
      // Also invalidate users query
      await queryClient.invalidateQueries({
        queryKey: ['/api/users']
      });
      
      // Force a complete refetch of family relationships
      await queryClient.refetchQueries({
        queryKey: ['/api/family-relationships', userId],
        type: 'all'
      });
      
      handleClose();
    },
    onError: (error) => {
      console.error('[FamilyDialog] Error:', error);
      alert('Greška pri kreiranju člana porodice: ' + (error instanceof Error ? error.message : String(error)));
    }
  });

  const relationshipOptions = [
    { value: 'supružnik', label: 'Supružnik/a' },
    { value: 'dijete', label: 'Dijete' },
    { value: 'roditelj', label: 'Roditelj' },
    { value: 'brat', label: 'Brat' },
    { value: 'sestra', label: 'Sestra' },
    { value: 'ostalo', label: 'Ostalo' }
  ];

  const handleClose = () => {
    setNewUserData({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      relationship: ''
    });
    onClose();
  };

  const handleAddNewUser = () => {
    const { relationship: rel, ...userData } = newUserData;
    if (userData.firstName && userData.lastName && rel) {
      const cleanedUserData = {
        ...userData,
        username: userData.username || null,
        email: userData.email || null,
        password: userData.password || null,
        status: 'član porodice',
        roles: ['clan_porodice'],
        _relationship: rel // Pass relationship explicitly to mutation
      };
      createUserMutation.mutate(cleanedUserData);
    }
  };

  const handleNewUserChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewUserData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, minHeight: 500 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Dodaj člana porodice
        <IconButton onClick={handleClose} data-testid="close-family-dialog">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Dodajte novog člana porodice koji će biti alatski dodan u vašu porodičnu mrežu.
          </Typography>
          
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                variant="outlined"
                label="Ime"
                value={newUserData.firstName}
                onChange={handleNewUserChange('firstName')}
                required
                data-testid="input-new-firstName"
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                variant="outlined"
                label="Prezime"
                value={newUserData.lastName}
                onChange={handleNewUserChange('lastName')}
                required
                data-testid="input-new-lastName"
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                variant="outlined"
                label="Korisničko ime"
                value={newUserData.username}
                onChange={handleNewUserChange('username')}
                helperText="Opciono"
                data-testid="input-new-username"
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                variant="outlined"
                label="Email"
                type="email"
                value={newUserData.email}
                onChange={handleNewUserChange('email')}
                helperText="Opciono"
                data-testid="input-new-email"
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                variant="outlined"
                label="Šifra"
                type="password"
                value={newUserData.password}
                onChange={handleNewUserChange('password')}
                helperText="Opciono"
                data-testid="input-new-password"
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Tip odnosa</InputLabel>
                <Select
                  value={newUserData.relationship}
                  label="Tip odnosa"
                  onChange={(e) => setNewUserData(prev => ({ ...prev, relationship: e.target.value }))}
                  data-testid="select-new-relationship"
                >
                  {relationshipOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={handleClose} 
          variant="outlined"
          data-testid="button-cancel"
        >
          Odustani
        </Button>
        
        <Button 
          onClick={handleAddNewUser}
          variant="contained"
          disabled={
            !newUserData.firstName || 
            !newUserData.lastName || 
            !newUserData.relationship ||
            createUserMutation.isPending
          }
          data-testid="button-add-new"
        >
          {createUserMutation.isPending ? 'Kreira se...' : 'Kreiraj i dodaj'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
