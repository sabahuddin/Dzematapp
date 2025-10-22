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
  Autocomplete,
  SelectChangeEvent,
  FormControlLabel,
  Switch
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
import { useAuth } from '@/hooks/useAuth';

interface UserModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (userData: any) => void;
  user?: User | null;
  isMemberView?: boolean;
}

export default function UserModal({ open, onClose, onSave, user, isMemberView = false }: UserModalProps) {
  const { user: currentUser } = useAuth();
  
  // Check if current user is editing their own profile
  const isEditingSelf = user && currentUser && user.id === currentUser.id;
  
  // Check if current user is a regular member (Član) editing their profile
  const isMemberEditingSelf = Boolean(
    isMemberView ||
    (isEditingSelf && 
    currentUser?.roles?.includes('clan') && 
    !currentUser?.isAdmin)
  );
  
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
    categories: [] as string[],
    roles: [] as string[],
    skills: [] as string[],
    isAdmin: false
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [showFamilyDialog, setShowFamilyDialog] = useState(false);
  
  const queryClient = useQueryClient();

  // Convert date from "19.10.1999." format to "1999-10-19" (ISO format for input[type=date])
  const convertDateToISO = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    
    // If already in ISO format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Parse "19.10.1999." or "19. 10. 1999." format (with/without spaces, optional trailing dot)
    const match = dateStr.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})\.?/);
    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return '';
  };

  // Convert date from "1999-10-19" (ISO) to "19.10.1999." format
  const convertDateFromISO = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    
    // If already in formatted format, return as is
    if (/\d{1,2}\.\s*\d{1,2}\.\s*\d{4}/.test(dateStr)) {
      return dateStr;
    }
    
    // Parse ISO format "1999-10-19"
    const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      return `${parseInt(day)}.${parseInt(month)}.${year}.`;
    }
    
    return dateStr;
  };

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
        dateOfBirth: convertDateToISO(user.dateOfBirth),
        occupation: user.occupation || '',
        membershipDate: user.membershipDate ? new Date(user.membershipDate).toISOString().split('T')[0] : '',
        status: user.status || 'aktivan',
        inactiveReason: user.inactiveReason || null,
        categories: user.categories || [],
        roles: user.roles || [],
        skills: user.skills || [],
        isAdmin: user.isAdmin || false
      });
      setPhotoPreview(user.photo || '');
    } else {
      // Reset form for new user with default dates for Safari compatibility
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
        dateOfBirth: '1900-01-01',
        occupation: '',
        membershipDate: '1900-01-01',
        status: 'aktivan',
        inactiveReason: null,
        categories: [],
        roles: ['clan'],
        skills: [],
        isAdmin: false
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

  const availableRoles = [
    { value: 'admin', label: 'Admin' },
    { value: 'imam', label: 'Imam' },
    { value: 'clan_io', label: 'Član IO' },
    { value: 'clan', label: 'Član' },
    { value: 'clan_porodice', label: 'Član porodice' }
  ];

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
    if (!finalFormData.username || finalFormData.username === '') {
      finalFormData.username = null;
    }
    if (!finalFormData.email || finalFormData.email === '') {
      finalFormData.email = null;
    }
    if (!finalFormData.password || finalFormData.password === '') {
      finalFormData.password = null;
    }
    if (!finalFormData.phone || finalFormData.phone === '') {
      finalFormData.phone = null;
    }
    // Convert dateOfBirth from ISO format to "DD. MM. YYYY." format
    if (!finalFormData.dateOfBirth || finalFormData.dateOfBirth === '') {
      finalFormData.dateOfBirth = null;
    } else {
      finalFormData.dateOfBirth = convertDateFromISO(finalFormData.dateOfBirth);
    }
    if (!finalFormData.address || finalFormData.address === '') {
      finalFormData.address = null;
    }
    if (!finalFormData.city || finalFormData.city === '') {
      finalFormData.city = null;
    }
    if (!finalFormData.postalCode || finalFormData.postalCode === '') {
      finalFormData.postalCode = null;
    }
    if (!finalFormData.occupation || finalFormData.occupation === '') {
      finalFormData.occupation = null;
    }
    if (!finalFormData.photo || finalFormData.photo === '') {
      finalFormData.photo = null;
    }
    
    // Ensure inactiveReason is null if status is not "pasivan"
    if (finalFormData.status !== 'pasivan') {
      finalFormData.inactiveReason = null;
    }
    
    // Ensure categories is an empty array if not set
    if (!finalFormData.categories || finalFormData.categories.length === 0) {
      finalFormData.categories = [];
    }
    
    // Ensure roles is an empty array if not set
    if (!finalFormData.roles || finalFormData.roles.length === 0) {
      finalFormData.roles = [];
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

            {/* Row 1: Ime i Prezime (50-50) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                variant="outlined"
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
                variant="outlined"
                label="Prezime"
                value={formData.lastName}
                onChange={handleChange('lastName')}
                required
                data-testid="input-lastName"
              />
            </Grid>

            {/* Row 2: Datum rođenja i Zanimanje (50-50) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                variant="outlined"
                label="Datum rođenja"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange('dateOfBirth')}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 1 }}
                data-testid="input-dateOfBirth"
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                variant="outlined"
                label="Zanimanje"
                value={formData.occupation}
                onChange={handleChange('occupation')}
                data-testid="input-occupation"
              />
            </Grid>

            {/* Row 3: Korisničko ime i Šifra (50-50) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                variant="outlined"
                label="Korisničko ime"
                value={formData.username}
                onChange={handleChange('username')}
                required={!formData.roles.includes('clan_porodice')}
                helperText={formData.roles.includes('clan_porodice') ? "Opciono za člana porodice" : ""}
                data-testid="input-username"
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                variant="outlined"
                label="Šifra"
                type="password"
                value={formData.password}
                onChange={handleChange('password')}
                required={!user && !formData.roles.includes('clan_porodice')}
                helperText={user ? "Ostavite prazno da zadržite postojeću šifru" : formData.roles.includes('clan_porodice') ? "Opciono za člana porodice" : ""}
                data-testid="input-password"
              />
            </Grid>

            {/* Row 4: Telefon i Email (50-50) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                variant="outlined"
                label="Telefon"
                type="tel"
                value={formData.phone}
                onChange={handleChange('phone')}
                placeholder="+41 7x xxx xx xx"
                data-testid="input-phone"
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                variant="outlined"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                helperText={formData.roles.includes('clan_porodice') ? "Opciono za člana porodice" : ""}
                data-testid="input-email"
              />
            </Grid>

            {/* Row 5: Adresa, Grad, Poštanski broj (40-40-20) */}
            <Grid size={{ xs: 12, sm: 4.8 }}>
              <TextField
                fullWidth
                variant="outlined"
                label="Adresa"
                value={formData.address}
                onChange={handleChange('address')}
                data-testid="input-address"
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 4.8 }}>
              <TextField
                fullWidth
                variant="outlined"
                label="Grad"
                value={formData.city}
                onChange={handleChange('city')}
                data-testid="input-city"
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 2.4 }}>
              <TextField
                fullWidth
                variant="outlined"
                label="Poštanski broj"
                value={formData.postalCode}
                onChange={handleChange('postalCode')}
                data-testid="input-postalCode"
              />
            </Grid>

            {/* Row 6: Član od i Status članstva (50-50) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                variant="outlined"
                label="Član od"
                type="date"
                value={formData.membershipDate}
                onChange={handleChange('membershipDate')}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 1 }}
                helperText={!user ? "Ostavite prazno za današnji datum" : ""}
                disabled={isMemberEditingSelf}
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
                  disabled={isMemberEditingSelf}
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
            
            {/* Razlog pasivnosti - Only shown when status is "pasivan" */}
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
            
            {/* Row 7a: Skills (Full width or 50%) */}
            <Grid size={{ xs: 12, sm: isMemberEditingSelf ? 12 : 6 }}>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={formData.skills}
                onChange={(event, newValue) => {
                  setFormData(prev => ({ ...prev, skills: newValue }));
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      color="primary"
                      variant="outlined"
                      {...getTagProps({ index })}
                      data-testid={`chip-skill-${index}`}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Vještine"
                    placeholder="Unesite vještine (npr. Programiranje, Dizajn...)"
                    helperText="Unesite vještine i pritisnite Enter"
                    InputLabelProps={{ shrink: true }}
                    data-testid="input-skills"
                  />
                )}
                data-testid="autocomplete-skills"
              />
            </Grid>

            {/* Row 7b: Kategorije (50%) - Hide for members editing themselves */}
            {!isMemberEditingSelf && (
              <Grid size={{ xs: 12, sm: 6 }}>
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
              </Grid>
            )}
            
            {/* Uloge - Admin can edit, Member can only view their own */}
            {(currentUser?.isAdmin || isMemberEditingSelf) && (
              <Grid size={{ xs: 12, sm: isMemberEditingSelf ? 12 : 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Uloge</InputLabel>
                  <Select
                    multiple
                    value={formData.roles}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData(prev => ({ 
                        ...prev, 
                        roles: typeof value === 'string' ? value.split(',') : value as string[]
                      }));
                    }}
                    label="Uloge"
                    disabled={isMemberEditingSelf}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => {
                          const role = availableRoles.find(r => r.value === value);
                          return (
                            <Chip 
                              key={value} 
                              label={role?.label || value} 
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          );
                        })}
                      </Box>
                    )}
                    data-testid="select-roles"
                  >
                    {availableRoles.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        {role.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            {/* Admin Toggle - Only for superadmin */}
            {currentUser?.isAdmin && !isMemberEditingSelf && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isAdmin}
                      onChange={(e) => setFormData(prev => ({ ...prev, isAdmin: e.target.checked }))}
                      color="primary"
                      data-testid="switch-isAdmin"
                    />
                  }
                  label="Superadmin pristup"
                  sx={{ mt: 1 }}
                />
                <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4 }}>
                  Superadmin može dodavati i uređivati sve korisnike
                </Typography>
              </Grid>
            )}
            
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
                                apiRequest('/api/family-relationships/' + rel.id, 'DELETE')
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
