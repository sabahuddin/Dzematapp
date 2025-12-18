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

const BadgeIcon = ({ icon, size = 24 }: { icon?: string | null; size?: number }) => {
  const [imgError, setImgError] = useState(false);
  
  if (!icon || imgError) return <span style={{ fontSize: size }}>🏅</span>;
  
  if (icon.startsWith('/') || icon.startsWith('http')) {
    return (
      <img 
        src={icon} 
        alt="Badge" 
        style={{ 
          width: size, 
          height: size, 
          objectFit: 'contain',
          borderRadius: '50%'
        }} 
        onError={() => setImgError(true)}
      />
    );
  }
  
  return <span style={{ fontSize: size }}>{icon}</span>;
};

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
        description: data.message || t('badges:messages.allBadgesChecked')
      });
    },
    onError: () => {
      toast({ 
        title: t('common:common.error'), 
        description: t('badges:messages.errorCheckingBadges'), 
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
    const isValid = await form.trigger();
    
    if (!isValid) {
      toast({
        title: t('common:common.error'),
        description: t('badges:validation.allFieldsRequired'),
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
    if (window.confirm(t('badges:messages.checkAllConfirm'))) {
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

      {/* Inline Form - appears when dialogOpen is true */}
      {dialogOpen && (
        <Card sx={{ mb: 3, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {selectedBadge ? t('badges:editBadge') : t('badges:addNewBadge')}
          </Typography>
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                {t('badges:badgeName')} *
              </Typography>
              <input
                type="text"
                {...form.register('name')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #5C6BC0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                data-testid="input-name-inline"
              />
              {form.formState.errors.name && (
                <Typography color="error" variant="caption">{form.formState.errors.name.message}</Typography>
              )}
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                {t('badges:description')} *
              </Typography>
              <textarea
                {...form.register('description')}
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #5C6BC0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
                data-testid="input-description-inline"
              />
              {form.formState.errors.description && (
                <Typography color="error" variant="caption">{form.formState.errors.description.message}</Typography>
              )}
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                {t('badges:criteriaType')} *
              </Typography>
              <Controller
                name="criteriaType"
                control={form.control}
                render={({ field }) => (
                  <select
                    {...field}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #5C6BC0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      boxSizing: 'border-box'
                    }}
                    data-testid="select-criteria-type-inline"
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
                <Typography color="error" variant="caption">{form.formState.errors.criteriaType.message}</Typography>
              )}
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                {t('badges:criteriaValue')} *
              </Typography>
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
                      border: '2px solid #5C6BC0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                    data-testid="input-criteria-value-inline"
                  />
                )}
              />
              {form.formState.errors.criteriaValue && (
                <Typography color="error" variant="caption">{form.formState.errors.criteriaValue.message}</Typography>
              )}
            </Box>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => {
                  console.log('[BADGES] Cancel clicked');
                  handleCloseDialog();
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e5e7eb',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                data-testid="button-cancel-inline"
              >
                {t('badges:cancel')}
              </button>
              <button
                type="button"
                disabled={saveBadgeMutation.isPending}
                onClick={() => {
                  handleFormSubmit();
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: saveBadgeMutation.isPending ? '#9ca3af' : '#1E88E5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: saveBadgeMutation.isPending ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
                data-testid="button-save-inline"
              >
                {saveBadgeMutation.isPending ? t('badges:saving') : t('badges:save')}
              </button>
            </div>
          </Stack>
        </Card>
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BadgeIcon icon={badge.icon} size={32} />
                      <Typography variant="body2" fontWeight={600}>
                        {badge.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" data-testid={`badge-desc-${badge.id}`}>
                      {badge.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" data-testid={`badge-type-${badge.id}`}>
                      {(t('badges:criteriaTypes', { returnObjects: true }) as Record<string, string>)[badge.criteriaType] || badge.criteriaType}
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

    </Box>
  );
}
