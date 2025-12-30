import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSortableTable } from '../hooks/useSortableTable';
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
  DialogActions,
  Tabs,
  Tab
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
  Assignment,
  Star,
  Download,
  ReceiptLong,
  BadgeOutlined,
  Send as SendIcon,
  Add,
  Edit,
  Delete,
  Upload,
  TrendingUp,
  MoreVert,
  ExpandLess,
  ExpandMore,
  Visibility,
  Close,
  Refresh
} from '@mui/icons-material';
import { ActivityLog, User, UserCertificate, FinancialContribution, Badge, insertBadgeSchema } from '@shared/schema';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { SortableHeaderCell } from '../components/SortableHeaderCell';
import { exportToExcel } from '../utils/excelExport';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { UpgradeCTA } from '../components/UpgradeCTA';
import { useCurrency } from '../contexts/CurrencyContext';
import CertificateTemplatesPage from './CertificateTemplatesPage';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { getCriteriaTypeLabel } from '@/lib/badgeUtils';
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
  const [activeTab, setActiveTab] = useState<number>(0);
  
  const getTabValue = () => {
    if (currentUser?.isAdmin) {
      return ['activities', 'contributions', 'bodove', 'badges-manage', 'issued-badges', 'templates', 'issue', 'issued'];
    }
    return ['activities', 'contributions', 'bodove', 'badges-earned', 'zahvale'];
  };
  
  const tabKeys = getTabValue();
  const currentTabKey = tabKeys[activeTab] || 'activities';
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');
  const [viewCertificateOpen, setViewCertificateOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<UserCertificate | null>(null);
  const [deleteCertificateOpen, setDeleteCertificateOpen] = useState(false);
  const [certificateToDelete, setCertificateToDelete] = useState<UserCertificate | null>(null);
  const [badgeIconUploading, setBadgeIconUploading] = useState(false);
  const [issuedBadgesSearch, setIssuedBadgesSearch] = useState('');

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
    queryKey: [`/api/user-badges/${currentUser?.id}`],
    enabled: !!currentUser?.id,
  });

  const certificatesQuery = useQuery({
    queryKey: currentUser?.isAdmin ? ['/api/certificates/all'] : ['/api/certificates/user'],
    enabled: !!currentUser,
  });

  const usersQuery = useQuery({
    queryKey: ['/api/users', currentUser?.tenantId],
    enabled: currentUser?.isAdmin || false,
  });

  const templatesQuery = useQuery({
    queryKey: ['/api/certificates/templates'],
    enabled: currentUser?.isAdmin || false,
  });

  // Sorting hooks for tables
  const activitiesSort = useSortableTable({
    data: (activityLogsQuery.data as ActivityLog[]) || [],
    defaultSortKey: 'createdAt',
    defaultSortDirection: 'desc',
  });

  const contributionsSort = useSortableTable({
    data: (contributionsQuery.data as FinancialContribution[]) || [],
    defaultSortKey: 'paymentDate',
    defaultSortDirection: 'desc',
  });

  const badgesSort = useSortableTable({
    data: (badgesQuery.data as any[]) || [],
    defaultSortKey: 'name',
    defaultSortDirection: 'asc',
  });

  const certificatesSort = useSortableTable({
    data: (certificatesQuery.data as UserCertificate[]) || [],
    defaultSortKey: 'issuedAt',
    defaultSortDirection: 'desc',
  });

  const templatesSort = useSortableTable({
    data: (templatesQuery.data as CertificateTemplate[]) || [],
    defaultSortKey: 'name',
    defaultSortDirection: 'asc',
  });

  // Badge form - omit tenantId from validation (added in mutation)
  const badgeFormSchema = insertBadgeSchema.omit({ tenantId: true }).extend({
    name: z.string().min(1, t('activity:validation.nameRequired')),
    description: z.string().min(1, t('activity:validation.descriptionRequired')),
    criteriaType: z.string().min(1, t('activity:validation.criteriaTypeRequired')),
    criteriaValue: z.number().min(0, t('activity:validation.valueMustBePositive')),
  });

  const badgeForm = useForm<z.infer<typeof badgeFormSchema>>({
    resolver: zodResolver(badgeFormSchema),
    defaultValues: {
      name: '',
      description: '',
      criteriaType: 'points_total',
      criteriaValue: 0,
      icon: null,
    }
  });

  // Mutations
  const issueMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate || selectedUsers.size === 0) throw new Error(t('activity:issueSection.templateAndUsersRequired'));
      return apiRequest('/api/certificates/issue', 'POST', {
        templateId: selectedTemplate,
        userIds: Array.from(selectedUsers),
        customMessage: customMessage || null,
      });
    },
    onSuccess: (data: any) => {
      toast({ title: t('activity:success'), description: t('activity:messages.certificatesIssued', { count: data.count }) });
      setSelectedUsers(new Set());
      setSelectedTemplate("");
      setCustomMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/all'] });
    },
    onError: (error: Error) => {
      toast({ title: t('activity:error'), description: error.message, variant: "destructive" });
    },
  });

  const saveBadgeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof badgeFormSchema>) => {
      const payload = { ...data, tenantId: currentUser?.tenantId };
      if (selectedBadge) {
        return apiRequest(`/api/badges/${selectedBadge.id}`, 'PUT', payload);
      } else {
        return apiRequest('/api/badges', 'POST', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/badges'] });
      toast({ title: t('activity:success'), description: selectedBadge ? t('activity:messages.badgeUpdated') : t('activity:messages.badgeCreated') });
      setBadgeDialogOpen(false);
      setSelectedBadge(null);
      badgeForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: t('activity:error'), description: error.message, variant: "destructive" });
    },
  });

  const deleteBadgeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/badges/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/badges'] });
      toast({ title: t('activity:success'), description: t('activity:messages.badgeDeleted') });
    },
    onError: (error: Error) => {
      toast({ title: t('activity:error'), description: error.message, variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/certificates/templates/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/templates'] });
      toast({ title: t('activity:success'), description: t('activity:messages.templateDeleted') });
    },
    onError: (error: Error) => {
      toast({ title: t('activity:error'), description: error.message, variant: "destructive" });
    },
  });

  const deleteCertificateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/certificates/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/user'] });
      setDeleteCertificateOpen(false);
      setCertificateToDelete(null);
      toast({ title: t('activity:success'), description: t('activity:messages.certificateDeleted') });
    },
    onError: (error: Error) => {
      toast({ title: t('activity:error'), description: error.message, variant: "destructive" });
    },
  });

  const markViewedMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/certificates/${id}/viewed`, 'PATCH');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/unviewed-count'] });
    },
  });

  const recalculatePointsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/admin/recalculate-all-points', 'POST');
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/activity-logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/badges'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-badges'] });
      toast({ 
        title: t('activity:success'), 
        description: t('activity:messages.pointsRecalculated', { count: data.usersProcessed }) 
      });
    },
    onError: (error: Error) => {
      toast({ title: t('activity:error'), description: error.message, variant: "destructive" });
    },
  });

  const handleViewCertificate = (cert: UserCertificate) => {
    setSelectedCertificate(cert);
    setViewCertificateOpen(true);
    if (!cert.viewed) {
      markViewedMutation.mutate(cert.id);
    }
  };

  const handleDownloadCertificate = (cert: UserCertificate) => {
    const link = document.createElement('a');
    link.href = cert.certificateImagePath;
    link.download = `zahvalnica-${cert.recipientName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: t('activity:messages.downloading'), description: t('activity:messages.certificateDownloaded') });
  };

  const handleDeleteCertificateClick = (cert: UserCertificate) => {
    setCertificateToDelete(cert);
    setDeleteCertificateOpen(true);
  };

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
      toast({ title: t('users:common.error'), description: t('activity:exportError'), variant: 'destructive' });
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
      title: t('activity:export.title'),
      filename: t('activity:export.filename'),
      sheetName: t('activity:export.sheetName'),
      headers: [
        t('activity:export.headers.user'),
        t('activity:export.headers.activityType'),
        t('activity:export.headers.description'),
        t('activity:export.headers.points'),
        t('activity:export.headers.date')
      ],
      data: activityData
    });

    toast({ title: t('users:common.success'), description: t('activity:exportSuccess') });
  };

  const isLoading = activityLogsQuery.isLoading || contributionsQuery.isLoading || badgesQuery.isLoading || userBadgesQuery.isLoading || certificatesQuery.isLoading;

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {currentUser?.isAdmin ? t('activity:overview') : t('activity:myActivities')}
        </Typography>
        {currentUser?.isAdmin && currentTabKey === 'activities' && (
          <Button variant="outlined" startIcon={<Download />} onClick={handleExportActivityLogsToExcel} data-testid="button-export-excel">
            {t('activity:exportToExcel')}
          </Button>
        )}
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': {
            textTransform: 'none',
            fontSize: '0.9rem',
            fontWeight: 500,
            minHeight: 48,
          },
          '& .Mui-selected': {
            color: '#3949AB',
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#5C6BC0',
          }
        }}
      >
        <Tab label={t('activity:tabs.activities')} data-testid="tab-activities" />
        <Tab icon={<AttachMoney />} iconPosition="start" label={t('activity:tabs.contributions')} data-testid="tab-contributions" />
        <Tab icon={<EmojiEvents />} iconPosition="start" label={t('activity:tabs.points')} data-testid="tab-bodove" />
        {currentUser?.isAdmin ? (
          [
            <Tab key="badges-manage" icon={<BadgeOutlined />} iconPosition="start" label={t('activity:tabs.badges')} data-testid="tab-badges-manage" />,
            <Tab key="issued-badges" icon={<BadgeOutlined />} iconPosition="start" label={t('activity:tabs.assignedBadges')} data-testid="tab-issued-badges" />,
            <Tab key="templates" label={t('activity:tabs.certificateTemplates')} data-testid="tab-templates" />,
            <Tab key="issue" icon={<SendIcon />} iconPosition="start" label={t('activity:tabs.assignCertificate')} data-testid="tab-issue" />,
            <Tab key="issued" icon={<ReceiptLong />} iconPosition="start" label={t('activity:tabs.assignedCertificates')} data-testid="tab-issued" />
          ]
        ) : (
          [
            <Tab key="badges-earned" icon={<BadgeOutlined />} iconPosition="start" label={`${t('activity:tabs.badges')} (${earnedBadges.length})`} data-testid="tab-badges-earned" />,
            <Tab key="zahvale" icon={<ReceiptLong />} iconPosition="start" label={t('activity:tabs.certificates')} data-testid="tab-zahvale" />
          ]
        )}
      </Tabs>

      {/* Activities Tab */}
      {currentTabKey === 'activities' && (
        <Card>
          <Box sx={{ p: 3, borderBottom: '1px solid hsl(0 0% 88%)' }}>
            <Grid container spacing={2}>
              {currentUser?.isAdmin && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField variant="outlined" label={t('searchPlaceholder')} placeholder={t('searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} data-testid="input-search" />
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
                  {currentUser?.isAdmin && <SortableHeaderCell sortKey="userId" onSort={activitiesSort.handleSort} currentSortKey={activitiesSort.sortKey} currentSortDirection={activitiesSort.sortDirection}>{t('user')}</SortableHeaderCell>}
                  <SortableHeaderCell sortKey="activityType" onSort={activitiesSort.handleSort} currentSortKey={activitiesSort.sortKey} currentSortDirection={activitiesSort.sortDirection}>{t('type')}</SortableHeaderCell>
                  <SortableHeaderCell sortKey="description" onSort={activitiesSort.handleSort} currentSortKey={activitiesSort.sortKey} currentSortDirection={activitiesSort.sortDirection}>{t('description')}</SortableHeaderCell>
                  <SortableHeaderCell sortKey="points" onSort={activitiesSort.handleSort} currentSortKey={activitiesSort.sortKey} currentSortDirection={activitiesSort.sortDirection}>{t('points')}</SortableHeaderCell>
                  <SortableHeaderCell sortKey="createdAt" onSort={activitiesSort.handleSort} currentSortKey={activitiesSort.sortKey} currentSortDirection={activitiesSort.sortDirection}>{t('date')}</SortableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activitiesSort.sortedData.filter((activity: ActivityLog) => {
                  const matchesType = filterType === 'all' || activity.activityType === filterType;
                  if (!matchesType) return false;
                  if (!searchTerm) return true;
                  const user = (usersQuery.data as User[] || []).find(u => u.id === activity.userId);
                  return (user && `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    activity.description.toLowerCase().includes(searchTerm.toLowerCase());
                }).map((activity: ActivityLog) => (
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
      {currentTabKey === 'contributions' && (
        <Card>
          <Box sx={{ p: 3 }}>
            {(contributionsQuery.data as FinancialContribution[])?.length === 0 ? (
              <Alert severity="info">{currentUser?.isAdmin ? t('activity:contributions.noPayments') : t('activity:contributions.noPaymentsMember')}</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {currentUser?.isAdmin && <SortableHeaderCell sortKey="userId" onSort={contributionsSort.handleSort} currentSortKey={contributionsSort.sortKey} currentSortDirection={contributionsSort.sortDirection}>{t('activity:user')}</SortableHeaderCell>}
                      <SortableHeaderCell sortKey="amount" onSort={contributionsSort.handleSort} currentSortKey={contributionsSort.sortKey} currentSortDirection={contributionsSort.sortDirection}>{t('activity:contributions.amount')}</SortableHeaderCell>
                      <SortableHeaderCell sortKey="purpose" onSort={contributionsSort.handleSort} currentSortKey={contributionsSort.sortKey} currentSortDirection={contributionsSort.sortDirection}>{t('activity:contributions.purpose')}</SortableHeaderCell>
                      <SortableHeaderCell sortKey="paymentDate" onSort={contributionsSort.handleSort} currentSortKey={contributionsSort.sortKey} currentSortDirection={contributionsSort.sortDirection}>{t('activity:date')}</SortableHeaderCell>
                      <SortableHeaderCell sortKey="notes" onSort={contributionsSort.handleSort} currentSortKey={contributionsSort.sortKey} currentSortDirection={contributionsSort.sortDirection}>{t('activity:contributions.note')}</SortableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contributionsSort.sortedData?.map((contrib: FinancialContribution) => (
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
      {currentTabKey === 'bodove' && (
        <Card>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <EmojiEvents sx={{ fontSize: 40, color: 'hsl(14 100% 45%)' }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {currentUser?.isAdmin ? t('activity:pointsSection.allPointsOverview') : t('activity:pointsSection.yourPoints')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentUser?.isAdmin ? t('activity:pointsSection.allMembersPoints') : t('activity:pointsSection.yourPointsDescription')}
                </Typography>
              </Box>
            </Box>

            {/* Admin Search & Filter */}
            {currentUser?.isAdmin && (
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField 
                  variant="outlined" 
                  label={t('activity:pointsSection.searchByName')}
                  placeholder={`${t('activity:pointsSection.searchByName')}...`} 
                  value={userSearchTerm} 
                  onChange={(e) => setUserSearchTerm(e.target.value)} 
                  fullWidth 
                  InputLabelProps={{ shrink: true }}
                  sx={{ maxWidth: 300 }}
                  data-testid="input-bodove-search"
                />
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>{t('activity:pointsSection.activityType')}</InputLabel>
                  <Select value={filterType} label={t('activity:pointsSection.activityType')} onChange={(e) => setFilterType(e.target.value)} data-testid="select-bodove-type">
                    <MenuItem value="all">{t('activity:pointsSection.all')}</MenuItem>
                    <MenuItem value="task_completed">{t('activity:pointsSection.tasksCompleted')}</MenuItem>
                    <MenuItem value="event_rsvp">{t('activity:pointsSection.eventRsvp')}</MenuItem>
                    <MenuItem value="contribution_made">{t('activity:pointsSection.contribution')}</MenuItem>
                    <MenuItem value="badge_earned">{t('activity:pointsSection.badgeEarned')}</MenuItem>
                  </Select>
                </FormControl>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={() => recalculatePointsMutation.mutate()}
                  disabled={recalculatePointsMutation.isPending}
                  startIcon={<Refresh />}
                  data-testid="button-recalculate-points"
                >
                  {recalculatePointsMutation.isPending ? t('activity:pointsSection.recalculating') : t('activity:pointsSection.recalculatePoints')}
                </Button>
              </Box>
            )}

            {/* Points by Category Card - Only for member view */}
            {!currentUser?.isAdmin && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  {t('activity:pointsSection.pointsByCategory')}
                </Typography>
                <Grid container spacing={2}>
                  {(() => {
                    const activities = (activityLogsQuery.data as ActivityLog[]) || [];
                    const pointsByCategory: Record<string, number> = {};
                    activities.forEach(entry => {
                      const type = entry.activityType || 'other';
                      pointsByCategory[type] = (pointsByCategory[type] || 0) + (entry.points || 0);
                    });
                    
                    const categoryConfig: Record<string, { label: string; color: string; icon: any }> = {
                      'task_completed': { label: t('activity:pointsSection.tasksCompleted'), color: '#4CAF50', icon: <Assignment /> },
                      'event_rsvp': { label: t('activity:pointsSection.eventRsvp'), color: '#2196F3', icon: <Event /> },
                      'contribution_made': { label: t('activity:pointsSection.contribution'), color: '#FF9800', icon: <TrendingUp /> },
                      'badge_earned': { label: t('activity:pointsSection.badgeEarned'), color: '#9C27B0', icon: <EmojiEvents /> },
                      'project_contribution': { label: 'Podrška projektu', color: '#00BCD4', icon: <Assignment /> },
                    };
                    
                    const hiddenCategories = ['profile_updated'];
                    
                    return Object.entries(pointsByCategory)
                      .filter(([type]) => !hiddenCategories.includes(type))
                      .map(([type, points]) => {
                      const config = categoryConfig[type] || { label: type, color: '#757575', icon: <Star /> };
                      return (
                        <Grid size={{ xs: 6, sm: 3 }} key={type}>
                          <Card sx={{ p: 2, textAlign: 'center', borderTop: `4px solid ${config.color}` }}>
                            <Box sx={{ color: config.color, mb: 1 }}>{config.icon}</Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: config.color }}>
                              {points}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {config.label}
                            </Typography>
                          </Card>
                        </Grid>
                      );
                    });
                  })()}
                </Grid>
              </Box>
            )}

            {/* Activity Log Table */}
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    {currentUser?.isAdmin && <SortableHeaderCell sortKey="userId" onSort={activitiesSort.handleSort} currentSortKey={activitiesSort.sortKey} currentSortDirection={activitiesSort.sortDirection}>{t('activity:user')}</SortableHeaderCell>}
                    <SortableHeaderCell sortKey="activityType" onSort={activitiesSort.handleSort} currentSortKey={activitiesSort.sortKey} currentSortDirection={activitiesSort.sortDirection}>{t('activity:activityType')}</SortableHeaderCell>
                    <SortableHeaderCell sortKey="description" onSort={activitiesSort.handleSort} currentSortKey={activitiesSort.sortKey} currentSortDirection={activitiesSort.sortDirection}>{t('activity:description')}</SortableHeaderCell>
                    <SortableHeaderCell sortKey="points" onSort={activitiesSort.handleSort} currentSortKey={activitiesSort.sortKey} currentSortDirection={activitiesSort.sortDirection}>{t('activity:points')}</SortableHeaderCell>
                    <SortableHeaderCell sortKey="createdAt" onSort={activitiesSort.handleSort} currentSortKey={activitiesSort.sortKey} currentSortDirection={activitiesSort.sortDirection}>{t('activity:date')}</SortableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    const filtered = activitiesSort.sortedData.filter((entry: ActivityLog) => {
                      if (currentUser?.isAdmin) {
                        const matchesType = filterType === 'all' || entry.activityType === filterType;
                        if (!matchesType) return false;
                        if (!userSearchTerm) return true;
                        const user = (usersQuery.data as User[] || []).find(u => u.id === entry.userId);
                        return user && `${user.firstName} ${user.lastName}`.toLowerCase().includes(userSearchTerm.toLowerCase());
                      }
                      return true;
                    });
                    return filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={currentUser?.isAdmin ? 5 : 4} sx={{ textAlign: 'center', py: 4 }}>
                          <Typography color="text.secondary">
                            {t('activity:pointsSection.noActivities')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((entry: ActivityLog) => (
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
                            <Typography sx={{ fontWeight: 600, color: (entry.points || 0) > 0 ? '#26A69A' : 'inherit' }}>
                              +{entry.points || 0}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('hr-HR') : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    );
                  })()}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Card>
      )}

      {/* Badges Admin Tab */}
      {currentTabKey === 'badges-manage' && currentUser?.isAdmin && (
        <Card>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{t('activity:badgesSection.badgeManagement')}</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedBadge(null); badgeForm.reset(); setBadgeDialogOpen(true); }} data-testid="button-add-badge">
                {t('activity:badgesSection.addNewBadge')}
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 60 }}>{t('activity:badgesSection.icon')}</TableCell>
                    <SortableHeaderCell sortKey="name" onSort={badgesSort.handleSort} currentSortKey={badgesSort.sortKey} currentSortDirection={badgesSort.sortDirection}>{t('activity:badgesSection.name')}</SortableHeaderCell>
                    <SortableHeaderCell sortKey="description" onSort={badgesSort.handleSort} currentSortKey={badgesSort.sortKey} currentSortDirection={badgesSort.sortDirection}>{t('common:description')}</SortableHeaderCell>
                    <SortableHeaderCell sortKey="criteriaType" onSort={badgesSort.handleSort} currentSortKey={badgesSort.sortKey} currentSortDirection={badgesSort.sortDirection}>{t('activity:badgesSection.criteriaType')}</SortableHeaderCell>
                    <SortableHeaderCell sortKey="criteriaValue" onSort={badgesSort.handleSort} currentSortKey={badgesSort.sortKey} currentSortDirection={badgesSort.sortDirection}>{t('activity:badgesSection.value')}</SortableHeaderCell>
                    <TableCell>{t('common:actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {badgesSort.sortedData?.map((badge: any) => (
                    <TableRow key={badge.id}>
                      <TableCell>
                        {badge.icon ? (
                          <Avatar src={badge.icon} alt={badge.name} sx={{ width: 40, height: 40 }} />
                        ) : (
                          <Box sx={{ fontSize: '1.5rem', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏆</Box>
                        )}
                      </TableCell>
                      <TableCell>{badge.name}</TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{badge.description}</Typography></TableCell>
                      <TableCell>{getCriteriaTypeLabel(badge.criteriaType)}</TableCell>
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
      {currentTabKey === 'badges-earned' && !currentUser?.isAdmin && (
        <Card>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>{t('activity:tabs.badges')} ({earnedBadges.length})</Typography>
            {earnedBadges.length === 0 ? (
              <Alert severity="info">{t('activity:badgesSection.noBadgesEarned')}</Alert>
            ) : (
              <Stack spacing={2}>
                {earnedBadges.map((badge: any) => (
                  <Card key={badge.id} sx={{ p: 2, border: '2px solid hsl(76 100% 29%)', bgcolor: 'hsl(76 100% 97%)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {badge.icon ? (
                        <Avatar src={badge.icon} alt={badge.name} sx={{ width: 50, height: 50 }} />
                      ) : (
                        <Box sx={{ fontSize: '2rem', textAlign: 'center', minWidth: 60 }}>🏆</Box>
                      )}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>{badge.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{badge.description}</Typography>
                        {badge.earnedAt && <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>{t('activity:badgesSection.earnedOn')}: {new Date(badge.earnedAt).toLocaleDateString('hr-HR')}</Typography>}
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
      {currentTabKey === 'templates' && currentUser?.isAdmin && (
        <CertificateTemplatesPage hideHeader={true} />
      )}

      {/* Issue Certificates Tab */}
      {currentTabKey === 'issue' && currentUser?.isAdmin && (
        <Stack spacing={3}>
          <Card>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>{t('activity:issueSection.selectTemplate')}</Typography>
              <FormControl fullWidth>
                <InputLabel>{t('activity:issueSection.template')}</InputLabel>
                <Select value={selectedTemplate} label={t('activity:issueSection.template')} onChange={(e) => setSelectedTemplate(e.target.value)} data-testid="select-template">
                  {(templatesQuery.data as CertificateTemplate[])?.map((template) => (
                    <MenuItem key={template.id} value={template.id}>{template.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {selectedTemplate && (
                <Box sx={{ mt: 2 }}>
                  <TextField fullWidth multiline rows={3} label={t('activity:issueSection.messageOptional')} value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} data-testid="input-custom-message" />
                </Box>
              )}
            </Box>
          </Card>

          {selectedTemplate && (
            <Card>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>{t('activity:issueSection.selectUsers')} ({selectedUsers.size}/{filteredUsers.length})</Typography>

                <TextField fullWidth placeholder={t('activity:issueSection.searchByNameOrDob')} value={userSearchTerm} onChange={(e) => setUserSearchTerm(e.target.value)} sx={{ mb: 2 }} data-testid="input-user-search" />

                <Box sx={{ mb: 2 }}>
                  <Checkbox checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0} onChange={() => {
                    if (selectedUsers.size === filteredUsers.length) {
                      setSelectedUsers(new Set());
                    } else {
                      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
                    }
                  }} />
                  <Typography component="span" variant="body2">{t('activity:issueSection.selectAll')}</Typography>
                </Box>

                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 50 }}><Checkbox /></TableCell>
                        <TableCell>{t('activity:user')}</TableCell>
                        <TableCell>{t('activity:issueSection.dateOfBirth')}</TableCell>
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
                    {issueMutation.isPending ? t('activity:issueSection.sending') : `${t('activity:issueSection.issueCertificate')} (${selectedUsers.size})`}
                  </Button>
                </Box>
              </Box>
            </Card>
          )}
        </Stack>
      )}

      {/* Issued Certificates Tab */}
      {currentTabKey === 'issued' && currentUser?.isAdmin && (
        <Card>
          <Box sx={{ p: 3 }}>
            {(certificatesQuery.data as UserCertificate[])?.length === 0 ? (
              <Alert severity="info">{t('activity:certificateSection.noCertificatesIssued')}</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 80 }}>{t('activity:certificateSection.preview')}</TableCell>
                      <SortableHeaderCell sortKey="userId" onSort={certificatesSort.handleSort} currentSortKey={certificatesSort.sortKey} currentSortDirection={certificatesSort.sortDirection}>{t('activity:user')}</SortableHeaderCell>
                      <SortableHeaderCell sortKey="recipientName" onSort={certificatesSort.handleSort} currentSortKey={certificatesSort.sortKey} currentSortDirection={certificatesSort.sortDirection}>{t('activity:certificateSection.recipient')}</SortableHeaderCell>
                      <SortableHeaderCell sortKey="issuedAt" onSort={certificatesSort.handleSort} currentSortKey={certificatesSort.sortKey} currentSortDirection={certificatesSort.sortDirection}>{t('activity:certificateSection.issueDate')}</SortableHeaderCell>
                      <TableCell>{t('activity:certificateSection.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {certificatesSort.sortedData?.map((cert: UserCertificate) => (
                      <TableRow key={cert.id} hover>
                        <TableCell>
                          <Box 
                            component="img" 
                            src={cert.certificateImagePath} 
                            alt={t('activity:certificate')}
                            sx={{ 
                              width: 60, 
                              height: 40, 
                              objectFit: 'cover', 
                              borderRadius: 1, 
                              cursor: 'pointer',
                              border: '1px solid',
                              borderColor: 'divider'
                            }}
                            onClick={() => handleViewCertificate(cert)}
                            data-testid={`img-thumbnail-${cert.id}`}
                          />
                        </TableCell>
                        <TableCell><Typography variant="body2">{getUserName(cert.userId)}</Typography></TableCell>
                        <TableCell>{cert.recipientName}</TableCell>
                        <TableCell>{cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString('hr-HR') : '-'}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewCertificate(cert)}
                              sx={{ color: 'primary.main' }}
                              title={t('activity:certificateSection.view')}
                              data-testid={`button-view-${cert.id}`}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDownloadCertificate(cert)}
                              sx={{ color: 'success.main' }}
                              title={t('activity:certificateSection.download')}
                              data-testid={`button-download-${cert.id}`}
                            >
                              <Download fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteCertificateClick(cert)}
                              sx={{ color: 'error.main' }}
                              title={t('activity:certificateSection.delete')}
                              data-testid={`button-delete-${cert.id}`}
                            >
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

      {/* Zahvale Tab - Members Only */}
      {currentTabKey === 'zahvale' && !currentUser?.isAdmin && (
        <Card>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <ReceiptLong sx={{ fontSize: 40, color: 'hsl(14 100% 45%)' }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('activity:certificateSection.yourCertificates')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('activity:certificateSection.certificatesDescription')}
                </Typography>
              </Box>
            </Box>

            {(certificatesQuery.data as UserCertificate[])?.length === 0 ? (
              <Alert severity="info">{t('activity:certificateSection.noCertificatesReceived')}</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 80 }}>{t('activity:certificateSection.preview')}</TableCell>
                      <SortableHeaderCell sortKey="recipientName" onSort={certificatesSort.handleSort} currentSortKey={certificatesSort.sortKey} currentSortDirection={certificatesSort.sortDirection}>{t('activity:certificateSection.recipient')}</SortableHeaderCell>
                      <SortableHeaderCell sortKey="issuedAt" onSort={certificatesSort.handleSort} currentSortKey={certificatesSort.sortKey} currentSortDirection={certificatesSort.sortDirection}>{t('activity:certificateSection.issueDate')}</SortableHeaderCell>
                      <TableCell>{t('activity:certificateSection.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {certificatesSort.sortedData?.map((cert: UserCertificate) => (
                      <TableRow key={cert.id} hover>
                        <TableCell>
                          <Box 
                            component="img" 
                            src={cert.certificateImagePath} 
                            alt={t('activity:certificate')}
                            sx={{ 
                              width: 60, 
                              height: 40, 
                              objectFit: 'cover', 
                              borderRadius: 1, 
                              cursor: 'pointer',
                              border: '1px solid',
                              borderColor: 'divider'
                            }}
                            onClick={() => handleViewCertificate(cert)}
                            data-testid={`img-thumbnail-${cert.id}`}
                          />
                          {!cert.viewed && (
                            <Chip 
                              label={t('activity:certificateSection.new')} 
                              size="small" 
                              color="primary" 
                              sx={{ ml: 1, fontSize: '0.65rem', height: 18 }}
                            />
                          )}
                        </TableCell>
                        <TableCell>{cert.recipientName}</TableCell>
                        <TableCell>{cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString('hr-HR') : '-'}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewCertificate(cert)}
                              sx={{ color: 'primary.main' }}
                              title={t('activity:certificateSection.view')}
                              data-testid={`button-view-${cert.id}`}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDownloadCertificate(cert)}
                              sx={{ color: 'success.main' }}
                              title={t('activity:certificateSection.download')}
                              data-testid={`button-download-${cert.id}`}
                            >
                              <Download fontSize="small" />
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

      {/* Issued Badges Tab */}
      {currentTabKey === 'issued-badges' && currentUser?.isAdmin && (
        <Card>
          <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Pretraži po korisniku ili znački"
                placeholder="Ime, prezime ili naziv značke..."
                value={issuedBadgesSearch}
                onChange={(e) => setIssuedBadgesSearch(e.target.value)}
                sx={{ maxWidth: 400 }}
                data-testid="input-issued-badges-search"
              />
            </Box>
            {(() => {
              const searchLower = issuedBadgesSearch.toLowerCase().trim();
              const filteredBadges = allIssuedBadges.filter((item: any) => {
                if (!searchLower) return true;
                const userName = item.user ? `${item.user.firstName} ${item.user.lastName}`.toLowerCase() : '';
                const badgeName = (item.badge?.name || '').toLowerCase();
                return userName.includes(searchLower) || badgeName.includes(searchLower);
              });
              
              if (filteredBadges.length === 0) {
                return <Alert severity="info">{issuedBadgesSearch ? 'Nema rezultata pretrage' : t('activity:badgesSection.noBadgesAssigned')}</Alert>;
              }
              
              return (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('activity:user')}</TableCell>
                        <TableCell>{t('activity:badgesSection.badge')}</TableCell>
                        <TableCell>{t('activity:description')}</TableCell>
                        <TableCell>{t('activity:badgesSection.assignmentDate')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredBadges.map((item: any) => (
                        <TableRow key={`${item.userId}-${item.badgeId}`}>
                          <TableCell><Typography variant="body2">{item.user ? `${item.user.firstName} ${item.user.lastName}` : t('activity:badgesSection.unknownUser')}</Typography></TableCell>
                          <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{item.badge?.name || t('activity:badgesSection.unknownBadge')}</Typography></TableCell>
                          <TableCell><Typography variant="body2" color="text.secondary">{item.badge?.description || '-'}</Typography></TableCell>
                          <TableCell>{item.earnedAt ? new Date(item.earnedAt).toLocaleDateString('hr-HR') : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              );
            })()}
          </Box>
        </Card>
      )}

      {/* Badge Inline Form (replaces Dialog to avoid aria-hidden issues) */}
      {badgeDialogOpen && (
        <>
          <Box 
            sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.5)', zIndex: 9998 }}
            onClick={() => { setBadgeDialogOpen(false); setSelectedBadge(null); badgeForm.reset(); }}
          />
          <Card sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999, width: '90%', maxWidth: 500, p: 3, boxShadow: 24 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {selectedBadge ? t('activity:badgesSection.editBadge') : t('activity:badgesSection.addNewBadge')}
              </Typography>
              <IconButton onClick={() => { setBadgeDialogOpen(false); setSelectedBadge(null); badgeForm.reset(); }}>
                <Close />
              </IconButton>
            </Box>
            <Stack spacing={2}>
              <TextField 
                fullWidth 
                label={t('activity:badgesSection.name')} 
                {...badgeForm.register('name')} 
                error={!!badgeForm.formState.errors.name} 
                helperText={badgeForm.formState.errors.name?.message} 
                data-testid="input-badge-name" 
              />
              <TextField 
                fullWidth 
                label={t('activity:description')} 
                {...badgeForm.register('description')} 
                error={!!badgeForm.formState.errors.description} 
                helperText={badgeForm.formState.errors.description?.message} 
                data-testid="input-badge-description" 
              />
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>{t('activity:badgesSection.icon')}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {badgeForm.watch('icon') ? (
                    <Avatar src={badgeForm.watch('icon') as string} alt="Badge icon" sx={{ width: 60, height: 60 }} />
                  ) : (
                    <Box sx={{ width: 60, height: 60, fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', borderRadius: 1 }}>🏆</Box>
                  )}
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<Upload />}
                    disabled={badgeIconUploading}
                    data-testid="button-upload-badge-icon"
                  >
                    {badgeIconUploading ? t('activity:uploading') : t('activity:badgesSection.uploadIcon')}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setBadgeIconUploading(true);
                        try {
                          const formData = new FormData();
                          formData.append('icon', file);
                          const response = await fetch('/api/upload/badge-icon', {
                            method: 'POST',
                            body: formData,
                            credentials: 'include',
                          });
                          if (!response.ok) throw new Error('Upload failed');
                          const data = await response.json();
                          badgeForm.setValue('icon', data.iconUrl);
                          toast({ title: t('activity:success'), description: t('activity:badgesSection.iconUploaded') });
                        } catch (error) {
                          toast({ title: t('activity:error'), description: t('activity:badgesSection.iconUploadFailed'), variant: 'destructive' });
                        } finally {
                          setBadgeIconUploading(false);
                        }
                      }}
                    />
                  </Button>
                  {badgeForm.watch('icon') && (
                    <IconButton size="small" onClick={() => badgeForm.setValue('icon', null)} sx={{ color: '#d32f2f' }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Box>
              <FormControl fullWidth>
                <InputLabel>{t('activity:badgesSection.criteriaType')}</InputLabel>
                <Select 
                  value={badgeForm.watch('criteriaType') || 'points_total'}
                  onChange={(e) => badgeForm.setValue('criteriaType', e.target.value)}
                  label={t('activity:badgesSection.criteriaType')} 
                  data-testid="select-criteria-type"
                  MenuProps={{ 
                    sx: { zIndex: 10000 },
                    disablePortal: false
                  }}
                >
                  <MenuItem value="points_total">{t('activity:badgesSection.totalPoints')}</MenuItem>
                  <MenuItem value="contributions_amount">{t('activity:badgesSection.contributionAmount')}</MenuItem>
                  <MenuItem value="tasks_completed">{t('activity:badgesSection.tasksCompleted')}</MenuItem>
                  <MenuItem value="events_attended">{t('activity:badgesSection.eventsAttended')}</MenuItem>
                </Select>
              </FormControl>
              <TextField 
                fullWidth 
                type="number" 
                label={t('activity:badgesSection.value')}
                value={badgeForm.watch('criteriaValue') ?? 0}
                onChange={(e) => badgeForm.setValue('criteriaValue', parseInt(e.target.value) || 0)}
                error={!!badgeForm.formState.errors.criteriaValue} 
                helperText={badgeForm.formState.errors.criteriaValue?.message} 
                data-testid="input-criteria-value" 
              />
            </Stack>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
              <Button onClick={() => { setBadgeDialogOpen(false); setSelectedBadge(null); badgeForm.reset(); }}>
                {t('activity:certificateSection.cancel')}
              </Button>
              <Button 
                variant="contained" 
                disabled={saveBadgeMutation.isPending}
                onClick={() => {
                  console.log('[BADGE FORM] Spremi clicked!');
                  console.log('[BADGE FORM] Current values:', badgeForm.getValues());
                  console.log('[BADGE FORM] Errors:', badgeForm.formState.errors);
                  badgeForm.handleSubmit(
                    (data) => {
                      console.log('[BADGE FORM] Submitting:', data);
                      saveBadgeMutation.mutate(data);
                    },
                    (errors) => {
                      console.log('[BADGE FORM] Validation errors:', errors);
                    }
                  )();
                }} 
                data-testid="button-save-badge"
              >
                {saveBadgeMutation.isPending ? t('activity:badgesSection.saving') : t('activity:badgesSection.save')}
              </Button>
            </Box>
          </Card>
        </>
      )}

      {/* View Certificate Inline Modal (replaces Dialog to avoid aria-hidden issues) */}
      {viewCertificateOpen && selectedCertificate && (
        <>
          <Box 
            sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.5)', zIndex: 9998 }}
            onClick={() => setViewCertificateOpen(false)}
          />
          <Card sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999, width: '95%', maxWidth: 900, maxHeight: '90vh', overflow: 'auto', p: 3, boxShadow: 24 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">{t('activity:certificate')} - {selectedCertificate.recipientName}</Typography>
              <IconButton onClick={() => setViewCertificateOpen(false)}>
                <Close />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Box
                component="img"
                src={selectedCertificate.certificateImagePath}
                alt={`${t('activity:certificate')} - ${selectedCertificate.recipientName}`}
                sx={{ 
                  width: '100%', 
                  maxHeight: '60vh',
                  objectFit: 'contain',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
                data-testid="img-certificate-full"
              />
              {selectedCertificate.message && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  {selectedCertificate.message}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
              <Button 
                variant="contained" 
                startIcon={<Download />}
                onClick={() => handleDownloadCertificate(selectedCertificate)}
                data-testid="button-download-full"
              >
                {t('activity:certificateSection.download')}
              </Button>
              <Button 
                variant="outlined"
                onClick={() => {
                  const printWindow = window.open(selectedCertificate.certificateImagePath, '_blank');
                  printWindow?.print();
                }}
                data-testid="button-print"
              >
                {t('activity:certificateSection.print')}
              </Button>
            </Box>
          </Card>
        </>
      )}

      {/* Delete Certificate Inline Confirmation (replaces Dialog to avoid aria-hidden issues) */}
      {deleteCertificateOpen && certificateToDelete && (
        <>
          <Box 
            sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.5)', zIndex: 9998 }}
            onClick={() => setDeleteCertificateOpen(false)}
          />
          <Card sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999, width: '90%', maxWidth: 400, p: 3, boxShadow: 24 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>{t('activity:certificateSection.deleteCertificate')}</Typography>
            <Typography sx={{ mb: 3 }}>
              {t('activity:certificateSection.confirmDeleteCertificate', { name: certificateToDelete.recipientName })}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={() => setDeleteCertificateOpen(false)}>{t('activity:certificateSection.cancel')}</Button>
              <Button 
                variant="contained" 
                color="error"
                onClick={() => deleteCertificateMutation.mutate(certificateToDelete.id)}
                disabled={deleteCertificateMutation.isPending}
                data-testid="button-confirm-delete"
              >
                {deleteCertificateMutation.isPending ? t('activity:certificateSection.deleting') : t('activity:certificateSection.delete')}
              </Button>
            </Box>
          </Card>
        </>
      )}
    </Box>
  );
}
