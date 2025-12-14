import { useState, useMemo } from 'react';
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
  Tabs,
  Tab,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { Close, Search, Person, Link as LinkIcon, PersonAdd } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

interface FamilySelectionDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function FamilySelectionDialog({ open, onClose, userId }: FamilySelectionDialogProps) {
  const { t } = useTranslation('users');
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.isAdmin || currentUser?.isSuperAdmin || false;
  
  // For non-admins, always show create tab (index 0 in their view)
  // For admins, tab 0 = link existing, tab 1 = create new
  const [tabValue, setTabValue] = useState(isAdmin ? 0 : 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExistingUser, setSelectedExistingUser] = useState<any>(null);
  const [existingUserRelationship, setExistingUserRelationship] = useState('');
  
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    relationship: ''
  });

  const queryClient = useQueryClient();

  // Fetch all users for linking - ONLY for admins
  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['/api/users'],
    enabled: open && isAdmin && tabValue === 0,
  });

  // Fetch existing family relationships to exclude already linked users
  // Note: The queryKey includes the full URL path to properly fetch user-specific relationships
  const { data: existingRelationships = [] } = useQuery({
    queryKey: [`/api/family-relationships/${userId}`],
    enabled: open && !!userId,
  });

  // Filter users based on search and exclude current user and already linked users
  const filteredUsers = useMemo(() => {
    if (!allUsers || !Array.isArray(allUsers)) return [];
    
    const linkedUserIds = new Set(
      (existingRelationships as any[]).map((rel: any) => 
        rel.userId === userId ? rel.relatedUserId : rel.userId
      )
    );
    
    return allUsers.filter((user: any) => {
      // Exclude current user
      if (user.id === userId) return false;
      // Exclude already linked users
      if (linkedUserIds.has(user.id)) return false;
      // Filter by search query
      if (searchQuery) {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
        const email = (user.email || '').toLowerCase();
        const username = (user.username || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return fullName.includes(query) || email.includes(query) || username.includes(query);
      }
      return true;
    });
  }, [allUsers, userId, existingRelationships, searchQuery]);

  // Mutation to link existing user as family member
  const linkExistingMutation = useMutation({
    mutationFn: async ({ relatedUserId, relationship }: { relatedUserId: string; relationship: string }) => {
      console.log('[FamilyDialog] Linking existing user:', { userId, relatedUserId, relationship });
      
      const response = await apiRequest('/api/family-relationships', 'POST', {
        userId: userId,
        relatedUserId: relatedUserId,
        relationship: relationship
      });
      
      return response.json();
    },
    onSuccess: async (result) => {
      console.log('[FamilyDialog] Existing user linked:', result);
      
      // Invalidate all family-relationships queries (including the specific user query)
      await queryClient.invalidateQueries({ queryKey: ['/api/family-relationships'] });
      await queryClient.invalidateQueries({ queryKey: [`/api/family-relationships/${userId}`] });
      await queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      handleClose();
    },
    onError: (error) => {
      console.error('[FamilyDialog] Error linking user:', error);
      alert('Greška pri povezivanju člana: ' + (error instanceof Error ? error.message : String(error)));
    }
  });

  // Mutation to create new user and link as family member
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
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
      
      // Invalidate all family-relationships queries (including the specific user query)
      await queryClient.invalidateQueries({ queryKey: ['/api/family-relationships'] });
      await queryClient.invalidateQueries({ queryKey: [`/api/family-relationships/${userId}`] });
      await queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
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
    setSearchQuery('');
    setSelectedExistingUser(null);
    setExistingUserRelationship('');
    setTabValue(0);
    onClose();
  };

  const handleLinkExistingUser = () => {
    if (selectedExistingUser && existingUserRelationship) {
      linkExistingMutation.mutate({
        relatedUserId: selectedExistingUser.id,
        relationship: existingUserRelationship
      });
    }
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
        _relationship: rel
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
        sx: { borderRadius: 2, minHeight: 550 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {t('family.addMember')}
        <IconButton onClick={handleClose} data-testid="close-family-dialog">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {/* Only show tabs for admins - non-admins only see create new form */}
        {isAdmin && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
              <Tab 
                icon={<LinkIcon />} 
                iconPosition="start" 
                label={t('family.linkExistingTab')} 
                data-testid="tab-link-existing"
              />
              <Tab 
                icon={<PersonAdd />} 
                iconPosition="start" 
                label={t('family.createNewTab')} 
                data-testid="tab-create-new"
              />
            </Tabs>
          </Box>
        )}

        {/* Tab 0: Link Existing Member - ADMIN ONLY */}
        {isAdmin && <TabPanel value={tabValue} index={0}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('family.linkExistingDescription')}
          </Typography>
          
          <TextField
            fullWidth
            variant="outlined"
            placeholder={t('family.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            data-testid="input-search-users"
          />

          {loadingUsers ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ maxHeight: 250, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 1 }}>
              {filteredUsers.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    {searchQuery ? t('family.noSearchResults') : t('family.noAvailableForLinking')}
                  </Typography>
                </Box>
              ) : (
                <List dense>
                  {filteredUsers.map((user: any) => (
                    <ListItemButton
                      key={user.id}
                      selected={selectedExistingUser?.id === user.id}
                      onClick={() => setSelectedExistingUser(user)}
                      sx={{
                        '&.Mui-selected': {
                          backgroundColor: '#e8eaf6',
                        }
                      }}
                      data-testid={`user-option-${user.id}`}
                    >
                      <ListItemAvatar>
                        <Avatar src={user.photo || undefined}>
                          <Person />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${user.firstName} ${user.lastName}`}
                        secondary={user.email || user.username || t('family.noContact')}
                      />
                      {user.status && (
                        <Chip 
                          size="small" 
                          label={user.status} 
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </ListItemButton>
                  ))}
                </List>
              )}
            </Box>
          )}

          {selectedExistingUser && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('family.selected')}: {selectedExistingUser.firstName} {selectedExistingUser.lastName}
              </Typography>
              <FormControl fullWidth size="small" required>
                <InputLabel>{t('family.relationshipType')}</InputLabel>
                <Select
                  value={existingUserRelationship}
                  label={t('family.relationshipType')}
                  onChange={(e) => setExistingUserRelationship(e.target.value)}
                  data-testid="select-existing-relationship"
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
        </TabPanel>}

        {/* Create New Member Form - For admins wrapped in TabPanel, for members shown directly */}
        {isAdmin ? (
          <TabPanel value={tabValue} index={1}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('family.createNewDescription')}
            </Typography>
            
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label={t('firstName')}
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
                  label={t('lastName')}
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
                  label={t('username')}
                  value={newUserData.username}
                  onChange={handleNewUserChange('username')}
                  helperText={t('family.optional')}
                  data-testid="input-new-username"
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label={t('email')}
                  type="email"
                  value={newUserData.email}
                  onChange={handleNewUserChange('email')}
                  helperText={t('family.optional')}
                  data-testid="input-new-email"
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label={t('password')}
                  type="password"
                  value={newUserData.password}
                  onChange={handleNewUserChange('password')}
                  helperText={t('family.optional')}
                  data-testid="input-new-password"
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>{t('family.relationshipType')}</InputLabel>
                  <Select
                    value={newUserData.relationship}
                    label={t('family.relationshipType')}
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
          </TabPanel>
        ) : (
          /* Non-admin: Show create form directly without TabPanel */
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('family.createNewDescriptionMember')}
            </Typography>
            
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label={t('firstName')}
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
                  label={t('lastName')}
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
                  label={t('username')}
                  value={newUserData.username}
                  onChange={handleNewUserChange('username')}
                  helperText={t('family.optional')}
                  data-testid="input-new-username"
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label={t('email')}
                  type="email"
                  value={newUserData.email}
                  onChange={handleNewUserChange('email')}
                  helperText={t('family.optional')}
                  data-testid="input-new-email"
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label={t('password')}
                  type="password"
                  value={newUserData.password}
                  onChange={handleNewUserChange('password')}
                  helperText={t('family.optional')}
                  data-testid="input-new-password"
                />
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>{t('family.relationshipType')}</InputLabel>
                  <Select
                    value={newUserData.relationship}
                    label={t('family.relationshipType')}
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
          {t('family.cancel')}
        </Button>
        
        {/* For admins: show link button on tab 0, create button on tab 1 */}
        {/* For non-admins: only show create button */}
        {isAdmin && tabValue === 0 ? (
          <Button 
            onClick={handleLinkExistingUser}
            variant="contained"
            disabled={
              !selectedExistingUser || 
              !existingUserRelationship ||
              linkExistingMutation.isPending
            }
            startIcon={<LinkIcon />}
            data-testid="button-link-existing"
          >
            {linkExistingMutation.isPending ? t('family.linking') : t('family.linkMember')}
          </Button>
        ) : (
          <Button 
            onClick={handleAddNewUser}
            variant="contained"
            disabled={
              !newUserData.firstName || 
              !newUserData.lastName || 
              !newUserData.relationship ||
              createUserMutation.isPending
            }
            startIcon={<PersonAdd />}
            data-testid="button-add-new"
          >
            {createUserMutation.isPending ? t('family.creating') : t('family.createAndAdd')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
