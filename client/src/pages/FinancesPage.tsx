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
  AttachMoney,
  Download
} from '@mui/icons-material';
import { FinancialContribution, User, Project, ContributionPurpose, insertFinancialContributionSchema, insertProjectSchema, insertContributionPurposeSchema } from '@shared/schema';
import { useAuth } from '../hooks/useAuth';
import { useCurrency } from '../contexts/CurrencyContext';
import { useToast } from '../hooks/use-toast';
import { apiRequest, queryClient } from '../lib/queryClient';
import { exportToExcel } from '../utils/excelExport';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { UpgradeCTA } from '../components/UpgradeCTA';
import { useSortableTable } from '../hooks/useSortableTable';
import { SortableHeaderCell } from '../components/SortableHeaderCell';

export default function FinancesPage() {
  const { user: currentUser } = useAuth();
  const { formatPrice, currency } = useCurrency();
  const { toast } = useToast();
  const { t } = useTranslation(['finances', 'common']);
  const featureAccess = useFeatureAccess('finances');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContribution, setSelectedContribution] = useState<FinancialContribution | null>(null);
  const [purposeDialogOpen, setPurposeDialogOpen] = useState(false);
  const [newPurposeName, setNewPurposeName] = useState('');
  const [newPurposeDesc, setNewPurposeDesc] = useState('');
  const [editingPurpose, setEditingPurpose] = useState<ContributionPurpose | null>(null);
  const [editPurposeName, setEditPurposeName] = useState('');
  const [editPurposeDesc, setEditPurposeDesc] = useState('');

  if (featureAccess.upgradeRequired) {
    return <UpgradeCTA moduleId="finances" requiredPlan={featureAccess.requiredPlan || 'standard'} currentPlan={featureAccess.currentPlan || 'basic'} />;
  }

  // Fetch contributions
  const contributionsQuery = useQuery({
    queryKey: currentUser?.isAdmin 
      ? ['/api/financial-contributions'] 
      : ['/api/financial-contributions/user', currentUser?.id],
    enabled: !!currentUser,
  });

  // Fetch users (for admin) - SCOPED BY TENANT
  const usersQuery = useQuery({
    queryKey: ['/api/users', currentUser?.tenantId],
    enabled: currentUser?.isAdmin || false,
  });

  // Fetch projects (for admin)
  const projectsQuery = useQuery({
    queryKey: ['/api/projects'],
    enabled: currentUser?.isAdmin || false,
  });

  // Fetch contribution purposes (for admin)
  const purposesQuery = useQuery<ContributionPurpose[]>({
    queryKey: ['/api/contribution-purposes'],
    enabled: currentUser?.isAdmin || false,
  });

  // Extended schema for client-side form - omit tenantId as it comes from session
  const formSchema = insertFinancialContributionSchema.omit({ tenantId: true }).extend({
    userId: currentUser?.isAdmin 
      ? z.string().min(1, t('finances:validation.userRequired'))
      : z.string().optional(),
    paymentDate: z.string().min(1, t('finances:validation.dateRequired')),
    purpose: z.string().min(1, t('finances:validation.purposeRequired') || 'Odaberite svrhu'),
    projectId: z.string().transform(val => val || null).nullable().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: currentUser?.id || '',
      amount: '0',
      paymentDate: new Date().toISOString().split('T')[0],
      purpose: '',
      paymentMethod: t('finances:paymentMethods.cash'),
      notes: '',
      createdById: currentUser?.id || '',
      pointsValue: 0
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

  // Create new purpose mutation
  const createPurposeMutation = useMutation<ContributionPurpose, Error, void>({
    mutationFn: async () => {
      return await apiRequest('/api/contribution-purposes', 'POST', {
        name: newPurposeName,
        description: newPurposeDesc,
      }) as unknown as ContributionPurpose;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contribution-purposes'] });
      setNewPurposeName('');
      setNewPurposeDesc('');
      toast({ title: t('common:common.success'), description: t('finances:purposeMessages.created') });
    },
    onError: () => {
      toast({ title: t('common:common.error'), description: t('finances:purposeMessages.errorCreating'), variant: 'destructive' });
    }
  });

  // Delete purpose mutation
  const deletePurposeMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/contribution-purposes/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contribution-purposes'] });
      toast({ title: t('common:common.success'), description: t('finances:purposeMessages.deleted') });
    },
    onError: () => {
      toast({ title: t('common:common.error'), description: t('finances:purposeMessages.errorDeleting'), variant: 'destructive' });
    }
  });

  const handleDeletePurpose = (id: string) => {
    if (window.confirm(t('finances:purposeMessages.confirmDelete'))) {
      deletePurposeMutation.mutate(id);
    }
  };

  // Update purpose mutation
  const updatePurposeMutation = useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description: string }) => {
      return await apiRequest(`/api/contribution-purposes/${id}`, 'PUT', { name, description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contribution-purposes'] });
      toast({ title: t('common:common.success'), description: t('finances:purposeMessages.updated') });
      setEditingPurpose(null);
      setEditPurposeName('');
      setEditPurposeDesc('');
    },
    onError: () => {
      toast({ title: t('common:common.error'), description: t('finances:purposeMessages.errorUpdating'), variant: 'destructive' });
    }
  });

  const handleStartEditPurpose = (purpose: ContributionPurpose) => {
    setEditingPurpose(purpose);
    setEditPurposeName(purpose.name);
    setEditPurposeDesc(purpose.description || '');
  };

  const handleSaveEditPurpose = () => {
    if (editingPurpose && editPurposeName.trim()) {
      updatePurposeMutation.mutate({
        id: editingPurpose.id,
        name: editPurposeName.trim(),
        description: editPurposeDesc.trim()
      });
    }
  };

  const handleCancelEditPurpose = () => {
    setEditingPurpose(null);
    setEditPurposeName('');
    setEditPurposeDesc('');
  };


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
        createdById: contribution.createdById,
        pointsValue: contribution.pointsValue || 0
      });
    } else {
      setSelectedContribution(null);
      form.reset({
        userId: currentUser?.id || '',
        amount: '0',
        paymentDate: new Date().toISOString().split('T')[0],
        purpose: '',
        paymentMethod: t('finances:paymentMethods.cash'),
        notes: '',
        projectId: undefined,
        createdById: currentUser?.id || '',
        pointsValue: 0
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedContribution(null);
    form.reset();
  };

  const handleSubmit = form.handleSubmit(
    (data) => {
      console.log('[CONTRIBUTION FORM] Valid data:', data);
      saveContributionMutation.mutate(data);
    },
    (errors) => {
      console.error('[CONTRIBUTION FORM] Validation errors:', errors);
    }
  );

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

  const contributionsSort = useSortableTable({
    data: filteredContributions,
    defaultSortKey: 'paymentDate',
    defaultSortDirection: 'desc',
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

  const handleExportFinancesToExcel = () => {
    if (!filteredContributions || filteredContributions.length === 0) {
      toast({
        title: 'Greška',
        description: 'Nema podataka za export',
        variant: 'destructive'
      });
      return;
    }

    const financeData = filteredContributions.map((contribution: FinancialContribution) => [
      currentUser?.isAdmin ? getUserName(contribution.userId) : '-',
      formatPrice(contribution.amount),
      contribution.purpose,
      getProjectName(contribution.projectId) || '-',
      contribution.paymentDate ? new Date(contribution.paymentDate).toLocaleDateString('hr-HR') : '-',
      contribution.paymentMethod || '-',
      contribution.notes || '-'
    ]);

    // Calculate total
    const total = filteredContributions.reduce((sum, c) => sum + Number(c.amount), 0);
    const summaryRow = [t('finances:export.total'), formatPrice(total), '', '', '', '', ''];

    exportToExcel({
      title: t('finances:export.title'),
      filename: t('finances:export.filename'),
      sheetName: t('finances:export.filename'),
      headers: [
        t('finances:export.headers.user'),
        t('finances:export.headers.amount'),
        t('finances:export.headers.purpose'),
        t('finances:export.headers.project'),
        t('finances:export.headers.paymentDate'),
        t('finances:export.headers.paymentMethod'),
        t('finances:export.headers.notes')
      ],
      data: financeData,
      summaryRow
    });

    toast({
      title: t('common:common.success'),
      description: t('finances:export.success')
    });
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
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExportFinancesToExcel}
              data-testid="button-export-excel"
            >
              {t('finances:exportToExcel')}
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setPurposeDialogOpen(true)}
              data-testid="button-add-purpose"
            >
              {t('finances:purposeButton')}
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              data-testid="button-add-contribution"
            >
              {t('finances:addPayment')}
            </Button>
          </Box>
        )}
      </Box>

      <Card>
        {currentUser?.isAdmin && (
          <Box sx={{ p: 3, borderBottom: '1px solid hsl(0 0% 88%)' }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 200, display: 'flex', gap: 2 }}>
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
                  sx={{ minWidth: 200, '& select': { backgroundColor: '#fff', color: '#333' } }}
                  SelectProps={{ native: true }}
                  data-testid="select-category-filter"
                >
                  <option value="">{t("finances:allCategories")}</option>
                  {purposesQuery.data?.map((purpose: ContributionPurpose) => (
                    <option key={purpose.id} value={purpose.name}>{purpose.name}</option>
                  ))}
                </TextField>
              </Box>
            </Box>
          </Box>
        )}

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                {currentUser?.isAdmin && <SortableHeaderCell sortKey="userId" onSort={contributionsSort.handleSort} currentSortKey={contributionsSort.sortKey} currentSortDirection={contributionsSort.sortDirection}>{t('finances:user')}</SortableHeaderCell>}
                <SortableHeaderCell sortKey="amount" onSort={contributionsSort.handleSort} currentSortKey={contributionsSort.sortKey} currentSortDirection={contributionsSort.sortDirection}>{t('finances:amount')}</SortableHeaderCell>
                <SortableHeaderCell sortKey="purpose" onSort={contributionsSort.handleSort} currentSortKey={contributionsSort.sortKey} currentSortDirection={contributionsSort.sortDirection}>{t('finances:purpose')}</SortableHeaderCell>
                <SortableHeaderCell sortKey="projectId" onSort={contributionsSort.handleSort} currentSortKey={contributionsSort.sortKey} currentSortDirection={contributionsSort.sortDirection}>{t('finances:project')}</SortableHeaderCell>
                <SortableHeaderCell sortKey="paymentDate" onSort={contributionsSort.handleSort} currentSortKey={contributionsSort.sortKey} currentSortDirection={contributionsSort.sortDirection}>{t('finances:paymentDate')}</SortableHeaderCell>
                <SortableHeaderCell sortKey="notes" onSort={contributionsSort.handleSort} currentSortKey={contributionsSort.sortKey} currentSortDirection={contributionsSort.sortDirection}>{t('finances:notes')}</SortableHeaderCell>
                {currentUser?.isAdmin && <TableCell>{t('common:common.actions')}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {contributionsSort.sortedData.map((contribution: FinancialContribution) => (
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
                      label={formatPrice(contribution.amount)}
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
                          sx={{ color: 'hsl(207 88% 55%)' }}
                          data-testid={`button-edit-${contribution.id}`}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(contribution.id)}
                          sx={{ color: 'hsl(4 90% 58%)' }}
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

      {/* Manage Purposes Dialog */}
      <Dialog open={purposeDialogOpen} onClose={() => setPurposeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('finances:purposeDialog.title')}</DialogTitle>
        <DialogContent sx={{ pt: 3, px: 3 }}>
          {/* Existing purposes list */}
          {purposesQuery.data && purposesQuery.data.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                {t('finances:purposeDialog.existingPurposes')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {purposesQuery.data.map((purpose: ContributionPurpose) => (
                  <Box 
                    key={purpose.id} 
                    sx={{ 
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: 'grey.50',
                      border: '1px solid',
                      borderColor: editingPurpose?.id === purpose.id ? 'primary.main' : 'grey.200'
                    }}
                  >
                    {editingPurpose?.id === purpose.id ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Naziv svrhe"
                          value={editPurposeName}
                          onChange={(e) => setEditPurposeName(e.target.value)}
                          data-testid={`input-edit-purpose-name-${purpose.id}`}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Opis (opcionalno)"
                          value={editPurposeDesc}
                          onChange={(e) => setEditPurposeDesc(e.target.value)}
                          data-testid={`input-edit-purpose-desc-${purpose.id}`}
                        />
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button 
                            size="small" 
                            onClick={handleCancelEditPurpose}
                            disabled={updatePurposeMutation.isPending}
                            data-testid={`button-cancel-edit-purpose-${purpose.id}`}
                          >
                            Odustani
                          </Button>
                          <Button 
                            size="small" 
                            variant="contained"
                            onClick={handleSaveEditPurpose}
                            disabled={updatePurposeMutation.isPending || !editPurposeName.trim()}
                            data-testid={`button-save-edit-purpose-${purpose.id}`}
                          >
                            {updatePurposeMutation.isPending ? 'Spremam...' : 'Spremi'}
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {purpose.name}
                          </Typography>
                          {purpose.description && (
                            <Typography variant="caption" color="text.secondary">
                              {purpose.description}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleStartEditPurpose(purpose)}
                            sx={{ color: 'primary.main' }}
                            data-testid={`button-edit-purpose-${purpose.id}`}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeletePurpose(purpose.id)}
                            sx={{ color: 'error.main' }}
                            disabled={deletePurposeMutation.isPending}
                            data-testid={`button-delete-purpose-${purpose.id}`}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Divider */}
          {purposesQuery.data && purposesQuery.data.length > 0 && (
            <Box sx={{ borderBottom: '1px solid', borderColor: 'grey.200', mb: 3 }} />
          )}

          {/* Add new purpose form */}
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Dodaj novu svrhu:
          </Typography>
          <TextField
            fullWidth
            label="Naziv svrhe"
            value={newPurposeName}
            onChange={(e) => setNewPurposeName(e.target.value)}
            sx={{ mb: 2 }}
            data-testid="input-new-purpose-name"
          />
          <TextField
            fullWidth
            label="Opis (opcionalno)"
            multiline
            rows={2}
            value={newPurposeDesc}
            onChange={(e) => setNewPurposeDesc(e.target.value)}
            data-testid="input-new-purpose-desc"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPurposeDialogOpen(false)} data-testid="button-cancel-purpose">
            Zatvori
          </Button>
          <Button
            variant="contained"
            onClick={() => createPurposeMutation.mutate()}
            disabled={createPurposeMutation.isPending || !newPurposeName}
            data-testid="button-save-purpose"
          >
            {createPurposeMutation.isPending ? 'Kreiram...' : 'Dodaj svrhu'}
          </Button>
        </DialogActions>
      </Dialog>


      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {selectedContribution ? t('finances:editPayment') : t('finances:addNewPayment')}
          </DialogTitle>
          <DialogContent sx={{ pt: 3, px: 3 }}>
            <Grid container spacing={2} sx={{ mt: 4 }}>
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
                  label={`${t('finances:amount')} (${currency})`}
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
                  sx={{ '& select': { backgroundColor: '#fff', color: '#333' } }}
                  data-testid="select-purpose"
                >
                  <option value="">{t('finances:selectPurpose')}</option>
                  {purposesQuery.data?.map((purpose: ContributionPurpose) => (
                    <option key={purpose.id} value={purpose.name || (purpose as any).title || ''}>{purpose.name || (purpose as any).title || 'N/A'}</option>
                  ))}
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
                  sx={{ '& select': { backgroundColor: '#fff', color: '#333' } }}
                  data-testid="select-payment-method"
                >
                  <option value={t('finances:paymentMethods.cash')}>{t('finances:paymentMethods.cash')}</option>
                  <option value={t('finances:paymentMethods.bank')}>{t('finances:paymentMethods.bank')}</option>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label={t('finances:projectOptional')}
                  {...form.register('projectId')}
                  SelectProps={{ native: true }}
                  sx={{ '& select': { backgroundColor: '#fff', color: '#333' } }}
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
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('finances:pointsValue')}
                  type="number"
                  {...form.register('pointsValue', { valueAsNumber: true })}
                  data-testid="input-points"
                />
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
