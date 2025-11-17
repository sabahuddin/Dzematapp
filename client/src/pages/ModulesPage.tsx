import { Box, Paper, Typography } from '@mui/material';
import {
  Announcement,
  Email,
  Church,
  Favorite,
  Help,
  MenuBook,
  AccountBalance,
  BarChart,
  People,
  Feed,
  Description,
  EmojiEvents,
  Tv,
  Settings,
  Assignment,
  Store,
  CalendarMonth,
} from '@mui/icons-material';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';

interface ModuleItem {
  icon: React.ReactNode;
  label: string;
  description: string;
  route: string;
  testId: string;
  adminOnly?: boolean;
}

export default function ModulesPage() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();

  // Ordered same as webapp sidebar menu
  const modules: ModuleItem[] = [
    { icon: <Feed sx={{ fontSize: 48 }} />, label: 'Feed', description: 'Aktivnosti zajednice', route: '/feed', testId: 'module-feed' },
    { icon: <MenuBook sx={{ fontSize: 48 }} />, label: t('sidebar.vaktija'), description: 'Raspored namaza', route: '/vaktija', testId: 'module-vaktija' },
    { icon: <Announcement sx={{ fontSize: 48 }} />, label: t('sidebar.announcements'), description: 'Obavještenja džemata', route: '/announcements', testId: 'module-announcements' },
    { icon: <CalendarMonth sx={{ fontSize: 48 }} />, label: t('sidebar.events'), description: 'Događaji i aktivnosti', route: '/events', testId: 'module-events' },
    { icon: <Assignment sx={{ fontSize: 48 }} />, label: t('sidebar.tasks'), description: 'Sekcije i zadaci', route: '/tasks', testId: 'module-tasks' },
    { icon: <Store sx={{ fontSize: 48 }} />, label: t('sidebar.shop'), description: 'DžematShop i oglasnike', route: '/shop', testId: 'module-shop' },
    { icon: <Email sx={{ fontSize: 48 }} />, label: 'Pristupnica', description: 'Zahtjev za članstvo', route: '/membership-applications', testId: 'module-membership' },
    { icon: <Church sx={{ fontSize: 48 }} />, label: 'Akika', description: 'Prijava akike', route: '/applications', testId: 'module-akika' },
    { icon: <Favorite sx={{ fontSize: 48 }} />, label: 'Vjenčanje', description: 'Prijava vjenčanja', route: '/applications', testId: 'module-marriage' },
    { icon: <Help sx={{ fontSize: 48 }} />, label: t('sidebar.askImam'), description: 'Pitanja za imama', route: '/ask-imam', testId: 'module-ask-imam' },
    { icon: <AccountBalance sx={{ fontSize: 48 }} />, label: t('sidebar.projects'), description: 'Projekti džemata', route: '/projects', testId: 'module-projects' },
    { icon: <BarChart sx={{ fontSize: 48 }} />, label: t('sidebar.finances'), description: 'Finansije i doprinosi', route: '/finances', testId: 'module-finances' },
    { icon: <People sx={{ fontSize: 48 }} />, label: t('sidebar.users'), description: 'Članovi džemata', route: '/users', testId: 'module-users', adminOnly: true },
    { icon: <Description sx={{ fontSize: 48 }} />, label: t('sidebar.documents'), description: 'Dokumenti džemata', route: '/documents', testId: 'module-documents' },
    { icon: <EmojiEvents sx={{ fontSize: 48 }} />, label: 'Priznanja', description: 'Značke i zahvalnice', route: '/badges', testId: 'module-recognition' },
    { icon: <Tv sx={{ fontSize: 48 }} />, label: 'Media', description: 'Livestream i snimci', route: '/livestream-settings', testId: 'module-media', adminOnly: true },
    { icon: <Settings sx={{ fontSize: 48 }} />, label: t('sidebar.settings'), description: 'Podešavanja džemata', route: '/settings', testId: 'module-settings', adminOnly: true },
  ].filter(m => !m.adminOnly || user?.isAdmin);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: 'hsl(123 46% 34%)' }}>
        Moduli
      </Typography>
      
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {modules.map((module) => (
          <Paper
            key={module.testId}
            onClick={() => setLocation(module.route)}
            data-testid={module.testId}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                boxShadow: '0 8px 16px rgba(18, 94, 48, 0.18)',
              },
            }}
          >
            <Box sx={{ color: 'hsl(123 46% 54%)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 48 }}>
              {module.icon}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                {module.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {module.description}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
