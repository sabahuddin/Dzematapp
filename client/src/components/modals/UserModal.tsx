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
  Box,
  Avatar,
  Typography,
  Card,
  CardContent,
  Chip,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete
} from '@mui/material';
import {
  Close,
  PhotoCamera,
  Add,
  Person,
  Delete
} from '@mui/icons-material';
import { User, FamilyRelationship } from '@shared/schema';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import FamilySelectionDialog from './FamilySelectionDialog';

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
    phone: '',
    photo: '',
    address: '',
    city: '',
    postalCode: '',
    dateOfBirth: '',
    occupation: '',
    membershipDate: '',
    status: 'aktivan',
    inactiveReason: null as string | null,
    categories: [] as string[]
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [showFamilyDialog, setShowFamilyDialog] = useState(false);
  
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.email || '',
        password: '', // Don't populate password for security
        phone: user.phone || '',
        photo: user.photo || '',
        address: user.address || '',
        city: user.city || '',
        postalCode: user.postalCode || '',
        dateOfBirth: user.dateOfBirth || '',
        occupation: user.occupation || '',
        membershipDate: user.membershipDate ? new Date(user.membershipDate).toISOString().split('T')[0] : '',
        status: user.status || 'aktivan',
        inactiveReason: user.inactiveReason || null,
        categories: user.categories || []
      });
      setPhotoPreview(user.photo || '');
    } else {
      // Reset form for new user
      setFormData({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        phone: '',
        photo: '',
        address: '',
        city: '',
        postalCode: '',
        dateOfBirth: '',
        occupation: '',
        membershipDate: '',
        status: 'aktivan',
        inactiveReason: null,
        categories: []
      });
      setPhotoPreview('');
      setPhotoFile(null);
    }
  }, [user, open]);

  const { data: familyRelationships } = useQuery({
    queryKey: ['/api/family-relationships', user?.id],
    enabled: !!user?.id,
  });

  const predefinedCategories = ['Muškarci', 'Žene', 'Roditelji', 'Omladina'];

  const inactiveReasonOptions = [
    { value: 'Smrt', label: 'Smrt' },
    { value: 'Drugi džemat', label: 'Drugi džemat' },
    { value: 'Isključen', label: 'Isključen' },
    { value: 'Nepoznato', label: 'Nepoznato' }
  ];

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | { value: unknown }>) => {
    const value = event.target.value;
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      // If status changes and it's not "pasivan", reset inactiveReason
      if (field === 'status' && value !== 'pasivan') {
        updated.inactiveReason = null;
      }
      
      return updated;
    });
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('photo', file);
      const response = await fetch('/api/upload/photo', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Photo upload failed');
      const result = await response.json();
      return result.photoUrl;
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    let finalFormData: any = { ...formData };
    
    // Upload photo if a new one was selected
    if (photoFile) {
      try {
        const photoUrl = await uploadPhotoMutation.mutateAsync(photoFile);
        finalFormData.photo = photoUrl;
      } catch (error) {
        console.error('Photo upload failed:', error);
      }
    }
    
    // Convert membershipDate string to Date if provided, otherwise remove it
    if (finalFormData.membershipDate && finalFormData.membershipDate !== '') {
      finalFormData.membershipDate = new Date(finalFormData.membershipDate);
    } else {
      delete finalFormData.membershipDate;
    }
    
    // Clean up empty strings to null for optional fields
    if (!finalFormData.email || finalFormData.email === '') {
      finalFormData.email = null;
    }
    if (!finalFormData.phone || finalFormData.phone === '') {
      finalFormData.phone = null;
    }
    
    // Ensure inactiveReason is null if status is not "pasivan"
    if (finalFormData.status !== 'pasivan') {
      finalFormData.inactiveReason = null;
    }
    
    // Ensure categories is an empty array if not set
    if (!finalFormData.categories || finalFormData.categories.length === 0) {
      finalFormData.categories = [];
    }
    
    onSave(finalFormData);
    onClose();
  };

  const statusOptions = [
    { value: 'aktivan', label: 'Aktivan' },
    { value: 'pasivan', label: 'Pasivan' },
    { value: 'član porodice', label: 'Član porodice' }
  ];

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
            {/* Photo Upload Section */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar
                  src={photoPreview}
                  sx={{ width: 80, height: 80 }}
                  data-testid="avatar-preview"
                >
                  <Person sx={{ fontSize: 40 }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Fotografija korisnika
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<PhotoCamera />}
                    size="small"
                    data-testid="button-upload-photo"
                  >
                    {photoPreview ? 'Promijeni sliku' : 'Dodaj sliku'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handlePhotoChange}
                      data-testid="input-photo"
                    />
                  </Button>
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />
            </Grid>
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
                data-testid="input-email"
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Telefon"
                type="tel"
                value={formData.phone}
                onChange={handleChange('phone')}
                placeholder="+381 60 123 4567"
                data-testid="input-phone"
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
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Član od"
                type="date"
                value={formData.membershipDate}
                onChange={handleChange('membershipDate')}
                InputLabelProps={{ shrink: true }}
                helperText={!user ? "Ostavite prazno za današnji datum" : ""}
                data-testid="input-membershipDate"
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Status članstva</InputLabel>
                <Select
                  value={formData.status}
                  label="Status članstva"
                  onChange={(e) => handleChange('status')(e as any)}
                  data-testid="select-status"
                >
                  {statusOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Inactive Reason - Only shown when status is "pasivan" */}
            {formData.status === 'pasivan' && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Razlog pasivnosti</InputLabel>
                  <Select
                    value={formData.inactiveReason || ''}
                    label="Razlog pasivnosti"
                    onChange={(e) => setFormData(prev => ({ ...prev, inactiveReason: e.target.value as string }))}
                    data-testid="select-inactive-reason"
                  >
                    {inactiveReasonOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            {/* Categories Multi-Select */}
            <Grid size={{ xs: 12 }}>
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
                    label="Kategorije"
                    placeholder="Odaberite ili unesite kategoriju"
                    data-testid="input-categories"
                  />
                )}
                data-testid="autocomplete-categories"
              />
            </Grid>
            
            {/* Family Members Section */}
            {user && (
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Članovi porodice</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => setShowFamilyDialog(true)}
                    size="small"
                    data-testid="button-add-family-member"
                  >
                    Dodaj člana porodice
                  </Button>
                </Box>
                
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {familyRelationships && (familyRelationships as any[]).length > 0 ? (
                    (familyRelationships as any[]).map((rel: any) => (
                      <Card key={rel.id} sx={{ mb: 1 }}>
                        <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar src={rel.relatedUser?.photo} sx={{ width: 32, height: 32 }}>
                                <Person sx={{ fontSize: 16 }} />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {rel.relatedUser?.firstName} {rel.relatedUser?.lastName}
                                </Typography>
                                <Chip size="small" label={rel.relationship} variant="outlined" />
                              </Box>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => {
                                // Handle delete family relationship
                                apiRequest('DELETE', '/api/family-relationships/' + rel.id)
                                  .then(() => {
                                    queryClient.invalidateQueries({ queryKey: ['/api/family-relationships', user.id] });
                                  });
                              }}
                              data-testid={`button-delete-family-${rel.id}`}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      Nema dodanih članova porodice
                    </Typography>
                  )}
                </Box>
              </Grid>
            )}
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
      
      {/* Family Selection Dialog */}
      {user && (
        <FamilySelectionDialog
          open={showFamilyDialog}
          onClose={() => setShowFamilyDialog(false)}
          userId={user.id}
        />
      )}
    </Dialog>
  );
}
