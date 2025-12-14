import { BottomNavigation as MuiBottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Home, CalendarMonth, Campaign, Store, Apps } from '@mui/icons-material';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';

export const BOTTOM_NAV_HEIGHT = 64;

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const { t } = useTranslation('navigation');

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
        borderTop: '1px solid #ECEFF1',
        backgroundColor: '#ffffff',
        borderRadius: 0,
      }}
      elevation={0}
    >
      <MuiBottomNavigation
        value={getActiveTab()}
        onChange={handleChange}
        showLabels={false}
        sx={{
          backgroundColor: 'transparent',
          height: 'auto',
          px: 2,
          py: 1,
          borderRadius: 0,
          '& .MuiBottomNavigationAction-root': {
            color: '#B0BEC5',
            minWidth: '60px',
            fontSize: '0.75rem',
            '&.Mui-selected': {
              color: '#3949AB',
            },
          },
        }}
      >
        <BottomNavigationAction
          label={t('bottomNav.home')}
          icon={<Home />}
          data-testid="bottom-nav-home"
        />
        <BottomNavigationAction
          label={t('bottomNav.announcements')}
          icon={<Campaign />}
          data-testid="bottom-nav-announcements"
        />
        <BottomNavigationAction
          label={t('bottomNav.events')}
          icon={<CalendarMonth />}
          data-testid="bottom-nav-events"
        />
        <BottomNavigationAction
          label={t('bottomNav.shop')}
          icon={<Store />}
          data-testid="bottom-nav-shop"
        />
        <BottomNavigationAction
          label={t('bottomNav.more')}
          icon={<Apps />}
          data-testid="bottom-nav-modules"
        />
      </MuiBottomNavigation>
    </Paper>
  );
}
