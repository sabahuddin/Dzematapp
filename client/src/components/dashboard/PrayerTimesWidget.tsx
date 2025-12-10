import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { AccessTime } from '@mui/icons-material';

interface PrayerTime {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  date: string;
}

const cardStyle = { borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', height: '100%' };

interface PrayerTimesWidgetProps {
  size?: { w: number; h: number };
}

export default function PrayerTimesWidget({ size }: PrayerTimesWidgetProps) {
  const [, setLocation] = useLocation();

  const { data: prayerTime, isLoading } = useQuery<PrayerTime>({
    queryKey: ['/api/prayer-times/today'],
  });

  const isCompact = size?.w === 1 && size?.h === 1;

  if (isLoading) {
    return (
      <Card sx={cardStyle}>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress size={20} />
        </CardContent>
      </Card>
    );
  }

  if (!prayerTime) {
    return (
      <Card sx={cardStyle} onClick={() => setLocation('/prayer-times')} style={{ cursor: 'pointer' }}>
        <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <AccessTime sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">Vaktija nije postavljena</Typography>
        </CardContent>
      </Card>
    );
  }

  if (isCompact) {
    return (
      <Card sx={cardStyle} onClick={() => setLocation('/prayer-times')} style={{ cursor: 'pointer' }}>
        <CardContent sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AccessTime fontSize="small" color="primary" />
            <Typography variant="caption" fontWeight={600}>Vaktija</Typography>
          </Box>
          <Typography variant="caption">Akšam: <strong>{prayerTime.maghrib}</strong></Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={cardStyle}>
      <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTime fontSize="small" color="primary" />
            <Typography variant="subtitle2" fontWeight={600}>Vaktija</Typography>
          </Box>
          <Typography 
            variant="caption" 
            color="primary" 
            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            onClick={() => setLocation('/prayer-times')}
          >
            Kalendar
          </Typography>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, flex: 1 }}>
          <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: '6px' }}>
            <Typography variant="caption" color="text.secondary">Sabah</Typography>
            <Typography variant="body2" fontWeight={600}>{prayerTime.fajr}</Typography>
          </Box>
          <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: '6px' }}>
            <Typography variant="caption" color="text.secondary">Izl. sunca</Typography>
            <Typography variant="body2" fontWeight={600}>{prayerTime.sunrise}</Typography>
          </Box>
          <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: '6px' }}>
            <Typography variant="caption" color="text.secondary">Podne</Typography>
            <Typography variant="body2" fontWeight={600}>{prayerTime.dhuhr}</Typography>
          </Box>
          <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: '6px' }}>
            <Typography variant="caption" color="text.secondary">Ikindija</Typography>
            <Typography variant="body2" fontWeight={600}>{prayerTime.asr}</Typography>
          </Box>
          <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: '6px' }}>
            <Typography variant="caption" color="primary.dark">Akšam</Typography>
            <Typography variant="body2" fontWeight={600} color="primary.dark">{prayerTime.maghrib}</Typography>
          </Box>
          <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: '6px' }}>
            <Typography variant="caption" color="text.secondary">Jacija</Typography>
            <Typography variant="body2" fontWeight={600}>{prayerTime.isha}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
