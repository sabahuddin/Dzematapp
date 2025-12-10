import { Box, Typography, Card, CardContent, LinearProgress, Avatar, Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { EmojiEvents, WorkspacePremium, Stars, TrendingUp } from '@mui/icons-material';

interface UserBadge {
  id: number;
  userId: number;
  badgeId: number;
  earnedAt: Date;
  badge?: {
    name: string;
    icon: string;
    criteriaType: string;
  };
}

interface UserCertificate {
  id: number;
  userId: number;
  issuedAt: Date;
  template?: {
    name: string;
  };
}

interface UserPoints {
  userId: number;
  totalPoints: number;
  level: number;
}

const cardStyle = { borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };

export default function ActivityWidget() {
  const [, setLocation] = useLocation();

  const { data: badges = [] } = useQuery<UserBadge[]>({
    queryKey: ['/api/user-badges'],
  });

  const { data: certificates = [] } = useQuery<UserCertificate[]>({
    queryKey: ['/api/user-certificates'],
  });

  const { data: pointsData } = useQuery<{ totalPoints: number; topUsers: any[] }>({
    queryKey: ['/api/points/summary'],
  });

  const recentBadges = badges.slice(0, 3);
  const recentCertificates = certificates.slice(0, 3);

  return (
    <Card sx={{ ...cardStyle, height: '100%' }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Stars fontSize="small" color="primary" />
          <Typography variant="subtitle2" fontWeight={600}>Aktivnosti</Typography>
        </Box>

        {/* Points Summary */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.light', borderRadius: '8px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <TrendingUp fontSize="small" sx={{ color: 'primary.main' }} />
            <Typography variant="body2" fontWeight={600} color="primary.main">
              Ukupno bodova
            </Typography>
          </Box>
          <Typography variant="h4" fontWeight="bold" color="primary.main">
            {pointsData?.totalPoints || 0}
          </Typography>
        </Box>

        {/* Badges Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmojiEvents fontSize="small" sx={{ color: 'warning.main' }} />
              <Typography variant="body2" fontWeight={600}>Značke</Typography>
            </Box>
            <Typography 
              variant="caption" 
              color="primary" 
              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              onClick={() => setLocation('/badges')}
            >
              Vidi sve ({badges.length})
            </Typography>
          </Box>
          {recentBadges.length === 0 ? (
            <Typography variant="caption" color="text.secondary">Nema dodijeljenih znački</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {recentBadges.map((badge) => (
                <Chip
                  key={badge.id}
                  icon={<EmojiEvents sx={{ fontSize: 16 }} />}
                  label={badge.badge?.name || 'Značka'}
                  size="small"
                  sx={{ 
                    bgcolor: 'warning.light', 
                    color: 'warning.dark',
                    '& .MuiChip-icon': { color: 'warning.dark' }
                  }}
                />
              ))}
            </Box>
          )}
        </Box>

        {/* Certificates Section */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WorkspacePremium fontSize="small" sx={{ color: 'info.main' }} />
              <Typography variant="body2" fontWeight={600}>Zahvalnice</Typography>
            </Box>
            <Typography 
              variant="caption" 
              color="primary" 
              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              onClick={() => setLocation('/certificates')}
            >
              Vidi sve ({certificates.length})
            </Typography>
          </Box>
          {recentCertificates.length === 0 ? (
            <Typography variant="caption" color="text.secondary">Nema izdatih zahvalnica</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {recentCertificates.map((cert) => (
                <Box 
                  key={cert.id}
                  sx={{ 
                    p: 1, 
                    bgcolor: 'info.light', 
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <WorkspacePremium sx={{ fontSize: 18, color: 'info.dark' }} />
                  <Typography variant="caption" color="info.dark" fontWeight={500}>
                    {cert.template?.name || 'Zahvalnica'}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
