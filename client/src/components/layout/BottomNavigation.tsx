import { BottomNavigation as MuiBottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Home, CalendarMonth, Assignment, Store, Apps } from '@mui/icons-material';
import { useLocation } from 'wouter';

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const getActiveTab = () => {
    if (location === '/' || location === '/dashboard') return 0;
    if (location.startsWith('/events')) return 1;
    if (location.startsWith('/tasks')) return 2;
    if (location.startsWith('/shop')) return 3;
    if (location.startsWith('/modules')) return 4;
    return 0;
  };

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    const routes = ['/', '/events', '/tasks', '/shop', '/modules'];
    setLocation(routes[newValue]);
  };

  return (
    <Paper
      sx={{
        borderTop: '2px solid var(--semantic-success-border)',
        backgroundColor: 'var(--semantic-success-bg)',
      }}
      elevation={8}
    >
      <MuiBottomNavigation
        value={getActiveTab()}
        onChange={handleChange}
        showLabels
        sx={{
          backgroundColor: 'transparent',
          '& .MuiBottomNavigationAction-root': {
            color: 'hsl(123 46% 34%)',
            '&.Mui-selected': {
              color: 'hsl(123 46% 54%)',
            },
          },
        }}
      >
        <BottomNavigationAction
          label="Home"
          icon={<Home />}
          data-testid="bottom-nav-home"
        />
        <BottomNavigationAction
          label="Događaji"
          icon={<CalendarMonth />}
          data-testid="bottom-nav-events"
        />
        <BottomNavigationAction
          label="Sekcije"
          icon={<Assignment />}
          data-testid="bottom-nav-tasks"
        />
        <BottomNavigationAction
          label="Trgovina"
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
