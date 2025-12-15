import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
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
  Avatar
} from '@mui/material';
import {
  EmojiEvents
} from '@mui/icons-material';
import { format } from 'date-fns';
import { User, Badge, UserBadge } from '@shared/schema';
import { BadgeIconDisplay } from './BadgeIcons';
import { useAuth } from '../hooks/useAuth';

interface IssuedBadgeData extends UserBadge {
  user: User;
  badge: Badge;
}

export default function IssuedBadgesTab() {
  const { user: currentUser, isLoading } = useAuth();
  const { t } = useTranslation(['badges', 'common']);

  // Check if auth is loading
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Check admin access
  if (!currentUser?.isAdmin) {
    return (
      <Alert severity="error">
        {t('badges:accessDenied')}
      </Alert>
    );
  }

  // Fetch all issued badges
  const issuedBadgesQuery = useQuery<IssuedBadgeData[]>({
    queryKey: ['/api/user-badges/all'],
    enabled: !!currentUser?.isAdmin,
  });

  const getCriteriaTypeLabel = (criteriaType: string) => {
    const labels: Record<string, string> = {
      'tasks_completed': t('badges:criteriaTypes.tasks_completed'),
      'contributions_amount': t('badges:criteriaTypes.contributions_amount'),
      'events_attended': t('badges:criteriaTypes.events_attended'),
      'points_total': t('badges:criteriaTypes.points_total')
    };
    return labels[criteriaType] || criteriaType;
  };

  if (issuedBadgesQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (issuedBadgesQuery.isError) {
    return (
      <Alert severity="error">
        {t('common:common.error')}
      </Alert>
    );
  }

  const issuedBadges = issuedBadgesQuery.data || [];

  return (
    <Card>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <EmojiEvents color="primary" />
          <Typography variant="h5" component="h2">
            {t('badges:issuedBadges.title', 'Izdate značke')}
          </Typography>
        </Box>

        {issuedBadges.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <EmojiEvents sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {t('badges:issuedBadges.noBadges', 'Nema izdatih znački')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('badges:issuedBadges.noBadgesDescription', 'Značke se automatski dodjeljuju kada korisnici ispune kriterije')}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('badges:issuedBadges.user', 'Korisnik')}</TableCell>
                  <TableCell>{t('badges:issuedBadges.badge', 'Značka')}</TableCell>
                  <TableCell>{t('badges:issuedBadges.criteria', 'Kriterijum')}</TableCell>
                  <TableCell>{t('badges:issuedBadges.earnedAt', 'Datum dodjele')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {issuedBadges.map((issuedBadge) => (
                  <TableRow key={issuedBadge.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                          {issuedBadge.user.firstName[0]}{issuedBadge.user.lastName[0]}
                        </Avatar>
                        <Typography variant="body2">
                          {issuedBadge.user.firstName} {issuedBadge.user.lastName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <BadgeIconDisplay iconId={issuedBadge.badge.icon} size={24} />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {issuedBadge.badge.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {issuedBadge.badge.description}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${getCriteriaTypeLabel(issuedBadge.badge.criteriaType)}: ${issuedBadge.badge.criteriaValue}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {issuedBadge.earnedAt ? format(new Date(issuedBadge.earnedAt), 'dd.MM.yyyy. u HH:mm') : '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Card>
  );
}
