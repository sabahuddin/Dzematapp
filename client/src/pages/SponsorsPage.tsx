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
import { Sponsor, insertSponsorSchema } from '@shared/schema';
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

const tierLabels: Record<string, string> = {
  gold: 'Zlatni',
  silver: 'Srebreni',
  bronze: 'Bronzani'
};

const statusLabels: Record<string, string> = {
  pending: 'Na čekanju',
  active: 'Aktivno',
  expired: 'Isteklo',
  rejected: 'Odbijeno'
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
  const { t } = useTranslation(['common']);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [sponsorToReview, setSponsorToReview] = useState<Sponsor | null>(null);

  const isAdmin = currentUser?.isAdmin;

  const sponsorsQuery = useQuery<Sponsor[]>({
    queryKey: ['/api/sponsors'],
  });

  const activeSponsorsQuery = useQuery<Sponsor[]>({
    queryKey: ['/api/sponsors/active'],
  });

  const formSchema = z.object({
    name: z.string().min(1, 'Naziv je obavezan'),
    type: z.enum(['company', 'individual']),
    tier: z.enum(['bronze', 'silver', 'gold']),
    email: z.string().email('Neispravan email').optional().or(z.literal('')),
    phone: z.string().optional(),
    website: z.string().url('Neispravna web adresa').optional().or(z.literal('')),
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
        title: 'Uspješno', 
        description: selectedSponsor ? 'Sponzor ažuriran' : 'Prijava za sponzorstvo poslana' 
      });
      handleCloseDialog();
    },
    onError: () => {
      toast({ 
        title: 'Greška', 
        description: 'Došlo je do greške', 
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
      toast({ title: 'Uspješno', description: 'Sponzor obrisan' });
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri brisanju', variant: 'destructive' });
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
        title: 'Uspješno', 
        description: reviewAction === 'approve' ? 'Sponzorstvo odobreno' : 'Sponzorstvo odbijeno' 
      });
      setReviewDialogOpen(false);
      setSponsorToReview(null);
      setReviewNotes('');
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri obradi', variant: 'destructive' });
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
    if (window.confirm('Da li ste sigurni da želite obrisati ovog sponzora?')) {
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
        toast({ title: 'Greška', description: 'Morate unijeti razlog odbijanja', variant: 'destructive' });
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
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#1b5e20' }}>
        Naši sponzori
      </Typography>
      
      {activeSponsors.length === 0 ? (
        <Alert severity="info">Trenutno nema aktivnih sponzora.</Alert>
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
                    {tierLabels[tier]} sponzori
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
                            label={sponsor.type === 'company' ? 'Firma' : 'Fizičko lice'}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                          <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
                            {sponsor.website && (
                              <IconButton 
                                size="small" 
                                onClick={() => window.open(sponsor.website!, '_blank')}
                                data-testid={`link-sponsor-website-${sponsor.id}`}
                              >
                                <Language />
                              </IconButton>
                            )}
                            {sponsor.phone && (
                              <IconButton 
                                size="small"
                                onClick={() => window.open(`tel:${sponsor.phone}`, '_self')}
                                data-testid={`link-sponsor-phone-${sponsor.id}`}
                              >
                                <Phone />
                              </IconButton>
                            )}
                            {sponsor.email && (
                              <IconButton 
                                size="small"
                                onClick={() => window.open(`mailto:${sponsor.email}`, '_self')}
                                data-testid={`link-sponsor-email-${sponsor.id}`}
                              >
                                <Email />
                              </IconButton>
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

      <Card sx={{ mt: 4, p: 3, bgcolor: '#e8f5e9', borderRadius: '12px' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Postanite naš sponzor!
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Podržite naš džemat i promovirajte vaš posao u našoj zajednici. Odaberite nivo sponzorstva koji vam odgovara.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Chip icon={<EmojiEvents sx={{ color: tierColors.bronze }} />} label="Bronzani - osnovna reklama" />
          <Chip icon={<EmojiEvents sx={{ color: tierColors.silver }} />} label="Srebreni - istaknuta reklama" />
          <Chip icon={<EmojiEvents sx={{ color: tierColors.gold }} />} label="Zlatni - premium reklama" />
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          data-testid="button-become-sponsor"
          sx={{ 
            bgcolor: '#81c784',
            '&:hover': { bgcolor: '#66bb6a' }
          }}
        >
          Prijavite se za sponzorstvo
        </Button>
      </Card>
    </Box>
  );

  const renderAdminView = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#1b5e20' }}>
          Upravljanje sponzorima
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          data-testid="button-add-sponsor"
          sx={{ 
            bgcolor: '#81c784',
            '&:hover': { bgcolor: '#66bb6a' }
          }}
        >
          Dodaj sponzora
        </Button>
      </Box>

      {pendingSponsors.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {pendingSponsors.length} prijava čeka na odobrenje
        </Alert>
      )}

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sponzor</TableCell>
                <TableCell>Tip</TableCell>
                <TableCell>Nivo</TableCell>
                <TableCell>Kontakt</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Akcije</TableCell>
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
                      label={sponsor.type === 'company' ? 'Firma' : 'Fizičko lice'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      icon={<EmojiEvents sx={{ color: tierColors[sponsor.tier] }} />}
                      label={tierLabels[sponsor.tier]}
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
                      label={statusLabels[sponsor.status]}
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
                      Nema sponzora
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
          <Tab label="Javni prikaz" data-testid="tab-public" />
          <Tab label="Administracija" data-testid="tab-admin" />
        </Tabs>
      )}

      {activeTab === 0 || !isAdmin ? renderPublicView() : renderAdminView()}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {selectedSponsor ? 'Uredi sponzora' : 'Prijava za sponzorstvo'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Naziv (firme ili ime i prezime)"
                {...form.register('name')}
                error={!!form.formState.errors.name}
                helperText={form.formState.errors.name?.message}
                required
                data-testid="input-name"
              />
              
              <FormControl fullWidth>
                <InputLabel>Tip</InputLabel>
                <Select
                  {...form.register('type')}
                  defaultValue={form.getValues('type')}
                  label="Tip"
                  data-testid="select-type"
                >
                  <MenuItem value="company">Firma</MenuItem>
                  <MenuItem value="individual">Fizičko lice</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Nivo sponzorstva</InputLabel>
                <Select
                  {...form.register('tier')}
                  defaultValue={form.getValues('tier')}
                  label="Nivo sponzorstva"
                  data-testid="select-tier"
                >
                  <MenuItem value="bronze">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmojiEvents sx={{ color: tierColors.bronze }} />
                      Bronzani
                    </Box>
                  </MenuItem>
                  <MenuItem value="silver">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmojiEvents sx={{ color: tierColors.silver }} />
                      Srebreni
                    </Box>
                  </MenuItem>
                  <MenuItem value="gold">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmojiEvents sx={{ color: tierColors.gold }} />
                      Zlatni
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Email"
                type="email"
                {...form.register('email')}
                error={!!form.formState.errors.email}
                helperText={form.formState.errors.email?.message}
                data-testid="input-email"
              />

              <TextField
                fullWidth
                label="Telefon"
                {...form.register('phone')}
                data-testid="input-phone"
              />

              <TextField
                fullWidth
                label="Web stranica"
                {...form.register('website')}
                error={!!form.formState.errors.website}
                helperText={form.formState.errors.website?.message || 'npr. https://www.firma.ba'}
                data-testid="input-website"
              />

              <TextField
                fullWidth
                label="URL loga/slike"
                {...form.register('logoUrl')}
                helperText="Link do slike vašeg loga"
                data-testid="input-logo"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} data-testid="button-cancel">
              Otkaži
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={saveSponsorMutation.isPending}
              data-testid="button-save"
            >
              {saveSponsorMutation.isPending ? 'Spremam...' : 'Spremi'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {reviewAction === 'approve' ? 'Odobri sponzorstvo' : 'Odbij sponzorstvo'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            {reviewAction === 'approve' 
              ? `Da li želite odobriti sponzorstvo za "${sponsorToReview?.name}"?`
              : `Da li želite odbiti sponzorstvo za "${sponsorToReview?.name}"?`
            }
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label={reviewAction === 'approve' ? 'Napomena (opcionalno)' : 'Razlog odbijanja (obavezno)'}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            required={reviewAction === 'reject'}
            data-testid="input-review-notes"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Otkaži</Button>
          <Button 
            onClick={handleConfirmReview}
            variant="contained"
            color={reviewAction === 'approve' ? 'success' : 'error'}
            disabled={reviewSponsorMutation.isPending}
            data-testid="button-confirm-review"
          >
            {reviewSponsorMutation.isPending ? 'Obrađujem...' : (reviewAction === 'approve' ? 'Odobri' : 'Odbij')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
