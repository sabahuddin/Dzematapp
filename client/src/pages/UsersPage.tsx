import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
  Avatar,
  Autocomplete,
  Grid,
  Divider
} from '@mui/material';
import {
  PersonAdd,
  Edit,
  Block,
  CheckCircle,
  Person,
  Groups,
  Upload,
  Visibility,
  Download
} from '@mui/icons-material';
import { User } from '@shared/schema';
import UserModal from '../components/modals/UserModal';
import BulkUploadModal from '../components/modals/BulkUploadModal';
import FamilyMembersDialog from '../components/modals/FamilyMembersDialog';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { apiRequest } from '../lib/queryClient';
import { useTranslation } from 'react-i18next';
import { exportToExcel } from '../utils/excelExport';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation(['users']);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkUploadModalOpen, setBulkUploadModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [familyMembersDialogOpen, setFamilyMembersDialogOpen] = useState(false);
  const [selectedUserForFamily, setSelectedUserForFamily] = useState<User | null>(null);

  const predefinedCategories = [
    t('users:categories.all'),
    t('users:categories.men'),
    t('users:categories.women'),
    t('users:categories.parents'),
    t('users:categories.youth')
  ];

  // Fetch users
  const usersQuery = useQuery({
    queryKey: ['/api/users'],
    retry: 1,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest('/api/users', 'POST', userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ title: t('users:common.success'), description: t('users:messages.successCreate') });
    },
    onError: () => {
      toast({ title: t('users:common.error'), description: t('users:messages.errorCreate'), variant: 'destructive' });
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, ...userData }: any) => {
      const response = await apiRequest(`/api/users/${id}`, 'PUT', userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ title: t('users:common.success'), description: t('users:messages.successUpdate') });
    },
    onError: () => {
      toast({ title: t('users:common.error'), description: t('users:messages.errorUpdate'), variant: 'destructive' });
    }
  });

  const handleCreateUser = () => {
    setSelectedUser(null);
    setModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aktivan': return t('users:membershipStatuses.aktivan');
      case 'pasivan': return t('users:membershipStatuses.pasivan');
      case 'član porodice': return 'Član porodice';
      default: return status;
    }
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'info' => {
    switch (status) {
      case 'aktivan': return 'success';
      case 'pasivan': return 'error';
      case 'član porodice': return 'info';
      default: return 'warning';
    }
  };

  const getRoleLabel = (role: string): string => {
    const roleLabels: Record<string, string> = {
      'admin': t('users:roles.admin'),
      'imam': 'Imam',
      'clan_io': t('users:roles.clan_io'),
      'clan': t('users:roles.clan'),
      'clan_porodice': t('users:roles.clan_porodice'),
      'moderator': 'Moderator',
      'clan_radne_grupe': 'Član sekcije'
    };
    return roleLabels[role] || role;
  };

  const getRoleColor = (role: string): 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' => {
    switch (role) {
      case 'admin': return 'error';
      case 'imam': return 'error';
      case 'clan_io': return 'primary';
      case 'clan': return 'success';
      case 'clan_porodice': return 'info';
      case 'moderator': return 'warning';
      case 'clan_radne_grupe': return 'success';
      default: return 'default';
    }
  };

  const handleSaveUser = (userData: any) => {
    if (selectedUser) {
      updateUserMutation.mutate({ id: selectedUser.id, ...userData });
    } else {
      createUserMutation.mutate(userData);
    }
  };

  const handleExportUsersToExcel = () => {
    if (!filteredUsers || filteredUsers.length === 0) {
      toast({
        title: 'Greška',
        description: 'Nema korisnika za export',
        variant: 'destructive'
      });
      return;
    }

    const userData = filteredUsers.map((user: User) => [
      `${user.firstName} ${user.lastName}`,
      user.username || '-',
      user.email || '-',
      user.phone || '-',
      user.membershipDate ? new Date(user.membershipDate).toLocaleDateString('hr-HR') : '-',
      user.status || '-',
      user.categories && user.categories.length > 0 ? user.categories.join(', ') : '-',
      user.skills && user.skills.length > 0 ? user.skills.join(', ') : '-',
      user.roles && user.roles.length > 0 ? user.roles.map(r => getRoleLabel(r)).join(', ') : '-'
    ]);

    exportToExcel({
      title: 'Spisak korisnika',
      filename: 'Korisnici',
      sheetName: 'Korisnici',
      headers: [
        'Ime i prezime',
        'Username',
        'Email',
        'Telefon',
        'Član od',
        'Status članstva',
        'Kategorije',
        'Vještine',
        'Uloge'
      ],
      data: userData
    });

    toast({
      title: 'Uspjeh',
      description: 'Excel fajl je preuzet'
    });
  };

  // Collect all unique skills from all users for filter options
  const allSkills = Array.from(
    new Set(
      ((usersQuery.data as User[]) || [])
        .flatMap(user => user.skills || [])
    )
  ).sort();

  const filteredUsers = ((usersQuery.data as User[]) || []).filter((user: User) => {
    // For non-admin users, show only their own profile
    if (!currentUser?.isAdmin) {
      return user.id === currentUser?.id;
    }
    
    // Text search filter (admin only)
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.username ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter (admin only)
    const matchesCategory = selectedCategories.length === 0 || 
      selectedCategories.includes('Svi') ||
      (user.categories && selectedCategories.some(cat => user.categories?.includes(cat)));
    
    // Skills filter (admin only)
    const matchesSkills = selectedSkills.length === 0 ||
      (user.skills && selectedSkills.every(skill => user.skills?.includes(skill)));
    
    return matchesSearch && matchesCategory && matchesSkills;
  });

  if (usersQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (usersQuery.error) {
    return (
      <Alert severity="error">
        {t('users:messages.error')}
      </Alert>
    );
  }

  // Member Profile View
  if (!currentUser?.isAdmin && filteredUsers.length > 0) {
    const myProfile = filteredUsers[0];
    
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {t('users:viewUser')}
          </Typography>
        </Box>

        <Card>
          {/* Profile Header with Photo and Edit Button */}
          <Box sx={{ p: 4, borderBottom: '1px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
              <Avatar 
                src={myProfile.photo || undefined} 
                sx={{ width: 120, height: 120 }}
                data-testid="profile-avatar"
              >
                <Person sx={{ fontSize: 60 }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                  {myProfile.firstName} {myProfile.lastName}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {myProfile.email || t('users:email')}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Edit />}
                  onClick={() => handleEditUser(myProfile)}
                  data-testid="button-edit-profile"
                >
                  {t('users:actions.edit')}
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Profile Details */}
          <Box sx={{ p: 4 }}>
            <Grid container spacing={2}>
              {/* Personal Information */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  {t('users:firstName')} {t('users:lastName')}
                </Typography>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('users:firstName')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                    {myProfile.firstName}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('users:lastName')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                    {myProfile.lastName}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('users:username')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                    {myProfile.username}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('users:email')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                    {myProfile.email || '-'}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('users:phone')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                    {myProfile.phone || '-'}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('users:address')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                    {myProfile.address || '-'}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('users:postalCode')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                    {myProfile.postalCode || '-'}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('users:city')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                    {myProfile.city || '-'}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('users:occupation')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                    {myProfile.occupation || '-'}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('users:skills')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                    {myProfile.skills && myProfile.skills.length > 0 ? (
                      myProfile.skills.map((skill, index) => (
                        <Chip
                          key={index}
                          label={skill}
                          size="small"
                          color="primary"
                          variant="outlined"
                          data-testid={`profile-skill-${index}`}
                        />
                      ))
                    ) : (
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>-</Typography>
                    )}
                  </Box>
                </Box>
              </Grid>

              {/* Divider between sections */}
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 2 }} />
              </Grid>

              {/* Membership Information */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  {t('users:membershipStatus')}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('users:memberSince')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                    {myProfile.membershipDate ? new Date(myProfile.membershipDate).toLocaleDateString('hr-HR') : '-'}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('users:membershipStatus')}
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={getStatusLabel(myProfile.status)}
                      color={getStatusColor(myProfile.status)}
                      size="small"
                    />
                  </Box>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('users:roles.label')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                    {myProfile.roles && myProfile.roles.length > 0 ? (
                      myProfile.roles.map((role, index) => (
                        <Chip
                          key={index}
                          label={getRoleLabel(role)}
                          size="small"
                          color={getRoleColor(role)}
                        />
                      ))
                    ) : (
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>-</Typography>
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Card>

        {/* Modals */}
        {modalOpen && (
          <UserModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            user={selectedUser}
            onSave={handleSaveUser}
            isMemberView={true}
          />
        )}
      </Box>
    );
  }

  // Admin View
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {t('users:title')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportUsersToExcel}
            data-testid="button-export-excel"
          >
            Exportuj u Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => setBulkUploadModalOpen(true)}
            data-testid="button-bulk-upload"
          >
            {t('users:bulkUpload')}
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={handleCreateUser}
            data-testid="button-add-user"
          >
            {t('users:addUser')}
          </Button>
        </Box>
      </Box>

      <Card>
        <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            variant="outlined"
            placeholder={t('users:search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 250, flex: 1, maxWidth: 400 }}
            data-testid="input-search"
          />
          <Autocomplete
            multiple
            options={predefinedCategories}
            value={selectedCategories}
            onChange={(event, newValue) => setSelectedCategories(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder={t('users:filterByCategory')}
                data-testid="input-category-filter"
              />
            )}
            sx={{ minWidth: 250, flex: 1, maxWidth: 400 }}
            data-testid="autocomplete-category-filter"
          />
          <Autocomplete
            multiple
            options={allSkills}
            value={selectedSkills}
            onChange={(event, newValue) => setSelectedSkills(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder={t('users:filterBySkills')}
                data-testid="input-skills-filter"
              />
            )}
            sx={{ minWidth: 250, flex: 1, maxWidth: 400 }}
            data-testid="autocomplete-skills-filter"
          />
        </Box>

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 600 }}>{t('users:firstName')} {t('users:lastName')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('users:username')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('users:email')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('users:phone')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('users:memberSince')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('users:membershipStatus')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Kategorije</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('users:skills')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('users:roles.label')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('users:family.title')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('users:table.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar 
                        src={user.photo || undefined} 
                        sx={{ width: 40, height: 40 }}
                        data-testid={`avatar-${user.id}`}
                      >
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {user.firstName} {user.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.isAdmin ? t('users:roles.admin') : t('users:viewUser')}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email || '-'}</TableCell>
                  <TableCell>
                    {user.phone ? (
                      <a 
                        href={`tel:${user.phone}`} 
                        style={{ textDecoration: 'none', color: '#1976d2' }}
                        data-testid={`phone-link-${user.id}`}
                      >
                        {user.phone}
                      </a>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {user.membershipDate ? new Date(user.membershipDate).toLocaleDateString('hr-HR') : '-'}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Chip
                        label={getStatusLabel(user.status)}
                        color={getStatusColor(user.status)}
                        size="small"
                        data-testid={`status-${user.id}`}
                      />
                      {user.status === 'pasivan' && user.inactiveReason && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }} data-testid={`inactive-reason-${user.id}`}>
                          {user.inactiveReason}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {user.categories && user.categories.length > 0 ? (
                        user.categories.map((category, index) => (
                          <Chip
                            key={index}
                            label={category}
                            size="small"
                            variant="outlined"
                            data-testid={`category-${user.id}-${index}`}
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {user.skills && user.skills.length > 0 ? (
                        user.skills.map((skill, index) => (
                          <Chip
                            key={index}
                            label={skill}
                            size="small"
                            color="primary"
                            variant="outlined"
                            data-testid={`skill-${user.id}-${index}`}
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((role, index) => (
                          <Chip
                            key={index}
                            label={getRoleLabel(role)}
                            size="small"
                            color={getRoleColor(role)}
                            data-testid={`role-${user.id}-${index}`}
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      size="small"
                      onClick={() => {
                        setSelectedUserForFamily(user);
                        setFamilyMembersDialogOpen(true);
                      }}
                      data-testid={`family-${user.id}`}
                      title={t('users:actions.viewFamily')}
                    >
                      <Groups />
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditUser(user)}
                        sx={{ color: '#1976d2' }}
                        data-testid={`button-view-user-${user.id}`}
                        title={t('users:viewUser')}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditUser(user)}
                        sx={{ color: '#ed6c02' }}
                        data-testid={`button-edit-user-${user.id}`}
                        title={t('users:actions.edit')}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      {searchTerm || selectedCategories.length > 0 ? t('users:searchUsers') : t('users:noUsers')}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>


      {/* User Modal */}
      <UserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveUser}
        user={selectedUser}
      />

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        open={bulkUploadModalOpen}
        onClose={() => setBulkUploadModalOpen(false)}
      />

      {/* Family Members Dialog */}
      {selectedUserForFamily && (
        <FamilyMembersDialog
          open={familyMembersDialogOpen}
          onClose={() => setFamilyMembersDialogOpen(false)}
          userId={selectedUserForFamily.id}
          userName={`${selectedUserForFamily.firstName} ${selectedUserForFamily.lastName}`}
        />
      )}
    </Box>
  );
}
