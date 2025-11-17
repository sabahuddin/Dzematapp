import { BottomNavigation as MuiBottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Home, CalendarMonth, Campaign, Store, Apps } from '@mui/icons-material';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const { t } = useTranslation(['navigation']);

  const getActiveTab = () => {
    if (location === '/' || location === '/dashboard') return 0;
    if (location.startsWith('/announcements')) return 1;
    if (location.startsWith('/events')) return 2;
    if (location.startsWith('/shop')) return 3;
    if (location.startsWith('/modules')) return 4;
    return 0;
  };

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    const routes = ['/', '/announcements', '/events', '/shop', '/modules'];
    setLocation(routes[newValue]);
  };

  return (
    <Paper
      sx={{
        borderTop: '1px solid var(--semantic-success-border)',
        backgroundColor: 'var(--semantic-success-bg)',
      }}
      elevation={8}
    >
      <MuiBottomNavigation
        value={getActiveTab()}
        onChange={handleChange}
        showLabels={true}
        sx={{
          backgroundColor: 'transparent',
          px: 1,
          pb: 0.5,
          '& .MuiBottomNavigationAction-root': {
            color: 'hsl(123 46% 34%)',
            minWidth: '60px',
            fontSize: '0.65rem',
            '&.Mui-selected': {
              color: 'hsl(123 46% 54%)',
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.65rem',
              '&.Mui-selected': {
                fontSize: '0.7rem',
              }
            }
          },
        }}
      >
        <BottomNavigationAction
          label={t('navigation:menu.dashboard')}
          icon={<Home />}
          data-testid="bottom-nav-home"
        />
        <BottomNavigationAction
          label={t('navigation:menu.announcements')}
          icon={<Campaign />}
          data-testid="bottom-nav-announcements"
        />
        <BottomNavigationAction
          label={t('navigation:menu.events')}
          icon={<CalendarMonth />}
          data-testid="bottom-nav-events"
        />
        <BottomNavigationAction
          label={t('navigation:menu.shop')}
          icon={<Store />}
          data-testid="bottom-nav-shop"
        />
        <BottomNavigationAction
          label="Moduli"
          icon={<Apps />}
          data-testid="bottom-nav-modules"
        />
      </MuiBottomNavigation>
    </Paper>
  );
}
