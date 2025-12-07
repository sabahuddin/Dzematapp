import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Card,
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
  Chip,
  Stack
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  EmojiEvents
} from '@mui/icons-material';
import { Badge, insertBadgeSchema } from '@shared/schema';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { apiRequest, queryClient } from '../lib/queryClient';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { UpgradeCTA } from '../components/UpgradeCTA';

interface BadgesPageProps {
  hideHeader?: boolean;
}

// Form schema defined outside component to avoid recreating on each render
const badgeFormSchema = insertBadgeSchema.omit({ tenantId: true }).extend({
  name: z.string().min(1, 'Naziv je obavezan'),
  description: z.string().min(1, 'Opis je obavezan'),
  criteriaType: z.string().min(1, 'Tip kriterija je obavezan'),
  criteriaValue: z.number().min(0, 'Vrijednost mora biti pozitivna'),
});

type BadgeFormData = z.infer<typeof badgeFormSchema>;

export default function BadgesPage({ hideHeader = false }: BadgesPageProps = {}) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation(['badges', 'common']);
  const featureAccess = useFeatureAccess('badges');
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const badgesQuery = useQuery({
    queryKey: ['/api/badges'],
    enabled: !featureAccess.upgradeRequired && currentUser?.isAdmin,
  });

  const form = useForm<BadgeFormData>({
    resolver: zodResolver(badgeFormSchema),
    defaultValues: {
      name: '',
      description: '',
      criteriaType: 'points_total',
      criteriaValue: 0,
      icon: '🏅',
    }
  });

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedBadge(null);
    form.reset();
  };

  const saveBadgeMutation = useMutation({
    mutationFn: async (data: BadgeFormData) => {
      if (selectedBadge) {
        const response = await apiRequest(`/api/badges/${selectedBadge.id}`, 'PUT', data);
        return response.json();
      } else {
        const response = await apiRequest('/api/badges', 'POST', data);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/badges'] });
      toast({ 
        title: t('common:common.success'), 
        description: selectedBadge ? t('badges:messages.updated') : t('badges:messages.created') 
      });
      handleCloseDialog();
    },
    onError: () => {
      toast({ 
        title: t('common:common.error'), 
        description: t('badges:messages.errorSaving'), 
        variant: 'destructive' 
      });
    }
  });

  const deleteBadgeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/badges/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/badges'] });
      toast({ 
        title: t('common:common.success'), 
        description: t('badges:messages.deleted') 
      });
    },
    onError: () => {
      toast({ 
        title: t('common:common.error'), 
        description: t('badges:messages.errorDeleting'), 
        variant: 'destructive' 
      });
    }
  });

  const checkAllBadgesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/user-badges/check-all', 'POST');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key?.startsWith('/api/user-badges') || key === '/api/badges' || key === '/api/auth/session';
        }
      });
      toast({ 
        title: t('common:common.success'), 
        description: data.message || 'Značke provjerene za sve korisnike'
      });
    },
    onError: () => {
      toast({ 
        title: t('common:common.error'), 
        description: 'Greška prilikom provjere znački', 
        variant: 'destructive' 
      });
    }
  });

  // CONDITIONAL RETURNS AFTER ALL HOOKS
  if (featureAccess.upgradeRequired) {
    return <UpgradeCTA moduleId="badges" requiredPlan={featureAccess.requiredPlan || 'full'} currentPlan={featureAccess.currentPlan || 'standard'} />;
  }

  if (!currentUser?.isAdmin) {
    return (
      <Alert severity="error">
        {t('badges:accessDenied')}
      </Alert>
    );
  }

  const handleOpenDialog = (badge?: Badge) => {
    if (badge) {
      setSelectedBadge(badge);
      form.reset({
        name: badge.name,
        description: badge.description,
        criteriaType: badge.criteriaType,
        criteriaValue: badge.criteriaValue,
        icon: badge.icon,
      });
    } else {
      setSelectedBadge(null);
      form.reset({
        name: '',
        description: '',
        criteriaType: 'points_total',
        criteriaValue: 0,
        icon: '🏅',
      });
    }
    setDialogOpen(true);
  };

  const handleFormSubmit = async () => {
    console.log('[BADGES] handleFormSubmit CALLED!');
    alert('Spremi kliknut!'); // DEBUG - remove after testing
    
    const isValid = await form.trigger();
    console.log('[BADGES] Form validation result:', isValid);
    
    if (!isValid) {
      console.log('[BADGES] Form errors:', form.formState.errors);
      toast({
        title: 'Greška u formi',
        description: 'Molimo popunite sva obavezna polja.',
        variant: 'destructive'
      });
      return;
    }
    
    const data = form.getValues();
    console.log('[BADGES] Submitting data:', data);
    saveBadgeMutation.mutate(data);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('badges:messages.confirmDelete'))) {
      deleteBadgeMutation.mutate(id);
    }
  };

  const handleCheckAllBadges = () => {
    if (window.confirm('Ova akcija će provjeriti i dodijeliti značke za SVE korisnike. Može potrajati nekoliko sekundi. Nastaviti?')) {
      checkAllBadgesMutation.mutate();
    }
  };

  if (badgesQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (badgesQuery.error) {
    return (
      <Alert severity="error">
        {t('badges:messages.errorLoading')}
      </Alert>
    );
  }

  const badges = (badgesQuery.data as Badge[]) || [];

  return (
    <Box>
      {!hideHeader && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {t('badges:title')}
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<EmojiEvents />}
              onClick={handleCheckAllBadges}
              disabled={checkAllBadgesMutation.isPending}
              data-testid="button-check-all-badges"
            >
              {checkAllBadgesMutation.isPending ? 'Provjeravam...' : 'Provjeri sve korisnike'}
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              data-testid="button-add-badge"
            >
              {t('badges:addBadge')}
            </Button>
          </Stack>
        </Box>
      )}
      
      {hideHeader && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<EmojiEvents />}
              onClick={handleCheckAllBadges}
              disabled={checkAllBadgesMutation.isPending}
              data-testid="button-check-all-badges"
            >
              {checkAllBadgesMutation.isPending ? 'Provjeravam...' : 'Provjeri sve korisnike'}
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              data-testid="button-add-badge"
            >
              {t('badges:addBadge')}
            </Button>
          </Stack>
        </Box>
      )}

      <Card>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('badges:tableHeaders.name')}</TableCell>
                <TableCell>{t('badges:tableHeaders.description')}</TableCell>
                <TableCell>{t('badges:tableHeaders.criteriaType')}</TableCell>
                <TableCell>{t('badges:tableHeaders.value')}</TableCell>
                <TableCell>{t('badges:tableHeaders.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {badges.map((badge: Badge) => (
                <TableRow key={badge.id}>
                  <TableCell>
                    <Chip
                      icon={<EmojiEvents />}
                      label={badge.name}
                      color="warning"
                      data-testid={`badge-name-${badge.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" data-testid={`badge-desc-${badge.id}`}>
                      {badge.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" data-testid={`badge-type-${badge.id}`}>
                      {t(`badges:criteriaTypes.${badge.criteriaType}`)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={badge.criteriaValue} size="small" data-testid={`badge-value-${badge.id}`} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(badge)}
                        sx={{ color: 'hsl(207 88% 55%)' }}
                        data-testid={`button-edit-${badge.id}`}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(badge.id)}
                        sx={{ color: 'hsl(4 90% 58%)' }}
                        data-testid={`button-delete-${badge.id}`}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {badges.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      {t('badges:emptyState')}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add/Edit Modal - Pure HTML/CSS to avoid MUI Dialog issues */}
      {dialogOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={handleCloseDialog}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4">
              {selectedBadge ? t('badges:editBadge') : t('badges:addNewBadge')}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('badges:badgeName')} *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  {...form.register('name')}
                  data-testid="input-name"
                />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('badges:description')} *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={2}
                  {...form.register('description')}
                  data-testid="input-description"
                />
                {form.formState.errors.description && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.description.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('badges:criteriaType')} *
                </label>
                <Controller
                  name="criteriaType"
                  control={form.control}
                  render={({ field }) => (
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      {...field}
                      data-testid="select-criteria-type"
                    >
                      <option value="">{t('badges:selectType')}</option>
                      <option value="points_total">{t('badges:criteriaTypes.points')}</option>
                      <option value="tasks_completed">{t('badges:criteriaTypes.tasks_completed')}</option>
                      <option value="donation_total">{t('badges:criteriaTypes.contributions_amount')}</option>
                      <option value="events_attended">{t('badges:criteriaTypes.events_attended')}</option>
                    </select>
                  )}
                />
                {form.formState.errors.criteriaType && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.criteriaType.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('badges:criteriaValue')} *
                </label>
                <Controller
                  name="criteriaValue"
                  control={form.control}
                  render={({ field }) => (
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      data-testid="input-criteria-value"
                    />
                  )}
                />
                {form.formState.errors.criteriaValue && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.criteriaValue.message}</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                onClick={handleCloseDialog}
                data-testid="button-cancel"
              >
                {t('badges:cancel')}
              </button>
              <button
                type="button"
                className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                disabled={saveBadgeMutation.isPending}
                onClick={() => {
                  console.log('[BADGES] Save button clicked!');
                  handleFormSubmit();
                }}
                data-testid="button-save"
              >
                {saveBadgeMutation.isPending ? t('badges:saving') : t('badges:save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Box>
  );
}
