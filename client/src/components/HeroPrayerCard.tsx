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
      {/* Next Prayer Highlight - Kompaktniji */}
      {nextPrayer && (
        <Box 
          sx={{ 
            bgcolor: '#f5f7ff',
            border: '1px solid #c5cae9',
            borderRadius: 'var(--radius)',
            p: 1,
            mb: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
          data-testid="box-next-prayer"
        >
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#3949AB',
              fontSize: '0.65rem'
            }}
          >
            {t('dashboard:nextPrayer', 'Sljedeći')}:
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 600,
              color: '#0D1B2A',
            }}
            data-testid="text-next-prayer-name"
          >
            {nextPrayer.name}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              fontWeight: 700,
              color: '#0D1B2A',
            }}
            data-testid="text-next-prayer-time"
          >
            {nextPrayer.time}
          </Typography>
        </Box>
      )}

      {/* 3-Column Grid (2 reda po 3) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
        {prayerItems.map((prayer) => (
          <Box 
            key={prayer.name}
            sx={{
              bgcolor: 'white',
              border: '1px solid #e8eaf6',
              borderRadius: 'var(--radius)',
              p: 0.75,
              textAlign: 'center',
            }}
            data-testid={`chip-prayer-${prayer.name.toLowerCase()}`}
          >
            <Box sx={{ color: '#3949AB', mb: 0.25 }}>{prayer.icon}</Box>
            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#546E7A', display: 'block' }}>
              {prayer.name}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0D1B2A', fontSize: '0.85rem' }}>
              {prayer.time}
            </Typography>
          </Box>
        ))}
      </Box>
    </SectionCard>
  );
}
