import { BottomNavigation as MuiBottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Home, CalendarMonth, Campaign, Store, Apps, FolderOpen } from '@mui/icons-material';
import { useLocation } from 'wouter';

export const BOTTOM_NAV_HEIGHT = 64;

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const getActiveTab = () => {
    if (location === '/' || location === '/dashboard') return 0;
    if (location.startsWith('/announcements')) return 1;
    if (location.startsWith('/events')) return 2;
    if (location.startsWith('/shop')) return 3;
    if (location.startsWith('/projects')) return 4;
    if (location.startsWith('/modules')) return 5;
    return 0;
  };

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    const routes = ['/', '/announcements', '/events', '/shop', '/projects', '/modules'];
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
        showLabels={true}
        sx={{
          backgroundColor: 'transparent',
          height: 'auto',
          px: 2,
          py: 1,
          borderRadius: 0,
          '& .MuiBottomNavigationAction-root': {
            color: 'hsl(123 46% 34%)',
            minWidth: '60px',
            fontSize: '0.75rem',
            '&.Mui-selected': {
              color: 'hsl(123 46% 54%)',
            },
          },
        }}
      >
        <BottomNavigationAction
          label="Početna"
          icon={<Home />}
          data-testid="bottom-nav-home"
        />
        <BottomNavigationAction
          label="Obavještenja"
          icon={<Campaign />}
          data-testid="bottom-nav-announcements"
        />
        <BottomNavigationAction
          label="Događaji"
          icon={<CalendarMonth />}
          data-testid="bottom-nav-events"
        />
        <BottomNavigationAction
          label="Prodavnica"
          icon={<Store />}
          data-testid="bottom-nav-shop"
        />
        <BottomNavigationAction
          label="Projekti"
          icon={<FolderOpen />}
          data-testid="bottom-nav-projects"
        />
        <BottomNavigationAction
          label="Više"
          icon={<Apps />}
          data-testid="bottom-nav-modules"
        />
      </MuiBottomNavigation>
    </Paper>
  );
}
