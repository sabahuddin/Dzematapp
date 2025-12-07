import { useState } from 'react';
import { createPortal } from 'react-dom';
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

      {/* Add/Edit Modal - Using React Portal to render directly in body */}
      {dialogOpen && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            pointerEvents: 'auto'
          }}
          onClick={handleCloseDialog}
          data-testid="badge-modal-backdrop"
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              width: '100%',
              maxWidth: '500px',
              margin: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              pointerEvents: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
            data-testid="badge-modal-content"
          >
            <h2 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', fontWeight: 600 }}>
              {selectedBadge ? t('badges:editBadge') : t('badges:addNewBadge')}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '14px' }}>
                  {t('badges:badgeName')} *
                </label>
                <input
                  type="text"
                  {...form.register('name')}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  data-testid="input-name"
                />
                {form.formState.errors.name && (
                  <span style={{ color: '#ef4444', fontSize: '12px' }}>{form.formState.errors.name.message}</span>
                )}
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '14px' }}>
                  {t('badges:description')} *
                </label>
                <textarea
                  {...form.register('description')}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                  data-testid="input-description"
                />
                {form.formState.errors.description && (
                  <span style={{ color: '#ef4444', fontSize: '12px' }}>{form.formState.errors.description.message}</span>
                )}
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '14px' }}>
                  {t('badges:criteriaType')} *
                </label>
                <Controller
                  name="criteriaType"
                  control={form.control}
                  render={({ field }) => (
                    <select
                      {...field}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        backgroundColor: 'white',
                        boxSizing: 'border-box'
                      }}
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
                  <span style={{ color: '#ef4444', fontSize: '12px' }}>{form.formState.errors.criteriaType.message}</span>
                )}
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '14px' }}>
                  {t('badges:criteriaValue')} *
                </label>
                <Controller
                  name="criteriaValue"
                  control={form.control}
                  render={({ field }) => (
                    <input
                      type="number"
                      value={field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      onBlur={field.onBlur}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                      data-testid="input-criteria-value"
                    />
                  )}
                />
                {form.formState.errors.criteriaValue && (
                  <span style={{ color: '#ef4444', fontSize: '12px' }}>{form.formState.errors.criteriaValue.message}</span>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={handleCloseDialog}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
                data-testid="button-cancel"
              >
                {t('badges:cancel')}
              </button>
              <button
                type="button"
                disabled={saveBadgeMutation.isPending}
                onClick={() => {
                  console.log('[BADGES] Portal Save button clicked!');
                  handleFormSubmit();
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: saveBadgeMutation.isPending ? '#9ca3af' : '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: saveBadgeMutation.isPending ? 'not-allowed' : 'pointer'
                }}
                data-testid="button-save"
              >
                {saveBadgeMutation.isPending ? t('badges:saving') : t('badges:save')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </Box>
  );
}
