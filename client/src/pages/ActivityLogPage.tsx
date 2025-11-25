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
  LinearProgress,
  FormControlLabel
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
  Dashboard as DashboardIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { ActivityLog, User, UserCertificate, UserBadge, FinancialContribution } from '@shared/schema';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { exportToExcel } from '../utils/excelExport';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { UpgradeCTA } from '../components/UpgradeCTA';
import { useCurrency } from '../contexts/CurrencyContext';
import { queryClient, apiRequest } from '@/lib/queryClient';

interface CertificateTemplate {
  id: string;
  name: string;
  description: string | null;
  templateImagePath: string;
}

export default function ActivityLogPage() {
  const { t } = useTranslation(['activity', 'finances', 'common']);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const featureAccess = useFeatureAccess('activity-log');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'activities' | 'certificates' | 'badges' | 'contributions' | 'issue'>('dashboard');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');

  if (featureAccess.upgradeRequired) {
    return <UpgradeCTA moduleId="activity-log" requiredPlan={featureAccess.requiredPlan || 'full'} currentPlan={featureAccess.currentPlan || 'standard'} />;
  }

  // Fetch activity logs
  const activityLogsQuery = useQuery({
    queryKey: currentUser?.isAdmin 
      ? ['/api/activity-logs'] 
      : [`/api/activity-logs/user/${currentUser?.id}`],
    enabled: !!currentUser,
  });

  // Fetch certificates
  const certificatesQuery = useQuery({
    queryKey: currentUser?.isAdmin 
      ? ['/api/certificates/all']
      : ['/api/certificates/user'],
    enabled: !!currentUser && featureAccess.hasAccess,
  });

  // Fetch badges
  const badgesQuery = useQuery({
    queryKey: ['/api/badges'],
    enabled: !!currentUser,
  });

  const userBadgesQuery = useQuery({
    queryKey: ['/api/user-badges', currentUser?.id],
    enabled: !!currentUser?.id,
  });

  // Fetch financial contributions
  const contributionsQuery = useQuery({
    queryKey: currentUser?.isAdmin 
      ? ['/api/financial-contributions'] 
      : [`/api/financial-contributions/user/${currentUser?.id}`],
    enabled: !!currentUser && featureAccess.hasAccess,
  });

  // Fetch users (for admin)
  const usersQuery = useQuery({
    queryKey: ['/api/users'],
    enabled: currentUser?.isAdmin || false,
  });

  // Fetch certificate templates (for admin)
  const templatesQuery = useQuery({
    queryKey: ['/api/certificates/templates'],
    enabled: currentUser?.isAdmin || false,
  });

  // Issue certificates mutation
  const issueMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate) {
        throw new Error("Template nije izabran");
      }
      if (selectedUsers.size === 0) {
        throw new Error("Nije izabran nijedan korisnik");
      }

      return apiRequest('/api/certificates/issue', 'POST', {
        templateId: selectedTemplate,
        userIds: Array.from(selectedUsers),
        customMessage: customMessage || null,
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Uspješno",
        description: `Izdato ${data.count} zahvalnic${data.count === 1 ? 'a' : 'e'}`,
      });
      setSelectedUsers(new Set());
      setSelectedTemplate("");
      setCustomMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/all'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Greška",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getUserName = (userId: string) => {
    if (!usersQuery.data) return t('unknown');
    const user = (usersQuery.data as User[]).find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : t('unknown');
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_completed':
        return <CheckCircle />;
      case 'event_rsvp':
        return <Event />;
      case 'announcement_read':
        return <Campaign />;
      case 'contribution_made':
        return <AttachMoney />;
      case 'badge_earned':
        return <EmojiEvents />;
      case 'profile_updated':
        return <Person />;
      case 'project_contribution':
        return <Work />;
      default:
        return <Timeline />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'task_completed':
        return 'success';
      case 'event_rsvp':
        return 'primary';
      case 'announcement_read':
        return 'info';
      case 'contribution_made':
        return 'success';
      case 'badge_earned':
        return 'warning';
      case 'profile_updated':
        return 'default';
      case 'project_contribution':
        return 'secondary';
      default:
        return 'default';
    }
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
    const matchesSearch = 
      (user && `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleExportActivityLogsToExcel = () => {
    if (!filteredActivities || filteredActivities.length === 0) {
      toast({
        title: 'Greška',
        description: 'Nema podataka za export',
        variant: 'destructive'
      });
      return;
    }

    const activityData = filteredActivities.map((activity: ActivityLog) => [
      currentUser?.isAdmin ? getUserName(activity.userId) : '-',
      getActivityLabel(activity.activityType),
      activity.description,
      activity.points || 0,
      activity.createdAt ? new Date(activity.createdAt).toLocaleDateString('hr-HR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : '-'
    ]);

    exportToExcel({
      title: 'Zapisnik aktivnosti',
      filename: 'Aktivnosti',
      sheetName: 'Aktivnosti',
      headers: [
        'Korisnik',
        'Tip aktivnosti',
        'Opis',
        'Bodovi',
        'Datum i vrijeme'
      ],
      data: activityData
    });

    toast({
      title: 'Uspjeh',
      description: 'Excel fajl je preuzet'
    });
  };

  const allBadges = (badgesQuery.data as any[]) || [];
  const userBadges = (userBadgesQuery.data as any[]) || [];
  const earnedBadges = userBadges.map((ub: any) => {
    const badge = allBadges.find((b: any) => b.id === ub.badgeId);
    return {
      ...badge,
      earnedAt: ub.earnedAt,
    };
  }).filter(Boolean);

  // Calculate total points for current user
  const userActivities = ((activityLogsQuery.data as ActivityLog[]) || []).filter(a => a.userId === currentUser?.id);
  const totalPoints = userActivities.reduce((sum, a) => sum + (a.points || 0), 0);

  // Find next badge
  const sortedBadges = [...allBadges].sort((a, b) => a.criteriaValue - b.criteriaValue);
  const nextBadge = sortedBadges.find(b => b.criteriaValue > totalPoints);
  const pointsToNextBadge = nextBadge ? nextBadge.criteriaValue - totalPoints : 0;

  const getBadgeColor = (criteriaType: string) => {
    switch (criteriaType) {
      case 'points_total': return { bg: 'var(--semantic-award-bg)', text: 'var(--semantic-award-text)', border: 'var(--semantic-award-border)' };
      case 'contributions_amount': return { bg: 'var(--semantic-success-bg)', text: 'var(--semantic-success-text)', border: 'var(--semantic-success-border)' };
      case 'tasks_completed': return { bg: 'var(--semantic-info-bg)', text: 'var(--semantic-info-text)', border: 'var(--semantic-info-border)' };
      case 'events_attended': return { bg: 'var(--semantic-celebration-bg)', text: 'var(--semantic-celebration-text)', border: 'var(--semantic-celebration-border)' };
      default: return { bg: 'hsl(0 0% 96%)', text: '#616161', border: 'hsl(0 0% 74%)' };
    }
  };

  const isLoading = activityLogsQuery.isLoading || certificatesQuery.isLoading || badgesQuery.isLoading || userBadgesQuery.isLoading || contributionsQuery.isLoading;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  const filteredUsers = ((usersQuery.data as User[]) || []).filter(u => 
    !u.isAdmin && u.id !== currentUser?.id
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {currentUser?.isAdmin ? 'Pregled' : 'Moje aktivnosti'}
        </Typography>
        {currentUser?.isAdmin && activeTab === 'activities' && (
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportActivityLogsToExcel}
            data-testid="button-export-excel"
          >
            Exportuj u Excel
          </Button>
        )}
      </Box>

      {/* Tab Buttons */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <Button
          variant={activeTab === 'dashboard' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('dashboard')}
          data-testid="tab-dashboard"
          startIcon={<DashboardIcon />}
        >
          Dashboard
        </Button>
        <Button
          variant={activeTab === 'activities' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('activities')}
          data-testid="tab-activities"
        >
          Aktivnosti
        </Button>
        <Button
          variant={activeTab === 'certificates' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('certificates')}
          data-testid="tab-certificates"
          startIcon={<ReceiptLong />}
        >
          Zahvale ({certificatesQuery.data?.length || 0})
        </Button>
        <Button
          variant={activeTab === 'badges' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('badges')}
          data-testid="tab-badges"
          startIcon={<BadgeOutlined />}
        >
          Značke ({earnedBadges.length})
        </Button>
        <Button
          variant={activeTab === 'contributions' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('contributions')}
          data-testid="tab-contributions"
          startIcon={<AttachMoney />}
        >
          Uplate ({contributionsQuery.data?.length || 0})
        </Button>
        {currentUser?.isAdmin && (
          <Button
            variant={activeTab === 'issue' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('issue')}
            data-testid="tab-issue-certificates"
            startIcon={<SendIcon />}
          >
            Dodjeli zahvalnicu
          </Button>
        )}
      </Box>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <Stack spacing={3}>
          {/* Points Card */}
          <Card>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Moji bodovi</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {totalPoints}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ukupnih bodova
                  </Typography>
                </Box>
                {nextBadge && (
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Do sledeće značke <strong>{nextBadge.name}</strong>:
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {pointsToNextBadge} bodova
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((totalPoints / nextBadge.criteriaValue) * 100, 100)}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          </Card>

          {/* Badges Overview */}
          <Card>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Osvojene značke ({earnedBadges.length})
              </Typography>
              {earnedBadges.length === 0 ? (
                <Alert severity="info">
                  Počnite sa aktivnostima da zaradite prve značke!
                </Alert>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 2 }}>
                  {earnedBadges.map((badge: any) => (
                    <Box 
                      key={badge.id} 
                      sx={{ 
                        textAlign: 'center', 
                        p: 2, 
                        border: '1px solid hsl(0 0% 88%)',
                        borderRadius: 1
                      }}
                    >
                      <Box sx={{ fontSize: '2rem', mb: 1 }}>
                        {badge.icon || '🏆'}
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {badge.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Card>

          {/* Recent Activity */}
          <Card>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Nedavne aktivnosti
              </Typography>
              {userActivities.length === 0 ? (
                <Typography color="text.secondary">Nema aktivnosti</Typography>
              ) : (
                <Stack spacing={1}>
                  {userActivities.slice(0, 5).map((activity: ActivityLog) => (
                    <Box 
                      key={activity.id}
                      sx={{ 
                        p: 2, 
                        bgcolor: 'hsl(0 0% 97%)',
                        borderRadius: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {activity.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(activity.createdAt).toLocaleDateString('hr-HR')}
                        </Typography>
                      </Box>
                      {activity.points && activity.points > 0 && (
                        <Chip
                          label={`+${activity.points}`}
                          color="warning"
                          size="small"
                          sx={{ ml: 2 }}
                        />
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Card>
        </Stack>
      )}

      {/* Activities Tab */}
      {activeTab === 'activities' && (
        <Card>
          <Box sx={{ p: 3, borderBottom: '1px solid hsl(0 0% 88%)' }}>
            <Grid container spacing={2}>
              {currentUser?.isAdmin && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    variant="outlined"
                    placeholder={t('searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    fullWidth
                    data-testid="input-search"
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12, md: currentUser?.isAdmin ? 6 : 12 }}>
                <FormControl fullWidth>
                  <InputLabel>{t('filterByType')}</InputLabel>
                  <Select
                    value={filterType}
                    label={t('filterByType')}
                    onChange={(e) => setFilterType(e.target.value)}
                    data-testid="select-filter-type"
                  >
                    <MenuItem value="all">{t('filterOptions.all')}</MenuItem>
                    <MenuItem value="task_completed">{t('filterOptions.task_completed')}</MenuItem>
                    <MenuItem value="event_rsvp">{t('filterOptions.event_rsvp')}</MenuItem>
                    <MenuItem value="announcement_read">{t('filterOptions.announcement_read')}</MenuItem>
                    <MenuItem value="contribution_made">{t('filterOptions.contribution_made')}</MenuItem>
                    <MenuItem value="badge_earned">{t('filterOptions.badge_earned')}</MenuItem>
                    <MenuItem value="profile_updated">{t('filterOptions.profile_updated')}</MenuItem>
                    <MenuItem value="project_contribution">{t('filterOptions.project_contribution')}</MenuItem>
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
                          <Typography variant="body2" fontWeight={500}>
                            {getUserName(activity.userId)}
                          </Typography>
                        </Box>
                      </TableCell>
                    )}
                    <TableCell>
                      <Chip
                        icon={getActivityIcon(activity.activityType)}
                        label={getActivityLabel(activity.activityType)}
                        color={getActivityColor(activity.activityType) as any}
                        size="small"
                        data-testid={`type-${activity.id}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" data-testid={`description-${activity.id}`}>
                        {activity.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {activity.points && activity.points > 0 ? (
                        <Chip
                          icon={<EmojiEvents />}
                          label={`+${activity.points}`}
                          color="warning"
                          size="small"
                          data-testid={`points-${activity.id}`}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(activity.createdAt).toLocaleString('hr-HR')}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredActivities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={currentUser?.isAdmin ? 5 : 4} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">
                        {t('noActivities')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Certificates Tab */}
      {activeTab === 'certificates' && (
        <Card>
          <Box sx={{ p: 3 }}>
            {(certificatesQuery.data as UserCertificate[])?.length === 0 ? (
              <Alert severity="info">
                {currentUser?.isAdmin ? 'Nema zahvalnica' : 'Još niste primili nijednu zahvalnicu'}
              </Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {currentUser?.isAdmin && <TableCell>Korisnik</TableCell>}
                      <TableCell>Primatelj</TableCell>
                      <TableCell>Datum izdavanja</TableCell>
                      <TableCell>Akcije</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(certificatesQuery.data as UserCertificate[])?.map((cert: UserCertificate) => (
                      <TableRow key={cert.id}>
                        {currentUser?.isAdmin && (
                          <TableCell>
                            <Typography variant="body2">
                              {getUserName(cert.userId)}
                            </Typography>
                          </TableCell>
                        )}
                        <TableCell>{cert.recipientName}</TableCell>
                        <TableCell>
                          {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString('hr-HR') : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            href={cert.certificateImagePath}
                            download
                            variant="outlined"
                            data-testid={`button-download-${cert.id}`}
                          >
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

      {/* Badges Tab */}
      {activeTab === 'badges' && (
        <Card>
          <Box sx={{ p: 3 }}>
            {earnedBadges.length === 0 ? (
              <Alert severity="info">
                {currentUser?.isAdmin ? 'Nema osvojenih značaka' : 'Još niste osvojili nijednu značku'}
              </Alert>
            ) : (
              <Stack spacing={2}>
                {earnedBadges.map((badge: any) => {
                  const colors = getBadgeColor(badge.criteriaType);
                  return (
                    <Card 
                      key={badge.id}
                      sx={{ 
                        bgcolor: colors.bg,
                        border: `2px solid ${colors.border}`,
                        boxShadow: 2
                      }}
                    >
                      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ fontSize: '2rem', textAlign: 'center', minWidth: 60 }}>
                          {badge.icon || '🏆'}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {badge.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {badge.description}
                          </Typography>
                          {badge.earnedAt && (
                            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                              Osvojena: {new Date(badge.earnedAt).toLocaleDateString('hr-HR')}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Card>
      )}

      {/* Contributions Tab */}
      {activeTab === 'contributions' && (
        <Card>
          <Box sx={{ p: 3 }}>
            {(contributionsQuery.data as FinancialContribution[])?.length === 0 ? (
              <Alert severity="info">
                {currentUser?.isAdmin ? 'Nema uplata' : 'Još niste napravili nijednu uplatu'}
              </Alert>
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
                        {currentUser?.isAdmin && (
                          <TableCell>
                            <Typography variant="body2">
                              {getUserName(contrib.userId)}
                            </Typography>
                          </TableCell>
                        )}
                        <TableCell>
                          <Chip
                            icon={<AttachMoney />}
                            label={formatPrice(contrib.amount)}
                            color="success"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{contrib.purpose}</TableCell>
                        <TableCell>
                          {contrib.paymentDate ? new Date(contrib.paymentDate).toLocaleDateString('hr-HR') : '-'}
                        </TableCell>
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

      {/* Issue Certificates Tab (Admin Only) */}
      {activeTab === 'issue' && currentUser?.isAdmin && (
        <Stack spacing={3}>
          {/* Template Selection */}
          <Card>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Izbor template-a</Typography>
              <FormControl fullWidth>
                <InputLabel>Template</InputLabel>
                <Select 
                  value={selectedTemplate}
                  label="Template"
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  data-testid="select-template"
                >
                  {(templatesQuery.data as CertificateTemplate[])?.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {selectedTemplate && (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Poruka (opcionalno)"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    data-testid="input-custom-message"
                  />
                </Box>
              )}
            </Box>
          </Card>

          {/* User Selection */}
          {selectedTemplate && (
            <Card>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Odaberi korisnike ({selectedUsers.size}/{filteredUsers.length})
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                        onChange={() => {
                          if (selectedUsers.size === filteredUsers.length) {
                            setSelectedUsers(new Set());
                          } else {
                            setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
                          }
                        }}
                      />
                    }
                    label="Odaberi sve"
                  />
                </Box>

                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 50 }}>
                          <Checkbox />
                        </TableCell>
                        <TableCell>Korisnik</TableCell>
                        <TableCell>Email</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredUsers.map((user: User) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedUsers.has(user.id)}
                              onChange={() => {
                                const newSelected = new Set(selectedUsers);
                                if (newSelected.has(user.id)) {
                                  newSelected.delete(user.id);
                                } else {
                                  newSelected.add(user.id);
                                }
                                setSelectedUsers(newSelected);
                              }}
                            />
                          </TableCell>
                          <TableCell>{user.firstName} {user.lastName}</TableCell>
                          <TableCell>{user.email || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ mt: 3 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => issueMutation.mutate()}
                    disabled={selectedUsers.size === 0 || issueMutation.isPending}
                    data-testid="button-issue-certificates"
                  >
                    {issueMutation.isPending ? 'Slanje...' : `Dodjeli zahvalnicu (${selectedUsers.size})`}
                  </Button>
                </Box>
              </Box>
            </Card>
          )}
        </Stack>
      )}
    </Box>
  );
}
