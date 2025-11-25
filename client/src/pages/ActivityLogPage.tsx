import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Stack,
  Checkbox,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Timeline,
  CheckCircle,
  Person,
  Event,
  Campaign,
  AttachMoney,
  EmojiEvents,
  Work,
  Download,
  ReceiptLong,
  BadgeOutlined,
  Send as SendIcon,
  Add,
  Edit,
  Delete,
  Upload,
  TrendingUp
} from '@mui/icons-material';
import { ActivityLog, User, UserCertificate, FinancialContribution, Badge, insertBadgeSchema } from '@shared/schema';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { exportToExcel } from '../utils/excelExport';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { UpgradeCTA } from '../components/UpgradeCTA';
import { useCurrency } from '../contexts/CurrencyContext';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface CertificateTemplate {
  id: string;
  name: string;
  description: string | null;
  templateImagePath: string;
  textPositionX: number | null;
  textPositionY: number | null;
  fontSize: number | null;
  fontColor: string | null;
}

export default function ActivityLogPage() {
  const { t } = useTranslation(['activity', 'finances', 'common', 'badges']);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const featureAccess = useFeatureAccess('activity-log');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'activities' | 'contributions' | 'bodove' | 'badges-manage' | 'badges-earned' | 'zahvale' | 'templates' | 'issue' | 'issued' | 'issued-badges'>('activities');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');

  if (featureAccess.upgradeRequired && !currentUser?.isAdmin) {
    return <UpgradeCTA moduleId="activity-log" requiredPlan={featureAccess.requiredPlan || 'full'} currentPlan={featureAccess.currentPlan || 'standard'} />;
  }

  // Queries
  const activityLogsQuery = useQuery({
    queryKey: currentUser?.isAdmin ? ['/api/activity-logs'] : [`/api/activity-logs/user/${currentUser?.id}`],
    enabled: !!currentUser,
  });

  const contributionsQuery = useQuery({
    queryKey: currentUser?.isAdmin ? ['/api/financial-contributions'] : [`/api/financial-contributions/user/${currentUser?.id}`],
    enabled: !!currentUser,
  });

  const badgesQuery = useQuery({ queryKey: ['/api/badges'], enabled: !!currentUser });
  const userBadgesQuery = useQuery({
    queryKey: ['/api/user-badges', currentUser?.id],
    enabled: !!currentUser?.id,
  });

  const certificatesQuery = useQuery({
    queryKey: currentUser?.isAdmin ? ['/api/certificates/all'] : ['/api/certificates/user'],
    enabled: !!currentUser,
  });

  const usersQuery = useQuery({
    queryKey: ['/api/users'],
    enabled: currentUser?.isAdmin || false,
  });

  const templatesQuery = useQuery({
    queryKey: ['/api/certificates/templates'],
    enabled: currentUser?.isAdmin || false,
  });

  // Badge form
  const badgeFormSchema = insertBadgeSchema.extend({
    name: z.string().min(1, 'Naziv je obavezan'),
    description: z.string().min(1, 'Opis je obavezan'),
    criteriaType: z.string().min(1, 'Tip kriterija je obavezan'),
    criteriaValue: z.number().min(0, 'Vrijednost mora biti pozitivna'),
  });

  const badgeForm = useForm<z.infer<typeof badgeFormSchema>>({
    resolver: zodResolver(badgeFormSchema),
    defaultValues: {
      name: '',
      description: '',
      criteriaType: '',
      criteriaValue: 0,
      icon: null,
    }
  });

  // Mutations
  const issueMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate || selectedUsers.size === 0) throw new Error("Template i korisnici su obavezni");
      return apiRequest('/api/certificates/issue', 'POST', {
        templateId: selectedTemplate,
        userIds: Array.from(selectedUsers),
        customMessage: customMessage || null,
      });
    },
    onSuccess: (data: any) => {
      toast({ title: "Uspješno", description: `Izdato ${data.count} zahvalnica` });
      setSelectedUsers(new Set());
      setSelectedTemplate("");
      setCustomMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/all'] });
    },
    onError: (error: Error) => {
      toast({ title: "Greška", description: error.message, variant: "destructive" });
    },
  });

  const saveBadgeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof badgeFormSchema>) => {
      if (selectedBadge) {
        return apiRequest(`/api/badges/${selectedBadge.id}`, 'PUT', data);
      } else {
        return apiRequest('/api/badges', 'POST', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/badges'] });
      toast({ title: "Uspješno", description: selectedBadge ? "Značka ažurirana" : "Značka kreirана" });
      setBadgeDialogOpen(false);
      setSelectedBadge(null);
      badgeForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Greška", description: error.message, variant: "destructive" });
    },
  });

  const deleteBadgeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/badges/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/badges'] });
      toast({ title: "Uspješno", description: "Značka obrisana" });
    },
    onError: (error: Error) => {
      toast({ title: "Greška", description: error.message, variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/certificates/templates/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/templates'] });
      toast({ title: "Uspješno", description: "Šablon obrisan" });
    },
    onError: (error: Error) => {
      toast({ title: "Greška", description: error.message, variant: "destructive" });
    },
  });

  // Helpers
  const getUserName = (userId: string) => {
    const user = (usersQuery.data as User[])?.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : t('unknown');
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_completed': return <CheckCircle />;
      case 'event_rsvp': return <Event />;
      case 'announcement_read': return <Campaign />;
      case 'contribution_made': return <AttachMoney />;
      case 'badge_earned': return <EmojiEvents />;
      case 'profile_updated': return <Person />;
      case 'project_contribution': return <Work />;
      default: return <Timeline />;
    }
  };

  const getActivityColor = (type: string) => {
    const colors: Record<string, any> = {
      'task_completed': 'success',
      'event_rsvp': 'primary',
      'announcement_read': 'info',
      'contribution_made': 'success',
      'badge_earned': 'warning',
      'profile_updated': 'default',
      'project_contribution': 'secondary',
    };
    return colors[type] || 'default';
  };

  const getActivityLabel = (type: string) => {
    const labels: Record<string, string> = {
      'task_completed': t('activityLabels.task_completed'),
      'event_rsvp': t('activityLabels.event_rsvp'),
      'announcement_read': t('activityLabels.announcement_read'),
      'contribution_made': t('activityLabels.contribution_made'),
      'badge_earned': t('activityLabels.badge_earned'),
      'profile_updated': t('activityLabels.profile_updated'),
      'project_contribution': t('activityLabels.project_contribution')
    };
    return labels[type] || type;
  };

  const filteredActivities = ((activityLogsQuery.data as ActivityLog[]) || []).filter((activity: ActivityLog) => {
    const matchesType = filterType === 'all' || activity.activityType === filterType;
    if (!matchesType) return false;
    if (!searchTerm) return true;
    const user = (usersQuery.data as User[] || []).find(u => u.id === activity.userId);
    return (user && `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const allBadges = (badgesQuery.data as any[]) || [];
  const userBadges = (userBadgesQuery.data as any[]) || [];
  const earnedBadges = userBadges.map((ub: any) => {
    const badge = allBadges.find((b: any) => b.id === ub.badgeId);
    return { ...badge, earnedAt: ub.earnedAt };
  }).filter(Boolean);

  const filteredUsers = ((usersQuery.data as User[]) || []).filter(u => {
    if (u.isAdmin || u.id === currentUser?.id) return false;
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    const dob = u.dateOfBirth || '';
    return fullName.includes(userSearchTerm.toLowerCase()) || dob.includes(userSearchTerm.toLowerCase());
  });

  const allIssuedBadges = ((userBadgesQuery.data as any[]) || []).map((ub: any) => {
    const badge = allBadges.find((b: any) => b.id === ub.badgeId);
    const user = (usersQuery.data as User[])?.find(u => u.id === ub.userId);
    return { ...ub, badge, user };
  }).filter(Boolean);

  const handleExportActivityLogsToExcel = () => {
    if (!filteredActivities || filteredActivities.length === 0) {
      toast({ title: 'Greška', description: 'Nema podataka za export', variant: 'destructive' });
      return;
    }

    const activityData = filteredActivities.map((activity: ActivityLog) => [
      currentUser?.isAdmin ? getUserName(activity.userId) : '-',
      getActivityLabel(activity.activityType),
      activity.description,
      activity.points || 0,
      activity.createdAt ? new Date(activity.createdAt).toLocaleDateString('hr-HR') : '-'
    ]);

    exportToExcel({
      title: 'Zapisnik aktivnosti',
      filename: 'Aktivnosti',
      sheetName: 'Aktivnosti',
      headers: ['Korisnik', 'Tip aktivnosti', 'Opis', 'Bodovi', 'Datum'],
      data: activityData
    });

    toast({ title: 'Uspjeh', description: 'Excel fajl je preuzet' });
  };

  const isLoading = activityLogsQuery.isLoading || contributionsQuery.isLoading || badgesQuery.isLoading || userBadgesQuery.isLoading || certificatesQuery.isLoading;

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {currentUser?.isAdmin ? 'Pregled' : 'Moje aktivnosti'}
        </Typography>
        {currentUser?.isAdmin && activeTab === 'activities' && (
          <Button variant="outlined" startIcon={<Download />} onClick={handleExportActivityLogsToExcel} data-testid="button-export-excel">
            Exportuj u Excel
          </Button>
        )}
      </Box>

      {/* Tab Buttons */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <Button variant={activeTab === 'activities' ? 'contained' : 'outlined'} onClick={() => setActiveTab('activities')} data-testid="tab-activities">
          Aktivnosti
        </Button>
        <Button variant={activeTab === 'contributions' ? 'contained' : 'outlined'} onClick={() => setActiveTab('contributions')} data-testid="tab-contributions" startIcon={<AttachMoney />}>
          Uplate
        </Button>
        <Button variant={activeTab === 'bodove' ? 'contained' : 'outlined'} onClick={() => setActiveTab('bodove')} data-testid="tab-bodove" startIcon={<EmojiEvents />}>
          Bodovi
        </Button>
        {currentUser?.isAdmin && (
          <>
            <Button variant={activeTab === 'badges-manage' ? 'contained' : 'outlined'} onClick={() => setActiveTab('badges-manage')} data-testid="tab-badges-manage" startIcon={<BadgeOutlined />}>
              Značke
            </Button>
            <Button variant={activeTab === 'issued-badges' ? 'contained' : 'outlined'} onClick={() => setActiveTab('issued-badges')} data-testid="tab-issued-badges" startIcon={<BadgeOutlined />}>
              Dodjeljene značke
            </Button>
            <Button variant={activeTab === 'templates' ? 'contained' : 'outlined'} onClick={() => setActiveTab('templates')} data-testid="tab-templates">
              Šabloni zahvala
            </Button>
            <Button variant={activeTab === 'issue' ? 'contained' : 'outlined'} onClick={() => setActiveTab('issue')} data-testid="tab-issue" startIcon={<SendIcon />}>
              Dodjeli zahvalnicu
            </Button>
            <Button variant={activeTab === 'issued' ? 'contained' : 'outlined'} onClick={() => setActiveTab('issued')} data-testid="tab-issued" startIcon={<ReceiptLong />}>
              Dodijeljene zahvale
            </Button>
          </>
        )}
        {!currentUser?.isAdmin && (
          <>
            <Button variant={activeTab === 'badges-earned' ? 'contained' : 'outlined'} onClick={() => setActiveTab('badges-earned')} data-testid="tab-badges-earned" startIcon={<BadgeOutlined />}>
              Značke ({earnedBadges.length})
            </Button>
            <Button variant={activeTab === 'zahvale' ? 'contained' : 'outlined'} onClick={() => setActiveTab('zahvale')} data-testid="tab-zahvale" startIcon={<ReceiptLong />}>
              Zahvale
            </Button>
          </>
        )}
      </Box>

      {/* Activities Tab */}
      {activeTab === 'activities' && (
        <Card>
          <Box sx={{ p: 3, borderBottom: '1px solid hsl(0 0% 88%)' }}>
            <Grid container spacing={2}>
              {currentUser?.isAdmin && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField variant="outlined" placeholder={t('searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} fullWidth data-testid="input-search" />
                </Grid>
              )}
              <Grid size={{ xs: 12, md: currentUser?.isAdmin ? 6 : 12 }}>
                <FormControl fullWidth>
                  <InputLabel>{t('filterByType')}</InputLabel>
                  <Select value={filterType} label={t('filterByType')} onChange={(e) => setFilterType(e.target.value)} data-testid="select-filter-type">
                    <MenuItem value="all">{t('filterOptions.all')}</MenuItem>
                    <MenuItem value="task_completed">{t('filterOptions.task_completed')}</MenuItem>
                    <MenuItem value="event_rsvp">{t('filterOptions.event_rsvp')}</MenuItem>
                    <MenuItem value="contribution_made">{t('filterOptions.contribution_made')}</MenuItem>
                    <MenuItem value="badge_earned">{t('filterOptions.badge_earned')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  {currentUser?.isAdmin && <TableCell>{t('user')}</TableCell>}
                  <TableCell>{t('type')}</TableCell>
                  <TableCell>{t('description')}</TableCell>
                  <TableCell>{t('points')}</TableCell>
                  <TableCell>{t('date')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredActivities.map((activity: ActivityLog) => (
                  <TableRow key={activity.id}>
                    {currentUser?.isAdmin && (
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            {getUserName(activity.userId).charAt(0)}
                          </Avatar>
                          <Typography variant="body2" fontWeight={500}>{getUserName(activity.userId)}</Typography>
                        </Box>
                      </TableCell>
                    )}
                    <TableCell>
                      <Chip icon={getActivityIcon(activity.activityType)} label={getActivityLabel(activity.activityType)} color={getActivityColor(activity.activityType) as any} size="small" data-testid={`type-${activity.id}`} />
                    </TableCell>
                    <TableCell><Typography variant="body2" data-testid={`description-${activity.id}`}>{activity.description}</Typography></TableCell>
                    <TableCell>
                      {activity.points && activity.points > 0 ? (
                        <Chip icon={<EmojiEvents />} label={`+${activity.points}`} color="warning" size="small" data-testid={`points-${activity.id}`} />
                      ) : ('-')}
                    </TableCell>
                    <TableCell>{new Date(activity.createdAt).toLocaleString('hr-HR')}</TableCell>
                  </TableRow>
                ))}
                {filteredActivities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={currentUser?.isAdmin ? 5 : 4} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">{t('noActivities')}</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Contributions Tab */}
      {activeTab === 'contributions' && (
        <Card>
          <Box sx={{ p: 3 }}>
            {(contributionsQuery.data as FinancialContribution[])?.length === 0 ? (
              <Alert severity="info">{currentUser?.isAdmin ? 'Nema uplata' : 'Još niste napravili nijednu uplatu'}</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {currentUser?.isAdmin && <TableCell>Korisnik</TableCell>}
                      <TableCell>Iznos</TableCell>
                      <TableCell>Svrha</TableCell>
                      <TableCell>Datum</TableCell>
                      <TableCell>Napomena</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(contributionsQuery.data as FinancialContribution[])?.map((contrib: FinancialContribution) => (
                      <TableRow key={contrib.id}>
                        {currentUser?.isAdmin && <TableCell><Typography variant="body2">{getUserName(contrib.userId)}</Typography></TableCell>}
                        <TableCell><Chip icon={<AttachMoney />} label={formatPrice(contrib.amount)} color="success" size="small" /></TableCell>
                        <TableCell>{contrib.purpose}</TableCell>
                        <TableCell>{contrib.paymentDate ? new Date(contrib.paymentDate).toLocaleDateString('hr-HR') : '-'}</TableCell>
                        <TableCell>{contrib.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Card>
      )}

      {/* Bodove Tab */}
      {activeTab === 'bodove' && (
        <Card>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <EmojiEvents sx={{ fontSize: 40, color: 'hsl(14 100% 45%)' }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {currentUser?.isAdmin ? 'Pregled svih bodova' : 'Vaši bodovi'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentUser?.isAdmin ? 'Bodovi svih članova' : 'Detaljan pregled svih bodova koje ste zaradili'}
                </Typography>
              </Box>
            </Box>

            {/* Total Points Card - Only for member view */}
            {!currentUser?.isAdmin && (
              <Card sx={{ mb: 3, p: 3, bgcolor: 'hsl(36 100% 94%)', borderLeft: '4px solid hsl(14 100% 45%)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingUp sx={{ fontSize: 48, color: 'hsl(14 100% 45%)' }} />
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: 'hsl(14 100% 45%)' }}>
                      {((activityLogsQuery.data as ActivityLog[]) || []).reduce((sum, entry) => sum + (entry.points || 0), 0)}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Ukupno bodova
                    </Typography>
                  </Box>
                </Box>
              </Card>
            )}

            {/* Activity Log Table */}
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    {currentUser?.isAdmin && <TableCell><strong>Korisnik</strong></TableCell>}
                    <TableCell><strong>Tip Aktivnosti</strong></TableCell>
                    <TableCell><strong>Opis</strong></TableCell>
                    <TableCell align="center"><strong>Bodovi</strong></TableCell>
                    <TableCell><strong>Datum</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {((activityLogsQuery.data as ActivityLog[]) || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={currentUser?.isAdmin ? 5 : 4} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">
                          Nema aktivnosti za prikaz
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    ((activityLogsQuery.data as ActivityLog[]) || [])
                      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
                      .map((entry: ActivityLog) => (
                        <TableRow key={entry.id} hover>
                          {currentUser?.isAdmin && (
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                  {getUserName(entry.userId).charAt(0)}
                                </Avatar>
                                <Typography variant="body2" fontWeight={500}>{getUserName(entry.userId)}</Typography>
                              </Box>
                            </TableCell>
                          )}
                          <TableCell>
                            <Chip icon={getActivityIcon(entry.activityType)} label={getActivityLabel(entry.activityType)} color={getActivityColor(entry.activityType) as any} size="small" />
                          </TableCell>
                          <TableCell><Typography variant="body2">{entry.description}</Typography></TableCell>
                          <TableCell align="center">
                            <Typography sx={{ fontWeight: 600, color: (entry.points || 0) > 0 ? 'hsl(122 60% 29%)' : 'inherit' }}>
                              +{entry.points || 0}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('hr-HR') : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Card>
      )}

      {/* Badges Admin Tab */}
      {activeTab === 'badges-manage' && currentUser?.isAdmin && (
        <Card>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Upravljanje značkama</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedBadge(null); badgeForm.reset(); setBadgeDialogOpen(true); }} data-testid="button-add-badge">
                Dodaj novu značku
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Naziv</TableCell>
                    <TableCell>Opis</TableCell>
                    <TableCell>Kriterij</TableCell>
                    <TableCell>Vrijednost</TableCell>
                    <TableCell>Akcije</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allBadges.map((badge: any) => (
                    <TableRow key={badge.id}>
                      <TableCell>{badge.name}</TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{badge.description}</Typography></TableCell>
                      <TableCell>{badge.criteriaType}</TableCell>
                      <TableCell>{badge.criteriaValue}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton size="small" onClick={() => { setSelectedBadge(badge); badgeForm.reset({ ...badge }); setBadgeDialogOpen(true); }} sx={{ color: '#1976d2' }} data-testid={`button-edit-${badge.id}`}>
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => deleteBadgeMutation.mutate(badge.id)} sx={{ color: '#d32f2f' }} data-testid={`button-delete-${badge.id}`}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Card>
      )}

      {/* Earned Badges Tab */}
      {activeTab === 'badges-earned' && !currentUser?.isAdmin && (
        <Card>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Značke ({earnedBadges.length})</Typography>
            {earnedBadges.length === 0 ? (
              <Alert severity="info">Još niste osvojili nijednu značku</Alert>
            ) : (
              <Stack spacing={2}>
                {earnedBadges.map((badge: any) => (
                  <Card key={badge.id} sx={{ p: 2, border: '2px solid hsl(76 100% 29%)', bgcolor: 'hsl(76 100% 97%)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ fontSize: '2rem', textAlign: 'center', minWidth: 60 }}>{badge.icon || '🏆'}</Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>{badge.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{badge.description}</Typography>
                        {badge.earnedAt && <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>Osvojena: {new Date(badge.earnedAt).toLocaleDateString('hr-HR')}</Typography>}
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        </Card>
      )}

      {/* Certificate Templates Tab */}
      {activeTab === 'templates' && currentUser?.isAdmin && (
        <Card>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Šabloni zahvalnica</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} data-testid="button-manage-templates">
                Upravljaj šablonima
              </Button>
            </Box>

            {(templatesQuery.data as CertificateTemplate[])?.length === 0 ? (
              <Alert severity="info">Nema kreiranih šablona zahvalnica</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Naziv</TableCell>
                      <TableCell>Opis</TableCell>
                      <TableCell>Font</TableCell>
                      <TableCell>Akcije</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(templatesQuery.data as CertificateTemplate[])?.map((template: CertificateTemplate) => (
                      <TableRow key={template.id}>
                        <TableCell>{template.name}</TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{template.description || '-'}</Typography></TableCell>
                        <TableCell>{template.fontSize}px {template.fontColor}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton size="small" href={`/certificate-templates?edit=${template.id}`} target="_blank" sx={{ color: '#1976d2' }} data-testid={`button-edit-template-${template.id}`}>
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => deleteTemplateMutation.mutate(template.id)} sx={{ color: '#d32f2f' }} data-testid={`button-delete-template-${template.id}`}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Card>
      )}

      {/* Issue Certificates Tab */}
      {activeTab === 'issue' && currentUser?.isAdmin && (
        <Stack spacing={3}>
          <Card>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Izbor šablona</Typography>
              <FormControl fullWidth>
                <InputLabel>Šablon</InputLabel>
                <Select value={selectedTemplate} label="Šablon" onChange={(e) => setSelectedTemplate(e.target.value)} data-testid="select-template">
                  {(templatesQuery.data as CertificateTemplate[])?.map((template) => (
                    <MenuItem key={template.id} value={template.id}>{template.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {selectedTemplate && (
                <Box sx={{ mt: 2 }}>
                  <TextField fullWidth multiline rows={3} label="Poruka (opcionalno)" value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} data-testid="input-custom-message" />
                </Box>
              )}
            </Box>
          </Card>

          {selectedTemplate && (
            <Card>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Odaberi korisnike ({selectedUsers.size}/{filteredUsers.length})</Typography>

                <TextField fullWidth placeholder="Pretraži po imenu ili datumu rođenja..." value={userSearchTerm} onChange={(e) => setUserSearchTerm(e.target.value)} sx={{ mb: 2 }} data-testid="input-user-search" />

                <Box sx={{ mb: 2 }}>
                  <Checkbox checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0} onChange={() => {
                    if (selectedUsers.size === filteredUsers.length) {
                      setSelectedUsers(new Set());
                    } else {
                      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
                    }
                  }} />
                  <Typography component="span" variant="body2">Odaberi sve</Typography>
                </Box>

                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 50 }}><Checkbox /></TableCell>
                        <TableCell>Korisnik</TableCell>
                        <TableCell>Datum rođenja</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredUsers.map((user: User) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <Checkbox checked={selectedUsers.has(user.id)} onChange={() => {
                              const newSelected = new Set(selectedUsers);
                              if (newSelected.has(user.id)) {
                                newSelected.delete(user.id);
                              } else {
                                newSelected.add(user.id);
                              }
                              setSelectedUsers(newSelected);
                            }} />
                          </TableCell>
                          <TableCell>{user.firstName} {user.lastName}</TableCell>
                          <TableCell>{user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('hr-HR') : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ mt: 3 }}>
                  <Button fullWidth variant="contained" color="primary" onClick={() => issueMutation.mutate()} disabled={selectedUsers.size === 0 || issueMutation.isPending} data-testid="button-issue-certificates">
                    {issueMutation.isPending ? 'Slanje...' : `Dodjeli zahvalnicu (${selectedUsers.size})`}
                  </Button>
                </Box>
              </Box>
            </Card>
          )}
        </Stack>
      )}

      {/* Issued Certificates Tab */}
      {activeTab === 'issued' && currentUser?.isAdmin && (
        <Card>
          <Box sx={{ p: 3 }}>
            {(certificatesQuery.data as UserCertificate[])?.length === 0 ? (
              <Alert severity="info">Nema dodijeljenih zahvalnica</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Korisnik</TableCell>
                      <TableCell>Primatelj</TableCell>
                      <TableCell>Datum izdavanja</TableCell>
                      <TableCell>Akcije</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(certificatesQuery.data as UserCertificate[])?.map((cert: UserCertificate) => (
                      <TableRow key={cert.id}>
                        <TableCell><Typography variant="body2">{getUserName(cert.userId)}</Typography></TableCell>
                        <TableCell>{cert.recipientName}</TableCell>
                        <TableCell>{cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString('hr-HR') : '-'}</TableCell>
                        <TableCell>
                          <Button size="small" href={cert.certificateImagePath} download variant="outlined" data-testid={`button-download-${cert.id}`}>
                            Preuzmi
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Card>
      )}

      {/* Zahvale Tab - Members Only */}
      {activeTab === 'zahvale' && !currentUser?.isAdmin && (
        <Card>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <ReceiptLong sx={{ fontSize: 40, color: 'hsl(14 100% 45%)' }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Vaše zahvale
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Zahvale koje ste dobili za vaše doprinos
                </Typography>
              </Box>
            </Box>

            {(certificatesQuery.data as UserCertificate[])?.length === 0 ? (
              <Alert severity="info">Još niste dobili nijednu zahvalnicu</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Primatelj</strong></TableCell>
                      <TableCell><strong>Datum izdavanja</strong></TableCell>
                      <TableCell><strong>Akcije</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(certificatesQuery.data as UserCertificate[])?.map((cert: UserCertificate) => (
                      <TableRow key={cert.id} hover>
                        <TableCell>{cert.recipientName}</TableCell>
                        <TableCell>{cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString('hr-HR') : '-'}</TableCell>
                        <TableCell>
                          <Button size="small" href={cert.certificateImagePath} download variant="outlined" data-testid={`button-download-${cert.id}`}>
                            Preuzmi
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Card>
      )}

      {/* Issued Badges Tab */}
      {activeTab === 'issued-badges' && currentUser?.isAdmin && (
        <Card>
          <Box sx={{ p: 3 }}>
            {allIssuedBadges.length === 0 ? (
              <Alert severity="info">Nema dodjeljenih značaka</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Korisnik</TableCell>
                      <TableCell>Značka</TableCell>
                      <TableCell>Opis</TableCell>
                      <TableCell>Datum dodjele</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allIssuedBadges.map((item: any) => (
                      <TableRow key={`${item.userId}-${item.badgeId}`}>
                        <TableCell><Typography variant="body2">{item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Nepoznat korisnik'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{item.badge?.name || 'Nepoznata značka'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{item.badge?.description || '-'}</Typography></TableCell>
                        <TableCell>{item.earnedAt ? new Date(item.earnedAt).toLocaleDateString('hr-HR') : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Card>
      )}

      {/* Badge Dialog */}
      <Dialog open={badgeDialogOpen} onClose={() => { setBadgeDialogOpen(false); setSelectedBadge(null); badgeForm.reset(); }} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedBadge ? 'Uredi značku' : 'Dodaj novu značku'}</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Stack spacing={2}>
            <TextField fullWidth label="Naziv" {...badgeForm.register('name')} error={!!badgeForm.formState.errors.name} helperText={badgeForm.formState.errors.name?.message} data-testid="input-badge-name" />
            <TextField fullWidth label="Opis" {...badgeForm.register('description')} error={!!badgeForm.formState.errors.description} helperText={badgeForm.formState.errors.description?.message} data-testid="input-badge-description" />
            <FormControl fullWidth>
              <InputLabel>Tip kriterija</InputLabel>
              <Select {...badgeForm.register('criteriaType')} label="Tip kriterija" data-testid="select-criteria-type">
                <MenuItem value="points_total">Ukupno bodova</MenuItem>
                <MenuItem value="contributions_amount">Iznos doprinosa</MenuItem>
                <MenuItem value="tasks_completed">Završeni zadaci</MenuItem>
                <MenuItem value="events_attended">Posjećeni eventi</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth type="number" label="Vrijednost" {...badgeForm.register('criteriaValue', { valueAsNumber: true })} error={!!badgeForm.formState.errors.criteriaValue} helperText={badgeForm.formState.errors.criteriaValue?.message} data-testid="input-criteria-value" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setBadgeDialogOpen(false); setSelectedBadge(null); badgeForm.reset(); }}>Otkaži</Button>
          <Button variant="contained" onClick={badgeForm.handleSubmit((data) => saveBadgeMutation.mutate(data))} data-testid="button-save-badge">Spremi</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
