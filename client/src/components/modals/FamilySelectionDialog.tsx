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
  Card,
  CardContent,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Divider,
  Alert
} from '@mui/material';
import {
  Close,
  Person,
  Search,
  PersonAdd
} from '@mui/icons-material';
import { User } from '@shared/schema';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface FamilySelectionDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export default function FamilySelectionDialog({ open, onClose, userId }: FamilySelectionDialogProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [relationship, setRelationship] = useState('');
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    relationship: ''
  });

  const queryClient = useQueryClient();

  const { data: allUsers } = useQuery({
    queryKey: ['/api/users'],
    enabled: open,
  });

  const { data: familyRelationships } = useQuery({
    queryKey: ['/api/family-relationships', userId],
    enabled: open && !!userId,
  });

  const createRelationshipMutation = useMutation({
    mutationFn: async (data: { userId: string; relatedUserId: string; relationship: string }) => {
      return apiRequest('POST', '/api/family-relationships', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/family-relationships', userId] });
      handleClose();
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest('POST', '/api/users', userData);
      return response.json();
    },
    onSuccess: async (newUser) => {
      // Create family relationship with the new user
      await createRelationshipMutation.mutateAsync({
        userId: userId,
        relatedUserId: newUser.id,
        relationship: newUserData.relationship
      });
    },
  });

  const relationshipOptions = [
    { value: 'supružnik', label: 'Supružnik/a' },
    { value: 'dijete', label: 'Dijete' },
    { value: 'roditelj', label: 'Roditelj' },
    { value: 'brat', label: 'Brat' },
    { value: 'sestra', label: 'Sestra' },
    { value: 'ostalo', label: 'Ostalo' }
  ];

  const filteredUsers = ((allUsers as User[]) || []).filter((user: User) => {
    if (user.id === userId) return false; // Don't include self
    
    // Don't include users already in family relationships
    const alreadyRelated = ((familyRelationships as any[]) || []).some((rel: any) => 
      rel.relatedUser?.id === user.id
    );
    if (alreadyRelated) return false;

    // Filter by search term
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const email = user.email.toLowerCase();
    const username = user.username.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return fullName.includes(search) || email.includes(search) || username.includes(search);
  }) || [];

  const handleClose = () => {
    setActiveTab(0);
    setSearchTerm('');
    setSelectedUser(null);
    setRelationship('');
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

  const handleAddExistingUser = () => {
    if (selectedUser && relationship) {
      createRelationshipMutation.mutate({
        userId: userId,
        relatedUserId: selectedUser.id,
        relationship: relationship
      });
    }
  };

  const handleAddNewUser = () => {
    const { relationship: rel, ...userData } = newUserData;
    if (userData.firstName && userData.lastName && userData.email && rel) {
      createUserMutation.mutate({
        ...userData,
        status: 'član porodice'
      });
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
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab label="Odaberi postojećeg korisnika" data-testid="tab-existing-user" />
          <Tab label="Dodaj novog korisnika" data-testid="tab-new-user" />
        </Tabs>

        {activeTab === 0 && (
          <Box>
            <TextField
              fullWidth
              label="Pretražite korisnike"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1 }} />
              }}
              sx={{ mb: 2 }}
              data-testid="input-search-users"
            />

            <Box sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
              {filteredUsers.length > 0 ? (
                <List>
                  {filteredUsers.map((user: User) => (
                    <ListItem key={user.id} disablePadding>
                      <ListItemButton
                        selected={selectedUser?.id === user.id}
                        onClick={() => setSelectedUser(user)}
                        data-testid={`list-item-user-${user.id}`}
                      >
                        <ListItemAvatar>
                          <Avatar src={user.photo || undefined}>
                            <Person />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${user.firstName} ${user.lastName}`}
                          secondary={`${user.email} • ${user.username}`}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  {searchTerm ? 'Nema pronađenih korisnika' : 'Nema dostupnih korisnika'}
                </Typography>
              )}
            </Box>

            {selectedUser && (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Odabrani korisnik: <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>
                </Alert>
                
                <FormControl fullWidth>
                  <InputLabel>Tip odnosa</InputLabel>
                  <Select
                    value={relationship}
                    label="Tip odnosa"
                    onChange={(e) => setRelationship(e.target.value)}
                    data-testid="select-relationship"
                  >
                    {relationshipOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Dodajte novog korisnika koji će automatski biti označen kao član porodice.
            </Typography>
            
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
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
                  label="Korisničko ime"
                  value={newUserData.username}
                  onChange={handleNewUserChange('username')}
                  required
                  data-testid="input-new-username"
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={newUserData.email}
                  onChange={handleNewUserChange('email')}
                  required
                  data-testid="input-new-email"
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Šifra"
                  type="password"
                  value={newUserData.password}
                  onChange={handleNewUserChange('password')}
                  required
                  data-testid="input-new-password"
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
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
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={handleClose} 
          variant="outlined"
          data-testid="button-cancel"
        >
          Odustani
        </Button>
        
        {activeTab === 0 ? (
          <Button 
            onClick={handleAddExistingUser}
            variant="contained"
            disabled={!selectedUser || !relationship || createRelationshipMutation.isPending}
            data-testid="button-add-existing"
          >
            {createRelationshipMutation.isPending ? 'Dodaje se...' : 'Dodaj člana'}
          </Button>
        ) : (
          <Button 
            onClick={handleAddNewUser}
            variant="contained"
            disabled={
              !newUserData.firstName || 
              !newUserData.lastName || 
              !newUserData.email || 
              !newUserData.relationship ||
              createUserMutation.isPending
            }
            data-testid="button-add-new"
          >
            {createUserMutation.isPending ? 'Kreira se...' : 'Kreiraj i dodaj'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}