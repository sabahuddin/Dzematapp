import { Box, Typography, Button } from '@mui/material';
import { Link } from 'wouter';
import { ArrowForward } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { PrayerTime } from '@shared/schema';

interface CompactPrayerTimesProps {
  prayerTime: PrayerTime;
}

export default function CompactPrayerTimes({ prayerTime }: CompactPrayerTimesProps) {
  const { t } = useTranslation(['dashboard']);

  return (
    <Box
      sx={{
        bgcolor: 'var(--semantic-success-bg)',
        border: '2px solid var(--semantic-success-border)',
        borderRadius: 'var(--radius-lg)',
        p: 2,
        mb: 2,
      }}
    >
      {/* Row 1: Date and link to monthly vaktija */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography 
          variant="body1" 
          sx={{ 
            fontWeight: 600, 
            color: '#3949AB',
            fontSize: { xs: '0.95rem', sm: '1.1rem' }
          }}
        >
          Vaktija {prayerTime.date} 
        </Typography>
        <Link href="/vaktija">
          <Button
            size="small"
            endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
            sx={{
              textTransform: 'none',
              fontSize: '0.85rem',
              color: '#1E88E5',
              minWidth: 'auto',
              p: 0.5,
            }}
            data-testid="link-monthly-vaktija"
          >
            Mjesečne vaktije
          </Button>
        </Link>
      </Box>

      {/* Row 2: Prayer names */}
      <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" sx={{ flex: 1, textAlign: 'center', fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#3949AB' }}>
          {t('dashboard:prayers.fajr')}
        </Typography>
        {prayerTime.sunrise && (
          <Typography variant="caption" sx={{ flex: 1, textAlign: 'center', fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#3949AB' }}>
            {t('dashboard:prayers.sunrise')}
          </Typography>
        )}
        <Typography variant="caption" sx={{ flex: 1, textAlign: 'center', fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#3949AB' }}>
          {t('dashboard:prayers.dhuhr')}
        </Typography>
        <Typography variant="caption" sx={{ flex: 1, textAlign: 'center', fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#3949AB' }}>
          {t('dashboard:prayers.asr')}
        </Typography>
        <Typography variant="caption" sx={{ flex: 1, textAlign: 'center', fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#3949AB' }}>
          {t('dashboard:prayers.maghrib')}
        </Typography>
        <Typography variant="caption" sx={{ flex: 1, textAlign: 'center', fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: '#3949AB' }}>
          {t('dashboard:prayers.isha')}
        </Typography>
      </Box>

      {/* Row 3: Prayer times */}
      <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, justifyContent: 'space-between' }}>
        <Typography variant="body2" sx={{ flex: 1, textAlign: 'center', fontWeight: 600, fontSize: { xs: '0.85rem', sm: '1rem' }, color: '#0D1B2A' }}>
          {prayerTime.fajr}
        </Typography>
        {prayerTime.sunrise && (
          <Typography variant="body2" sx={{ flex: 1, textAlign: 'center', fontWeight: 600, fontSize: { xs: '0.85rem', sm: '1rem' }, color: '#0D1B2A' }}>
            {prayerTime.sunrise}
          </Typography>
        )}
        <Typography variant="body2" sx={{ flex: 1, textAlign: 'center', fontWeight: 600, fontSize: { xs: '0.85rem', sm: '1rem' }, color: '#0D1B2A' }}>
          {prayerTime.dhuhr}
        </Typography>
        <Typography variant="body2" sx={{ flex: 1, textAlign: 'center', fontWeight: 600, fontSize: { xs: '0.85rem', sm: '1rem' }, color: '#0D1B2A' }}>
          {prayerTime.asr}
        </Typography>
        <Typography variant="body2" sx={{ flex: 1, textAlign: 'center', fontWeight: 600, fontSize: { xs: '0.85rem', sm: '1rem' }, color: '#0D1B2A' }}>
          {prayerTime.maghrib}
        </Typography>
        <Typography variant="body2" sx={{ flex: 1, textAlign: 'center', fontWeight: 600, fontSize: { xs: '0.85rem', sm: '1rem' }, color: '#0D1B2A' }}>
          {prayerTime.isha}
        </Typography>
      </Box>
    </Box>
  );
}
