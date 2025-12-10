import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { People, Groups, FamilyRestroom } from '@mui/icons-material';

interface DashboardStats {
  totalUsers: number;
  members: number;
  familyMembers: number;
}

const cardStyle = { borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', height: '100%' };

interface UsersStatsWidgetProps {
  size?: { w: number; h: number };
}

export default function UsersStatsWidget({ size }: UsersStatsWidgetProps) {
  const [, setLocation] = useLocation();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const isCompact = size?.w === 1 && size?.h === 1;
  const isHorizontal = size?.w === 2 && size?.h === 1;

  if (isLoading) {
    return (
      <Card sx={cardStyle}>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress size={20} />
        </CardContent>
      </Card>
    );
  }

  if (isCompact) {
    return (
      <Card sx={cardStyle} onClick={() => setLocation('/users')} style={{ cursor: 'pointer' }}>
        <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <People sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
          <Typography variant="h4" fontWeight="bold" color="primary.main">
            {stats?.totalUsers || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">Korisnika</Typography>
        </CardContent>
      </Card>
    );
  }

  if (isHorizontal) {
    return (
      <Card sx={cardStyle}>
        <CardContent sx={{ p: 2, height: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '100%' }}>
            <Box sx={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setLocation('/users')}>
              <People sx={{ fontSize: 24, color: 'primary.main' }} />
              <Typography variant="h5" fontWeight="bold">{stats?.totalUsers || 0}</Typography>
              <Typography variant="caption" color="text.secondary">Ukupno</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setLocation('/users')}>
              <Groups sx={{ fontSize: 24, color: 'info.main' }} />
              <Typography variant="h5" fontWeight="bold">{stats?.members || 0}</Typography>
              <Typography variant="caption" color="text.secondary">Članovi</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setLocation('/users')}>
              <FamilyRestroom sx={{ fontSize: 24, color: 'secondary.main' }} />
              <Typography variant="h5" fontWeight="bold">{stats?.familyMembers || 0}</Typography>
              <Typography variant="caption" color="text.secondary">Porodica</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Vertical layout (1x2)
  return (
    <Card sx={cardStyle}>
      <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="subtitle2" fontWeight={600}>Korisnici</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => setLocation('/users')}>
            <Box sx={{ bgcolor: 'primary.light', p: 1, borderRadius: '8px' }}>
              <People sx={{ color: 'primary.main' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold">{stats?.totalUsers || 0}</Typography>
              <Typography variant="caption" color="text.secondary">Ukupno korisnika</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => setLocation('/users')}>
            <Box sx={{ bgcolor: 'info.light', p: 1, borderRadius: '8px' }}>
              <Groups sx={{ color: 'info.main' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold">{stats?.members || 0}</Typography>
              <Typography variant="caption" color="text.secondary">Članovi</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => setLocation('/users')}>
            <Box sx={{ bgcolor: 'secondary.light', p: 1, borderRadius: '8px' }}>
              <FamilyRestroom sx={{ color: 'secondary.main' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold">{stats?.familyMembers || 0}</Typography>
              <Typography variant="caption" color="text.secondary">Članovi porodice</Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
