import { Card, CardContent, Typography, IconButton, Box, Tooltip } from '@mui/material';
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
import { useTranslation } from 'react-i18next';

// Define available shortcuts with icons (labels will come from i18n)
export const getAvailableShortcuts = (t: any) => [
  { path: '/announcements', label: t('navigation:menu.announcements'), icon: Campaign, color: '#1976d2', testId: 'quickaccess-announcements' },
  { path: '/events', label: t('navigation:menu.events'), icon: Event, color: '#ed6c02', testId: 'quickaccess-events' },
  { path: '/users', label: t('navigation:menu.users'), icon: People, color: '#26A69A', testId: 'quickaccess-users' },
  { path: '/tasks', label: t('navigation:menu.sections'), icon: Workspaces, color: '#9c27b0', testId: 'quickaccess-sections' },
  { path: '/messages', label: t('navigation:menu.messages'), icon: Mail, color: '#0288d1', testId: 'quickaccess-messages' },
  { path: '/ask-imam', label: t('navigation:menu.askImam'), icon: School, color: '#3949AB', testId: 'quickaccess-askimam' },
  { path: '/documents', label: t('navigation:menu.documents'), icon: Description, color: '#f57c00', testId: 'quickaccess-documents' },
  { path: '/shop', label: t('navigation:menu.shop'), icon: ShoppingCart, color: '#c2185b', testId: 'quickaccess-shop' },
  { path: '/vaktija', label: t('navigation:menu.vaktija'), icon: CalendarMonth, color: '#5e35b1', testId: 'quickaccess-vaktija' },
  { path: '/finances', label: t('navigation:menu.finances'), icon: AccountBalance, color: '#00796b', testId: 'quickaccess-finances' },
  { path: '/activity-log', label: t('navigation:menu.activityLog'), icon: Timeline, color: '#616161', testId: 'quickaccess-activitylog' },
  { path: '/badges', label: t('navigation:menu.badges'), icon: EmojiEvents, color: '#fbc02d', testId: 'quickaccess-badges' },
  { path: '/projects', label: t('navigation:menu.projects'), icon: FolderSpecial, color: '#1565c0', testId: 'quickaccess-projects' },
];

interface QuickAccessWidgetProps {
  shortcuts: string[];
  onSettingsClick: () => void;
}

export default function QuickAccessWidget({ shortcuts, onSettingsClick }: QuickAccessWidgetProps) {
  const { t } = useTranslation(['navigation']);
  
  // Filter to get only the shortcuts that are in user's preferences
  const availableShortcuts = getAvailableShortcuts(t);
  const userShortcuts = availableShortcuts.filter(shortcut => 
    shortcuts.includes(shortcut.path)
  );

  // If no shortcuts, show empty state
  if (userShortcuts.length === 0) {
    return (
      <Card data-testid="quick-access-widget">
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('navigation:quickAccess')}
            </Typography>
            <Tooltip title={t('navigation:customizeQuickAccess')}>
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
            {t('navigation:customizeQuickAccess')}
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
            {t('navigation:quickAccess')}
          </Typography>
          <Tooltip title={t('navigation:customizeQuickAccess')}>
            <IconButton 
              size="small" 
              onClick={onSettingsClick}
              data-testid="button-settings-quickaccess"
            >
              <Settings />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {userShortcuts.map((shortcut) => {
            const IconComponent = shortcut.icon;
            return (
              <Box key={shortcut.path} sx={{ width: { xs: 'calc(50% - 8px)', sm: 'calc(33.33% - 11px)', md: 'calc(25% - 12px)' } }}>
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
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}
