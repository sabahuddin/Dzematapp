import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
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
  IconButton,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Autocomplete,
  Chip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  AttachMoney
} from '@mui/icons-material';
import { FinancialContribution, User, Project, insertFinancialContributionSchema } from '@shared/schema';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { apiRequest, queryClient } from '../lib/queryClient';

export default function FinancesPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation(['finances', 'common']);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContribution, setSelectedContribution] = useState<FinancialContribution | null>(null);

  // Fetch contributions
  const contributionsQuery = useQuery({
    queryKey: currentUser?.isAdmin 
      ? ['/api/financial-contributions'] 
      : ['/api/financial-contributions/user', currentUser?.id],
    enabled: !!currentUser,
  });

  // Fetch users (for admin)
  const usersQuery = useQuery({
    queryKey: ['/api/users'],
    enabled: currentUser?.isAdmin || false,
  });

  // Fetch projects (for admin)
  const projectsQuery = useQuery({
    queryKey: ['/api/projects'],
    enabled: currentUser?.isAdmin || false,
  });

  // Extended schema for client-side form
  const formSchema = insertFinancialContributionSchema.extend({
    userId: currentUser?.isAdmin 
      ? z.string().min(1, t('finances:validation.userRequired'))
      : z.string().optional(),
    paymentDate: z.string().min(1, t('finances:validation.dateRequired')),
    projectId: z.string().transform(val => val || null).nullable().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: currentUser?.id || '',
      amount: '0',
      paymentDate: new Date().toISOString().split('T')[0],
      purpose: t('finances:purposes.membership'),
      paymentMethod: t('finances:paymentMethods.cash'),
      notes: '',
      createdById: currentUser?.id || ''
    }
  });

  // Create/Update contribution mutation
  const saveContributionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      // Ensure userId is set for non-admins
      const payload = currentUser?.isAdmin ? data : { ...data, userId: currentUser?.id || '' };
      
      if (selectedContribution) {
        return await apiRequest(`/api/financial-contributions/${selectedContribution.id}`, 'PATCH', payload);
      } else {
        return await apiRequest('/api/financial-contributions', 'POST', payload);
      }
    },
    onSuccess: () => {
      // Invalidate both admin and member query keys
      queryClient.invalidateQueries({ queryKey: ['/api/financial-contributions'] });
      if (currentUser?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/financial-contributions/user', currentUser.id] });
      }
      // Invalidate projects query as currentAmount may have changed
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: t('common:common.success'), description: selectedContribution ? t('finances:messages.updated') : t('finances:messages.created') });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: t('common:common.error'), description: t('finances:messages.errorSaving'), variant: 'destructive' });
    }
  });

  // Delete contribution mutation
  const deleteContributionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/financial-contributions/${id}`, 'DELETE');
    },
    onSuccess: () => {
      // Invalidate both query keys
      queryClient.invalidateQueries({ queryKey: ['/api/financial-contributions'] });
      if (currentUser?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/financial-contributions/user', currentUser.id] });
      }
      // Invalidate projects query as currentAmount may have changed
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: t('common:common.success'), description: t('finances:messages.deleted') });
    },
    onError: () => {
      toast({ title: t('common:common.error'), description: t('finances:messages.errorDeleting'), variant: 'destructive' });
    }
  });

  const handleOpenDialog = (contribution?: FinancialContribution) => {
    if (contribution) {
      setSelectedContribution(contribution);
      form.reset({
        userId: contribution.userId,
        amount: contribution.amount,
        paymentDate: contribution.paymentDate ? new Date(contribution.paymentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        purpose: contribution.purpose,
        paymentMethod: contribution.paymentMethod,
        notes: contribution.notes || '',
        projectId: contribution.projectId || undefined,
        createdById: contribution.createdById
      });
    } else {
      setSelectedContribution(null);
      form.reset({
        userId: currentUser?.id || '',
        amount: '0',
        paymentDate: new Date().toISOString().split('T')[0],
        purpose: t('finances:purposes.membership'),
        paymentMethod: t('finances:paymentMethods.cash'),
        notes: '',
        projectId: undefined,
        createdById: currentUser?.id || ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedContribution(null);
    form.reset();
  };

  const handleSubmit = form.handleSubmit((data) => {
    saveContributionMutation.mutate(data);
  });

  const handleDelete = (id: string) => {
    if (window.confirm(t('finances:messages.confirmDelete'))) {
      deleteContributionMutation.mutate(id);
    }
  };

  const filteredContributions = ((contributionsQuery.data as FinancialContribution[]) || []).filter((contribution: FinancialContribution) => {
    // Category filter
    if (categoryFilter && contribution.purpose !== categoryFilter) {
      return false;
    }
    
    // Search filter
    if (!searchTerm) return true;
    
    const user = (usersQuery.data as User[] || []).find(u => u.id === contribution.userId);
    const matchesSearch = 
      (user && `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contribution.notes ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      contribution.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getUserName = (userId: string) => {
    if (!usersQuery.data) return t('finances:unknown');
    const user = (usersQuery.data as User[]).find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : t('finances:unknown');
  };

  const getProjectName = (projectId: string | null) => {
    if (!projectId || !projectsQuery.data) return null;
    const project = (projectsQuery.data as Project[]).find(p => p.id === projectId);
    return project?.name || null;
  };

  if (contributionsQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (contributionsQuery.error) {
    return (
      <Alert severity="error">
        {t('finances:messages.errorLoading')}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {currentUser?.isAdmin ? t('finances:title') : t('finances:myPayments')}
        </Typography>
        {currentUser?.isAdmin && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            data-testid="button-add-contribution"
          >
            {t('finances:addPayment')}
          </Button>
        )}
      </Box>

      <Card>
        {currentUser?.isAdmin && (
          <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                variant="outlined"
                placeholder={t('finances:searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                data-testid="input-search"
              />
              <TextField
                select
                variant="outlined"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                sx={{ minWidth: 200 }}
                SelectProps={{ native: true }}
                data-testid="select-category-filter"
              >
                <option value="">{t('finances:allCategories')}</option>
                <option value={t('finances:purposes.membership')}>{t('finances:purposes.membership')}</option>
                <option value={t('finances:purposes.donation')}>{t('finances:purposes.donation')}</option>
                <option value={t('finances:purposes.waqf')}>{t('finances:purposes.waqf')}</option>
                <option value={t('finances:purposes.sergija')}>{t('finances:purposes.sergija')}</option>
                <option value={t('finances:purposes.other')}>{t('finances:purposes.other')}</option>
              </TextField>
            </Box>
          </Box>
        )}

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                {currentUser?.isAdmin && <TableCell sx={{ fontWeight: 600 }}>{t('finances:user')}</TableCell>}
                <TableCell sx={{ fontWeight: 600 }}>{t('finances:amount')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('finances:purpose')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('finances:project')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('finances:paymentDate')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('finances:notes')}</TableCell>
                {currentUser?.isAdmin && <TableCell sx={{ fontWeight: 600 }}>{t('common:common.actions')}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredContributions.map((contribution: FinancialContribution) => (
                <TableRow key={contribution.id}>
                  {currentUser?.isAdmin && (
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {getUserName(contribution.userId)}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell>
                    <Chip
                      icon={<AttachMoney />}
                      label={t('finances:amountInCHF', { amount: contribution.amount })}
                      color="success"
                      size="small"
                      data-testid={`amount-${contribution.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={contribution.purpose}
                      size="small"
                      variant="outlined"
                      data-testid={`purpose-${contribution.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    {getProjectName(contribution.projectId) ? (
                      <Chip
                        label={getProjectName(contribution.projectId)}
                        size="small"
                        color="primary"
                        variant="outlined"
                        data-testid={`project-${contribution.id}`}
                      />
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {contribution.paymentDate ? new Date(contribution.paymentDate).toLocaleDateString('hr-HR') : '-'}
                  </TableCell>
                  <TableCell>{contribution.notes || '-'}</TableCell>
                  {currentUser?.isAdmin && (
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(contribution)}
                          sx={{ color: '#1976d2' }}
                          data-testid={`button-edit-${contribution.id}`}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(contribution.id)}
                          sx={{ color: '#d32f2f' }}
                          data-testid={`button-delete-${contribution.id}`}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filteredContributions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={currentUser?.isAdmin ? 7 : 6} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      {t('finances:noPayments')}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {selectedContribution ? t('finances:editPayment') : t('finances:addNewPayment')}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {currentUser?.isAdmin && (
                <Grid size={{ xs: 12 }}>
                  <Autocomplete
                    options={(usersQuery.data as User[]) || []}
                    getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                    value={(usersQuery.data as User[] || []).find(u => u.id === form.watch('userId')) || null}
                    onChange={(event, newValue) => {
                      form.setValue('userId', newValue?.id || '');
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('finances:user')}
                        required
                        error={!!form.formState.errors.userId}
                        helperText={form.formState.errors.userId?.message}
                        data-testid="input-user"
                      />
                    )}
                    data-testid="autocomplete-user"
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('finances:amountLabel')}
                  type="number"
                  {...form.register('amount')}
                  error={!!form.formState.errors.amount}
                  helperText={form.formState.errors.amount?.message}
                  required
                  data-testid="input-amount"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('finances:paymentDateLabel')}
                  type="date"
                  {...form.register('paymentDate')}
                  error={!!form.formState.errors.paymentDate}
                  helperText={form.formState.errors.paymentDate?.message}
                  InputLabelProps={{ shrink: true }}
                  required
                  data-testid="input-date"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label={t('finances:purposeLabel')}
                  {...form.register('purpose')}
                  error={!!form.formState.errors.purpose}
                  helperText={form.formState.errors.purpose?.message}
                  SelectProps={{ native: true }}
                  data-testid="select-purpose"
                >
                  <option value={t('finances:purposes.membership')}>{t('finances:purposes.membership')}</option>
                  <option value={t('finances:purposes.donation')}>{t('finances:purposes.donation')}</option>
                  <option value={t('finances:purposes.waqf')}>{t('finances:purposes.waqf')}</option>
                  <option value={t('finances:purposes.sergija')}>{t('finances:purposes.sergija')}</option>
                  <option value={t('finances:purposes.other')}>{t('finances:purposes.other')}</option>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label={t('finances:paymentMethod')}
                  {...form.register('paymentMethod')}
                  error={!!form.formState.errors.paymentMethod}
                  helperText={form.formState.errors.paymentMethod?.message}
                  SelectProps={{ native: true }}
                  data-testid="select-payment-method"
                >
                  <option value={t('finances:paymentMethods.cash')}>{t('finances:paymentMethods.cash')}</option>
                  <option value={t('finances:paymentMethods.bank')}>{t('finances:paymentMethods.bank')}</option>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  select
                  fullWidth
                  label={t('finances:projectOptional')}
                  {...form.register('projectId')}
                  SelectProps={{ native: true }}
                  data-testid="select-project"
                >
                  <option value="">{t('finances:noProject')}</option>
                  {(projectsQuery.data as Project[] || [])
                    .filter(p => p.status === 'active')
                    .map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('finances:notes')}
                  multiline
                  rows={3}
                  {...form.register('notes')}
                  data-testid="input-notes"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} data-testid="button-cancel">
              {t('common:buttons.cancel')}
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={saveContributionMutation.isPending}
              data-testid="button-save"
            >
              {saveContributionMutation.isPending ? t('finances:saving') : t('common:buttons.save')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
