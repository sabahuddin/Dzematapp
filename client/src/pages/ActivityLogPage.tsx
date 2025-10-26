import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Grid
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
  Download
} from '@mui/icons-material';
import { ActivityLog, User } from '@shared/schema';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { exportToExcel } from '../utils/excelExport';

export default function ActivityLogPage() {
  const { t } = useTranslation(['activity']);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch activity logs
  const activityLogsQuery = useQuery({
    queryKey: currentUser?.isAdmin 
      ? ['/api/activity-logs'] 
      : [`/api/activity-logs/user/${currentUser?.id}`],
    enabled: !!currentUser,
  });

  // Fetch users (for admin to show names)
  const usersQuery = useQuery({
    queryKey: ['/api/users'],
    enabled: currentUser?.isAdmin || false,
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

  if (activityLogsQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (activityLogsQuery.error) {
    return (
      <Alert severity="error">
        {t('errorLoading')}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {currentUser?.isAdmin ? t('title') : t('myActivities')}
        </Typography>
        {currentUser?.isAdmin && (
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

      <Card>
        <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
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
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                {currentUser?.isAdmin && <TableCell sx={{ fontWeight: 600 }}>{t('user')}</TableCell>}
                <TableCell sx={{ fontWeight: 600 }}>{t('type')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('description')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('points')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('date')}</TableCell>
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
    </Box>
  );
}
