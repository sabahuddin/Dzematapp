import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress } from '@mui/material';
import { EmojiEvents, TrendingUp } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';

interface ActivityLogEntry {
  id: string;
  activityType: string;
  description: string;
  points: number;
  createdAt: string;
}

export default function UserPointsDetailsPage() {
  const { user } = useAuth();

  // Fetch user's activity log
  const { data: activityLog, isLoading } = useQuery<ActivityLogEntry[]>({
    queryKey: ['/api/activity-logs/user', user?.id],
    enabled: !!user?.id,
  });

  // Calculate total points
  const totalPoints = activityLog?.reduce((sum, entry) => sum + entry.points, 0) || 0;

  // Activity type translations
  const getActivityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'task_completed': 'Završen zadatak',
      'contribution_made': 'Finansijska uplata',
      'bonus_points': 'Bonus bodovi',
      'event_attendance': 'Prisustvo događaju',
      'project_contribution': 'Doprinos projektu',
    };
    return labels[type] || type;
  };

  // Activity type colors
  const getActivityTypeColor = (type: string): "default" | "primary" | "secondary" | "success" | "warning" | "error" => {
    const colors: Record<string, "default" | "primary" | "secondary" | "success" | "warning" | "error"> = {
      'task_completed': 'primary',
      'contribution_made': 'success',
      'bonus_points': 'warning',
      'event_attendance': 'secondary',
      'project_contribution': 'success',
    };
    return colors[type] || 'default';
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <EmojiEvents sx={{ fontSize: 40, color: '#f57c00' }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Vaši Bodovi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Detaljan pregled svih bodova koje ste zaradili
          </Typography>
        </Box>
      </Box>

      {/* Total Points Card */}
      <Card sx={{ mb: 3, p: 3, bgcolor: '#fff3e0', borderLeft: '4px solid #f57c00' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TrendingUp sx={{ fontSize: 48, color: '#f57c00' }} />
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#f57c00' }}>
              {totalPoints}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Ukupno bodova
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* Activity Log Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Tip Aktivnosti</strong></TableCell>
                <TableCell><strong>Opis</strong></TableCell>
                <TableCell align="center"><strong>Bodovi</strong></TableCell>
                <TableCell><strong>Datum</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activityLog && activityLog.length > 0 ? (
                activityLog
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((entry) => (
                    <TableRow key={entry.id} hover>
                      <TableCell>
                        <Chip 
                          label={getActivityTypeLabel(entry.activityType)} 
                          color={getActivityTypeColor(entry.activityType)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell align="center">
                        <Typography sx={{ fontWeight: 600, color: entry.points > 0 ? '#2e7d32' : 'inherit' }}>
                          +{entry.points}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {format(new Date(entry.createdAt), 'dd.MM.yyyy HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      Nema aktivnosti za prikaz
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
