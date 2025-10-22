import { Card, CardContent, Typography, Grid, IconButton, Box, Tooltip } from '@mui/material';
import {
  Campaign,
  Event,
  People,
  Workspaces,
  Mail,
  School,
  Description,
  ShoppingCart,
  Settings,
  CalendarMonth,
  AccountBalance,
  Timeline,
  EmojiEvents,
  FolderSpecial,
} from '@mui/icons-material';
import { Link } from 'wouter';

// Define available shortcuts with icons and labels
export const AVAILABLE_SHORTCUTS = [
  { path: '/announcements', label: 'Obavještenja', icon: Campaign, color: '#1976d2', testId: 'quickaccess-announcements' },
  { path: '/events', label: 'Događaji', icon: Event, color: '#ed6c02', testId: 'quickaccess-events' },
  { path: '/users', label: 'Korisnici', icon: People, color: '#2e7d32', testId: 'quickaccess-users' },
  { path: '/sections', label: 'Sekcije', icon: Workspaces, color: '#9c27b0', testId: 'quickaccess-sections' },
  { path: '/tasks', label: 'Zadaci', icon: Workspaces, color: '#d32f2f', testId: 'quickaccess-tasks' },
  { path: '/messages', label: 'Poruke', icon: Mail, color: '#0288d1', testId: 'quickaccess-messages' },
  { path: '/ask-imam', label: 'Pitaj Imama', icon: School, color: '#388e3c', testId: 'quickaccess-askimam' },
  { path: '/documents', label: 'Dokumenti', icon: Description, color: '#f57c00', testId: 'quickaccess-documents' },
  { path: '/shop', label: 'Prodavnica', icon: ShoppingCart, color: '#c2185b', testId: 'quickaccess-shop' },
  { path: '/vaktija', label: 'Vaktija', icon: CalendarMonth, color: '#5e35b1', testId: 'quickaccess-vaktija' },
  { path: '/finances', label: 'Finansije', icon: AccountBalance, color: '#00796b', testId: 'quickaccess-finances' },
  { path: '/activity-log', label: 'Aktivnosti', icon: Timeline, color: '#616161', testId: 'quickaccess-activitylog' },
  { path: '/badges', label: 'Značke', icon: EmojiEvents, color: '#fbc02d', testId: 'quickaccess-badges' },
  { path: '/projects', label: 'Projekti', icon: FolderSpecial, color: '#1565c0', testId: 'quickaccess-projects' },
];

interface QuickAccessWidgetProps {
  shortcuts: string[];
  onSettingsClick: () => void;
}

export default function QuickAccessWidget({ shortcuts, onSettingsClick }: QuickAccessWidgetProps) {
  // Filter to get only the shortcuts that are in user's preferences
  const userShortcuts = AVAILABLE_SHORTCUTS.filter(shortcut => 
    shortcuts.includes(shortcut.path)
  );

  // If no shortcuts, show empty state
  if (userShortcuts.length === 0) {
    return (
      <Card data-testid="quick-access-widget">
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Brzi Pristup
            </Typography>
            <Tooltip title="Podesi brze linkove">
              <IconButton 
                size="small" 
                onClick={onSettingsClick}
                data-testid="button-settings-quickaccess"
              >
                <Settings />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
            Nema podešenih brzih linkova. Kliknite na ikonu postavki da dodate.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="quick-access-widget">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Brzi Pristup
          </Typography>
          <Tooltip title="Podesi brze linkove">
            <IconButton 
              size="small" 
              onClick={onSettingsClick}
              data-testid="button-settings-quickaccess"
            >
              <Settings />
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={2}>
          {userShortcuts.map((shortcut) => {
            const IconComponent = shortcut.icon;
            return (
              <Grid key={shortcut.path} xs={6} sm={4} md={3}>
                <Link href={shortcut.path}>
                  <Box
                    data-testid={shortcut.testId}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: `${shortcut.color}10`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: `${shortcut.color}20`,
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      },
                    }}
                  >
                    <IconComponent sx={{ fontSize: 32, color: shortcut.color, mb: 1 }} />
                    <Typography 
                      variant="caption" 
                      align="center"
                      sx={{ 
                        fontWeight: 500,
                        color: 'text.primary'
                      }}
                    >
                      {shortcut.label}
                    </Typography>
                  </Box>
                </Link>
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
}
