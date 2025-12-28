import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Stack
} from '@mui/material';
import { EmojiEvents } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';

export default function MyBadgesPage() {
  const { user } = useAuth();

  const badgesQuery = useQuery({
    queryKey: ['/api/badges'],
  });

  const userBadgesQuery = useQuery({
    queryKey: ['/api/user-badges', user?.id],
    enabled: !!user?.id,
  });

  const activityLogQuery = useQuery({
    queryKey: ['/api/activity-logs/user', user?.id],
    enabled: !!user?.id,
  });

  if (badgesQuery.isLoading || userBadgesQuery.isLoading || activityLogQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (badgesQuery.error || userBadgesQuery.error) {
    return (
      <Alert severity="error">
        Greška pri učitavanju značaka
      </Alert>
    );
  }

  const allBadges = (badgesQuery.data as any[]) || [];
  const userBadges = (userBadgesQuery.data as any[]) || [];
  const activityLogs = (activityLogQuery.data as any[]) || [];

  const earnedBadges = userBadges.map((ub: any) => {
    const badge = allBadges.find((b: any) => b.id === ub.badgeId);
    
    // Find user's total points at the time of earning
    const earnedDate = new Date(ub.earnedAt);
    const logsBeforeEarning = activityLogs.filter((log: any) => 
      new Date(log.createdAt) <= earnedDate
    );
    const pointsAtEarning = logsBeforeEarning.reduce((sum: number, log: any) => 
      sum + (log.pointsEarned || 0), 0
    );
    
    return {
      ...badge,
      earnedAt: ub.earnedAt,
      pointsAtEarning
    };
  }).filter(Boolean);

  const getBadgeColor = (criteriaType: string) => {
    switch (criteriaType) {
      case 'points_total': return { bg: 'var(--semantic-award-bg)', text: 'var(--semantic-award-text)', border: 'var(--semantic-award-border)' };
      case 'contributions_amount': return { bg: 'var(--semantic-success-bg)', text: 'var(--semantic-success-text)', border: 'var(--semantic-success-border)' };
      case 'tasks_completed': return { bg: 'var(--semantic-info-bg)', text: 'var(--semantic-info-text)', border: 'var(--semantic-info-border)' };
      case 'events_attended': return { bg: 'var(--semantic-celebration-bg)', text: 'var(--semantic-celebration-text)', border: 'var(--semantic-celebration-border)' };
      default: return { bg: 'hsl(0 0% 96%)', text: '#616161', border: 'hsl(0 0% 74%)' };
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Moje značke
        </Typography>
        <Chip 
          icon={<EmojiEvents />}
          label={`${earnedBadges.length} ${earnedBadges.length === 1 ? 'značka' : 'značke/a'}`}
          color="primary"
          sx={{ fontWeight: 600 }}
        />
      </Box>

      {earnedBadges.length === 0 ? (
        <Alert severity="info">
          Još niste osvojili nijednu značku. Nastavite sa aktivnostima u džematu da zaradite značke!
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
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                    <Box
                      sx={{
                        fontSize: '4rem',
                        lineHeight: 1,
                        minWidth: 80,
                        textAlign: 'center'
                      }}
                    >
                      {badge.icon?.startsWith('/') || badge.icon?.startsWith('http') ? (
                        <img src={badge.icon} alt={badge.name} style={{ width: 64, height: 64, objectFit: 'contain' }} />
                      ) : (badge.icon || '🏆')}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: colors.text, mb: 1 }}>
                        {badge.name}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
                        {badge.description}
                      </Typography>
                      <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
                        <Chip
                          label={`Osvojeno: ${format(new Date(badge.earnedAt), 'dd.MM.yyyy HH:mm')}`}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                        <Chip
                          label={`Bodova tog dana: ${badge.pointsAtEarning.toLocaleString()}`}
                          size="small"
                          color="primary"
                          sx={{ fontWeight: 600 }}
                        />
                        <Chip
                          label={`Kriterij: ${badge.criteriaValue.toLocaleString()}`}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
