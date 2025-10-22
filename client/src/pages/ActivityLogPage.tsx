import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Work
} from '@mui/icons-material';
import { ActivityLog, User } from '@shared/schema';
import { useAuth } from '../hooks/useAuth';

export default function ActivityLogPage() {
  const { user: currentUser } = useAuth();
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
    if (!usersQuery.data) return 'Nepoznato';
    const user = (usersQuery.data as User[]).find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Nepoznato';
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
    switch (type) {
      case 'task_completed':
        return 'Zadatak izvršen';
      case 'event_rsvp':
        return 'RSVP na događaj';
      case 'announcement_read':
        return 'Obavijest pročitana';
      case 'contribution_made':
        return 'Uplata izvršena';
      case 'badge_earned':
        return 'Značka osvojena';
      case 'profile_updated':
        return 'Profil ažuriran';
      case 'project_contribution':
        return 'Doprinos projektu';
      default:
        return type;
    }
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
        Greška pri učitavanju log-a aktivnosti. Molimo pokušajte ponovo.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {currentUser?.isAdmin ? 'Log aktivnosti' : 'Moje aktivnosti'}
        </Typography>
      </Box>

      <Card>
        <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
          <Grid container spacing={2}>
            {currentUser?.isAdmin && (
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  variant="outlined"
                  placeholder="Pretraži po korisniku ili opisu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  fullWidth
                  data-testid="input-search"
                />
              </Grid>
            )}
            <Grid size={{ xs: 12, md: currentUser?.isAdmin ? 6 : 12 }}>
              <FormControl fullWidth>
                <InputLabel>Filter po tipu</InputLabel>
                <Select
                  value={filterType}
                  label="Filter po tipu"
                  onChange={(e) => setFilterType(e.target.value)}
                  data-testid="select-filter-type"
                >
                  <MenuItem value="all">Sve aktivnosti</MenuItem>
                  <MenuItem value="task_completed">Zadaci izvršeni</MenuItem>
                  <MenuItem value="event_rsvp">RSVP događaji</MenuItem>
                  <MenuItem value="announcement_read">Obavijesti pročitane</MenuItem>
                  <MenuItem value="contribution_made">Uplate izvršene</MenuItem>
                  <MenuItem value="badge_earned">Značke osvojene</MenuItem>
                  <MenuItem value="profile_updated">Profil ažuriran</MenuItem>
                  <MenuItem value="project_contribution">Doprinosi projektima</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                {currentUser?.isAdmin && <TableCell sx={{ fontWeight: 600 }}>Korisnik</TableCell>}
                <TableCell sx={{ fontWeight: 600 }}>Tip</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Opis</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Bodovi</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Datum</TableCell>
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
                      Nema aktivnosti
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
