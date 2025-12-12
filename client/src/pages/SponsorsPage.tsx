import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Card,
  CardContent,
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
  Chip,
  Stack,
  Avatar,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Check,
  Close,
  Business,
  Person,
  Language,
  Phone,
  Email,
  EmojiEvents
} from '@mui/icons-material';
import { Sponsor } from '@shared/schema';

interface SponsorPricing {
  tenantId: string;
  bronzeAmount: number | null;
  silverAmount: number | null;
  goldAmount: number | null;
  currency: string;
}
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { apiRequest, queryClient } from '../lib/queryClient';

interface SponsorsPageProps {
  hideHeader?: boolean;
}

const tierColors: Record<string, string> = {
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32'
};

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  pending: 'warning',
  active: 'success',
  expired: 'default',
  rejected: 'error'
};

export default function SponsorsPage({ hideHeader = false }: SponsorsPageProps = {}) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation(['sponsors']);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [sponsorToReview, setSponsorToReview] = useState<Sponsor | null>(null);
  
  // Sponsor tier pricing state
  const [bronzeAmount, setBronzeAmount] = useState<string>('');
  const [silverAmount, setSilverAmount] = useState<string>('');
  const [goldAmount, setGoldAmount] = useState<string>('');
  const [sponsorCurrency, setSponsorCurrency] = useState<string>('EUR');
  const [pricingInitialized, setPricingInitialized] = useState(false);

  const isAdmin = currentUser?.isAdmin;

  const sponsorsQuery = useQuery<Sponsor[]>({
    queryKey: ['/api/sponsors'],
  });

  const activeSponsorsQuery = useQuery<Sponsor[]>({
    queryKey: ['/api/sponsors/active'],
  });

  const pricingQuery = useQuery<SponsorPricing>({
    queryKey: ['/api/sponsors/pricing'],
  });

  const pricing = pricingQuery.data;
  
  const getTierPriceLabel = (tier: string): string => {
    if (!pricing) return '';
    const currency = pricing.currency || 'EUR';
    let amount: number | null = null;
    if (tier === 'bronze') amount = pricing.bronzeAmount;
    if (tier === 'silver') amount = pricing.silverAmount;
    if (tier === 'gold') amount = pricing.goldAmount;
    if (amount) return `${amount} ${currency}`;
    return '';
  };

  // Initialize pricing state from server data
  useEffect(() => {
    if (pricing && !pricingInitialized) {
      setBronzeAmount(pricing.bronzeAmount?.toString() || '');
      setSilverAmount(pricing.silverAmount?.toString() || '');
      setGoldAmount(pricing.goldAmount?.toString() || '');
      setSponsorCurrency(pricing.currency || 'EUR');
      setPricingInitialized(true);
    }
  }, [pricing, pricingInitialized]);

  const updatePricingMutation = useMutation({
    mutationFn: async (data: { bronzeAmount: number | null; silverAmount: number | null; goldAmount: number | null; currency: string }) => {
      const response = await apiRequest('/api/sponsors/pricing', 'PUT', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sponsors/pricing'] });
      toast({ title: t('common.success'), description: t('pricesSaved') });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message || t('pricesSaveError'), variant: 'destructive' });
    }
  });

  const handleSavePricing = () => {
    updatePricingMutation.mutate({
      bronzeAmount: bronzeAmount ? parseInt(bronzeAmount) : null,
      silverAmount: silverAmount ? parseInt(silverAmount) : null,
      goldAmount: goldAmount ? parseInt(goldAmount) : null,
      currency: sponsorCurrency
    });
  };

  const formSchema = z.object({
    name: z.string().min(1, t('form.nameRequired')),
    type: z.enum(['company', 'individual']),
    tier: z.enum(['bronze', 'silver', 'gold']),
    email: z.string().email(t('form.emailInvalid')).optional().or(z.literal('')),
    phone: z.string().optional(),
    website: z.string()
      .transform((val) => {
        if (!val || val.trim() === '') return '';
        const trimmed = val.trim();
        if (trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          return 'https://' + trimmed;
        }
        return trimmed;
      })
      .refine((val) => {
        if (!val || val === '') return true;
        try {
          new URL(val);
          return true;
        } catch {
          return false;
        }
      }, { message: t('form.websiteInvalid') })
      .optional()
      .or(z.literal('')),
    logoUrl: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'company',
      tier: 'bronze',
      email: '',
      phone: '',
      website: '',
      logoUrl: '',
    }
  });

  const saveSponsorMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (selectedSponsor) {
        const response = await apiRequest(`/api/sponsors/${selectedSponsor.id}`, 'PUT', data);
        return response.json();
      } else {
        const response = await apiRequest('/api/sponsors', 'POST', data);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sponsors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sponsors/active'] });
      toast({ 
        title: t('common.success'), 
        description: selectedSponsor ? t('messages.sponsorUpdated') : t('messages.sponsorCreated') 
      });
      handleCloseDialog();
    },
    onError: () => {
      toast({ 
        title: t('common.error'), 
        description: t('messages.error'), 
        variant: 'destructive' 
      });
    }
  });

  const deleteSponsorMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/sponsors/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sponsors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sponsors/active'] });
      toast({ title: t('common.success'), description: t('messages.sponsorDeleted') });
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('messages.deleteError'), variant: 'destructive' });
    }
  });

  const reviewSponsorMutation = useMutation({
    mutationFn: async ({ id, action, notes }: { id: string; action: 'approve' | 'reject'; notes: string }) => {
      const response = await apiRequest(`/api/sponsors/${id}/${action}`, 'PUT', { reviewNotes: notes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sponsors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sponsors/active'] });
      toast({ 
        title: t('common.success'), 
        description: reviewAction === 'approve' ? t('messages.sponsorApproved') : t('messages.sponsorRejected') 
      });
      setReviewDialogOpen(false);
      setSponsorToReview(null);
      setReviewNotes('');
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('messages.reviewError'), variant: 'destructive' });
    }
  });

  const handleOpenDialog = (sponsor?: Sponsor) => {
    if (sponsor) {
      setSelectedSponsor(sponsor);
      form.reset({
        name: sponsor.name,
        type: sponsor.type as 'company' | 'individual',
        tier: sponsor.tier as 'bronze' | 'silver' | 'gold',
        email: sponsor.email || '',
        phone: sponsor.phone || '',
        website: sponsor.website || '',
        logoUrl: sponsor.logoUrl || '',
      });
    } else {
      setSelectedSponsor(null);
      form.reset({
        name: '',
        type: 'company',
        tier: 'bronze',
        email: '',
        phone: '',
        website: '',
        logoUrl: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedSponsor(null);
    form.reset();
  };

  const handleSubmit = form.handleSubmit((data) => {
    saveSponsorMutation.mutate(data);
  });

  const handleDelete = (id: string) => {
    if (window.confirm(t('messages.confirmDelete'))) {
      deleteSponsorMutation.mutate(id);
    }
  };

  const handleReview = (sponsor: Sponsor, action: 'approve' | 'reject') => {
    setSponsorToReview(sponsor);
    setReviewAction(action);
    setReviewNotes('');
    setReviewDialogOpen(true);
  };

  const handleConfirmReview = () => {
    if (sponsorToReview) {
      if (reviewAction === 'reject' && !reviewNotes.trim()) {
        toast({ title: t('common.error'), description: t('messages.rejectionReasonRequired'), variant: 'destructive' });
        return;
      }
      reviewSponsorMutation.mutate({
        id: sponsorToReview.id,
        action: reviewAction,
        notes: reviewNotes
      });
    }
  };

  if (sponsorsQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  const sponsors = sponsorsQuery.data || [];
  const activeSponsors = activeSponsorsQuery.data || [];
  const pendingSponsors = sponsors.filter(s => s.status === 'pending');

  const renderPublicView = () => (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#0D1B2A' }}>
        {t('ourSponsors')}
      </Typography>
      
      {activeSponsors.length === 0 ? (
        <Alert severity="info">{t('noActiveSponsors')}</Alert>
      ) : (
        <>
          {['gold', 'silver', 'bronze'].map(tier => {
            const tierSponsors = activeSponsors.filter(s => s.tier === tier);
            if (tierSponsors.length === 0) return null;
            
            return (
              <Box key={tier} sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <EmojiEvents sx={{ color: tierColors[tier] }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: tierColors[tier] }}>
                    {t('tierSponsors', { tier: t(`tiers.${tier}`) })}
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  {tierSponsors.map(sponsor => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={sponsor.id}>
                      <Card sx={{ 
                        height: '100%', 
                        border: `2px solid ${tierColors[tier]}`,
                        borderRadius: '12px'
                      }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          {sponsor.logoUrl ? (
                            <Avatar
                              src={sponsor.logoUrl}
                              sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
                              variant="rounded"
                            />
                          ) : (
                            <Avatar sx={{ 
                              width: 100, 
                              height: 100, 
                              mx: 'auto', 
                              mb: 2,
                              bgcolor: tierColors[tier]
                            }} variant="rounded">
                              {sponsor.type === 'company' ? <Business /> : <Person />}
                            </Avatar>
                          )}
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {sponsor.name}
                          </Typography>
                          <Chip 
                            label={sponsor.type === 'company' ? t('type.company') : t('type.individual')}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
                            {sponsor.website && (
                              <Box 
                                sx={{ 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                  '&:hover': { opacity: 0.7 }
                                }}
                                onClick={() => window.open(sponsor.website!, '_blank')}
                                data-testid={`link-sponsor-website-${sponsor.id}`}
                              >
                                <Language sx={{ fontSize: 24, color: 'primary.main' }} />
                                <Typography variant="caption" sx={{ mt: 0.5, maxWidth: 120, wordBreak: 'break-all', textAlign: 'center', fontSize: '0.7rem' }}>
                                  {sponsor.website?.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                </Typography>
                              </Box>
                            )}
                            {sponsor.phone && (
                              <Box 
                                sx={{ 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                  '&:hover': { opacity: 0.7 }
                                }}
                                onClick={() => window.open(`tel:${sponsor.phone}`, '_self')}
                                data-testid={`link-sponsor-phone-${sponsor.id}`}
                              >
                                <Phone sx={{ fontSize: 24, color: 'primary.main' }} />
                                <Typography variant="caption" sx={{ mt: 0.5, fontSize: '0.7rem' }}>{sponsor.phone}</Typography>
                              </Box>
                            )}
                            {sponsor.email && (
                              <Box 
                                sx={{ 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                  '&:hover': { opacity: 0.7 }
                                }}
                                onClick={() => window.open(`mailto:${sponsor.email}`, '_self')}
                                data-testid={`link-sponsor-email-${sponsor.id}`}
                              >
                                <Email sx={{ fontSize: 24, color: 'primary.main' }} />
                                <Typography variant="caption" sx={{ mt: 0.5, fontSize: '0.7rem' }}>{sponsor.email}</Typography>
                              </Box>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            );
          })}
        </>
      )}

      <Card sx={{ mt: 4, p: 3, bgcolor: '#f5f7ff', borderRadius: '12px' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          {t('becomeSponsor')}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t('becomeSponsorDescription')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Chip icon={<EmojiEvents sx={{ color: tierColors.bronze }} />} label={`${t('tiers.bronze')}${getTierPriceLabel('bronze') ? ` - ${getTierPriceLabel('bronze')}` : ''}`} />
          <Chip icon={<EmojiEvents sx={{ color: tierColors.silver }} />} label={`${t('tiers.silver')}${getTierPriceLabel('silver') ? ` - ${getTierPriceLabel('silver')}` : ''}`} />
          <Chip icon={<EmojiEvents sx={{ color: tierColors.gold }} />} label={`${t('tiers.gold')}${getTierPriceLabel('gold') ? ` - ${getTierPriceLabel('gold')}` : ''}`} />
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          data-testid="button-become-sponsor"
          sx={{ 
            bgcolor: '#1E88E5',
            '&:hover': { bgcolor: '#1976D2' }
          }}
        >
          {t('applyForSponsorship')}
        </Button>
      </Card>
    </Box>
  );

  const renderAdminView = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#0D1B2A' }}>
          {t('managementTitle')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          data-testid="button-add-sponsor"
          sx={{ 
            bgcolor: '#1E88E5',
            '&:hover': { bgcolor: '#1976D2' }
          }}
        >
          {t('addSponsor')}
        </Button>
      </Box>

      {pendingSponsors.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {t('pendingApplications', { count: pendingSponsors.length })}
        </Alert>
      )}

      {/* Sponsor Tier Pricing Configuration */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEvents sx={{ color: '#FFD700' }} />
          {t('pricingSettings')}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2 }}>
          <TextField
            label={t('tierAmount', { tier: t('tiers.bronze') })}
            type="number"
            value={bronzeAmount}
            onChange={(e) => setBronzeAmount(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            data-testid="input-bronze-amount"
          />
          <TextField
            label={t('tierAmount', { tier: t('tiers.silver') })}
            type="number"
            value={silverAmount}
            onChange={(e) => setSilverAmount(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            data-testid="input-silver-amount"
          />
          <TextField
            label={t('tierAmount', { tier: t('tiers.gold') })}
            type="number"
            value={goldAmount}
            onChange={(e) => setGoldAmount(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            data-testid="input-gold-amount"
          />
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>{t('currency')}</InputLabel>
            <Select
              value={sponsorCurrency}
              label={t('currency')}
              onChange={(e) => setSponsorCurrency(e.target.value)}
              data-testid="select-sponsor-currency"
            >
              <MenuItem value="EUR">EUR</MenuItem>
              <MenuItem value="CHF">CHF</MenuItem>
              <MenuItem value="USD">USD</MenuItem>
              <MenuItem value="BAM">BAM</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Button
          variant="contained"
          onClick={handleSavePricing}
          disabled={updatePricingMutation.isPending}
          data-testid="button-save-pricing"
          sx={{ bgcolor: '#1E88E5', '&:hover': { bgcolor: '#1976D2' } }}
        >
          {updatePricingMutation.isPending ? t('saving') : t('savePrices')}
        </Button>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('table.sponsor')}</TableCell>
                <TableCell>{t('table.type')}</TableCell>
                <TableCell>{t('table.tier')}</TableCell>
                <TableCell>{t('table.contact')}</TableCell>
                <TableCell>{t('table.status')}</TableCell>
                <TableCell>{t('table.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sponsors.map((sponsor) => (
                <TableRow key={sponsor.id} data-testid={`row-sponsor-${sponsor.id}`}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {sponsor.logoUrl ? (
                        <Avatar src={sponsor.logoUrl} variant="rounded" />
                      ) : (
                        <Avatar variant="rounded" sx={{ bgcolor: tierColors[sponsor.tier] }}>
                          {sponsor.type === 'company' ? <Business /> : <Person />}
                        </Avatar>
                      )}
                      <Typography fontWeight={600}>{sponsor.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      icon={sponsor.type === 'company' ? <Business /> : <Person />}
                      label={sponsor.type === 'company' ? t('type.company') : t('type.individual')}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      icon={<EmojiEvents sx={{ color: tierColors[sponsor.tier] }} />}
                      label={t(`tiers.${sponsor.tier}`)}
                      size="small"
                      sx={{ 
                        bgcolor: `${tierColors[sponsor.tier]}20`,
                        borderColor: tierColors[sponsor.tier],
                        border: '1px solid'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      {sponsor.email && <Typography variant="body2">{sponsor.email}</Typography>}
                      {sponsor.phone && <Typography variant="body2">{sponsor.phone}</Typography>}
                      {sponsor.website && (
                        <Typography 
                          variant="body2" 
                          sx={{ color: 'primary.main', cursor: 'pointer' }}
                          onClick={() => window.open(sponsor.website!, '_blank')}
                        >
                          {sponsor.website}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={t(`status.${sponsor.status}`)}
                      color={statusColors[sponsor.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {sponsor.status === 'pending' && (
                        <>
                          <IconButton 
                            size="small" 
                            color="success"
                            onClick={() => handleReview(sponsor, 'approve')}
                            data-testid={`button-approve-${sponsor.id}`}
                          >
                            <Check />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleReview(sponsor, 'reject')}
                            data-testid={`button-reject-${sponsor.id}`}
                          >
                            <Close />
                          </IconButton>
                        </>
                      )}
                      <IconButton 
                        size="small"
                        onClick={() => handleOpenDialog(sponsor)}
                        data-testid={`button-edit-${sponsor.id}`}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDelete(sponsor.id)}
                        data-testid={`button-delete-${sponsor.id}`}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {sponsors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      {t('noSponsors')}
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

  return (
    <Box>
      {!hideHeader && isAdmin && (
        <Tabs 
          value={activeTab} 
          onChange={(_, v) => setActiveTab(v)} 
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={t('tabs.public')} data-testid="tab-public" />
          <Tab label={t('tabs.admin')} data-testid="tab-admin" />
        </Tabs>
      )}

      {activeTab === 0 || !isAdmin ? renderPublicView() : renderAdminView()}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {selectedSponsor ? t('editSponsor') : t('applyTitle')}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label={t('form.nameLabel')}
                {...form.register('name')}
                error={!!form.formState.errors.name}
                helperText={form.formState.errors.name?.message}
                required
                data-testid="input-name"
              />
              
              <FormControl fullWidth>
                <InputLabel>{t('table.type')}</InputLabel>
                <Select
                  {...form.register('type')}
                  defaultValue={form.getValues('type')}
                  label={t('table.type')}
                  data-testid="select-type"
                >
                  <MenuItem value="company">{t('type.company')}</MenuItem>
                  <MenuItem value="individual">{t('type.individual')}</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>{t('form.tierLabel')}</InputLabel>
                <Select
                  {...form.register('tier')}
                  defaultValue={form.getValues('tier')}
                  label={t('form.tierLabel')}
                  data-testid="select-tier"
                >
                  <MenuItem value="bronze">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmojiEvents sx={{ color: tierColors.bronze }} />
                        {t('tiers.bronze')}
                      </Box>
                      {getTierPriceLabel('bronze') && (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {getTierPriceLabel('bronze')}
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                  <MenuItem value="silver">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmojiEvents sx={{ color: tierColors.silver }} />
                        {t('tiers.silver')}
                      </Box>
                      {getTierPriceLabel('silver') && (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {getTierPriceLabel('silver')}
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                  <MenuItem value="gold">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmojiEvents sx={{ color: tierColors.gold }} />
                        {t('tiers.gold')}
                      </Box>
                      {getTierPriceLabel('gold') && (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {getTierPriceLabel('gold')}
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label={t('form.email')}
                type="email"
                {...form.register('email')}
                error={!!form.formState.errors.email}
                helperText={form.formState.errors.email?.message}
                data-testid="input-email"
              />

              <TextField
                fullWidth
                label={t('form.phone')}
                {...form.register('phone')}
                data-testid="input-phone"
              />

              <TextField
                fullWidth
                label={t('form.website')}
                {...form.register('website')}
                error={!!form.formState.errors.website}
                helperText={form.formState.errors.website?.message || t('form.websiteExample')}
                data-testid="input-website"
              />

              <TextField
                fullWidth
                label={t('form.logoUrl')}
                {...form.register('logoUrl')}
                helperText={t('form.logoHelp')}
                data-testid="input-logo"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} data-testid="button-cancel">
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={saveSponsorMutation.isPending}
              data-testid="button-save"
            >
              {saveSponsorMutation.isPending ? t('common.savingBtn') : t('common.save')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {reviewAction === 'approve' ? t('review.approveTitle') : t('review.rejectTitle')}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            {reviewAction === 'approve' 
              ? t('review.approveConfirm', { name: sponsorToReview?.name })
              : t('review.rejectConfirm', { name: sponsorToReview?.name })
            }
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label={reviewAction === 'approve' ? t('review.noteOptional') : t('review.reasonRequired')}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            required={reviewAction === 'reject'}
            data-testid="input-review-notes"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button 
            onClick={handleConfirmReview}
            variant="contained"
            color={reviewAction === 'approve' ? 'success' : 'error'}
            disabled={reviewSponsorMutation.isPending}
            data-testid="button-confirm-review"
          >
            {reviewSponsorMutation.isPending ? t('review.processing') : (reviewAction === 'approve' ? t('review.approve') : t('review.reject'))}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
