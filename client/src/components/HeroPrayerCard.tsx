import { Box, Typography, Chip } from '@mui/material';
import { WbSunny, DarkMode, WbTwilight, NightsStay, AccessTime } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { PrayerTime } from '@shared/schema';
import { SectionCard } from './SectionCard';

interface HeroPrayerCardProps {
  prayerTime: PrayerTime;
}

export function HeroPrayerCard({ prayerTime }: HeroPrayerCardProps) {
  const { t } = useTranslation(['dashboard']);

  const getNextPrayer = (): { name: string; time: string; icon: JSX.Element } | null => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const parseTime = (timeStr: string): { hour: number; minute: number; second: number } => {
      const parts = timeStr.split(':').map(Number);
      return { 
        hour: parts[0] || 0, 
        minute: parts[1] || 0,
        second: parts[2] || 0
      };
    };

    const isAfterTime = (prayerTime: string): boolean => {
      const { hour, minute, second } = parseTime(prayerTime);
      if (currentHour < hour) return true;
      if (currentHour === hour) {
        if (currentMinute < minute) return true;
        if (currentMinute === minute && now.getSeconds() < second) return true;
      }
      return false;
    };

    const prayers = [
      { name: t('dashboard:prayers.fajr'), time: prayerTime.fajr, icon: <WbTwilight /> },
      ...(prayerTime.sunrise ? [{ name: t('dashboard:prayers.sunrise'), time: prayerTime.sunrise, icon: <WbSunny /> }] : []),
      { name: t('dashboard:prayers.dhuhr'), time: prayerTime.dhuhr, icon: <WbSunny /> },
      { name: t('dashboard:prayers.asr'), time: prayerTime.asr, icon: <WbSunny /> },
      { name: t('dashboard:prayers.maghrib'), time: prayerTime.maghrib, icon: <DarkMode /> },
      { name: t('dashboard:prayers.isha'), time: prayerTime.isha, icon: <NightsStay /> },
    ];

    for (const prayer of prayers) {
      if (isAfterTime(prayer.time)) {
        return prayer;
      }
    }

    return prayers[0]; // Tomorrow's Fajr
  };

  const nextPrayer = getNextPrayer();

  const prayerItems = [
    { name: t('dashboard:prayers.fajr'), time: prayerTime.fajr, icon: <WbTwilight fontSize="small" /> },
    ...(prayerTime.sunrise ? [{ name: t('dashboard:prayers.sunrise'), time: prayerTime.sunrise, icon: <WbSunny fontSize="small" /> }] : []),
    { name: t('dashboard:prayers.dhuhr'), time: prayerTime.dhuhr, icon: <WbSunny fontSize="small" /> },
    { name: t('dashboard:prayers.asr'), time: prayerTime.asr, icon: <WbSunny fontSize="small" /> },
    { name: t('dashboard:prayers.maghrib'), time: prayerTime.maghrib, icon: <DarkMode fontSize="small" /> },
    { name: t('dashboard:prayers.isha'), time: prayerTime.isha, icon: <NightsStay fontSize="small" /> },
  ];

  return (
    <SectionCard 
      title={`${t('dashboard:todaysPrayerTimes')} - ${prayerTime.date}`}
      icon={<AccessTime />}
      linkTo="/vaktija"
      variant="hero"
    >
      {/* Next Prayer Highlight */}
      {nextPrayer && (
        <Box 
          sx={{ 
            bgcolor: 'hsl(123 46% 95%)',
            border: '2px solid hsl(123 46% 70%)',
            borderRadius: 'var(--radius)',
            p: 2,
            mb: 2.5,
            textAlign: 'center',
          }}
          data-testid="box-next-prayer"
        >
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'hsl(123 46% 54%)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '0.7rem'
            }}
          >
            {t('dashboard:nextPrayer', 'Sljedeći namaz')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 0.5 }}>
            <Box sx={{ color: 'hsl(123 46% 34%)' }}>{nextPrayer.icon}</Box>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700,
                color: 'hsl(123 46% 24%)',
              }}
              data-testid="text-next-prayer-time"
            >
              {nextPrayer.time}
            </Typography>
          </Box>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'hsl(123 46% 34%)',
              fontWeight: 600,
              mt: 0.5
            }}
            data-testid="text-next-prayer-name"
          >
            {nextPrayer.name}
          </Typography>
        </Box>
      )}

      {/* 2-Column Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
        {prayerItems.map((prayer) => (
          <Box key={prayer.name}>
            <Chip
              icon={prayer.icon}
              label={
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 0.5 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'hsl(123 46% 44%)' }}>
                    {prayer.name}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'hsl(123 46% 24%)' }}>
                    {prayer.time}
                  </Typography>
                </Box>
              }
              sx={{
                width: '100%',
                height: 'auto',
                justifyContent: 'flex-start',
                bgcolor: 'white',
                border: '1px solid hsl(123 46% 85%)',
                borderRadius: 'var(--radius)',
                px: 1.5,
                py: 1,
                '& .MuiChip-icon': {
                  color: 'hsl(123 46% 54%)',
                  marginLeft: 0,
                },
                '& .MuiChip-label': {
                  padding: 0,
                  marginLeft: 1,
                }
              }}
              data-testid={`chip-prayer-${prayer.name.toLowerCase()}`}
            />
          </Box>
        ))}
      </Box>
    </SectionCard>
  );
}
