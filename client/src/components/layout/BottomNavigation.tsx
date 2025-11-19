import { BottomNavigation as MuiBottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Home, CalendarMonth, Campaign, Store, Apps } from '@mui/icons-material';
import { useLocation } from 'wouter';

export const BOTTOM_NAV_HEIGHT = 64;

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

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
        borderRadius: 0,
      }}
      elevation={8}
    >
      <MuiBottomNavigation
        value={getActiveTab()}
        onChange={handleChange}
        showLabels={false}
        sx={{
          backgroundColor: 'transparent',
          height: '64px',
          px: 2,
          borderRadius: 0,
          '& .MuiBottomNavigationAction-root': {
            color: 'hsl(123 46% 34%)',
            minWidth: '60px',
            '&.Mui-selected': {
              color: 'hsl(123 46% 54%)',
            },
          },
        }}
      >
        <BottomNavigationAction
          icon={<Home />}
          data-testid="bottom-nav-home"
        />
        <BottomNavigationAction
          icon={<Campaign />}
          data-testid="bottom-nav-announcements"
        />
        <BottomNavigationAction
          icon={<CalendarMonth />}
          data-testid="bottom-nav-events"
        />
        <BottomNavigationAction
          icon={<Store />}
          data-testid="bottom-nav-shop"
        />
        <BottomNavigationAction
          icon={<Apps />}
          data-testid="bottom-nav-modules"
        />
      </MuiBottomNavigation>
    </Paper>
  );
}
